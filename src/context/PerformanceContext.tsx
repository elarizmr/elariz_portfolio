import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { useThree } from "@react-three/fiber";

// Performance Tiers
export const TIERS = {
  HIGH: "HIGH",
  MEDIUM: "MEDIUM",
  LOW: "LOW",
} as const;

export type PerformanceTier = typeof TIERS[keyof typeof TIERS];
type TextureQuality = 'high' | 'medium' | 'low';

interface PerformanceSettings {
  dpr: [number, number];
  shadows: boolean;
  antialias: boolean;
  powerPreference: WebGLPowerPreference;
  physicsStep: number;
  textureQuality: TextureQuality;
  particleCount: number;
}

interface PerformanceContextValue {
  tier: PerformanceTier;
  settings: PerformanceSettings;
  isDetecting: boolean;
  downgradeTier: () => void;
}

// Settings for each tier
const SETTINGS: Record<PerformanceTier, PerformanceSettings> = {
  [TIERS.HIGH]: {
    dpr: [1, 2], // Allow up to 2x pixel density
    shadows: true, // Enable shadows
    antialias: true,
    powerPreference: "high-performance",
    physicsStep: 1 / 60,
    textureQuality: "high",
    particleCount: 1.0, // 100% particles
  },
  [TIERS.MEDIUM]: {
    dpr: [1, 1.5], // Cap at 1.5x on mobile to balance quality and GPU fillrate
    shadows: false, // Disable shadows for better mobile performance
    antialias: true,
    powerPreference: "default",
    physicsStep: 1 / 60,
    textureQuality: "medium",
    particleCount: 0.6, // 60% particles
  },
  [TIERS.LOW]: {
    dpr: [0.8, 1], // Minimum 0.8x pixel density to avoid extreme pixelation
    shadows: false, // Disable shadows completely
    antialias: false, // Disable AA to maximize FPS
    powerPreference: "low-power",
    physicsStep: 1 / 45, // Slower physics updates if needed
    textureQuality: "low",
    particleCount: 0.3, // 30% particles
  },
};

const PerformanceContext = createContext<PerformanceContextValue | null>(null);

export const usePerformance = (): PerformanceContextValue => {
  const context = useContext(PerformanceContext);
  if (!context) {
    throw new Error("usePerformance must be used within a PerformanceProvider");
  }
  return context;
};

export const PerformanceProvider = ({ children }: { children: ReactNode }) => {
  const [tier, setTier] = useState<PerformanceTier>(TIERS.HIGH); // Default to HIGH, degrade if needed
  const [isDetecting, setIsDetecting] = useState(true);

  useEffect(() => {
    const detectTier = () => {
      let detectedTier: PerformanceTier = TIERS.HIGH;

      // 1. Mobile Check
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      if (isMobile) {
        detectedTier = TIERS.MEDIUM;
      }

      // 2. Hardware Concurrency (CPU Cores)
      // Low-end devices usually have 4 or fewer cores
      if (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4) {
        detectedTier = isMobile ? TIERS.LOW : TIERS.MEDIUM;
      }

      // 3. GPU/FPS Estimate (Simplistic)
      // Override for very weak hardware or low RAM (<= 4GB)
      if (navigator.deviceMemory && navigator.deviceMemory <= 4) {
        detectedTier = TIERS.LOW;
      }
      
      // Removed small screen heuristic because modern phones have CSS width < 430px (e.g. iPhone 15 Pro Max is 430px)

      // console.log(
      //   `[Performance] Detected Tier: ${detectedTier} | Cores: ${navigator.hardwareConcurrency} | Mobile: ${isMobile}`
      // );
      setTier(detectedTier);
      setIsDetecting(false);
    };

    detectTier();
  }, []);

  // Function to manually downgrade tier (called by PerformanceMonitor)
  const downgradeTier = (): void => {
    setTier((current) => {
      if (current === TIERS.HIGH) return TIERS.MEDIUM;
      if (current === TIERS.MEDIUM) return TIERS.LOW;
      return TIERS.LOW;
    });
  };

  const value = {
    tier,
    settings: SETTINGS[tier],
    isDetecting,
    downgradeTier,
  };

  return (
    <PerformanceContext.Provider value={value}>
      {children}
    </PerformanceContext.Provider>
  );
};
