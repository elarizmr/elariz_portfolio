import React from 'react';
import { useAchievements, ACHIEVEMENTS } from '../../context/AchievementsContext';

interface AchievementsPanelProps {
    isOpen: boolean;
    onClose: () => void;
}

const AchievementsPanel = ({ isOpen, onClose }: AchievementsPanelProps) => {
    const { completed } = useAchievements();

    return (
        <div className={`achievements-panel fixed top-0 right-6 w-[280px] opacity-0 pointer-events-none -translate-y-full z-[95] [filter:drop-shadow(0_4px_15px_rgba(0,0,0,0.15))] [transition:transform_0.4s_cubic-bezier(0.16,1,0.3,1),opacity_0.3s_ease] max-tablet:right-4 max-tablet:w-[260px] [&.open]:opacity-100 [&.open]:pointer-events-auto [&.open]:translate-y-0 ${isOpen ? 'open' : ''}`} inert={!isOpen ? true : undefined}>
            <div className="achievements-card relative w-full px-4 pt-[18px] pb-5 bg-white overflow-hidden">
                <div className="achievements-header relative z-[1] flex justify-between items-center mb-3 pb-2 border-b-2 border-dashed border-[#bbb]">
                    <h3 className="m-0 text-sm font-bold tracking-[1.5px] text-[#1a1a1a] font-patrick-hand">ACHIEVEMENTS</h3>
                    <button
                        className="close-btn flex items-center justify-center w-6 h-6 bg-transparent border-0 cursor-pointer opacity-60 transition-[transform,opacity] duration-200 hover:opacity-100 hover:scale-110 active:scale-95 [&>svg]:w-[14px] [&>svg]:h-[14px] [&>svg]:stroke-[#1a1a1a] [&>svg]:stroke-[2.5] [&>svg]:fill-none [&>svg]:[stroke-linecap:round]"
                        onClick={onClose}
                        aria-label="Close achievements"
                    >
                        <svg viewBox="0 0 24 24">
                            <path d="M18 6L6 18M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="achievements-list relative z-[1] flex flex-col gap-3 max-h-[50vh] overflow-y-auto pr-1 [scrollbar-width:thin] [scrollbar-color:#ccc_transparent]">
                    {Object.values(ACHIEVEMENTS).map((achievement) => {
                        const isUnlocked = completed.includes(achievement.id);
                        return (
                            <div key={achievement.id} className={`achievement-item flex items-center gap-3 py-1.5 [&.locked]:opacity-50 ${isUnlocked ? 'unlocked' : 'locked'}`}>
                                <div className="achievement-icon flex items-center justify-center shrink-0 w-7 h-7 [&>svg]:w-full [&>svg]:h-full">
                                    {isUnlocked ? (
                                        <svg viewBox="0 0 24 24" className="icon-unlocked">
                                            <path d="M12 15l-3-3 1.4-1.4 1.6 1.6 4.6-4.6L18 9" fill="none" stroke="#1a1a1a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                                            <circle cx="12" cy="12" r="10" fill="none" stroke="#1a1a1a" strokeWidth="2" />
                                        </svg>
                                    ) : (
                                        <svg viewBox="0 0 24 24" className="icon-locked">
                                            <rect x="7" y="11" width="10" height="8" rx="2" fill="none" stroke="#666" strokeWidth="2" />
                                            <path d="M9 11V8a3 3 0 0 1 6 0v3" fill="none" stroke="#666" strokeWidth="2" />
                                        </svg>
                                    )}
                                </div>
                                <div className="achievement-text flex flex-col">
                                    <div className={`achievement-title mb-px font-patrick-hand text-sm font-bold text-[#1a1a1a] tracking-[0.5px] ${isUnlocked ? '' : '!text-[#555]'}`}>{achievement.title}</div>
                                    <div className={`achievement-label text-xs text-[#444] leading-[1.2] ${isUnlocked ? '' : '!text-[#777]'}`}>{achievement.label}</div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                <div className="achievements-footer relative z-[1] mt-3 pt-[10px] border-t-2 border-dashed border-[#bbb] text-center font-patrick-hand font-bold text-xs tracking-[1px] text-[#1a1a1a]">
                    <span>{completed.length} / {Object.keys(ACHIEVEMENTS).length} EXPLORED</span>
                </div>
            </div>
        </div>
    );
};

export default AchievementsPanel;
