"use client";
import React, { createContext, useContext, useEffect, useState } from "react";

export type ColorTheme = "default" | "dark" | "sepia" | "high_contrast";

export interface AccessibilitySettings {
  fontFamily: string;
  fontSize: number;
  lineSpacing: number;
  colorTheme: ColorTheme;
  dyslexiaFont: boolean;
  highContrast: boolean;
  reduceMotion: boolean;
  wordSpacing: number;
}

const DEFAULT: AccessibilitySettings = {
  fontFamily: "Inter",
  fontSize: 16,
  lineSpacing: 1.8,
  colorTheme: "dark",
  dyslexiaFont: false,
  highContrast: false,
  reduceMotion: false,
  wordSpacing: 0,
};

interface AccessibilityContextType {
  settings: AccessibilitySettings;
  update: (patch: Partial<AccessibilitySettings>) => void;
  reset: () => void;
}

const AccessibilityContext = createContext<AccessibilityContextType | null>(null);

const THEME_VARS: Record<ColorTheme, Record<string, string>> = {
  default: {
    "--bg-primary": "#0f0f1a",
    "--bg-secondary": "#1a1a2e",
    "--bg-card": "#16213e",
    "--text-primary": "#e2e8f0",
    "--text-secondary": "#94a3b8",
    "--accent": "#818cf8",
    "--accent-glow": "rgba(129,140,248,0.3)",
    "--border": "rgba(255,255,255,0.08)",
  },
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
    "--bg-primary": "#2c2015",
    "--bg-secondary": "#3a2c1e",
    "--bg-card": "#332519",
    "--text-primary": "#f5e6c8",
    "--text-secondary": "#c4a97d",
    "--accent": "#e8a84c",
    "--accent-glow": "rgba(232,168,76,0.3)",
    "--border": "rgba(255,220,150,0.1)",
  },
  high_contrast: {
    "--bg-primary": "#000000",
    "--bg-secondary": "#0a0a0a",
    "--bg-card": "#111111",
    "--text-primary": "#ffffff",
    "--text-secondary": "#ffff00",
    "--accent": "#00ff88",
    "--accent-glow": "rgba(0,255,136,0.4)",
    "--border": "rgba(255,255,255,0.3)",
  },
};

export function AccessibilityProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<AccessibilitySettings>(() => {
    if (typeof window === "undefined") return DEFAULT;
    try {
      const stored = localStorage.getItem("nlap_accessibility");
      return stored ? { ...DEFAULT, ...JSON.parse(stored) } : DEFAULT;
    } catch {
      return DEFAULT;
    }
  });

  useEffect(() => {
    const root = document.documentElement;
    const theme = THEME_VARS[settings.colorTheme];
    Object.entries(theme).forEach(([k, v]) => root.style.setProperty(k, v));
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
  }, [settings]);

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
