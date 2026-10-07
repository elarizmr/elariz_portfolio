import { useAudio } from '../../context/AudioManager';

const AudioControls = () => {
    const { isMuted, toggleMute, globalVolume, setGlobalVolume } = useAudio();

    // Hand-drawn SVG Icons
    const SoundOnIcon = () => (
        <svg viewBox="0 0 24 24">
            <path d="M11 5L6 9H2v6h4l5 4V5z" strokeWidth="2.5" />
            <path d="M15 9a5 5 0 0 1 0 6" />
            <path d="M18 5a9 9 0 0 1 0 14" />
        </svg>
    );

    const SoundOffIcon = () => (
        <svg viewBox="0 0 24 24">
            <path d="M11 5L6 9H2v6h4l5 4V5z" strokeWidth="2.5" />
            <line x1="23" y1="9" x2="17" y2="15" />
            <line x1="17" y1="9" x2="23" y2="15" />
        </svg>
    );

    return (
        <div className="audio-controls group fixed top-8 right-8 z-[1000] flex items-center gap-[15px] px-[15px] py-[10px]">
            {/* Volume Slider - Revealed on Hover via CSS */}
            <div className="volume-slider-container flex items-center overflow-hidden opacity-0 w-0 translate-x-[10px] transition-[all] duration-[400ms] [transition-timing-function:cubic-bezier(0.34,1.56,0.64,1)] group-hover:opacity-100 group-hover:w-[100px] group-hover:translate-x-0">
                <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={globalVolume}
                    onChange={(e) => setGlobalVolume(parseFloat(e.target.value))}
                    className="w-full bg-transparent cursor-pointer appearance-none focus:outline-none"
                    aria-label="Volume"
                />
            </div>

            {/* Mute Toggle Button */}
            <button
                className="mute-btn flex items-center justify-center p-[5px] opacity-80 transition-[transform,opacity] duration-200 hover:opacity-100 hover:scale-[1.1] hover:rotate-[5deg] [&>svg]:w-7 [&>svg]:h-7 [&>svg]:fill-none [&>svg]:stroke-[#1a1a1a] [&>svg]:stroke-2 [&>svg]:[stroke-linecap:round] [&>svg]:[stroke-linejoin:round]"
                onClick={toggleMute}
                aria-label={isMuted ? "Unmute" : "Mute"}
            >
                {isMuted || globalVolume === 0 ? <SoundOffIcon /> : <SoundOnIcon />}
            </button>
        </div>
    );
};

export default AudioControls;
