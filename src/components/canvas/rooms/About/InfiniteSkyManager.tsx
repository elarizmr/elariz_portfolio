import { useState, useRef, useMemo, useEffect } from 'react';
import { useFrame, useLoader, useThree } from '@react-three/fiber';
import type { ThreeEvent } from '@react-three/fiber';
import { Text, PositionalAudio } from '@react-three/drei';
import * as THREE from 'three';
import gsap from 'gsap';
import SkyChunk, { CHUNK_LENGTH, ROOM_Z } from './SkyChunk';
import '../../shaders/RevealBasicMaterial'; // Registers brush-stroke reveal for BasicMaterial
import { isTouchDevice } from '../../../../utils/deviceDetect';

// Reusable Vector3 to avoid allocations in event handlers
const _tempVec3 = new THREE.Vector3();

/**
 * InfiniteSkyManager Component
 * 
 * Manages dynamic generation/removal of sky chunks for infinite scroll.
 * World group moves with scroll, chunks stay at fixed positions relative to group.
 * Includes Story Milestones that loop with the content!
 */

import { useAudio } from '../../../../context/AudioManager';

type Vector3Tuple = [number, number, number];
type ScrollProgressRef = { current: number };
type RevealBasicMaterialRef = THREE.MeshBasicMaterial & { uProgress: number };
type BalloonSize = 'large' | 'medium' | 'small';

interface RevealBasicMaterialProps {
    uProgress?: number;
}

declare module '@react-three/fiber' {
    interface ThreeElements {
        revealBasicMaterial: ThreeElements['meshBasicMaterial'] & RevealBasicMaterialProps;
    }
}

export const BALLOON_AUDIO_SETTINGS = {
    volume: 1.0,
    distance: 2,
    rolloff: 2
};

/**
 * Reusable Button Component with Hover Effect + Brush-Stroke Reveal
 */
// Story milestones repeat at consistent intervals along the sky path.
const STORY_CYCLE_LENGTH = 120;

// === TWARDA LINIA ZANIKANIA DLA MILESTONES (WORLD SPACE) ===
// Pokój About jest na Z = -25, więc -25 to drzwi pokoju
// -27 = 2 metry za drzwiami (w głąb pokoju) - musi matchować CORRIDOR_CLIP_Z w SkyChunk
const MILESTONE_CORRIDOR_CLIP_Z = -8.0;

interface InfiniteSkyManagerProps {
    scrollProgressRef?: ScrollProgressRef;
}

interface MilestoneProps {
    z: number;
    scrollProgressRef?: ScrollProgressRef;
}

const InfiniteSkyManager = ({ scrollProgressRef }: InfiniteSkyManagerProps) => {
    // PRE-CALCULATED FOR scrolProgress = 0
    // currentChunk = floor(0/40) = 0 -> [-1, 0, 1, 2]
    const [activeChunks, setActiveChunks] = useState([-1, 0, 1, 2]);
    // currentStoryCycle = floor(0/120) = 0 -> [-1, 0, 1]
    const [activeStoryCycles, setActiveStoryCycles] = useState([-1, 0, 1]);
    const worldRef = useRef<THREE.Group | null>(null);

    // Track current chunk for recycling
    const getCurrentChunk = (worldZ: number) => {
        return Math.floor(worldZ / CHUNK_LENGTH);
    };

    // Track current story cycle
    const getCurrentStoryCycle = (worldZ: number) => {
        return Math.floor(worldZ / STORY_CYCLE_LENGTH);
    };

    // Update chunks based on world position
    useFrame(() => {
        if (!worldRef.current) return;

        const scrollProgress = scrollProgressRef?.current || 0;

        // Move world directly
        worldRef.current.position.z = scrollProgress;

        // Figure out which chunk we're in
        const currentChunk = getCurrentChunk(scrollProgress);
        const shouldBeActiveChunks = [
            currentChunk - 1,
            currentChunk,
            currentChunk + 1,
            currentChunk + 2,
        ];

        const chunksNeedUpdate = shouldBeActiveChunks.some(c => !activeChunks.includes(c)) ||
            activeChunks.some(c => !shouldBeActiveChunks.includes(c));

        if (chunksNeedUpdate) {
            setActiveChunks(shouldBeActiveChunks);
        }

        // Update story cycles
        const currentStoryCycle = getCurrentStoryCycle(scrollProgress);
        const shouldBeActiveCycles = [
            currentStoryCycle - 1,
            currentStoryCycle,
            currentStoryCycle + 1,
        ];

        const cyclesNeedUpdate = shouldBeActiveCycles.some(c => !activeStoryCycles.includes(c)) ||
            activeStoryCycles.some(c => !shouldBeActiveCycles.includes(c));

        if (cyclesNeedUpdate) {
            setActiveStoryCycles(shouldBeActiveCycles);
        }
    });

    return (
        <group ref={worldRef}>
            {/* === SKY CHUNKS WITH CLOUDS === */}
            {activeChunks.map((chunkIndex) => (
                <SkyChunk
                    key={`sky-chunk-${chunkIndex}`}
                    chunkIndex={chunkIndex}
                    seed={42}
                    scrollProgressRef={scrollProgressRef}
                />
            ))}

            {/* === STORY MILESTONES (loop every 120 units) === */}
            {activeStoryCycles.map((cycleIndex) => (
                <group key={`story-cycle-${cycleIndex}`}>
                    {/* === INTRO MILESTONE === */}
                    <IntroMilestone
                        z={-(cycleIndex * STORY_CYCLE_LENGTH + 15)}
                        scrollProgressRef={scrollProgressRef}
                    />

                    {/* === JOURNEY MILESTONE === */}
                    <JourneyMilestone
                        z={-(cycleIndex * STORY_CYCLE_LENGTH + 55)}
                        scrollProgressRef={scrollProgressRef}
                    />

                    <SkillsMilestone
                        z={-(cycleIndex * STORY_CYCLE_LENGTH + 95)}
                        scrollProgressRef={scrollProgressRef}
                    />
                </group>
            ))}
        </group>
    );
};

