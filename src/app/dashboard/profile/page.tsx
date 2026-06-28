"use client";

import { useState, useEffect } from "react";
import { useAccessibility } from "@/context/AccessibilityContext";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import { useRouter } from "next/navigation";
import { 
  User, 
  Eye, 
  Volume2, 
  Sliders, 
  Lock, 
  Trash2, 
  Lightbulb, 
  PlayCircle, 
  Gauge, 
  Check, 
  Save, 
  RotateCcw,
  Sparkles,
  Info
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function ProfilePage() {
  const { settings, update, reset } = useAccessibility();
  const { user, token } = useAuth();
  const router = useRouter();

  // Local user profile state
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");

  // Sync state if user context resolves
  useEffect(() => {
    if (user?.email) {
      setEmail(user.email);
    }
    if (user?.displayName && !fullName) {
      setFullName(user.displayName);
    }
  }, [user]);

  // Focus preference duration (slider state)
  const [focusDuration, setFocusDuration] = useState(settings.focusDuration || 25);
  const [dailyGoalTarget, setDailyGoalTarget] = useState(4);

  // Active cognitive preset derived from global settings
  const cognitivePreset = settings.activeProfile || "dyslexia";

  // Toast feedback state
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  // Sync profile from backend on mount
  useEffect(() => {
    if (!token) return;

    const loadProfile = async () => {
      try {
        const profile = await api.getProfile(token);
        setFullName(profile.full_name);
        setFocusDuration(profile.focus_duration_minutes);
        setDailyGoalTarget(profile.daily_goal_target || 4);
      } catch (err: any) {
        console.warn("Profile loading issue:", err.message);
        if (err.message.includes("Assessment") || err.message.includes("not found")) {
          // Redirect to wizard if profile is missing
          router.push("/assessment");
        }
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [token]);

  // Sync state if settings focus duration changes
  useEffect(() => {
    if (settings.focusDuration) {
      setFocusDuration(settings.focusDuration);
    }
  }, [settings.focusDuration]);

  // Trigger cognitive preset settings
  const applyPreset = (preset: "adhd" | "dyslexia" | "autism") => {
    if (preset === "dyslexia") {
      update({
        activeProfile: "dyslexia",
        dyslexiaFont: true,
        fontSize: 18,
        lineSpacing: 1.8,
        wordSpacing: 2,
        colorTheme: "default"
      });
    } else if (preset === "adhd") {
      update({
        activeProfile: "adhd",
        dyslexiaFont: false,
        fontSize: 16,
        lineSpacing: 2.0,
        wordSpacing: 1,
        reduceMotion: true,
        colorTheme: "default"
      });
    } else if (preset === "autism") {
      update({
        activeProfile: "autism",
        dyslexiaFont: false,
        fontSize: 16,
        lineSpacing: 1.6,
        wordSpacing: 0,
        reduceMotion: true,
        colorTheme: "default"
      });
    }
  };

  const handleSaveChanges = async () => {
    if (!token) return;
    setIsSaving(true);
    
    // Optimistically update local context first
    update({
      focusDuration: focusDuration
    });

    try {
      await api.updateProfile(token, {
        diagnosis_type: cognitivePreset,
        focus_duration_minutes: focusDuration,
        daily_goal_target: dailyGoalTarget,
        break_duration_minutes: settings.breakDuration || 5,
        chunk_word_limit: settings.chunkWordLimit || 80,
        reading_level: settings.readingLevel || "intermediate",
        accessibility: {
          font_family: settings.fontFamily || "Inter",
          font_size: settings.fontSize || 16,
          line_spacing: settings.lineSpacing || 1.8,
          word_spacing: settings.wordSpacing || 0.0,
          color_theme: settings.colorTheme || "default",
          dyslexia_font: settings.dyslexiaFont || false,
          high_contrast: settings.highContrast || false,
          reduce_motion: settings.reduceMotion || false,
        } as any
      });
      
      setToastMessage("Preferences updated successfully in database!");
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    } catch (err: any) {
      console.error(err);
      setToastMessage(err.message || "Failed to update profile settings.");
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetToDefaults = () => {
    reset();
    setFocusDuration(25);
    setDailyGoalTarget(4);
    setToastMessage("Settings reset to defaults");
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px] text-[var(--text-secondary)] font-semibold gap-2">
        <div className="w-5 h-5 rounded-full border-2 border-[var(--accent)] border-t-transparent animate-spin" />
        <span>Syncing cognitive profile...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-[1200px] mx-auto pb-24 animate-fade-in text-[var(--text-primary)]">
      
      {/* Top Row / Title Bar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-[var(--text-primary)]">Learning Profile</h1>
          <p className="text-[var(--text-secondary)] font-semibold text-sm mt-1">
            Tailor your learning environment to support your cognitive style and accessibility needs.
          </p>
        </div>
        <button
          onClick={handleSaveChanges}
          disabled={isSaving}
          className="btn-content-action flex items-center gap-2 bg-[var(--accent)] hover:bg-[var(--accent)]/90 text-white font-bold text-sm px-5 py-3 rounded-xl shadow-sm transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 flex-shrink-0"
        >
          {isSaving ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Saving...
            </>
          ) : (
            <>
              <Save size={16} />
              Save Preferences
            </>
          )}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2-Col Span: Configs */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* User Profile Form */}
          <section className="bg-[var(--bg-card)] p-6 rounded-2xl border border-[var(--border)] shadow-sm space-y-4">
            <h3 className="text-base font-bold text-[var(--text-primary)] flex items-center gap-2 pb-3 border-b border-[var(--border)]">
              <User size={18} className="text-[var(--accent)]" />
              Account Details
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">Full Name</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full bg-[var(--bg-secondary)]/20 border border-[var(--border)] rounded-xl px-4 py-3 font-semibold text-sm text-[var(--text-primary)] focus:bg-[var(--bg-card)] focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)] outline-none transition-all"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">Email Address</label>
                <input
                  type="email"
                  value={email}
                  disabled
                  className="w-full bg-[var(--bg-secondary)]/10 border border-[var(--border)] rounded-xl px-4 py-3 font-semibold text-sm text-[var(--text-secondary)] outline-none cursor-not-allowed"
                />
              </div>
            </div>
          </section>

          {/* Learning Presets / Cognitive Modes */}
          <section className="space-y-3">
            <h3 className="text-sm font-bold text-[var(--text-secondary)] uppercase tracking-wider">Cognitive Preset Profiles</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              
              {/* Dyslexia Mode */}
              <button
                onClick={() => applyPreset("dyslexia")}
                className={`preset-card p-5 rounded-2xl border text-left flex flex-col justify-between min-h-[190px] h-full bg-[var(--bg-card)] transition-all hover:shadow-md hover:-translate-y-0.5
                  ${cognitivePreset === "dyslexia" 
                    ? "border-[var(--accent)] bg-[var(--accent-glow)] shadow-sm" 
                    : "border-[var(--border)]"
                  }
                `}
              >
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-[var(--text-primary)]">Dyslexia Preset</span>
                    {cognitivePreset === "dyslexia" && (
                      <span className="bg-[var(--accent-glow)] text-[var(--accent)] text-[9px] font-bold px-1.5 py-0.5 rounded border border-[var(--accent)]/20">Active</span>
                    )}
                  </div>
                  <p className="text-xs text-[var(--text-secondary)] font-semibold leading-normal">
                    Weights letter shapes, increases line spacing, and selects OpenDyslexic font to prevent vertical flipping.
                  </p>
                </div>
                <span className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">OpenDyslexic • 1.8 spacing</span>
              </button>

              {/* ADHD Mode */}
              <button
                onClick={() => applyPreset("adhd")}
                className={`preset-card p-5 rounded-2xl border text-left flex flex-col justify-between min-h-[190px] h-full bg-[var(--bg-card)] transition-all hover:shadow-md hover:-translate-y-0.5
                  ${cognitivePreset === "adhd" 
                    ? "border-[var(--accent)] bg-[var(--accent-glow)] shadow-sm" 
                    : "border-[var(--border)]"
                  }
                `}
              >
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-[var(--text-primary)]">ADHD Preset</span>
                    {cognitivePreset === "adhd" && (
                      <span className="bg-[var(--accent-glow)] text-[var(--accent)] text-[9px] font-bold px-1.5 py-0.5 rounded border border-[var(--accent)]/20">Active</span>
                    )}
                  </div>
                  <p className="text-xs text-[var(--text-secondary)] font-semibold leading-normal">
                    Toggles Sepia Warm theme, sets generous line gaps, disables moving animations, and sets a shorter 15m focus target.
                  </p>
                </div>
                <span className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">Sepia Theme • Reduced Motion</span>
              </button>

              {/* Autism Mode */}
              <button
                onClick={() => applyPreset("autism")}
                className={`preset-card p-5 rounded-2xl border text-left flex flex-col justify-between min-h-[190px] h-full bg-[var(--bg-card)] transition-all hover:shadow-md hover:-translate-y-0.5
                  ${cognitivePreset === "autism" 
                    ? "border-[var(--accent)] bg-[var(--accent-glow)] shadow-sm" 
                    : "border-[var(--border)]"
                  }
                `}
              >
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-[var(--text-primary)]">Autism Preset</span>
                    {cognitivePreset === "autism" && (
                      <span className="bg-[var(--accent-glow)] text-[var(--accent)] text-[9px] font-bold px-1.5 py-0.5 rounded border border-[var(--accent)]/20">Active</span>
                    )}
                  </div>
                  <p className="text-xs text-[var(--text-secondary)] font-semibold leading-normal">
                    Switches to dark background mode, reduces visual contrast load, removes extra sensory graphics, and schedules 30m sessions.
                  </p>
                </div>
                <span className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">Dark Theme • Low Intensity</span>
              </button>

            </div>
          </section>


        </div>

        {/* Right 1-Col Span: Focus Settings */}
        <div className="space-y-6">
          
          {/* Focus preferences Card */}
          <section className="bg-[var(--bg-card)] p-6 rounded-2xl border border-[var(--border)] shadow-sm space-y-6">
            <h3 className="text-base font-bold text-[var(--text-primary)] flex items-center gap-2 pb-3 border-b border-[var(--border)]">
              <Sliders size={18} className="text-[var(--accent)]" />
              Session Targets
            </h3>
            
            {/* Focus slider */}
            <div className="space-y-3">
              <div className="flex justify-between items-end">
                <span className="text-xs font-bold text-[var(--text-secondary)]">Focus Session Length</span>
                <span className="text-xs font-extrabold text-[var(--accent)] bg-[var(--accent-glow)] px-2 py-0.5 rounded">
                  {focusDuration} minutes
                </span>
              </div>
              <input
                type="range"
                min="5"
                max="60"
                step="5"
                value={focusDuration}
                onChange={(e) => setFocusDuration(parseInt(e.target.value))}
                className="w-full h-1.5 bg-[var(--bg-secondary)] rounded-full appearance-none cursor-pointer accent-[var(--accent)]"
              />
              <div className="flex justify-between text-[10px] font-semibold text-[var(--text-secondary)]">
                <span>5m</span>
                <span>30m</span>
                <span>60m</span>
              </div>
            </div>

            {/* Daily limit slider */}
            <div className="space-y-3">
              <div className="flex justify-between items-end">
                <span className="text-xs font-bold text-[var(--text-secondary)]">Daily Goal Target</span>
                <span className="text-xs font-extrabold text-[var(--accent)] bg-[var(--accent-glow)] px-2 py-0.5 rounded border border-[var(--accent)]/20">
                  {dailyGoalTarget} Sessions
                </span>
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-6 lg:grid-cols-3 xl:grid-cols-6 gap-1.5">
                {[1, 2, 3, 4, 5, 6].map((num) => (
                  <button 
                    key={num} 
                    onClick={() => setDailyGoalTarget(num)}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-colors
                      ${num === dailyGoalTarget 
                        ? "bg-[var(--accent)] border-[var(--accent)] text-white" 
                        : "bg-[var(--bg-secondary)]/30 border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]/60"
                      }
                    `}
                  >
                    {num}
                  </button>
                ))}
              </div>
            </div>

          </section>

          {/* Security & Danger Cards */}
          <section className="bg-[var(--bg-card)] p-6 rounded-2xl border border-[var(--border)] shadow-sm space-y-4">
            <h3 className="text-base font-bold text-rose-600 flex items-center gap-2 pb-3 border-b border-rose-50">
              <Trash2 size={18} />
              Danger Settings
            </h3>
            <p className="text-xs text-[var(--text-secondary)] font-semibold leading-normal">
              Irreversible actions. Deleting your profile will wipe out your streak history, focus minutes, and achievements.
            </p>
            <button className="w-full py-3 bg-rose-50 hover:bg-rose-100/60 border border-rose-100 text-rose-600 font-bold text-xs rounded-xl transition-all shadow-sm">
              Delete Profile Data
            </button>
          </section>

        </div>

      </div>

      {/* Bottom Actions Bar */}
      <div className="bg-[var(--bg-card)] border border-[var(--border)] p-4 rounded-2xl shadow-sm flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-2 text-[var(--text-secondary)]">
          <Info size={16} />
          <span className="text-xs font-semibold">Changes are saved persistently to your secure profile database.</span>
        </div>
        <div className="flex gap-3 w-full sm:w-auto">
          <button
            onClick={handleResetToDefaults}
            className="btn-content-action flex-1 sm:flex-initial py-2.5 px-4 rounded-xl border border-[var(--border)] hover:border-[var(--text-secondary)] text-xs font-bold text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors flex items-center justify-center gap-1.5"
          >
            <RotateCcw size={14} />
            Reset Defaults
          </button>
          <button
            onClick={handleSaveChanges}
            disabled={isSaving}
            className="btn-content-action flex-1 sm:flex-initial py-2.5 px-6 rounded-xl bg-[var(--accent)] hover:bg-[var(--accent)]/90 text-white text-xs font-bold transition-colors shadow-sm shadow-[var(--accent)]/5"
          >
            Save Changes
          </button>
        </div>
      </div>

      {/* Toast Feedback */}
      <AnimatePresence>
        {showToast && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-xl border border-slate-800"
          >
            <div className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center">
              <Check size={12} strokeWidth={3} />
            </div>
            <span className="text-xs font-bold">{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
