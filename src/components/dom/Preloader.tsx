import { useState, useEffect, useRef, useMemo } from 'react';
import * as THREE from 'three';
import gsap from 'gsap';
import { useAudio } from '../../context/AudioManager';
import type { Ref } from 'react';

// Reusable SVG Line Component (now accepts ref)
interface TearLineSVGProps {
  svgPathData: string;
  pathLength: number;
  strokeDashoffset: number;
  pathRef: Ref<SVGPathElement>;
}

const TearLineSVG = ({ svgPathData, pathLength, strokeDashoffset, pathRef }: TearLineSVGProps) => (
  <svg
    className="preloader__overlay absolute top-0 left-0 z-10 h-full w-full pointer-events-none"
    viewBox="0 0 100 100"
    preserveAspectRatio="none"
    style={{ pointerEvents: 'none' }}
  >
    <path
      ref={pathRef}
      d={svgPathData}
      fill="none"
      stroke="#1a1a1a"
      strokeWidth="0.1"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{
        strokeDasharray: pathLength,
        strokeDashoffset: strokeDashoffset,
      }}
    />
  </svg>
);

// New Ring Loader - Cleaner circle that spins around text
const RingLoader = () => (
  <div className="preloader__ring absolute top-1/2 left-1/2 h-[120px] w-[120px] pointer-events-none z-[5] [animation:ring-spin_10s_linear_infinite]">
    <svg width="120" height="120" viewBox="0 0 100 100" style={{ overflow: 'visible' }}>
      <circle
        cx="50" cy="50" r="45"
        fill="none"
        stroke="#000"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeDasharray="10 15"
        opacity="0.8"
      />
      <circle
        cx="50" cy="50" r="35"
        fill="none"
        stroke="#000"
        strokeWidth="1"
        strokeLinecap="round"
        strokeDasharray="5 10"
        opacity="0.5"
        className="preloader__ring-inner [animation:ring-spin-reverse_4s_linear_infinite] [transform-origin:50%_50%]"
      />
    </svg>
  </div>
);

interface PreloaderProps {
  onComplete?: () => void;
  ready: boolean;
}