/**
 * INTRO Milestone - Special detailed layout
 * Elements spread apart as they approach camera
 */
const IntroMilestone = ({ z, scrollProgressRef }: MilestoneProps) => {
    // Load avatar texture
    const avatarTexture = useLoader(THREE.TextureLoader, '/textures/about/awatarnachmurce.webp');
    const { camera, viewport } = useThree();
    const isTouch = isTouchDevice();

    // Refs for all animated elements
    const groupRef = useRef<THREE.Group | null>(null);
    const titleRef = useRef<THREE.Object3D | null>(null);
    const brandRef = useRef<THREE.Object3D | null>(null);
    const avatarRef = useRef<THREE.Mesh | null>(null);
    const motto1Ref = useRef<THREE.Object3D | null>(null);
    const motto2Ref = useRef<THREE.Object3D | null>(null);

    // Base positions
    const baseY = 2;

    // Calculate aspect ratio
    // LEGACY FIX: Use original dimensions (2816x1536) to prevent stretching
    const legacyAspectRatio = 2816 / 1536; 
    const avatarWidth = 6; // Zwiększony rozmiar awatara na chmurce
    const avatarHeight = avatarWidth / legacyAspectRatio;

    // Animation: floating + spread apart when close
    useFrame((state) => {
        if (!groupRef.current) return;

        const time = state.clock.elapsedTime;

        // === TWARDA LINIA CLIP (RĘCZNE OBLICZENIE WORLD Z) ===
        // worldZ = pokój(-25) + scrollProgress + lokalna pozycja milestone
        const scrollProgress = scrollProgressRef?.current || 0;
        const worldZ = ROOM_Z + scrollProgress + z;
        groupRef.current.visible = worldZ < MILESTONE_CORRIDOR_CLIP_Z;

        // Skip rest if not visible
        if (!groupRef.current.visible) return;

        // FIX: Use consistent distance based on scrollProgress + offset
        // This ensures animations work IDENTICALLY regardless of chunk/camera position
        // Base Start Z (-15) + Scroll (0) - Offset (55) = -70 (Matches "Working" Chunk 0 feel)
        const distanceZ = z + scrollProgress - 55;

        // Spread effect: starts at z = -25, full spread at z = -5
        // This makes elements spread BEFORE they reach the camera
        // === EDYTUJ TUTAJ (INTRO) ===
        // Zwiększ różnicę między Start a End, żeby animacja była wolniejsza
        const spreadStart = -70; // Startuje wcześniej
        const spreadEnd = -50;   // Kończy później
        let spreadFactor = 0;

        if (distanceZ > spreadStart && distanceZ < spreadEnd) {
            // Calculate spread: 0 at spreadStart, 1 at spreadEnd
            spreadFactor = (distanceZ - spreadStart) / (spreadEnd - spreadStart);
            spreadFactor = Math.min(1, Math.max(0, spreadFactor));
            // Ease out for smoother animation
            spreadFactor = spreadFactor * spreadFactor;
        } else if (distanceZ >= spreadEnd) {
            spreadFactor = 1;
        }

        // Apply spread to elements (move left/right) - MORE AGGRESSIVE
        const maxSpread = 15; // How far elements spread (increased!)

        if (titleRef.current) {
            titleRef.current.position.x = -spreadFactor * maxSpread * 0.8;
        }
        if (brandRef.current) {
            brandRef.current.position.x = spreadFactor * maxSpread * 0.6;
        }
        if (avatarRef.current) {
            // Avatar: floating + spread upward
            avatarRef.current.position.y = baseY + Math.sin(time * 0.8) * 0.15 + spreadFactor * 3;
            avatarRef.current.position.x = -spreadFactor * maxSpread * 0.3;
        }
        if (motto1Ref.current) {
            motto1Ref.current.position.x = spreadFactor * maxSpread * 0.7;
        }
        if (motto2Ref.current) {
            motto2Ref.current.position.x = -spreadFactor * maxSpread * 0.5;
        }
    });

    return (
        <group ref={groupRef} position={[0, 0, z]}>
            {/* Main title - Name (spreads left) */}
            <Text
                ref={titleRef}
                position={[0, 5, 0.1]}
                fontSize={0.8}
                color="#1a1a1a"
                anchorX="center"
                anchorY="middle"
                font="/fonts/RubikScribble-Regular.ttf"
            >
                ELARIZ RAJABOV
            </Text>

            {/* Subtitle - Brand (spreads right) */}
            <Text
                ref={brandRef}
                position={[0, 4.3, 0.1]}
                fontSize={0.45}
                color="#4a4a4a"
                anchorX="center"
                anchorY="middle"
                font="/fonts/CabinSketch-Regular.ttf"
            >
                Frontend Developer
            </Text>

            {/* Avatar on cloud - floating + spreads up-left */}
            <mesh ref={avatarRef} position={[0, baseY, 0]}>
                <planeGeometry args={[avatarWidth, avatarHeight]} />
                <meshBasicMaterial color="#e0e0e0"
                    map={avatarTexture}
                    transparent
                    side={THREE.DoubleSide}
                    depthWrite={false}
                />
            </mesh>

            {/* Motto - Line 1 (spreads right) */}
            <Text
                ref={motto1Ref}
                position={[0, 0, 0.1]}
                fontSize={0.32}
                color="#555555"
                anchorX="center"
                anchorY="middle"
                font="/fonts/CabinSketch-Regular.ttf"
                fontStyle="italic"
            >
                "Crafting digital experiences
            </Text>

            {/* Motto - Line 2 (spreads left) */}
            <Text
                ref={motto2Ref}
                position={[0, -0.5, 0]}
                fontSize={0.32}
                color="#555555"
                anchorX="center"
                anchorY="middle"
                font="/fonts/CabinSketch-Regular.ttf"
                fontStyle="italic"
            >
                that push creative boundaries"
            </Text>
        </group>
    );
};

