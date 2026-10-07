import { createContext, useContext, useState, useEffect, useRef, useCallback, type ReactNode } from 'react';

interface ManagedAudio extends HTMLAudioElement {
    _baseVolume?: number;
}

export interface AudioHandle {
    stop: () => void;
    fade: (duration?: number) => void;
}

export type VolumeUpdate = number | ((currentVolume: number) => number);

interface AudioContextValue {
    isMuted: boolean;
    toggleMute: () => void;
    play: (soundName: string, options?: { loop?: boolean; volume?: number }) => AudioHandle;
    enableAudio: () => void;
    audioEnabled: boolean;
    globalVolume: number;
    setGlobalVolume: (volume: VolumeUpdate) => void;
}

const AudioContext = createContext<AudioContextValue | null>(null);

export const useAudio = (): AudioContextValue => {
    const context = useContext(AudioContext);
    if (!context) throw new Error('useAudio must be used within an AudioProvider');
    return context;
};

export const AudioProvider = ({ children }: { children: ReactNode }) => {
    // Persist mute preference
    const [isMuted, setIsMuted] = useState(() => {
        const saved = localStorage.getItem('audio_muted');
        return saved === 'true';
    });

    // Persist volume preference (0.0 to 1.0)
    const [globalVolume, setGlobalVolume] = useState(() => {
        const saved = localStorage.getItem('audio_volume');
        return saved !== null ? parseFloat(saved) : 0.5;
    });

    const [audioEnabled, setAudioEnabled] = useState(false);

    // Track active sounds to stop them later
    const activeSounds = useRef<Record<string, ManagedAudio>>({});

    useEffect(() => {
        localStorage.setItem('audio_muted', String(isMuted));
        localStorage.setItem('audio_volume', String(globalVolume));

        // Update all active sounds
        Object.values(activeSounds.current).forEach(audio => {
            if (audio) {
                audio.muted = isMuted;
                // Scale effective volume by global volume
                // We stored the requested "base" volume on the object as _baseVolume
                const base = audio._baseVolume !== undefined ? audio._baseVolume : 1.0;
                let targetVol = base * globalVolume;
                audio.volume = Math.max(0, Math.min(1, targetVol));
            }
        });

    }, [isMuted, globalVolume]);

    const toggleMute = (): void => setIsMuted(prev => !prev);

    // Enhanced setter that auto-unmutes if user manually drags slider above 0
    const enhancedSetGlobalVolume = useCallback((vol: VolumeUpdate): void => {
        if (typeof vol === 'function') {
            setGlobalVolume(prev => {
                const newVol = vol(prev);
                if (newVol > 0) setIsMuted(false);
                return newVol;
            });
        } else {
            setGlobalVolume(vol);
            if (vol > 0) setIsMuted(false);
        }
    }, []);

    // Call this on first interaction
    const enableAudio = useCallback((): void => {
        if (!audioEnabled) {
            // Create a dummy context or just flip the switch to say "we tried"
            // Real web audio unlock usually needs a context resume, 
            // but for HTML5 Audio elements, just a user interaction event is enough 
            // to "bless" the document for subsequent plays.
            setAudioEnabled(true);
        }
    }, [audioEnabled]);

    const play = useCallback((soundName: string, { loop = false, volume = 1.0 }: { loop?: boolean; volume?: number } = {}): AudioHandle => {
        // Graceful degradation if files missing
        const soundPaths: Record<string, string> = {
            'szumwiatru': '/sounds/szumwiatru.mp3', // Szum wiatru w pokoju About
            'szummiasta': '/sounds/szummiasta.mp3', // Szum miasta w pokoju The Gallery
            'uchyleniedrzwi': '/sounds/uchyleniedrzwi.mp3', // Skrzypienie przy najechaniu
            'otwarciedrzwi': '/sounds/otwarciedrzwi.mp3',   // Otwarcie głównych/bocznych drzwi
            'zamknieciedrzwi': '/sounds/zamknieciedrzwi.mp3' // Zamykanie drzwi
        };
        const path = soundPaths[soundName] || `/sounds/${soundName}.mp3`;

        // In "simulation mode" or if file missing, this might error.
        // We'll trust the browser to handle 404s without crashing JS.
        const audio = new Audio(path) as ManagedAudio;

        // Store metadata
        audio.loop = loop;
        audio._baseVolume = volume; // Custom prop to remember intended relative mix

        // Apply current global state
        audio.muted = isMuted;
        let targetVol = volume * globalVolume;
        audio.volume = Math.max(0, Math.min(1, targetVol));

        // Store reference (clearing old one if exists with same name for simplicity)
        if (activeSounds.current[soundName]) {
            activeSounds.current[soundName].pause();
        }
        activeSounds.current[soundName] = audio;

        // Simulation log
        // console.log(`[Audio] Playing ${soundName} (loop: ${loop}, vol: ${audio.volume.toFixed(2)})`);

        // Attempt to play
        const playPromise = audio.play();

        if (playPromise !== undefined) {
            playPromise.catch((error: unknown) => {
                if (error instanceof Error && error.name === 'NotAllowedError') {
                    // console.warn('[Audio] Auto-play blocked. Waiting for interaction.');
                } else if (error instanceof Error && (error.name === 'NotSupportedError' || error.message.includes('404'))) {
                    // Silently fail if file is missing for SOTD clean console
                } else {
                    // console.warn('[Audio] Play error:', error);
                }
            });
        }

        // Return a handle to stop it
        return {
            stop: () => {
                audio.pause();
                audio.currentTime = 0;
                delete activeSounds.current[soundName];
            },
            fade: (duration = 1000) => {
                // For now just stop
                audio.pause();
                delete activeSounds.current[soundName];
            }
        };
    }, [isMuted, globalVolume]);

    return (
        <AudioContext.Provider value={{
            isMuted,
            toggleMute,
            globalVolume,
            setGlobalVolume: enhancedSetGlobalVolume,
            play,
            enableAudio,
            audioEnabled
        }}>
            {children}
        </AudioContext.Provider>
    );
};
