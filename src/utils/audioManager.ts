/**
 * Simple Global Audio Manager for background music
 */

let bgMusicAudio: HTMLAudioElement | null = null;
let isMuted = false;
let bgMusicStarted = false;

// Initialize background music
export const initAudio = (): void => {
    if (typeof window === 'undefined') return;

    // Sync muted state from localStorage (same key as AudioManager context)
    const savedMuted = localStorage.getItem('audio_muted');
    isMuted = savedMuted === 'true';

    if (!bgMusicAudio) {
        // We use the file provided by the user in public/sounds/
        bgMusicAudio = new Audio('/sounds/saalam.mp3');
        bgMusicAudio.preload = 'auto'; // Force browser to fetch data immediately
        bgMusicAudio.loop = true;
        bgMusicAudio.volume = 0.3; // Default volume for background cozy music
        bgMusicAudio.muted = isMuted; // Apply synced mute state

        // Trigger background load
        bgMusicAudio.load();
    }
};

export const playBackgroundMusic = (): void => {
    initAudio();
    bgMusicStarted = true;
    if (bgMusicAudio && bgMusicAudio.paused) {
        // Only play if not muted and it's currently paused
        bgMusicAudio.play().catch((error: unknown) => {
            console.warn('Audio play failed/blocked by browser:', error);
        });
    }
};

export const pauseBackgroundMusic = (): void => {
    if (bgMusicAudio && !bgMusicAudio.paused) {
        bgMusicAudio.pause();
    }
};

export const toggleMute = (): boolean => {
    isMuted = !isMuted;
    if (bgMusicAudio) {
        bgMusicAudio.muted = isMuted;
    }
    return isMuted;
};

export const getIsMuted = (): boolean => isMuted;

export const setMusicVolume = (vol: number): void => {
    if (bgMusicAudio) {
        bgMusicAudio.volume = Math.max(0, Math.min(1, vol));
        // Auto-unmute if user drags slider up
        if (vol > 0 && isMuted) {
            isMuted = false;
            bgMusicAudio.muted = false;
        }

        // Ensure playback continues if we unmute, ONLY if the music has actually been requested to start
        if (vol > 0 && bgMusicAudio.paused && bgMusicStarted) {
            bgMusicAudio.play().catch((error: unknown) => console.warn(error));
        }
    }
    // Dispatch event so UI sliders can stay in sync if changed programmatically
    window.dispatchEvent(new CustomEvent('musicVolumeChanged', { detail: vol }));
};

export const getMusicVolume = (): number => {
    return bgMusicAudio ? bgMusicAudio.volume : 0.3;
};