/**
 * JOURNEY Milestone - Freelance Island
 */
const JourneyMilestone = ({ z, scrollProgressRef }: MilestoneProps) => {
    const groupRef = useRef<THREE.Group | null>(null);
    const freelanceRef = useRef<THREE.Group | null>(null);

    // Load the Freelance island artwork; its title and date are rendered as text.
    const freelanceTexture = useLoader(THREE.TextureLoader, '/textures/about/freelancewyspa.webp');

    freelanceTexture.colorSpace = THREE.SRGBColorSpace;

    // Keep the island image at its original aspect ratio.
    // LEGACY FIX: Use original dimensions (2816x1536)
    const islandLegacyAspect = 2816 / 1536;
    const freelanceAspect = islandLegacyAspect;

    // Base height for islands - width will adjust automatically
    const islandHeight = 4.5;

    useFrame((state) => {
        if (!groupRef.current) return;

        // === TWARDA LINIA CLIP (RĘCZNE OBLICZENIE WORLD Z) ===
        const scrollProgress = scrollProgressRef?.current || 0;
        const worldZ = ROOM_Z + scrollProgress + z;
        groupRef.current.visible = worldZ < MILESTONE_CORRIDOR_CLIP_Z;
        if (!groupRef.current.visible) return;

        const time = state.clock.elapsedTime;

        // FIX: Use consistent distance based on scrollProgress + offset
        const distanceZ = z + scrollProgress - 55;

        // Reveal effect (islands float up from below clouds)
        // === EDYTUJ TUTAJ (JOURNEY) ===
        const revealStart = -100; // Wcześniejszy start
        const revealEnd = -20;
        let revealFactor = 0;

        if (distanceZ > revealStart && distanceZ < revealEnd) {
            revealFactor = (distanceZ - revealStart) / (revealEnd - revealStart);
            revealFactor = Math.min(1, Math.max(0, revealFactor));
            revealFactor = 1 - Math.pow(1 - revealFactor, 2);
        } else if (distanceZ >= revealEnd) {
            revealFactor = 1;
        }

        // Freelance island retains its float and reveal animation.
        if (freelanceRef.current) {
            // === EDYTUJ POZYCJE TUTAJ (Freelance) ===
            const startY = -1;
            const endY = 2.5;

            const currentBaseY = startY + revealFactor * (endY - startY);
            freelanceRef.current.position.y = currentBaseY + Math.sin(time * 0.4 + 2) * 0.25;
            freelanceRef.current.rotation.z = Math.sin(time * 0.2 + 1) * -0.05;
        }
    });

    return (
        <group ref={groupRef} position={[0, 0, z]}>
            {/* Title */}
            <Text
                position={[0, 5, 0.3]}
                fontSize={1.2}
                color="#1a1a1a"
                anchorX="center"
                anchorY="middle"
                font="/fonts/RubikScribble-Regular.ttf"
            >
                JOURNEY
            </Text>

            {/* Subtitle */}
            <Text
                position={[0, 4.2, 0.3]}
                fontSize={0.35}
                color="#555555"
                anchorX="center"
                anchorY="middle"
                font="/fonts/CabinSketch-Regular.ttf"
            >
                My path so far...
            </Text>

            {/* === FREELANCE ISLAND === */}
            <group ref={freelanceRef} position={[0, -2, 0.5]}>
                <mesh>
                    <planeGeometry args={[islandHeight * freelanceAspect, islandHeight]} />
                    <meshBasicMaterial color="#e0e0e0"
                        map={freelanceTexture}
                        transparent
                        side={THREE.DoubleSide}
                    />
                </mesh>
               
                <Text
                    position={[0, -0.65, 0.1]}
                    fontSize={0.5}
                    color="#1a1a1a"
                    anchorX="center"
                    anchorY="middle"
                    font="/fonts/CabinSketch-Bold.ttf"
                >
                    2026-NOW
                </Text>
            </group>
        </group>
    );
};

