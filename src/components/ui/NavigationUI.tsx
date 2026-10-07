import { useState, useEffect, useRef } from 'react';
import gsap from 'gsap';
import { useScene } from '../../context/SceneContext';
import { useAudio } from '../../context/AudioManager';
import { setMusicVolume, getMusicVolume } from '../../utils/audioManager';
import type { RoomId } from '../../config/routeMetadata';

// Room data for the map - positions are percentages on the map image
// These positions correspond to the visual elements on the map
const ROOMS = [
    { id: 'about', label: 'About', x: 43, y: 38 },      // Paper airplane (left side)
    { id: 'gallery', label: 'Gallery', x: 43, y: 72 },  // City buildings (bottom left)
    { id: 'contact', label: 'Contact', x: 57, y: 25 },  // Pier/dock (top right)
] as const;

// Pin starting position - the dashed circle at the bottom of the tower
const PIN_START_POSITION = { x: 50.5, y: 97 };

const NavigationUI = () => {
    const { currentRoom, isInRoom, requestExit, hasEntered, teleportTo, isTeleporting } = useScene();
    const { isMuted, globalVolume, setGlobalVolume } = useAudio();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [hoveredRoom, setHoveredRoom] = useState<RoomId | null>(null);
    const [isExiting, setIsExiting] = useState(false); // Track when back button is clicked

    // Audio controls state
    const [isAudioMenuOpen, setIsAudioMenuOpen] = useState(false);
    const [bgmVol, setBgmVol] = useState(0.3);
    const [isUIHidden, setIsUIHidden] = useState(false);

    // Refs for focus management
    const mapPanelRef = useRef<HTMLDivElement>(null);
    const mapCloseRef = useRef<HTMLButtonElement>(null);

    useEffect(() => {
        const handleInspectChange = (event: Event) => {
            if (!(event instanceof CustomEvent) || typeof event.detail !== 'boolean') return;
            setIsUIHidden(event.detail);
            if (event.detail) {
                setIsMenuOpen(false);
                setIsAudioMenuOpen(false);
            }
        };
        window.addEventListener('inspectChange', handleInspectChange);
        return () => window.removeEventListener('inspectChange', handleInspectChange);
    }, []);

    const paintedMapsRefs = {
        about: useRef<HTMLImageElement>(null),
        gallery: useRef<HTMLImageElement>(null),
        contact: useRef<HTMLImageElement>(null)
    };

    useEffect(() => {
        // About (zone: left 10%, top 20%, width 30%, height 35%)
        // -> X: 10% to 40%, Y: 20% to 55%
        if (paintedMapsRefs.about.current) {
            gsap.to(paintedMapsRefs.about.current, {
                clipPath: (hoveredRoom === 'about' || currentRoom === 'about')
                    ? 'polygon(10% 20%, 40% 20%, 40% 55%, 10% 55%)'
                    : 'polygon(10% 20%, 10% 20%, 10% 55%, 10% 55%)',
                duration: 0.5,
                ease: "power2.out"
            });
        }

        // Gallery (zone: left 10%, bottom 8%, width 30%, height 35%)
        // -> X: 10% to 40%, Y: 57% to 92% (since bottom=8% means top is 100-8-35=57%)
        if (paintedMapsRefs.gallery.current) {
            gsap.to(paintedMapsRefs.gallery.current, {
                clipPath: (hoveredRoom === 'gallery' || currentRoom === 'gallery')
                    ? 'polygon(10% 57%, 40% 57%, 40% 92%, 10% 92%)'
                    : 'polygon(10% 57%, 10% 57%, 10% 92%, 10% 92%)',
                duration: 0.5,
                ease: "power2.out"
            });
        }

        // Contact (zone: right 5%, top 10%, width 35%, height 25%)
        // -> X: 60% to 95% (since right=5% means left is 100-5-35=60%), Y: 10% to 35%
        if (paintedMapsRefs.contact.current) {
            gsap.to(paintedMapsRefs.contact.current, {
                clipPath: (hoveredRoom === 'contact' || currentRoom === 'contact')
                    ? 'polygon(60% 10%, 95% 10%, 95% 35%, 60% 35%)'
                    : 'polygon(95% 10%, 95% 10%, 95% 35%, 95% 35%)',
                duration: 0.5,
                ease: "power2.out"
            });
        }

    }, [hoveredRoom, currentRoom]);

    useEffect(() => {
        setBgmVol(getMusicVolume());

        const handleMusicVolumeChange = (event: Event) => {
            if (event instanceof CustomEvent && typeof event.detail === 'number') {
                setBgmVol(event.detail);
            }
        };
        window.addEventListener('musicVolumeChanged', handleMusicVolumeChange);

        return () => window.removeEventListener('musicVolumeChanged', handleMusicVolumeChange);
    }, []);

    const handleBgmChange = (val: number): void => {
        setBgmVol(val);
        setMusicVolume(val);
    };

    // Close menu when entering a room or starting teleport
    useEffect(() => {
        if (isInRoom || isTeleporting) {
            setIsMenuOpen(false);
            setIsAudioMenuOpen(false);
            setIsExiting(false);
        }
    }, [isInRoom, isTeleporting]);

    // Reset exiting state when not in room anymore
    useEffect(() => {
        if (!isInRoom) {
            setIsExiting(false);
        }
    }, [isInRoom]);

    // A4: Focus management for map panel — auto-focus, Escape, and focus trap
    useEffect(() => {
        if (isMenuOpen) {
            // Auto-focus on close button when map opens
            setTimeout(() => mapCloseRef.current?.focus(), 100);
        }
    }, [isMenuOpen]);

    // Global Escape key handler — closes any open panel
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent): void => {
            if (e.key === 'Escape') {
                if (isMenuOpen) setIsMenuOpen(false);
                if (isAudioMenuOpen) setIsAudioMenuOpen(false);
            }
        };
        window.addEventListener('keydown', handleEscape);
        return () => window.removeEventListener('keydown', handleEscape);
    }, [isMenuOpen, isAudioMenuOpen]);

    // Focus trap handler for map panel
    const handleMapKeyDown = (e: React.KeyboardEvent<HTMLDivElement>): void => {
        if (e.key !== 'Tab' || !mapPanelRef.current) return;

        const focusable = mapPanelRef.current.querySelectorAll<HTMLElement>(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusable.length === 0) return;

        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (e.shiftKey) {
            // Shift+Tab on first element → wrap to last
            if (document.activeElement === first) {
                e.preventDefault();
                last.focus();
            }
        } else {
            // Tab on last element → wrap to first
            if (document.activeElement === last) {
                e.preventDefault();
                first.focus();
            }
        }
    };

    const handleRoomClick = (roomId: RoomId): void => {
        // Don't teleport to the same room or if already teleporting
        if (roomId === currentRoom || isTeleporting) return;

        // Close map first, then start teleport
        setIsMenuOpen(false);
        setIsAudioMenuOpen(false);
        teleportTo(roomId);
    };

    const handleBackClick = () => {
        setIsExiting(true); // Immediately start exit animation
        // Request exit - DoorSection will handle the animation
        requestExit();
    };

    return (
        <div className="navigation-ui fixed inset-0 pointer-events-none z-[100] [&>button]:pointer-events-auto [&>.map-panel]:pointer-events-auto [&>.audio-panel]:pointer-events-auto [&>.menu-overlay]:pointer-events-auto">
            {/* Back Button - Only visible in rooms, hides up when clicked */}
            {hasEntered && isInRoom && (
                <button
                    className={`nav-btn back-btn relative flex items-center justify-center w-[50px] h-[55px] pt-2 bg-transparent border-0 cursor-pointer overflow-visible [box-shadow:0_3px_10px_rgba(0,0,0,0.1)] [&>svg]:w-[22px] [&>svg]:h-[22px] [&>svg]:fill-none [&>svg]:stroke-[#1a1a1a] [&>svg]:stroke-2 [&>svg]:[stroke-linecap:round] [&>svg]:[stroke-linejoin:round] [&>svg]:z-[1] fixed top-0 left-6 [animation:fadeSlideDown_0.3s_ease-out] [transition:transform_0.3s_ease,opacity_0.3s_ease] max-tablet:w-[45px] max-tablet:h-[50px] max-tablet:left-4 ${isExiting ? 'exiting' : ''}`}
                    onClick={handleBackClick}
                    aria-label="Back to corridor"
                >
                    <svg viewBox="0 0 24 24" className="icon-back">
                        <path d="M19 12H5M12 19l-7-7 7-7" />
                    </svg>
                </button>
            )}

            {/* Right side controls - Only visible after entering */}
            {hasEntered && (
                <div className={`nav-controls pointer-events-auto fixed top-0 right-6 flex gap-3 [transition:transform_0.3s_ease,opacity_0.3s_ease] [&.ui-hidden]:[transition:transform_0.4s_cubic-bezier(0.16,1,0.3,1),opacity_0.3s_ease] [animation:slideDownEntrance_0.4s_ease-out] max-tablet:right-4 max-tablet:gap-2 ${isMenuOpen || isAudioMenuOpen ? 'menu-open' : ''} ${isUIHidden ? 'ui-hidden' : ''}`}>
                    {/* Hamburger Menu Button */}
                    <button
                        className={`nav-btn hamburger-btn relative flex items-center justify-center w-[50px] h-[55px] pt-2 bg-transparent border-0 cursor-pointer overflow-visible transition-transform duration-200 [box-shadow:0_3px_10px_rgba(0,0,0,0.1)] hover:-translate-y-0.5 active:translate-y-px [&>svg]:w-[22px] [&>svg]:h-[22px] [&>svg]:fill-none [&>svg]:stroke-[#1a1a1a] [&>svg]:stroke-2 [&>svg]:[stroke-linecap:round] [&>svg]:[stroke-linejoin:round] [&>svg]:z-[1] max-tablet:w-[45px] max-tablet:h-[50px] ${isMenuOpen ? 'open' : ''}`}
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        aria-label="Toggle menu"
                        aria-expanded={isMenuOpen}
                    >
                        <div className="hamburger-icon flex flex-col gap-[5px] w-5 [&>span]:block [&>span]:h-[2px] [&>span]:w-full [&>span]:bg-[#1a1a1a] [&>span]:rounded-sm">
                            <span></span>
                            <span></span>
                            <span></span>
                        </div>
                    </button>
                    {/* Audio Toggle Button */}
                    <button
                        className={`nav-btn audio-btn relative flex items-center justify-center w-[50px] h-[55px] pt-2 bg-transparent border-0 cursor-pointer overflow-visible transition-transform duration-200 [box-shadow:0_3px_10px_rgba(0,0,0,0.1)] hover:-translate-y-0.5 active:translate-y-px [&>svg]:w-[22px] [&>svg]:h-[22px] [&>svg]:fill-none [&>svg]:stroke-[#1a1a1a] [&>svg]:stroke-2 [&>svg]:[stroke-linecap:round] [&>svg]:[stroke-linejoin:round] [&>svg]:z-[1] max-tablet:w-[45px] max-tablet:h-[50px] ${isAudioMenuOpen ? 'open' : ''}`}
                        onClick={() => setIsAudioMenuOpen(!isAudioMenuOpen)}
                        aria-label="Audio Settings"
                        aria-expanded={isAudioMenuOpen}
                    >
                        {isMuted ? (
                            <svg viewBox="0 0 24 24" className="icon-audio">
                                <path d="M11 5L6 9H2v6h4l5 4V5z" />
                                <line x1="23" y1="9" x2="17" y2="15" />
                                <line x1="17" y1="9" x2="23" y2="15" />
                            </svg>
                        ) : (
                            <svg viewBox="0 0 24 24" className="icon-audio">
                                <path d="M11 5L6 9H2v6h4l5 4V5z" />
                                <path d="M15 9a5 5 0 0 1 0 6" />
                                <path d="M18 5a9 9 0 0 1 0 14" />
                            </svg>
                        )}
                    </button>
                </div>
            )}

            {/* Map Panel - Drops from top when open */}
            {hasEntered && (
                <div className={`map-panel fixed top-0 left-1/2 w-[90%] max-w-[500px] -translate-x-1/2 -translate-y-full [filter:drop-shadow(0_4px_20px_rgba(0,0,0,0.15))] opacity-0 pointer-events-none [transition:transform_0.4s_cubic-bezier(0.16,1,0.3,1),opacity_0.3s_ease] max-tablet:w-[95%] max-tablet:max-w-none [@media(max-width:480px)]:w-full [&.open]:opacity-100 [&.open]:pointer-events-auto [&.open]:translate-y-0 ${isMenuOpen ? 'open' : ''}`} inert={!isMenuOpen ? true : undefined} ref={mapPanelRef} onKeyDown={handleMapKeyDown} role="dialog" aria-label="Map">
                    {/* SVG Border Overlay */}
                    <svg
                        className="map-border-overlay absolute top-0 left-0 h-full w-full pointer-events-none z-10"
                        viewBox="0 0 100 100"
                        preserveAspectRatio="none"
                    >
                        <path
                            d="M 0 0 L 100 0 L 100 0 L 99 3 L 100 6 L 98 10 L 100 14 L 99 18 L 100 22 L 98 26 L 100 30 L 99 35 L 100 40 L 98 45 L 100 50 L 99 55 L 100 60 L 98 65 L 100 70 L 99 75 L 100 80 L 98 85 L 100 90 L 99 95 L 100 100 L 96 99 L 92 100 L 88 98 L 84 100 L 80 99 L 76 100 L 72 98 L 68 100 L 64 99 L 60 100 L 56 98 L 52 100 L 48 99 L 44 100 L 40 98 L 36 100 L 32 99 L 28 100 L 24 98 L 20 100 L 16 99 L 12 100 L 8 98 L 4 100 L 0 99 L 0.5 99.5 L 1 95 L 0 90 L 2 85 L 0 80 L 1 75 L 0 70 L 2 65 L 0 60 L 1 55 L 0 50 L 2 45 L 0 40 L 1 35 L 0 30 L 2 26 L 0 22 L 1 18 L 0 14 L 2 10 L 0 6 L 1 3 L 0 0 Z"
                            fill="none"
                            stroke="#1a1a1a"
                            strokeWidth="0.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            vectorEffect="non-scaling-stroke"
                        />
                    </svg>

                    <div className="map-content-clipped relative w-full h-full p-5 pb-[30px] bg-white [clip-path:polygon(0%_0%,100%_0%,100%_0%,99%_3%,100%_6%,98%_10%,100%_14%,99%_18%,100%_22%,98%_26%,100%_30%,99%_35%,100%_40%,98%_45%,100%_50%,99%_55%,100%_60%,98%_65%,100%_70%,99%_75%,100%_80%,98%_85%,100%_90%,99%_95%,100%_100%,96%_99%,92%_100%,88%_98%,84%_100%,80%_99%,76%_100%,72%_98%,68%_100%,64%_99%,60%_100%,56%_98%,52%_100%,48%_99%,44%_100%,40%_98%,36%_100%,32%_99%,28%_100%,24%_98%,20%_100%,16%_99%,12%_100%,8%_98%,4%_100%,0%_99%,0.5%_99.5%,1%_95%,0%_90%,2%_85%,0%_80%,1%_75%,0%_70%,2%_65%,0%_60%,1%_55%,0%_50%,2%_45%,0%_40%,1%_35%,0%_30%,2%_26%,0%_22%,1%_18%,0%_14%,2%_10%,0%_6%,1%_3%,0%_0%)]">
                        <div className="map-header flex justify-between items-center mb-4 pb-3 border-b-2 border-dashed border-[#ccc]">
                            <h3 className="m-0 text-base font-bold tracking-[2px] uppercase text-[#1a1a1a] font-patrick-hand max-tablet:text-sm">MAP</h3>
                            <button
                                ref={mapCloseRef}
                                className="close-btn flex items-center justify-center w-7 h-7 bg-transparent border-0 cursor-pointer transition-[transform,opacity] duration-200 opacity-60 hover:opacity-100 hover:scale-110 active:scale-95 [&>svg]:w-[18px] [&>svg]:h-[18px] [&>svg]:fill-none [&>svg]:stroke-[#1a1a1a] [&>svg]:stroke-[2.5] [&>svg]:[stroke-linecap:round]"
                                onClick={() => setIsMenuOpen(false)}
                                aria-label="Close map"
                            >
                                <svg viewBox="0 0 24 24">
                                    <path d="M18 6L6 18M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        <div className="map-container relative w-full rounded-lg overflow-hidden">
                            {/* Map background image */}
                            <img src="/images/map.webp" alt="Portfolio Map" className="map-image block w-full h-auto pointer-events-none" />

                            {/* Painted Map Overlays */}
                            <img ref={paintedMapsRefs.about} src="/images/map_about_painted.webp" alt="" className="painted-map-layer absolute top-0 left-0 w-full h-full pointer-events-none z-[1]" style={{ clipPath: 'polygon(10% 20%, 10% 20%, 10% 55%, 10% 55%)' }} />
                            <img ref={paintedMapsRefs.gallery} src="/images/map_gallery_painted.webp" alt="" className="painted-map-layer absolute top-0 left-0 w-full h-full pointer-events-none z-[1]" style={{ clipPath: 'polygon(10% 57%, 10% 57%, 10% 92%, 10% 92%)' }} />
                            <img ref={paintedMapsRefs.contact} src="/images/map_contact_painted.webp" alt="" className="painted-map-layer absolute top-0 left-0 w-full h-full pointer-events-none z-[1]" style={{ clipPath: 'polygon(95% 10%, 95% 10%, 95% 35%, 95% 35%)' }} />

                            {/* Hover Zones */}
                            <button
                                type="button"
                                className="map-hover-zone zone-about absolute z-[2] cursor-pointer bg-transparent border-0 p-0 m-0 outline-none appearance-none [font:inherit] text-inherit top-0 left-0 w-[30%] h-[35%] mt-[20%] ml-[10%]"
                                onMouseEnter={() => setHoveredRoom('about')}
                                onMouseLeave={() => setHoveredRoom(null)}
                                onFocus={() => setHoveredRoom('about')}
                                onBlur={() => setHoveredRoom(null)}
                                onClick={() => handleRoomClick('about')}
                                aria-label="Teleport to About room"
                            />
                            <button
                                type="button"
                                className="map-hover-zone zone-gallery absolute z-[2] cursor-pointer bg-transparent border-0 p-0 m-0 outline-none appearance-none [font:inherit] text-inherit bottom-0 left-0 w-[30%] h-[35%] mb-[8%] ml-[10%]"
                                onMouseEnter={() => setHoveredRoom('gallery')}
                                onMouseLeave={() => setHoveredRoom(null)}
                                onFocus={() => setHoveredRoom('gallery')}
                                onBlur={() => setHoveredRoom(null)}
                                onClick={() => handleRoomClick('gallery')}
                                aria-label="Teleport to Gallery room"
                            />
                            <button
                                type="button"
                                className="map-hover-zone zone-contact absolute z-[2] cursor-pointer bg-transparent border-0 p-0 m-0 outline-none appearance-none [font:inherit] text-inherit top-0 right-0 w-[35%] h-[25%] mt-[10%] mr-[5%]"
                                onMouseEnter={() => setHoveredRoom('contact')}
                                onMouseLeave={() => setHoveredRoom(null)}
                                onFocus={() => setHoveredRoom('contact')}
                                onBlur={() => setHoveredRoom(null)}
                                onClick={() => handleRoomClick('contact')}
                                aria-label="Teleport to Contact room"
                            />

                            {/* Permanent Map Text Labels */}
                            <div className="map-room-label about absolute top-[28%] left-[26%] font-cabin-sketch text-[1.2rem] font-bold text-[#1a1a1a] pointer-events-none z-[4] uppercase tracking-[2px] -translate-x-1/2 -translate-y-1/2 text-center [text-shadow:-1px_-1px_0_#fff,1px_-1px_0_#fff,-1px_1px_0_#fff,1px_1px_0_#fff]">ABOUT</div>
                            <div className="map-room-label gallery absolute top-[94%] left-[26%] font-cabin-sketch text-[1.2rem] font-bold text-[#1a1a1a] pointer-events-none z-[4] uppercase tracking-[2px] -translate-x-1/2 -translate-y-1/2 text-center [text-shadow:-1px_-1px_0_#fff,1px_-1px_0_#fff,-1px_1px_0_#fff,1px_1px_0_#fff]">THE<br />GALLERY</div>
                            <div className="map-room-label contact absolute top-[14%] left-[76%] font-cabin-sketch text-[1.2rem] font-bold text-[#1a1a1a] pointer-events-none z-[4] uppercase tracking-[2px] -translate-x-1/2 -translate-y-1/2 text-center [text-shadow:-1px_-1px_0_#fff,1px_-1px_0_#fff,-1px_1px_0_#fff,1px_1px_0_#fff]">CONTACT</div>

                            {/* Pin slot markers */}
                            {ROOMS.map((room) => (
                                <button
                                    key={room.id}
                                    className={`pin-slot absolute -translate-x-1/2 -translate-y-1/2 w-[35px] h-[35px] p-0 bg-transparent border-0 cursor-pointer [transition:transform_0.2s_ease] z-[2] hover:scale-[1.15] [&>img]:w-full [&>img]:h-full [&>img]:object-contain ${currentRoom === room.id ? 'active' : ''} ${hoveredRoom === room.id ? 'hovered' : ''}`}
                                    style={{ left: `${room.x}%`, top: `${room.y}%` }}
                                    onClick={() => handleRoomClick(room.id)}
                                    onMouseEnter={() => setHoveredRoom(room.id)}
                                    onMouseLeave={() => setHoveredRoom(null)}
                                    title={room.label}
                                >
                                    <img src="/images/pin-slot.webp" alt="" className="slot-image" />
                                </button>
                            ))}

                            {/* The pin marker - moves to hovered slot, or current room, or start position */}
                            <div
                                className="pin-marker absolute -translate-x-1/2 -translate-y-[90%] w-5 h-auto z-[3] pointer-events-none [transition:left_0.4s_ease,top_0.4s_ease] [&>img]:w-full [&>img]:h-auto [&>img]:[filter:drop-shadow(2px_2px_2px_rgba(0,0,0,0.3))]"
                                style={{
                                    left: `${hoveredRoom
                                        ? ROOMS.find(r => r.id === hoveredRoom)?.x || PIN_START_POSITION.x
                                        : currentRoom && isInRoom
                                            ? ROOMS.find(r => r.id === currentRoom)?.x || PIN_START_POSITION.x
                                            : PIN_START_POSITION.x
                                        }%`,
                                    top: `${hoveredRoom
                                        ? ROOMS.find(r => r.id === hoveredRoom)?.y || PIN_START_POSITION.y
                                        : currentRoom && isInRoom
                                            ? ROOMS.find(r => r.id === currentRoom)?.y || PIN_START_POSITION.y
                                            : PIN_START_POSITION.y
                                        }%`
                                }}
                            >
                                <img src="/images/pin.webp" alt="You are here" className="pin-image" />
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Audio Panel — drops down from the button */}
            {hasEntered && (
                <div className={`audio-panel fixed top-0 right-6 w-[220px] z-[95] [filter:drop-shadow(0_4px_15px_rgba(0,0,0,0.15))] opacity-0 pointer-events-none -translate-y-full [transition:transform_0.4s_cubic-bezier(0.16,1,0.3,1),opacity_0.3s_ease] max-tablet:right-4 [&.open]:opacity-100 [&.open]:pointer-events-auto [&.open]:translate-y-0 ${isAudioMenuOpen ? 'open' : ''}`} inert={!isAudioMenuOpen ? true : undefined}>
                    <div className="audio-card relative w-full px-4 pt-[18px] pb-5 bg-white overflow-hidden [clip-path:polygon(0%_0%,100%_0%,100%_0%,98%_10%,100%_20%,97%_35%,100%_50%,98%_65%,100%_80%,97%_90%,100%_100%,90%_97%,80%_100%,70%_96%,60%_100%,50%_97%,40%_100%,30%_96%,20%_100%,10%_97%,0%_100%,0%_100%,2%_90%,0%_80%,3%_65%,0%_50%,2%_35%,0%_20%,3%_10%,0%_0%)]">
                        <div className="audio-header relative z-[1] flex justify-between items-center mb-3 pb-2 border-b-2 border-dashed border-[#bbb]">
                            <h3 className="m-0 text-sm font-bold tracking-[1.5px] text-[#1a1a1a] font-patrick-hand">AUDIO SETTINGS</h3>
                            <button
                                className="close-btn flex items-center justify-center w-6 h-6 bg-transparent border-0 cursor-pointer opacity-60 transition-[transform,opacity] duration-200 hover:opacity-100 hover:scale-110 active:scale-95 [&>svg]:w-[14px] [&>svg]:h-[14px] [&>svg]:stroke-[#1a1a1a] [&>svg]:stroke-[2.5] [&>svg]:fill-none [&>svg]:[stroke-linecap:round]"
                                onClick={() => setIsAudioMenuOpen(false)}
                                aria-label="Close audio settings"
                            >
                                <svg viewBox="0 0 24 24">
                                    <path d="M18 6L6 18M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        <div className="audio-sliders-container relative z-[1] flex flex-col gap-4">
                            <div className="slider-group flex flex-col gap-[6px]">
                                <div className="slider-label flex justify-between font-patrick-hand text-sm text-[#1a1a1a] font-semibold">
                                    <span>Music</span>
                                    <span>{Math.round(bgmVol * 100)}%</span>
                                </div>
                                <input
                                    type="range"
                                    min="0" max="1" step="0.01"
                                    value={bgmVol}
                                    onChange={(e) => handleBgmChange(parseFloat(e.target.value))}
                                    className="paper-slider appearance-none w-full h-1 bg-[#ccc] rounded-sm outline-none cursor-pointer"
                                    aria-label="Music volume"
                                    aria-valuetext={`${Math.round(bgmVol * 100)} percent`}
                                />
                            </div>
                            <div className="slider-group flex flex-col gap-[6px]">
                                <div className="slider-label flex justify-between font-patrick-hand text-sm text-[#1a1a1a] font-semibold">
                                    <span>SFX</span>
                                    <span>{Math.round(globalVolume * 100)}%</span>
                                </div>
                                <input
                                    type="range"
                                    min="0" max="1" step="0.01"
                                    value={globalVolume}
                                    onChange={(e) => setGlobalVolume(parseFloat(e.target.value))}
                                    className="paper-slider appearance-none w-full h-1 bg-[#ccc] rounded-sm outline-none cursor-pointer"
                                    aria-label="SFX volume"
                                    aria-valuetext={`${Math.round(globalVolume * 100)} percent`}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Overlay to close menus */}
            {(isMenuOpen || isAudioMenuOpen) && (
                <div
                    className="menu-overlay fixed inset-0 bg-transparent -z-[1]"
                    onClick={() => {
                        setIsMenuOpen(false);
                        setIsAudioMenuOpen(false);
                    }}
                />
            )}
        </div>
    );
};

export default NavigationUI;