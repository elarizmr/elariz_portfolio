import { useEffect, useRef, useMemo } from 'react';
import gsap from 'gsap';
import { useScene } from '../../context/SceneContext';
import { useAudio } from '../../context/AudioManager';

interface TearLineSVGProps {
    svgPathData: string;
}

/**
 * PaperTransition - Reusable paper tear transition for teleportation
 * 
 * Listens to SceneContext teleportPhase:
 * - 'closing': Paper halves slide together (reverse of tear)
 * - 'teleporting': Paper is closed, waiting for destination load
 * - 'opening': Paper tears apart revealing new room
 */

// Reusable SVG Line Component (copied from Preloader)
const TearLineSVG = ({ svgPathData }: TearLineSVGProps) => (
    <svg
        className="preloader__overlay absolute top-0 left-0 z-10 h-full w-full pointer-events-none"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        style={{ pointerEvents: 'none' }}
    >
        <path
            d={svgPathData}
            fill="none"
            stroke="#1a1a1a"
            strokeWidth="0.1"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
    </svg>
);

const PaperTransition = () => {
    const {
        teleportPhase,
        startTeleportTransition,
        finishPaperOpen,
        teleportTarget
    } = useScene();
    const { play } = useAudio();

    const containerRef = useRef<HTMLDivElement>(null);
    const leftHalfRef = useRef<HTMLDivElement>(null);
    const rightHalfRef = useRef<HTMLDivElement>(null);
    const timelineRef = useRef<gsap.core.Timeline | null>(null);

    // Generate tear path (same logic as Preloader)
    const tearPoints = useMemo(() => {
        const points: [number, number][] = [];
        const segments = 12;

        points.push([50, 0]);

        for (let i = 1; i < segments; i++) {
            const y = (i / segments) * 100;
            const xOffset = (Math.random() - 0.5) * 6;
            const x = 50 + xOffset;
            points.push([x, y]);
        }

        points.push([50, 100]);
        return points;
    }, []);

    const svgPathData = useMemo(() => {
        return tearPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p[0]} ${p[1]} `).join(' ');
    }, [tearPoints]);

    const leftClipPoly = useMemo(() => {
        let poly = '0% 0%, ';
        tearPoints.forEach(p => { poly += `${p[0]}% ${p[1]}%, `; });
        poly += '0% 100%';
        return `polygon(${poly})`;
    }, [tearPoints]);

    const rightClipPoly = useMemo(() => {
        let poly = '100% 0%, ';
        poly += '100% 100%, ';
        [...tearPoints].reverse().forEach(p => { poly += `${p[0]}% ${p[1]}%, `; });
        return `polygon(${poly.slice(0, -2)})`;
    }, [tearPoints]);

    // Handle teleport phases
    useEffect(() => {
        if (!leftHalfRef.current || !rightHalfRef.current || !containerRef.current) return;

        // Kill any existing timeline
        if (timelineRef.current) {
            timelineRef.current.kill();
        }

        if (teleportPhase === 'closing') {
            // Show container
            gsap.set(containerRef.current, { opacity: 1, display: 'block' });

            // Start with halves apart (like at end of preloader)
            gsap.set(leftHalfRef.current, { xPercent: -100, rotation: -2 });
            gsap.set(rightHalfRef.current, { xPercent: 100, rotation: 2 });

            // Animate halves together
            const timeline = gsap.timeline({
                onComplete: () => {
                    startTeleportTransition(); // Move to 'teleporting' phase
                }
            });
            timelineRef.current = timeline;

            // Play paper sound
            play('tear', { volume: 0.6 });

            timeline.to(leftHalfRef.current, {
                xPercent: 0,
                rotation: 0,
                duration: 0.8,
                ease: "power2.inOut"
            }, 'close');

            timeline.to(rightHalfRef.current, {
                xPercent: 0,
                rotation: 0,
                duration: 0.8,
                ease: "power2.inOut"
            }, 'close');
        }

        if (teleportPhase === 'teleporting') {
            // Paper is closed, TeleportRoom is loading the destination
            // TeleportRoom will call openTeleportTransition() when room is ready
            // No action needed here - just wait
        }

        if (teleportPhase === 'opening') {
            // Tear the paper apart
            const timeline = gsap.timeline({
                onComplete: () => {
                    finishPaperOpen(); // Just clear the phase - teleport logic already done
                }
            });
            timelineRef.current = timeline;

            play('tear', { volume: 0.8 });

            timeline.to(leftHalfRef.current, {
                xPercent: -100,
                rotation: -2,
                duration: 1.2,
                ease: "power3.inOut"
            }, 'tear');

            timeline.to(rightHalfRef.current, {
                xPercent: 100,
                rotation: 2,
                duration: 1.2,
                ease: "power3.inOut"
            }, 'tear');

            // Fade out container at end
            timeline.to(containerRef.current, {
                opacity: 0,
                duration: 0.3,
                onComplete: () => {
                    gsap.set(containerRef.current, { display: 'none' });
                }
            }, '-=0.3');
        }

        return () => {
            if (timelineRef.current) {
                timelineRef.current.kill();
            }
        };
    }, [teleportPhase, startTeleportTransition, finishPaperOpen, play]);

    // Zostawiamy komponent cały czas w DOM (bez "return null"), 
    // żeby uniknąć laga pierwszego załadowania skomplikowanych ścieżek SVG.
    // if (!teleportPhase) return null;

    return (
        <div
            className="preloader fixed inset-0 h-full w-full z-[var(--z-index-preloader)] pointer-events-auto cursor-auto"
            ref={containerRef}
            style={{ pointerEvents: 'none', display: 'none' }} // DOM starts hidden
        >
            {/* LEFT HALF */}
            <div
                className="preloader__half preloader__half--left absolute top-0 bottom-0 h-full w-full bg-white bg-[url('/textures/paper-texture.webp')] bg-cover bg-center will-change-transform [filter:drop-shadow(0_0_10px_rgba(0,0,0,0.1))] left-0"
                ref={leftHalfRef}
                style={{ clipPath: leftClipPoly }}
            >
                <TearLineSVG svgPathData={svgPathData} />
            </div>

            {/* RIGHT HALF */}
            <div
                className="preloader__half preloader__half--right absolute top-0 bottom-0 h-full w-full bg-white bg-[url('/textures/paper-texture.webp')] bg-cover bg-center will-change-transform [filter:drop-shadow(0_0_10px_rgba(0,0,0,0.1))] right-0"
                ref={rightHalfRef}
                style={{ clipPath: rightClipPoly }}
            >
                <TearLineSVG svgPathData={svgPathData} />
            </div>
        </div>
    );
};

export default PaperTransition;