/**
 * SKILLS Milestone - Floating Balloons
 * Colorful balloons floating upward, each representing a skill
 */

// Balloon configuration: size category, texture path, position offset
// === EDYTUJ WYSOKOŚĆ TUTAJ (zmień wartość 'y' dla każdego balona) ===
const BALLOON_CONFIG: BalloonConfig[] = [
    // Large balloons (main skills) - front and center
    { texture: '/textures/about/reactduzybalon.webp', paintedTexture: '/textures/about/reactduzybalon_painted.webp', label: 'React', size: 'large', x: -2.5, y: 2, z: 0.3, phase: 0 },
    { texture: '/textures/about/nodejsmalybalon.webp', paintedTexture: '/textures/about/nodejsmalybalon_painted.webp', label: 'Node.js', size: 'small', x: -6.2, y: 0.8, z: -0.9, phase: 5.5 },
     { texture: '/textures/about/threejsduzybalon.webp', paintedTexture: '/textures/about/threejsduzybalon_painted.webp', label: 'Three.js', size: 'large', x: 2.5, y: 2.5, z: 0.2, phase: 1.5 },

    // Medium balloons - scattered around
    { texture: '/textures/about/JSSREDNIBALON.webp', paintedTexture: '/textures/about/JSSREDNIBALON_painted.webp', label: 'JavaScript', size: 'medium', x: -4, y: 1, z: -0.3, phase: 0.8 },
    { texture: '/textures/about/csssrednibalon.webp', paintedTexture: '/textures/about/csssrednibalon_painted.webp', label: 'CSS', size: 'medium', x: 4, y: 1.5, z: -0.2, phase: 2.2 },
    { texture: '/textures/about/nextjssrednibalon.webp', paintedTexture: '/textures/about/nextjssrednibalon_painted.webp', label: 'Next.js', size: 'medium', x: 0, y: 0.5, z: -0.4, phase: 4 },

    // Small balloons - background accents
    { texture: '/textures/about/htmlmalybalon.webp', paintedTexture: '/textures/about/htmlmalybalon_painted.webp', label: 'HTML', size: 'small', x: -5.5, y: 2.5, z: -0.8, phase: 1.2 },
    { texture: '/textures/about/gitmalybalon.webp', paintedTexture: '/textures/about/gitmalybalon_painted.webp', label: 'Git', size: 'small', x: 5.5, y: 3, z: -0.7, phase: 2.8 },
    { texture: '/textures/about/figmamalybalon.webp', paintedTexture: '/textures/about/figmamalybalon_painted.webp', label: 'Figma', size: 'small', x: -3, y: 4.5, z: -0.5, phase: 3.5 },
    { texture: '/textures/about/firebasemalybalon.webp', paintedTexture: '/textures/about/firebasemalybalon_painted.webp', label: 'Firebase', size: 'small', x: 3.5, y: 4, z: -0.6, phase: 4.5 },   
];


