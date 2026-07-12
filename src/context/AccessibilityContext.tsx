"use client";
import React, { createContext, useContext, useEffect, useState } from "react";

export type ColorTheme = "default" | "dark" | "sepia" | "high_contrast";
export type NeurodivergentProfile = "adhd" | "dyslexia" | "autism";

export interface AccessibilitySettings {
  fontFamily: string;
  fontSize: number;
  lineSpacing: number;
  colorTheme: ColorTheme;
  dyslexiaFont: boolean;
  highContrast: boolean;
  reduceMotion: boolean;
  wordSpacing: number;
  activeProfile: NeurodivergentProfile;
  focusDuration: number;
  breakDuration: number;
  chunkWordLimit?: number;
  readingLevel?: "beginner" | "intermediate" | "advanced";
}

const DEFAULT: AccessibilitySettings = {
  fontFamily: "Inter",
  fontSize: 16,
  lineSpacing: 1.8,
  colorTheme: "default",
  dyslexiaFont: false,
  highContrast: false,
  reduceMotion: false,
  wordSpacing: 0,
  activeProfile: "dyslexia",
  focusDuration: 25,
  breakDuration: 5,
};

interface AccessibilityContextType {
  settings: AccessibilitySettings;
  update: (patch: Partial<AccessibilitySettings>) => void;
  reset: () => void;
}

const AccessibilityContext = createContext<AccessibilityContextType | null>(null);

export const PROFILE_THEMES: Record<NeurodivergentProfile, Record<string, string>> = {
  adhd: {
    "--bg-primary": "#FAF7F2", // Calm cream background
    "--bg-secondary": "#FAF7F2",
    "--bg-card": "#FFFFFF", // White cards
    "--text-primary": "#1E293B",
    "--text-secondary": "#64748B",
    "--accent": "#3B82F6", // Soft blue primary color
    "--accent-secondary": "#10B981", // Soft green accents
    "--accent-glow": "rgba(59, 130, 246, 0.15)",
    "--border": "#E2E8F0",
  },
  dyslexia: {
    "--bg-primary": "#FDFBF7", // Warm cream background
    "--bg-secondary": "#FDFBF7",
    "--bg-card": "#FFFFFF",
    "--text-primary": "#0F172A", // Navy text
    "--text-secondary": "#475569",
    "--accent": "#1F5F8B", // Soft blue accents
    "--accent-secondary": "#1F5F8B",
    "--accent-glow": "rgba(31, 95, 139, 0.15)",
    "--border": "#E2E8F0",
  },
  autism: {
    "--bg-primary": "#F5F3FF", // Soft lavender background
    "--bg-secondary": "#F5F3FF",
    "--bg-card": "#FFFFFF", // White cards
    "--text-primary": "#1E1B4B",
    "--text-secondary": "#4338CA",
    "--accent": "#0D9488", // Soft teal accents
    "--accent-secondary": "#0D9488",
    "--accent-glow": "rgba(13, 148, 136, 0.15)",
    "--border": "#DDD6FE",
  }
};

const THEME_VARS: Record<ColorTheme, Record<string, string>> = {
  default: {}, // Dynamically resolved from profile theme
  dark: {
    "--bg-primary": "#050508",
    "--bg-secondary": "#0d0d16",
    "--bg-card": "#111118",
    "--text-primary": "#f1f5f9",
    "--text-secondary": "#8892a4",
    "--accent": "#a78bfa",
    "--accent-glow": "rgba(167,139,250,0.3)",
    "--border": "rgba(255,255,255,0.06)",
  },
  sepia: {
    "--bg-primary": "#F5E7C5",
    "--bg-secondary": "#FFF4DE",
    "--bg-card": "#FFFFFF",
    "--text-primary": "#5A3E1B",
    "--text-secondary": "#8B6B43",
    "--accent": "#D97706",
    "--accent-glow": "rgba(217,119,6,0.2)",
    "--border": "#E7D3A5",
  },
  high_contrast: {
    "--bg-primary": "#000000",
    "--bg-secondary": "#111111",
    "--bg-card": "#1A1A1A",
    "--text-primary": "#FFFFFF",
    "--text-secondary": "#FFFF00",
    "--accent": "#00FF88",
    "--accent-glow": "rgba(0,255,136,0.3)",
    "--border": "#FFFFFF",
  },
};

export function AccessibilityProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<AccessibilitySettings>(DEFAULT);
  const [isHydrated, setIsHydrated] = useState(false);

  // Hydrate stored settings from localStorage on mount (client-only)
  useEffect(() => {
    try {
      const stored = localStorage.getItem("nlap_accessibility");
      if (stored) {
        setSettings({ ...DEFAULT, ...JSON.parse(stored) });
      }
    } catch (e) {
      console.warn("Failed to load accessibility settings from localStorage", e);
    }
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (!isHydrated) return;

    const root = document.documentElement;
    const profileTheme = PROFILE_THEMES[settings.activeProfile || "dyslexia"];
    const baseTheme = settings.colorTheme !== "default" 
      ? THEME_VARS[settings.colorTheme] 
      : profileTheme;

    Object.entries(baseTheme).forEach(([k, v]) => root.style.setProperty(k, v));
    
    // Set data attribute on the document element for CSS selectors
    root.setAttribute("data-profile", settings.activeProfile);
    
    root.style.setProperty("--font-size-base", `${settings.fontSize}px`);
    root.style.setProperty("--line-spacing", `${settings.lineSpacing}`);
    root.style.setProperty("--word-spacing", `${settings.wordSpacing}px`);
    root.style.setProperty(
      "--font-family",
      settings.dyslexiaFont ? "'OpenDyslexic', sans-serif" : `'${settings.fontFamily}', sans-serif`
    );
    if (settings.reduceMotion) {
      root.style.setProperty("--animation-duration", "0ms");
    } else {
      root.style.removeProperty("--animation-duration");
    }
    localStorage.setItem("nlap_accessibility", JSON.stringify(settings));
  }, [settings, isHydrated]);

  const update = (patch: Partial<AccessibilitySettings>) =>
    setSettings((prev) => ({ ...prev, ...patch }));

  const reset = () => setSettings(DEFAULT);

  return (
    <AccessibilityContext.Provider value={{ settings, update, reset }}>
      {children}
    </AccessibilityContext.Provider>
  );
}

export function useAccessibility() {
  const ctx = useContext(AccessibilityContext);
  if (!ctx) throw new Error("useAccessibility must be used within AccessibilityProvider");
  return ctx;
}