const Preloader = ({ onComplete, ready }: PreloaderProps) => {
  const [isDone, setIsDone] = useState(false);

  // Custom throttled progress state to prevent React 'Maximum update depth exceeded'
  const [realProgress, setRealProgress] = useState(0);
  const [active, setActive] = useState(true);

  useEffect(() => {
    let t = 0;
    const origOnStart = THREE.DefaultLoadingManager.onStart;
    const origOnProgress = THREE.DefaultLoadingManager.onProgress;
    const origOnLoad = THREE.DefaultLoadingManager.onLoad;

    THREE.DefaultLoadingManager.onStart = (url, loaded, total) => {
      setActive(true);
      origOnStart?.(url, loaded, total);
    };

    THREE.DefaultLoadingManager.onProgress = (url, loaded, total) => {
      cancelAnimationFrame(t);
      t = requestAnimationFrame(() => {
        setRealProgress((loaded / total) * 100);
      });
      origOnProgress?.(url, loaded, total);
    };

    THREE.DefaultLoadingManager.onLoad = () => {
      cancelAnimationFrame(t);
      setRealProgress(100);
      setActive(false);
      
      const loadEnd = performance.now();
      const loadDuration = ((loadEnd - loadStartTime.current) / 1000).toFixed(2);
      // console.info(`📦 Assets Loaded: ${loadDuration}s`);
      
      origOnLoad?.();
    };

    return () => {
      THREE.DefaultLoadingManager.onStart = origOnStart;
      THREE.DefaultLoadingManager.onProgress = origOnProgress;
      THREE.DefaultLoadingManager.onLoad = origOnLoad;
    };
  }, []);

  const { play } = useAudio();
  // Track audio handle to stop loop
  const pencilSoundRef = useRef<ReturnType<typeof play> | null>(null);

  // Performance Tracking
  const loadStartTime = useRef(performance.now());

  // Use refs for animation targets
  const containerRef = useRef<HTMLDivElement>(null);
  const leftHalfRef = useRef<HTMLDivElement>(null);
  const rightHalfRef = useRef<HTMLDivElement>(null);
  const pathLeftRef = useRef<SVGPathElement>(null);
  const pathRightRef = useRef<SVGPathElement>(null);
  const textLeftRef = useRef<HTMLSpanElement>(null);
  const textRightRef = useRef<HTMLSpanElement>(null);

  // Track visual progress entirely in refs to skip React renders 60x/sec!
  const [targetProgress, setTargetProgress] = useState(0);
  const displayProgressRef = useRef(0);
  const trackerRef = useRef<{ val: number }>({ val: 0 });
  const readyRef = useRef(ready);

  useEffect(() => { readyRef.current = ready; }, [ready]);

  // ----------------------------------------
  // GENERATE TEAR PATH
  // ----------------------------------------
  const tearPoints = useMemo(() => {
    const points: [number, number][] = [];
    const segments = 12; // Fewer segments

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


  // ----------------------------------------
  // SMOOTH LOADING LOGIC
  // ----------------------------------------
  useEffect(() => {
    let newTarget = 0;
    if (active) {
      newTarget = (realProgress / 100) * 85;
    } else {
      if (ready) {
        newTarget = 100;
      } else {
        newTarget = 90;
      }
    }

    setTargetProgress(prev => Math.max(prev, newTarget));
  }, [realProgress, active, ready]);

  // Handle Pencil Sound & Exit checking dynamically
  const checkProgressTriggers = (val: number): void => {
    // Pencil Sound
    if (val < 99 && !pencilSoundRef.current) {
      pencilSoundRef.current = play('pencil', { loop: true, volume: 0.5 });
    }
    else if (val >= 99 && pencilSoundRef.current) {
      pencilSoundRef.current.stop();
      pencilSoundRef.current = null;
    }

    // Exit phase
    if (val >= 99.5 && readyRef.current && !exitStarted.current) {
      exitStarted.current = true;
      startExit();
    }
  };

  useEffect(() => {
    return () => {
      if (pencilSoundRef.current) {
        pencilSoundRef.current.stop();
        pencilSoundRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    const distance = targetProgress - displayProgressRef.current;
    let duration = 0.5;

    if (distance > 60) {
      duration = 1.5;
    } else if (distance > 30) {
      duration = 1.0;
    } else if (distance > 10) {
      duration = 0.6;
    } else if (distance > 0) {
      duration = 0.4;
    }

    gsap.to(trackerRef.current, {
      val: targetProgress,
      duration: duration,
      ease: "power2.out",
      overwrite: true, // Auto kill previous tweens on trackerRef
      onUpdate: () => {
        const val = trackerRef.current.val;
        displayProgressRef.current = val;

        const safeProgress = Math.min(100, Math.max(0, val));
        const strokeDashoffset = 120 - (120 * safeProgress) / 100;
        const percentageText = `${Math.round(safeProgress)}%`;

        // Direct DOM manipulation - BYPASS React Render!
        if (textLeftRef.current) textLeftRef.current.innerText = percentageText;
        if (textRightRef.current) textRightRef.current.innerText = percentageText;
        if (pathLeftRef.current) pathLeftRef.current.style.strokeDashoffset = String(strokeDashoffset);
        if (pathRightRef.current) pathRightRef.current.style.strokeDashoffset = String(strokeDashoffset);

        checkProgressTriggers(val);
      }
    });

  }, [targetProgress]);


  // ----------------------------------------
  // EXIT SEQUENCE
  // ----------------------------------------
  const exitStarted = useRef(false);

  // Fallback trigger if ready becomes true AFTER 99.5% reached
  useEffect(() => {
    if (displayProgressRef.current >= 99.5 && ready && !exitStarted.current) {
      exitStarted.current = true;
      startExit();
    }
  }, [ready]);

  const startExit = () => {
    exitStarted.current = true;

    if (pencilSoundRef.current) {
      pencilSoundRef.current.stop();
      pencilSoundRef.current = null;
    }
    play('tear', { volume: 0.8 });

    const tl = gsap.timeline({
      onComplete: () => {
        setIsDone(true);
        
        const exitEnd = performance.now();
        const totalDuration = ((exitEnd - loadStartTime.current) / 1000).toFixed(2);
        // console.group("⏱️ Portfolio Loading Performance");
        // console.log(`- Start: %c${loadStartTime.current.toFixed(0)}ms`, "color: #888");
        // console.log(`- Total Duration: %c${totalDuration}s`, "color: #00ff00; font-weight: bold;");
        // console.groupEnd();
        
        onComplete?.();
      }
    });

    // 1. Quick pause before tear
    tl.to({}, { duration: 0.1 });

    // 2. Tear Apart
    tl.to(leftHalfRef.current, {
      xPercent: -100,
      rotation: -2,
      duration: 1.8,
      ease: "power3.inOut"
    }, 'tear');

    tl.to(rightHalfRef.current, {
      xPercent: 100,
      rotation: 2,
      duration: 1.8,
      ease: "power3.inOut"
    }, 'tear');

    // 3. Fade container
    tl.to(containerRef.current, {
      opacity: 0,
      duration: 0.5
    }, '-=0.5');
  };

  if (isDone) return null;

  const pathLength = 120;
  // Initialize values
  const safeProgress = Math.min(100, Math.max(0, displayProgressRef.current));
  const strokeDashoffset = pathLength - (pathLength * safeProgress) / 100;
  const percentageText = `${Math.round(safeProgress)}%`;

  return (
    <div className="preloader fixed inset-0 h-full w-full z-[var(--z-index-preloader)] pointer-events-auto cursor-auto" ref={containerRef}>
      {/* LEFT HALF */}
      <div
        className="preloader__half preloader__half--left absolute top-0 bottom-0 h-full w-full bg-white bg-[url('/textures/paper-texture.webp')] bg-cover bg-center will-change-transform [filter:drop-shadow(0_0_10px_rgba(0,0,0,0.1))] left-0"
        ref={leftHalfRef}
        style={{ clipPath: leftClipPoly }}
      >
        {/* Content: Percentage & Line */}
        <div className="preloader__percentage absolute top-1/2 left-1/2 w-full -translate-x-1/2 -translate-y-1/2 text-center z-20 font-primary text-[2rem] font-bold text-black mix-blend-multiply flex justify-center items-center overflow-visible">
          <span ref={textLeftRef}>{percentageText}</span>
          <RingLoader />
        </div>

        {/* SVG is now INSIDE the clipped half */}
        <TearLineSVG pathRef={pathLeftRef} svgPathData={svgPathData} pathLength={pathLength} strokeDashoffset={strokeDashoffset} />
      </div>

      {/* RIGHT HALF */}
      <div
        className="preloader__half preloader__half--right absolute top-0 bottom-0 h-full w-full bg-white bg-[url('/textures/paper-texture.webp')] bg-cover bg-center will-change-transform [filter:drop-shadow(0_0_10px_rgba(0,0,0,0.1))] right-0"
        ref={rightHalfRef}
        style={{ clipPath: rightClipPoly }}
      >
        {/* Content: Percentage & Line */}
        <div className="preloader__percentage absolute top-1/2 left-1/2 w-full -translate-x-1/2 -translate-y-1/2 text-center z-20 font-primary text-[2rem] font-bold text-black mix-blend-multiply flex justify-center items-center overflow-visible">
          <span ref={textRightRef}>{percentageText}</span>
          <RingLoader />
        </div>

        {/* SVG is now INSIDE the clipped half */}
        <TearLineSVG pathRef={pathRightRef} svgPathData={svgPathData} pathLength={pathLength} strokeDashoffset={strokeDashoffset} />
      </div>
    </div>
  );
};

export default Preloader;