interface BalloonConfig {
    texture: string;
    paintedTexture: string;
    label: string;
    size: BalloonSize;
    x: number;
    y: number;
    z: number;
    phase: number;
}

// Size multipliers for balloon categories
const SIZE_MULTIPLIERS: Record<BalloonSize, number> = {
    large: 3.0,
    medium: 2.2,
    small: 1.6,
};

// Individual balloon component
interface SkillBalloonProps {
    config: BalloonConfig;
    revealFactorRef: { current: number };
    spreadFactorRef: { current: number };
    timeRef: { current: number };
}

const SkillBalloon = ({ config, revealFactorRef, spreadFactorRef, timeRef }: SkillBalloonProps) => {
    const { viewport } = useThree();
    const isTouch = isTouchDevice();
    const texture = useLoader(THREE.TextureLoader, config.texture);
    const paintedTextureUrl = isTouch ? config.texture : config.paintedTexture;
    const paintedTexture = useLoader(THREE.TextureLoader, paintedTextureUrl);
    texture.colorSpace = THREE.SRGBColorSpace;
    paintedTexture.colorSpace = THREE.SRGBColorSpace;

    const [isPopping, setIsPopping] = useState(false);
    const [hovered, setHovered] = useState(false);
    const [isFadingOutText, setIsFadingOutText] = useState(false);
    const popRef = useRef(0);
    const textFadeRef = useRef(1); // 1 = fully visible, 0 = hidden
    const respawnOffsetRef = useRef(0); // For floating back up after respawn
    const balloonRevealRef = useRef<RevealBasicMaterialRef | null>(null); // RevealBasicMaterial ref for sketch
    const paintedMeshRef = useRef<THREE.Mesh | null>(null); // Painted balloon mesh visibility
    const paintedMatRef = useRef<THREE.MeshBasicMaterial | null>(null); // Painted balloon material opacity control
    const hideDelayRef = useRef<gsap.core.Tween | null>(null); // Track pending gsap.delayedCall
    const textRef = useRef<(THREE.Object3D & { fillOpacity: number; outlineOpacity: number }) | null>(null);

    // Audio Ref
    const balloonAudioRef = useRef<THREE.PositionalAudio>(null!);
    const { globalVolume, isMuted } = useAudio();

    const playBalloonSound = () => {
        if (balloonAudioRef.current) {
            const vol = isMuted ? 0 : BALLOON_AUDIO_SETTINGS.volume * globalVolume;
            balloonAudioRef.current.setVolume(vol);
            if (balloonAudioRef.current.isPlaying) balloonAudioRef.current.stop();
            balloonAudioRef.current.play();
        }
    };

    // LEGACY FIX: Use original aspect ratios from BALLOON_CONFIG or hardcoded for categories
    const legacyAspects: Record<string, number> = {
        'reactduzybalon.webp': 736 / 1447,
        'threejsduzybalon.webp': 1141 / 1964,
        'GSAPduzybalon.webp': 1.0, // GSAP balloon is square
        'default_small_medium': 631 / 1482 // Common ratio for others
    };
    
    const filename = config.texture.split('/').pop() ?? '';
    const aspect = legacyAspects[filename] || legacyAspects['default_small_medium'];
    const baseHeight = SIZE_MULTIPLIERS[config.size];

    const outerGroupRef = useRef<THREE.Group | null>(null);
    const innerGroupRef = useRef<THREE.Group | null>(null);
    const targetScale = useRef(1.0);
    const currentScale = useRef(1.0);
    const targetMagnet = useRef({ x: 0, y: 0 });
    const currentMagnet = useRef({ x: 0, y: 0 });

    // === RESPONSYWNOŚĆ ===
    // Na mobile (wąski viewport) balony są bliżej środka
    const positionScale = isTouch ? 0.5 : 1; // Jak bardzo ściskamy pozycje na mobile
    const spreadScale = isTouch ? 0.4 : 1;   // Jak bardzo zmniejszamy spread na mobile
    const sizeScale = isTouch ? 0.85 : 1;    // Trochę mniejsze balony na mobile

    // Cursor handling
    useEffect(() => {
        if (hovered && !isPopping) {
            document.body.style.cursor = 'pointer';
        } else {
            document.body.style.cursor = 'auto';
        }
    }, [hovered, isPopping]);

    // Handle text fade out timer
    useEffect(() => {
        if (isPopping) {
            // Start fading out text after 3 seconds
            const timer = setTimeout(() => {
                setIsFadingOutText(true);
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [isPopping]);

    // Hover handlers for brush-stroke reveal
    const handlePointerOver = (e: ThreeEvent<PointerEvent>) => {
        if (isTouch) return;
        e.stopPropagation();
        if (!isPopping) setHovered(true);

        // Brush-stroke reveal: show painted balloon
        if (balloonRevealRef.current) {
            gsap.to(balloonRevealRef.current, {
                uProgress: 1.0,
                duration: 0.8,
                ease: 'power2.out',
                overwrite: true
            });
        }
        if (hideDelayRef.current) hideDelayRef.current.kill();
        if (paintedMeshRef.current) paintedMeshRef.current.visible = true;
        if (paintedMatRef.current) paintedMatRef.current.opacity = 1;
    };

    const handlePointerOut = (e: ThreeEvent<PointerEvent>) => {
        if (isTouch) return;
        e.stopPropagation();
        setHovered(false);

        // Reverse reveal
        if (balloonRevealRef.current) {
            gsap.to(balloonRevealRef.current, {
                uProgress: 0.0,
                duration: 0.5,
                ease: 'power2.out',
                overwrite: true
            });
        }
        hideDelayRef.current = gsap.delayedCall(0.55, () => {
            if (paintedMatRef.current) paintedMatRef.current.opacity = 0;
        });
    };

    // Animation update loop
    useFrame((state, delta) => {
        if (hovered && !isPopping) {
            targetScale.current = 1.05; // lekkie powiększenie
        } else {
            targetScale.current = 1.0;
            targetMagnet.current.x = 0;
            targetMagnet.current.y = 0;
        }

        currentScale.current = THREE.MathUtils.lerp(currentScale.current, targetScale.current, 8 * delta);
        currentMagnet.current.x = THREE.MathUtils.lerp(currentMagnet.current.x, targetMagnet.current.x, 8 * delta);
        currentMagnet.current.y = THREE.MathUtils.lerp(currentMagnet.current.y, targetMagnet.current.y, 8 * delta);

        if (isPopping) {
            // Smooth, slow pop animation
            popRef.current = THREE.MathUtils.lerp(popRef.current, 1, 2.5 * delta);

            // Also hide painted mesh during pop (kill pending reveals)
            if (hideDelayRef.current) hideDelayRef.current.kill();
            if (balloonRevealRef.current) {
                balloonRevealRef.current.uProgress = 0;
            }
        }

        if (isFadingOutText) {
            // Fade out the text slowly
            textFadeRef.current = THREE.MathUtils.lerp(textFadeRef.current, 0, 2 * delta);

            // Once fully faded, respawn the balloon from below
            if (textFadeRef.current < 0.05) {
                setIsPopping(false);
                setHovered(false);
                setIsFadingOutText(false);
                popRef.current = 0;
                textFadeRef.current = 1;
                respawnOffsetRef.current = -12; // Teleport below to float up again

                // Immediately teleport the mesh to prevent pointer events at the old location
                if (outerGroupRef.current) {
                    outerGroupRef.current.position.y -= 12;
                }

                // Immediately reset opacities to prevent flashing
                if (balloonRevealRef.current) balloonRevealRef.current.opacity = 1;
                if (textRef.current) textRef.current.fillOpacity = 0;
                // Reset reveal state on respawn
                if (balloonRevealRef.current) balloonRevealRef.current.uProgress = 0;
                if (paintedMatRef.current) paintedMatRef.current.opacity = 0;
                if (paintedMeshRef.current) paintedMeshRef.current.visible = false;
            }
        }

        // Float back up if respawning
        if (respawnOffsetRef.current < -0.01) {
            respawnOffsetRef.current = THREE.MathUtils.lerp(respawnOffsetRef.current, 0, 1.5 * delta);
        }

        // Apply opacities if not fully respawned
        if (balloonRevealRef.current && isPopping) {
            balloonRevealRef.current.opacity = 1 - popRef.current;
        }
        if (paintedMatRef.current && isPopping) {
            paintedMatRef.current.opacity = 1 - popRef.current;
        }
        if (textRef.current && isPopping) {
            // Combine pop-in and fade-out opacities
            textRef.current.fillOpacity = popRef.current * textFadeRef.current;
            textRef.current.outlineOpacity = popRef.current * textFadeRef.current;
        }
    });

    // Floating animation with unique phase — now computed inside useFrame
    // Moved from render body to avoid re-renders

    // Bazowa pozycja X (skalowana na mobile)
    const baseX = config.x * positionScale;

    // P2: Compute position/scale/rotation imperatively inside useFrame
    useFrame(() => {
        if (!outerGroupRef.current) return;

        const time = timeRef.current;
        const revealFactor = revealFactorRef.current;
        const spreadFactor = spreadFactorRef.current;

        // Floating animation with unique phase
        const floatY = Math.sin(time * 0.6 + config.phase) * 0.3;
        const floatX = Math.sin(time * 0.4 + config.phase * 0.7) * 0.15;
        const rotation = Math.sin(time * 0.3 + config.phase) * 0.08;

        // Reveal: balloons float up from below, including respawn offset
        const startY = config.y - 8;
        const endY = config.y;
        const currentY = startY + revealFactor * (endY - startY) + floatY + respawnOffsetRef.current;

        // Scale up as they reveal
        let scale = revealFactor * sizeScale;
        const popScaleEffect = currentScale.current + popRef.current * 0.4;
        scale *= popScaleEffect;

        // === SPREAD EFFECT (ROZSUWANIE) ===
        const maxSpread = 15 * spreadScale;
        let spreadX = 0;

        if (config.x < -0.5) {
            spreadX = -spreadFactor * maxSpread * (0.5 + Math.abs(config.x) / 6);
        } else if (config.x > 0.5) {
            spreadX = spreadFactor * maxSpread * (0.5 + Math.abs(config.x) / 6);
        } else {
            spreadX = config.phase > 3.5
                ? spreadFactor * maxSpread * 0.8
                : -spreadFactor * maxSpread * 0.8;
        }

        // Apply imperatively
        outerGroupRef.current.position.set(baseX + floatX + spreadX, currentY, config.z);
        outerGroupRef.current.rotation.z = rotation;
        const s = Math.max(0.001, scale); // Avoid zero scale
        outerGroupRef.current.scale.set(s, s, s);

        // Update magnet position on inner group imperatively
        if (innerGroupRef.current) {
            innerGroupRef.current.position.set(currentMagnet.current.x, currentMagnet.current.y, 0);
        }
    });

    return (
        <group
            ref={outerGroupRef}
            position={[baseX, config.y - 8, config.z]}
        >
            <group ref={innerGroupRef}>
                {/* Painted balloon (behind) - hidden until hover */}
                <mesh ref={paintedMeshRef} visible={true}>
                    <planeGeometry args={[baseHeight * aspect, baseHeight]} />
                    <meshBasicMaterial color="#e0e0e0"
                        ref={paintedMatRef}
                        map={paintedTexture}
                        transparent
                        opacity={0}
                        side={THREE.DoubleSide}
                        alphaTest={0.5}
                        depthWrite={false}
                    />
                </mesh>

                {/* Sketch balloon (front) with brush-stroke reveal */}
                <mesh
                    position={[0, 0, 0.001]}
                    onClick={(e) => {
                        e.stopPropagation();
                        if (!isPopping) {
                            setIsPopping(true);
                            playBalloonSound();
                        }
                    }}
                    onPointerOver={handlePointerOver}
                    onPointerOut={handlePointerOut}
                    onPointerMove={(e: ThreeEvent<PointerEvent>) => {
                        if (hovered && !isPopping && outerGroupRef.current) {
                            outerGroupRef.current.getWorldPosition(_tempVec3);
                            // Reduced magnetic pull from 0.5 to 0.15 for gentler effect
                            targetMagnet.current.x = (e.point.x - _tempVec3.x) * 0.15;
                            targetMagnet.current.y = (e.point.y - _tempVec3.y) * 0.15;
                        }
                    }}
                    visible={popRef.current < 0.99}
                >
                    <planeGeometry args={[baseHeight * aspect, baseHeight]} />
                    <revealBasicMaterial
                        ref={balloonRevealRef}
                        map={texture}
                        transparent
                        side={THREE.DoubleSide}
                        depthWrite={false}
                        uProgress={0.0}
                    />
                </mesh>

                {/* Stack Name Text that fades in then out */}
                {isPopping && textFadeRef.current > 0.01 && (
                    <Text
                        ref={textRef}
                        position={[0, 0, 0.1]}
                        fontSize={baseHeight * 0.4}
                        color="#1a1a1a"
                        anchorX="center"
                        anchorY="middle"
                        font="/fonts/RubikScribble-Regular.ttf"
                        fillOpacity={0}
                        outlineWidth={0.02}
                        outlineColor="#fff"
                        outlineOpacity={0}
                    >
                        {config.label}
                    </Text>
                )}

                <PositionalAudio
                    {...{
                        distanceModel: 'exponential',
                        rolloffFactor: BALLOON_AUDIO_SETTINGS.rolloff,
                        refDistance: BALLOON_AUDIO_SETTINGS.distance
                    }}
                    ref={balloonAudioRef}
                    url="/sounds/baloonpoop.mp3"
                    loop={false}
                />
            </group>
        </group>
    );
};

const SkillsMilestone = ({ z, scrollProgressRef }: MilestoneProps) => {
    const { camera, viewport } = useThree();
    const isTouch = isTouchDevice();
    const groupRef = useRef<THREE.Group | null>(null);
    // P2: Use refs instead of state to avoid 60 re-renders/sec inside useFrame
    const revealFactorRef = useRef(0);
    const spreadFactorRef = useRef(0);
    const timeRef = useRef(0);

    useFrame((state) => {
        if (!groupRef.current) return;

        // === TWARDA LINIA CLIP (RĘCZNE OBLICZENIE WORLD Z) ===
        const scrollProgress = scrollProgressRef?.current || 0;
        const worldZ = ROOM_Z + scrollProgress + z;
        groupRef.current.visible = worldZ < MILESTONE_CORRIDOR_CLIP_Z;
        if (!groupRef.current.visible) return;

        timeRef.current = state.clock.elapsedTime;

        // FIX: Use consistent distance based on scrollProgress + offset
        const distanceZ = z + scrollProgress - 55;

        // Reveal effect (balloons float up)
        // === EDYTUJ TUTAJ (SKILLS REVEAL) ===
        const revealStart = -100;
        const revealEnd = -25;
        let newRevealFactor = 0;

        if (distanceZ > revealStart && distanceZ < revealEnd) {
            newRevealFactor = (distanceZ - revealStart) / (revealEnd - revealStart);
            newRevealFactor = Math.min(1, Math.max(0, newRevealFactor));
            newRevealFactor = 1 - Math.pow(1 - newRevealFactor, 3); // ease out cubic
        } else if (distanceZ >= revealEnd) {
            newRevealFactor = 1;
        }

        revealFactorRef.current = newRevealFactor;

        // === SPREAD EFFECT (EDYTUJ TUTAJ SKILLS SPREAD) ===
        // Im bliżej kamery, tym bardziej balony się rozsuwają
        // Większy zakres = dłuższa, bardziej widoczna animacja
        const spreadStart = -70; // Kiedy animacja SIĘ ZACZYNA (Wcześniej)
        const spreadEnd = -40;    // Kiedy animacja jest PEŁNA (Później)
        let newSpreadFactor = 0;

        if (distanceZ > spreadStart && distanceZ < spreadEnd) {
            newSpreadFactor = (distanceZ - spreadStart) / (spreadEnd - spreadStart);
            newSpreadFactor = Math.min(1, Math.max(0, newSpreadFactor));
            newSpreadFactor = newSpreadFactor * newSpreadFactor; // ease in
        } else if (distanceZ >= spreadEnd) {
            newSpreadFactor = 1;
        }

        spreadFactorRef.current = newSpreadFactor;
    });

    return (
        <group ref={groupRef} position={[0, 0, z]}>
            {/* Title */}
            <Text
                position={[0, 6, 0.5]}
                fontSize={1.2}
                color="#1a1a1a"
                anchorX="center"
                anchorY="middle"
                font="/fonts/RubikScribble-Regular.ttf"
            >
                SKILLS
            </Text>

            {/* Subtitle */}
            <Text
                position={[0, 5.2, 0.5]}
                fontSize={0.35}
                color="#555555"
                anchorX="center"
                anchorY="middle"
                font="/fonts/CabinSketch-Regular.ttf"
            >
                Technologies I love working with
            </Text>

            {/* === FLOATING BALLOONS === */}
            {BALLOON_CONFIG.map((config, index) => (
                <SkillBalloon
                    key={index}
                    config={config}
                    revealFactorRef={revealFactorRef}
                    spreadFactorRef={spreadFactorRef}
                    timeRef={timeRef}
                />
            ))}
        </group>
    );
};

// =========================================
// NOTE: Use this component inside the loop!
// =========================================

export default InfiniteSkyManager;
