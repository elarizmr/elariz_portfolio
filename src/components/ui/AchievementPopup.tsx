import React from 'react';
import { useAchievements, ACHIEVEMENTS } from '../../context/AchievementsContext';
import { useAudio } from '../../context/AudioManager';
import { toggleMute as toggleBgmMute, getIsMuted as getBgmMuted, setMusicVolume } from '../../utils/audioManager';

const AchievementPopup = () => {
    const { activePopup } = useAchievements();
    const { isMuted, toggleMute, setGlobalVolume } = useAudio();

    if (!activePopup) return null;

    const data = ACHIEVEMENTS[activePopup.id];
    if (!data) return null;

    const isCompleted = activePopup.status === 'completed';
    const isHiding = activePopup.status === 'hiding';

    // Specjalna logika dla corridor_enter (pytanie o dźwięk)
    const isSoundPrompt = activePopup.id === 'corridor_enter';

    return (
        <div
            className={`achievement-popup fixed bottom-8 left-1/2 [transform:translateX(-50%)_translateY(100px)] opacity-0 pointer-events-none z-[110] bg-white py-3 px-6 flex items-center gap-4 max-tablet:bottom-6 max-tablet:py-[10px] max-tablet:px-4 ${isCompleted ? 'completed' : ''} ${isHiding ? 'hiding' : ''} ${isSoundPrompt ? 'interactive' : ''}`}
            style={isSoundPrompt ? { pointerEvents: 'auto' } : {}}
        >
            {/* SVG Border Overlay */}
            <svg
                className="popup-border absolute top-0 left-0 w-full h-full pointer-events-none z-10"
                viewBox="0 0 100 100"
                preserveAspectRatio="none"
            >
                <path
                    d="M 0 0 L 100 0 L 100 0 L 98 10 L 100 20 L 97 35 L 100 50 L 98 65 L 100 80 L 97 90 L 100 100 L 90 97 L 80 100 L 70 96 L 60 100 L 50 97 L 40 100 L 30 96 L 20 100 L 10 97 L 0 100 L 0 100 L 2 90 L 0 80 L 3 65 L 0 50 L 2 35 L 0 20 L 3 10 L 0 0 Z"
                    fill="none"
                    stroke="#1a1a1a"
                    strokeWidth="0.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    vectorEffect="non-scaling-stroke"
                />
            </svg>
            <div className="popup-content relative z-[1] flex items-center gap-4">
                {!isSoundPrompt && (
                    <div className={`checkbox w-6 h-6 border-2 border-[#1a1a1a] rounded-[4px] flex items-center justify-center bg-transparent ${isCompleted ? 'checked' : ''}`}>
                        {isCompleted && (
                            <svg viewBox="0 0 24 24" className="checkmark w-[18px] h-[18px] bg-transparent [stroke-dasharray:24] [stroke-dashoffset:24] [animation:drawCheck_0.3s_ease_forwards_0.1s]">
                                <path d="M5 13l4 4L19 7" fill="none" stroke="#1a1a1a" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        )}
                    </div>
                )}
                <div className={`text-content flex flex-col ${isSoundPrompt ? 'items-center text-center' : ''}`}>
                    <span className="title mb-[2px] font-patrick-hand text-sm font-bold text-[#1a1a1a] uppercase tracking-[1px] max-tablet:text-[13px]">{data.title}</span>

                    {!isSoundPrompt ? (
                        <span className="description text-[13px] text-[#444] leading-[1.4] max-tablet:text-xs">{data.label}</span>
                    ) : (
                        <span className="description text-[13px] text-[#444] leading-[1.4] max-tablet:text-xs">
                            Click a door to enter. Audio is currently
                            <button
                                className={`inline-sound-toggle bg-transparent border-0 p-0 ml-1 font-patrick-hand text-[13px] font-bold cursor-pointer underline decoration-dashed underline-offset-[3px] transition-[opacity,transform] duration-200 inline-flex items-center hover:opacity-70 hover:scale-[1.05] ${!isMuted ? 'on !text-[#1a1a1a]' : 'off !text-[#888]'}`}
                                onClick={(e) => {
                                    e.stopPropagation();

                                    const willMute = !isMuted;

                                    // 1. Oprogramowujemy flagi MUTE (dla silnika i utilsa)
                                    if (isMuted !== willMute) toggleMute();
                                    if (getBgmMuted() !== willMute) toggleBgmMute();

                                    // 2. Wymuszamy fizyczne zjechanie pasków głośności, 
                                    // żeby menu się zsynchronizowało z ustawieniami z wejścia
                                    if (willMute) {
                                        setGlobalVolume(0);
                                        setMusicVolume(0);
                                    } else {
                                        setGlobalVolume(1.0); // 100% SFX
                                        setMusicVolume(0.3);  // 30% BGM
                                    }
                                }}
                            >
                                {!isMuted ? " [🔊 ON]" : " [🔇 OFF]"}
                            </button>
                        </span>
                    )}
                </div>

            </div>
        </div>
    );
};

export default AchievementPopup;
