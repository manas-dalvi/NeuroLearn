"use client";

import React, { useState, useEffect } from "react";
import Sidebar from "@/components/dashboard/Sidebar";
import Navbar from "@/components/dashboard/Navbar";
import AccessibilityPanel from "@/components/accessibility/AccessibilityPanel";
import { useAccessibility } from "@/context/AccessibilityContext";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { X, RotateCcw, Eye, Moon, Sun, Zap, Type } from "lucide-react";
import { api } from "@/lib/api";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [isAccessPanelOpen, setIsAccessPanelOpen] = useState(false);
  const { settings, update, reset } = useAccessibility();
  const { user, loading, token } = useAuth();
  const router = useRouter();
  const [profileLoaded, setProfileLoaded] = useState(false);

  const updateAndSync = async (patch: Partial<typeof settings>) => {
    update(patch);
    if (token) {
      try {
        const merged = { ...settings, ...patch };
        await api.updateProfile(token, {
          diagnosis_type: merged.activeProfile,
          focus_duration_minutes: merged.focusDuration,
          break_duration_minutes: merged.breakDuration,
          chunk_word_limit: merged.chunkWordLimit,
          reading_level: merged.readingLevel,
          accessibility: {
            font_family: merged.fontFamily,
            font_size: merged.fontSize,
            line_spacing: merged.lineSpacing,
            word_spacing: merged.wordSpacing,
            color_theme: merged.colorTheme,
            dyslexia_font: merged.dyslexiaFont,
            high_contrast: merged.highContrast,
            reduce_motion: merged.reduceMotion,
          } as any
        });
      } catch (err) {
        console.error("Failed to sync accessibility layout change", err);
      }
    }
  };

  useEffect(() => {
    if (!loading && !user) {
      router.push("/auth/login");
    }
  }, [user, loading, router]);

  // Sync profile from backend on mount/token change
  useEffect(() => {
    if (!token) {
      setProfileLoaded(false);
      return;
    }

    const loadProfileSettings = async () => {
      try {
        const profile = await api.getProfile(token);
        update({
          activeProfile: profile.diagnosis_type as any,
          focusDuration: profile.focus_duration_minutes,
          breakDuration: profile.break_duration_minutes,
          chunkWordLimit: profile.chunk_word_limit,
          readingLevel: profile.reading_level,
          fontFamily: profile.accessibility.font_family,
          fontSize: profile.accessibility.font_size,
          lineSpacing: profile.accessibility.line_spacing,
          wordSpacing: profile.accessibility.word_spacing,
          colorTheme: profile.accessibility.color_theme as any,
          dyslexiaFont: profile.accessibility.dyslexia_font,
          highContrast: profile.accessibility.high_contrast,
          reduceMotion: profile.accessibility.reduce_motion,
        });
      } catch (err) {
        console.error("Failed to load layout profile", err);
      } finally {
        setProfileLoaded(true);
      }
    };

    loadProfileSettings();
  }, [token]);

  if (loading || (token && !profileLoaded)) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[var(--bg-primary)] text-[var(--text-secondary)] font-semibold gap-2">
        <div className="w-5 h-5 rounded-full border-2 border-[var(--accent)] border-t-transparent animate-spin" />
        <span>Loading...</span>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="flex h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] transition-colors duration-300 overflow-hidden">
      {/* Collapsible Sidebar */}
      <Sidebar 
        collapsed={collapsed} 
        setCollapsed={setCollapsed} 
        onOpenAccessibility={() => setIsAccessPanelOpen(true)} 
      />

      {/* Main Content Area */}
      <div className="flex flex-col flex-grow min-w-0 h-screen relative overflow-hidden">
        {/* Sticky Header Navbar */}
        <Navbar onOpenAccessibility={() => setIsAccessPanelOpen(true)} />

        {/* Scrollable Page Content */}
        <main className="flex-grow p-6 md:p-8 max-w-[1440px] mx-auto w-full overflow-y-auto">
          {children}
        </main>
      </div>

      {/* Slide-out Accessibility Drawer */}
      <AnimatePresence>
        {isAccessPanelOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.4 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAccessPanelOpen(false)}
              className="fixed inset-0 bg-slate-900 z-50 cursor-pointer"
            />

            {/* Panel Content */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="fixed right-0 top-0 bottom-0 w-80 md:w-96 bg-[var(--bg-card)] border-l border-[var(--border)] shadow-2xl z-50 p-6 flex flex-col text-[var(--text-primary)]"
            >
              <div className="flex items-center justify-between border-b border-[var(--border)] pb-4 mb-6">
                <div className="flex items-center gap-2">
                  <Eye className="text-[var(--accent)]" size={20} />
                  <span className="font-bold text-lg text-[var(--text-primary)]">Accessibility Settings</span>
                </div>
                <button
                  onClick={() => setIsAccessPanelOpen(false)}
                  className="p-1 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]/50 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Adjustments stack */}
              <div className="flex-grow overflow-y-auto space-y-6 pr-1">
                {/* Reset button */}
                <button
                  onClick={async () => {
                    reset();
                    if (token) {
                      try {
                        await api.updateProfile(token, {
                          diagnosis_type: "dyslexia",
                          focus_duration_minutes: 25,
                          break_duration_minutes: 5,
                          chunk_word_limit: 80,
                          reading_level: "intermediate",
                          accessibility: {
                            font_family: "Inter",
                            font_size: 16,
                            line_spacing: 1.8,
                            word_spacing: 0,
                            color_theme: "default",
                            dyslexia_font: false,
                            high_contrast: false,
                            reduce_motion: false,
                          } as any
                        });
                      } catch (err) {
                        console.error("Failed to reset accessibility profile", err);
                      }
                    }
                  }}
                  className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-xl border border-[var(--border)] hover:border-[var(--text-secondary)] text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                >
                  <RotateCcw size={14} />
                  <span>Reset to default values</span>
                </button>

                {/* Color Theme Selector */}
                <div className="space-y-3">
                  <label className="flex items-center gap-2 text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">
                    <Moon size={14} /> Color Theme
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: "default", label: "Light (Default)" },
                      { id: "dark", label: "Dark Mode" },
                      { id: "sepia", label: "Sepia Warm" },
                      { id: "high_contrast", label: "High Contrast" },
                    ].map((theme) => {
                      const isActive = settings.colorTheme === theme.id;
                      return (
                        <button
                          key={theme.id}
                          onClick={() => updateAndSync({ colorTheme: theme.id as any })}
                          className={`p-2.5 rounded-xl border text-xs font-semibold text-center transition-all duration-200
                            ${
                              isActive
                                ? "bg-[var(--accent-glow)] border-[var(--accent)] text-[var(--accent)] shadow-sm"
                                : "bg-[var(--bg-secondary)]/30 border-[var(--border)] hover:bg-[var(--bg-secondary)]/60 text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                            }
                          `}
                        >
                          {theme.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Font Size slider */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <label className="flex items-center gap-2 text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">
                      <Type size={14} /> Font Size
                    </label>
                    <span className="text-xs font-bold text-[var(--accent)]">{settings.fontSize}px</span>
                  </div>
                  <input
                    type="range"
                    min="14"
                    max="24"
                    step="1"
                    value={settings.fontSize}
                    onChange={(e) => update({ fontSize: parseInt(e.target.value) })}
                    onMouseUp={(e) => updateAndSync({ fontSize: parseInt((e.target as HTMLInputElement).value) })}
                    onTouchEnd={(e) => updateAndSync({ fontSize: parseInt((e.target as HTMLInputElement).value) })}
                    className="w-full h-1.5 bg-[var(--bg-secondary)] rounded-full appearance-none cursor-pointer accent-[var(--accent)]"
                  />
                  <div className="flex justify-between text-[10px] font-semibold text-[var(--text-secondary)]">
                    <span>14px</span>
                    <span>24px</span>
                  </div>
                </div>

                {/* Line spacing slider */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">
                      Line Spacing
                    </label>
                    <span className="text-xs font-bold text-[var(--accent)]">{settings.lineSpacing}x</span>
                  </div>
                  <input
                    type="range"
                    min="1.4"
                    max="2.4"
                    step="0.1"
                    value={settings.lineSpacing}
                    onChange={(e) => update({ lineSpacing: parseFloat(e.target.value) })}
                    onMouseUp={(e) => updateAndSync({ lineSpacing: parseFloat((e.target as HTMLInputElement).value) })}
                    onTouchEnd={(e) => updateAndSync({ lineSpacing: parseFloat((e.target as HTMLInputElement).value) })}
                    className="w-full h-1.5 bg-[var(--bg-secondary)] rounded-full appearance-none cursor-pointer accent-[var(--accent)]"
                  />
                  <div className="flex justify-between text-[10px] font-semibold text-[var(--text-secondary)]">
                    <span>1.4x</span>
                    <span>2.4x</span>
                  </div>
                </div>

                {/* Word spacing slider */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">
                      Word Spacing
                    </label>
                    <span className="text-xs font-bold text-[var(--accent)]">{settings.wordSpacing}px</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="6"
                    step="1"
                    value={settings.wordSpacing}
                    onChange={(e) => update({ wordSpacing: parseInt(e.target.value) })}
                    onMouseUp={(e) => updateAndSync({ wordSpacing: parseInt((e.target as HTMLInputElement).value) })}
                    onTouchEnd={(e) => updateAndSync({ wordSpacing: parseInt((e.target as HTMLInputElement).value) })}
                    className="w-full h-1.5 bg-[var(--bg-secondary)] rounded-full appearance-none cursor-pointer accent-[var(--accent)]"
                  />
                  <div className="flex justify-between text-[10px] font-semibold text-[var(--text-secondary)]">
                    <span>0px</span>
                    <span>6px</span>
                  </div>
                </div>

                <div className="h-px bg-[var(--border)]" />

                {/* Accessibility Toggles */}
                <div className="space-y-4">
                  {[
                    { key: "dyslexiaFont", label: "OpenDyslexic Font", desc: "Letter shapes are weighted to prevent rotations." },
                    { key: "highContrast", label: "High Contrast Text", desc: "Max contrast ratios for readability." },
                    { key: "reduceMotion", label: "Reduce Motion", desc: "Minimize slide/zoom transitions." }
                  ].map((toggle) => (
                    <div key={toggle.key} className="flex items-center justify-between p-3.5 bg-[var(--bg-secondary)]/20 border border-[var(--border)] rounded-2xl">
                      <div className="space-y-1 pr-4">
                        <span className="text-sm font-bold text-[var(--text-primary)]">{toggle.label}</span>
                        <p className="text-[11px] text-[var(--text-secondary)] font-semibold leading-normal">{toggle.desc}</p>
                      </div>
                      <button
                        role="switch"
                        aria-checked={settings[toggle.key as keyof typeof settings] as boolean}
                        onClick={() => updateAndSync({ [toggle.key]: !settings[toggle.key as keyof typeof settings] })}
                        className={`w-11 h-6 rounded-full relative transition-all duration-200 outline-none flex-shrink-0
                          ${settings[toggle.key as keyof typeof settings] ? "bg-[var(--accent)]" : "bg-slate-200"}
                        `}
                      >
                        <span 
                          className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-all shadow-sm
                            ${settings[toggle.key as keyof typeof settings] ? "translate-x-5" : "translate-x-0"}
                          `}
                        />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
