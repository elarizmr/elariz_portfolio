import { createContext, useContext, useState, useCallback, useMemo, useRef, type ReactNode } from 'react';
import { getInitialRoomFromUrl } from '../hooks/useDocumentMeta';
import type { RoomId } from '../config/routeMetadata';

type TeleportPhase = 'closing' | 'teleporting' | 'opening';

interface SceneContextValue {
    currentRoom: RoomId | null;
    hasEntered: boolean;
    exitRequested: boolean;
    enterRoom: (roomId: RoomId) => void;
    exitRoom: () => void;
    requestExit: () => void;
    clearExitRequest: () => void;
    markEntered: () => void;
    isInRoom: boolean;
    initialRoom: RoomId | null;
    deeplinkHandled: { current: boolean };
    teleportTarget: RoomId | null;
    isTeleporting: boolean;
    teleportPhase: TeleportPhase | null;
    pendingDoorClick: string | null;
    isFastTeleport: boolean;
    teleportTo: (roomId: RoomId) => void;
    startTeleportTransition: () => void;
    openTeleportTransition: () => void;
    completeTeleport: () => void;
    signalRoomReady: () => void;
    finishPaperOpen: () => void;
    cancelTeleport: () => void;
}

const SceneContext = createContext<SceneContextValue | null>(null);

export const useScene = (): SceneContextValue => {
    const context = useContext(SceneContext);
    if (!context) {
        throw new Error('useScene must be used within a SceneProvider');
    }
    return context;
};

export const SceneProvider = ({ children }: { children: ReactNode }) => {
    // Deep linking: check if URL points to a specific room on first load
    const initialRoom = useRef(getInitialRoomFromUrl());
    const deeplinkHandled = useRef(false);

    const [currentRoom, setCurrentRoom] = useState<RoomId | null>(null); // null = corridor, 'about', 'portfolio', etc.
    const [hasEntered, setHasEntered] = useState(false);  // Has user clicked entrance doors?
    const [exitRequested, setExitRequested] = useState(false); // Signal to request exit from room

    // Teleportation states
    const [teleportTarget, setTeleportTarget] = useState<RoomId | null>(null); // Room ID to teleport to
    const [isTeleporting, setIsTeleporting] = useState(false);  // Currently in teleport transition
    const [teleportPhase, setTeleportPhase] = useState<TeleportPhase | null>(null);   // 'closing' | 'teleporting' | 'opening' | null
    const [pendingDoorClick, setPendingDoorClick] = useState<string | null>(null); // Label of door to click after teleport
    const [isFastTeleport, setIsFastTeleport] = useState(false); // Fast teleport in progress (skip animations)

    // Inspecting state removed to avoid global re-renders

    const enterRoom = useCallback((roomId: RoomId) => {
        setCurrentRoom(roomId);
        setExitRequested(false); // Clear any pending exit request

        // Teleportation cleanup - if we just teleported in
        // Note: isFastTeleport is cleared by signalRoomReady, not here
        // Don't clear teleportPhase if it's 'opening' - let the paper animation complete
        setIsTeleporting(false);
        setPendingDoorClick(null);
        // teleportPhase is cleared by finishPaperOpen after animation
    }, []);

    const exitRoom = useCallback(() => {
        setCurrentRoom(null);
        setExitRequested(false);
    }, []);

    // Request exit - this signals to DoorSection to trigger exit animation
    const requestExit = useCallback(() => {
        setExitRequested(true);
    }, []);

    // Clear exit request - called by DoorSection after handling
    const clearExitRequest = useCallback(() => {
        setExitRequested(false);
    }, []);

    const markEntered = useCallback(() => {
        setHasEntered(true);
    }, []);

    // Teleportation functions

    // Initiate teleport - called when user clicks room on map
    const teleportTo = useCallback((roomId: RoomId) => {
        if (isTeleporting || roomId === currentRoom) return; // Prevent double teleport or same room

        setTeleportTarget(roomId);
        setIsTeleporting(true);
        setIsFastTeleport(true); // Enable fast teleport mode
        setTeleportPhase('closing'); // Paper starts closing
    }, [isTeleporting, currentRoom]);

    // Called when paper close animation completes - actually move camera
    const startTeleportTransition = useCallback(() => {
        setTeleportPhase('teleporting');
        // Camera will be moved here by listening components
    }, []);

    // Called when teleport is ready (room loaded) - start paper open animation
    // During fast teleport, this is called AFTER camera is inside room
    const openTeleportTransition = useCallback(() => {
        setTeleportPhase('opening');
    }, []);

    // Called when paper open animation completes - cleanup
    const completeTeleport = useCallback(() => {
        // During FAST teleport: paper stays closed, trigger door click immediately
        // The paper will open when signalRoomReady() is called by DoorSection
        setPendingDoorClick(teleportTarget);

        // Don't clear isTeleporting yet! Wait for enterRoom() logic to finish
        // We only clear target here (phase cleared later)
        setTeleportTarget(null);
        // Note: teleportPhase stays at 'teleporting' during fast teleport so paper remains closed
    }, [teleportTarget]);

    // Called by DoorSection when camera has finished entering the room during fast teleport
    // This opens the paper and completes the teleport sequence
    const signalRoomReady = useCallback(() => {
        if (isFastTeleport) {
            // Now open the paper
            setTeleportPhase('opening');
            setIsFastTeleport(false);
        }
    }, [isFastTeleport]);

    // Called by PaperTransition when paper open animation finishes
    // This just clears the phase - teleport logic is already done
    const finishPaperOpen = useCallback(() => {
        setTeleportPhase(null);
    }, []);

    // REMOVED clearPendingDoorClick - it's now handled in enterRoom

    // Cancel teleport (in case of error)
    const cancelTeleport = useCallback(() => {
        setTeleportTarget(null);
        setIsTeleporting(false);
        setTeleportPhase(null);
        setPendingDoorClick(null);
        setIsFastTeleport(false);
    }, []);

    const value = useMemo(() => ({
        currentRoom,
        hasEntered,
        exitRequested,
        enterRoom,
        exitRoom,
        requestExit,
        clearExitRequest,
        markEntered,
        isInRoom: currentRoom !== null,
        // Deep linking
        initialRoom: initialRoom.current,
        deeplinkHandled,
        // Teleportation
        teleportTarget,
        isTeleporting,
        teleportPhase,
        pendingDoorClick,
        isFastTeleport,
        teleportTo,
        startTeleportTransition,
        openTeleportTransition,
        completeTeleport,
        signalRoomReady,
        finishPaperOpen,
        cancelTeleport,
    }), [
        currentRoom,
        hasEntered,
        exitRequested,
        enterRoom,
        exitRoom,
        requestExit,
        clearExitRequest,
        markEntered,
        // Teleportation dependencies
        teleportTarget,
        isTeleporting,
        teleportPhase,
        pendingDoorClick,
        isFastTeleport,
        teleportTo,
        startTeleportTransition,
        openTeleportTransition,
        completeTeleport,
        signalRoomReady,
        finishPaperOpen,
        cancelTeleport
    ]);

    return (
        <SceneContext.Provider value={value}>
            {children}
        </SceneContext.Provider>
    );
};

export default SceneContext;
