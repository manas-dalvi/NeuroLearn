"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import Sidebar from "@/components/ui/Sidebar";
import AccessibilityPanel from "@/components/accessibility/AccessibilityPanel";
import { Brain, Clock, BookOpen, Palette, Edit3, Loader2, Sparkles, CheckCircle, XCircle, AlertTriangle, RefreshCw } from "lucide-react";

const DIAGNOSES = [
  { id: "adhd", label: "ADHD / ADD" },
  { id: "dyslexia", label: "Dyslexia" },
  { id: "autism", label: "Autism Spectrum" },
  { id: "dyscalculia", label: "Dyscalculia" },
  { id: "multiple", label: "Multiple" },
  { id: "undiagnosed", label: "Self-identified" },
];

export function calculateAdaptiveChunkWordLimit(
  diagnosisType: string,
  readingLevel: "beginner" | "intermediate" | "advanced",
  focusDuration: number
): number {
  let baseLimit = 100;
  if (readingLevel === "beginner") {
    baseLimit = 60;
  } else if (readingLevel === "advanced") {
    baseLimit = 150;
  }

  let diagMod = 1.0;
  switch (diagnosisType) {
    case "adhd":
      diagMod = 0.7;
      break;
    case "dyslexia":
      diagMod = 0.6;
      break;
    case "autism":
      diagMod = 0.8;
      break;
    case "multiple":
      diagMod = 0.65;
      break;
    case "dyscalculia":
    case "undiagnosed":
      diagMod = 0.9;
      break;
    default:
      diagMod = 1.0;
  }

  let focusMod = 1.0;
  if (focusDuration >= 5 && focusDuration <= 15) {
    focusMod = 0.8;
  } else if (focusDuration >= 45) {
    focusMod = 1.2;
  }

  const calculated = baseLimit * diagMod * focusMod;
  const rounded = Math.round(calculated / 5) * 5;
  return Math.min(Math.max(rounded, 30), 250);
}

const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

export default function ProfilePage() {
  const { token, user, loading: authLoading } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form edit state
  const [form, setForm] = useState({
    diagnosis_type: "",
    focus_duration_minutes: 25,
    break_duration_minutes: 5,
    chunk_word_limit: 100,
    reading_level: "intermediate" as "beginner" | "intermediate" | "advanced",
  });

  // Redirect if not logged in
  useEffect(() => {
    if (!authLoading && !user) router.push("/auth/login");
  }, [authLoading, user, router]);

  // Query Profile
  const { data: profile, isLoading, error, refetch } = useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      try {
        const res = await api.getProfile(token ?? "demo");
        console.log("PROFILE FETCH SUCCESS", res);
        return res;
      } catch (err) {
        console.error("PROFILE FETCH FAILURE", err);
        throw err;
      }
    },
    retry: false,
    enabled: !authLoading && !!user && (!!token || DEMO_MODE),
  });

  // Initialize edit form when toggled to edit mode
  useEffect(() => {
    if (profile) {
      setForm({
        diagnosis_type: profile.diagnosis_type || "",
        focus_duration_minutes: profile.focus_duration_minutes ?? 25,
        break_duration_minutes: profile.break_duration_minutes ?? 5,
        chunk_word_limit: profile.chunk_word_limit ?? 100,
        reading_level: profile.reading_level ?? "intermediate",
      });
    }
  }, [profile, isEditing]);

  // Safe Onboarding Redirect: Only redirect to /assessment if profile explicitly not found (404)
  const isProfileNotFoundError = error instanceof Error && error.message.includes("Profile not found");
  
  useEffect(() => {
    if (isProfileNotFoundError) {
      router.push("/assessment");
    }
  }, [isProfileNotFoundError, router]);

  const updateProfileMutation = useMutation({
    mutationFn: async (updatedData: typeof form) => {
      const payload = {
        ...profile,
        ...updatedData,
      };
      const data = await api.updateProfile(token ?? "demo", payload);
      console.log("PROFILE UPDATE SUCCESS", data);
      return data;
    },
    onSuccess: async () => {
      // Prevent stale flash: await invalidation before completing mutation
      await queryClient.invalidateQueries({ queryKey: ["profile"] });
      setIsEditing(false);
    },
    onError: (err) => {
      console.error("PROFILE SAVE ERROR", err);
    },
    onSettled: () => {
      setSaving(false);
    },
  });

  const handleSave = () => {
    setSaving(true);
    const computedLimit = calculateAdaptiveChunkWordLimit(
      form.diagnosis_type,
      form.reading_level,
      form.focus_duration_minutes
    );
    const finalForm = {
      ...form,
      chunk_word_limit: computedLimit,
    };
    updateProfileMutation.mutate(finalForm);
  };

  // Loading UI
  if (authLoading || (isLoading && !error)) {
    return (
      <div style={{ minHeight: "100vh", background: "var(--bg-primary)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Loader2 size={32} color="var(--accent)" style={{ animation: "spin 1s linear infinite" }} />
      </div>
    );
  }

  // Network / Connection Error UI (Server down or network offline)
  if (error && !isProfileNotFoundError) {
    return (
      <div style={{ display: "flex", minHeight: "100vh", background: "var(--bg-primary)" }}>
        <Sidebar />
        <main style={{ flex: 1, padding: "32px 40px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
          <div className="glass-card animate-slide-up" style={{ padding: 40, maxWidth: 480, textAlign: "center" }}>
            <AlertTriangle size={48} color="#f59e0b" style={{ marginBottom: 20 }} />
            <h2 style={{ fontWeight: 800, marginBottom: 12 }}>Connection Failure</h2>
            <p style={{ color: "var(--text-secondary)", marginBottom: 24, fontSize: "0.9rem", lineHeight: "1.5" }}>
              Unable to load your cognitive profile. This may be caused by a temporary network disruption or backend service maintenance.
            </p>
            <button
              onClick={() => refetch()}
              className="btn-primary"
              style={{ display: "flex", alignItems: "center", gap: 8, margin: "0 auto" }}
            >
              <RefreshCw size={16} /> Retry Connection
            </button>
          </div>
        </main>
      </div>
    );
  }

  if (!profile) return null;

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--bg-primary)" }}>
      <div className="bg-animated">
        <div className="bg-orb bg-orb-1" style={{ opacity: 0.07 }} />
        <div className="bg-orb bg-orb-2" style={{ opacity: 0.05 }} />
      </div>
      <Sidebar />

      <main style={{ flex: 1, padding: "32px 40px", overflowY: "auto" }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32 }}>
          <div>
            <h1 style={{ fontSize: "1.8rem", fontWeight: 800, fontFamily: "'Space Grotesk',sans-serif", marginBottom: 4 }}>
              Cognitive <span className="gradient-text">Profile</span> Settings
            </h1>
            <p style={{ color: "var(--text-secondary)", margin: 0 }}>View and customize your AI-powered learning properties.</p>
          </div>
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            {!isEditing ? (
              <button
                onClick={() => setIsEditing(true)}
                className="btn-primary"
                style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "0.875rem", padding: "9px 20px" }}
              >
                <Edit3 size={15} /> Edit Settings
              </button>
            ) : (
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  onClick={() => setIsEditing(false)}
                  className="btn-secondary"
                  disabled={saving}
                  style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.875rem", padding: "9px 20px" }}
                >
                  <XCircle size={15} /> Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="btn-primary"
                  disabled={saving}
                  style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.875rem", padding: "9px 20px" }}
                >
                  {saving ? (
                    <Loader2 size={15} style={{ animation: "spin 1s linear infinite" }} />
                  ) : (
                    <CheckCircle size={15} />
                  )}
                  Save Changes
                </button>
              </div>
            )}
            <AccessibilityPanel />
          </div>
        </div>

        {/* Edit Form or Details View */}
        {isEditing ? (
          <div className="glass-card animate-slide-up" style={{ padding: 40, maxWidth: 640 }}>
            <h2 style={{ fontWeight: 700, marginBottom: 28, fontSize: "1.2rem" }}>Edit Settings</h2>
            
            <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
              {/* Diagnosis Profile */}
              <div>
                <label style={{ fontWeight: 600, display: "block", marginBottom: 8, fontSize: "0.9rem" }}>Diagnosis Profile</label>
                <select
                  className="input-field"
                  value={form.diagnosis_type}
                  onChange={(e) => setForm({ ...form, diagnosis_type: e.target.value })}
                >
                  {DIAGNOSES.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Reading Level */}
              <div>
                <label style={{ fontWeight: 600, display: "block", marginBottom: 8, fontSize: "0.9rem" }}>Reading Level</label>
                <select
                  className="input-field"
                  value={form.reading_level}
                  onChange={(e) => setForm({ ...form, reading_level: e.target.value as any })}
                >
                  <option value="beginner">Beginner (Simple words, short sentences)</option>
                  <option value="intermediate">Intermediate (Clear structure, defined terminology)</option>
                  <option value="advanced">Advanced (Preserved vocabulary, technical precision)</option>
                </select>
              </div>

              {/* Focus duration */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                  <label style={{ fontWeight: 600, fontSize: "0.9rem" }}>Focus Duration</label>
                  <span style={{ color: "var(--accent)", fontWeight: 700 }}>{form.focus_duration_minutes} min</span>
                </div>
                <input
                  type="range"
                  min={5}
                  max={90}
                  step={5}
                  value={form.focus_duration_minutes}
                  onChange={(e) => setForm({ ...form, focus_duration_minutes: +e.target.value })}
                />
              </div>

              {/* Break duration */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                  <label style={{ fontWeight: 600, fontSize: "0.9rem" }}>Break Duration</label>
                  <span style={{ color: "var(--accent)", fontWeight: 700 }}>{form.break_duration_minutes} min</span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={30}
                  step={1}
                  value={form.break_duration_minutes}
                  onChange={(e) => setForm({ ...form, break_duration_minutes: +e.target.value })}
                />
              </div>

              {/* Chunk word limit (Informational Only - Computed Adaptively in Real Time) */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                  <label style={{ fontWeight: 600, fontSize: "0.9rem" }}>Words per Chunk</label>
                  <span style={{ color: "var(--text-secondary)", fontWeight: 700 }}>
                    {calculateAdaptiveChunkWordLimit(form.diagnosis_type, form.reading_level, form.focus_duration_minutes)} words (Adaptive chunking active)
                  </span>
                </div>
              </div>

            </div>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 24, marginTop: 12 }}>
            {/* Card 1: Diagnostic Profile */}
            <div className="glass-card animate-slide-up" style={{ padding: 28 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: "rgba(129,140,248,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Brain size={18} color="var(--accent)" />
                </div>
                <h2 style={{ fontSize: "1.1rem", fontWeight: 700, margin: 0 }}>Learning & Cognitive Profile</h2>
              </div>
              
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div>
                  <div style={{ color: "var(--text-secondary)", fontSize: "0.8rem", marginBottom: 4 }}>DIAGNOSIS PROFILE</div>
                  <div style={{ fontSize: "1rem", fontWeight: 600, textTransform: "capitalize", display: "flex", alignItems: "center", gap: 6 }}>
                    <Sparkles size={14} color="var(--accent)" /> {DIAGNOSES.find(d => d.id === profile.diagnosis_type)?.label || profile.diagnosis_type || "Self-identified"}
                  </div>
                </div>
                <div>
                  <div style={{ color: "var(--text-secondary)", fontSize: "0.8rem", marginBottom: 4 }}>READING LEVEL</div>
                  <span className="badge badge-purple" style={{ textTransform: "capitalize", fontSize: "0.8rem" }}>
                    {profile.reading_level}
                  </span>
                </div>
              </div>
            </div>

            {/* Card 2: Timer Configuration */}
            <div className="glass-card animate-slide-up" style={{ padding: 28, animationDelay: "0.05s" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: "rgba(52,211,153,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Clock size={18} color="#34d399" />
                </div>
                <h2 style={{ fontSize: "1.1rem", fontWeight: 700, margin: 0 }}>Timer & Chunk Settings</h2>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div>
                  <div style={{ color: "var(--text-secondary)", fontSize: "0.8rem", marginBottom: 4 }}>FOCUS DURATION</div>
                  <div style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--text-primary)" }}>
                    {profile.focus_duration_minutes} <span style={{ fontSize: "0.875rem", fontWeight: 500, color: "var(--text-secondary)" }}>minutes</span>
                  </div>
                </div>
                <div>
                  <div style={{ color: "var(--text-secondary)", fontSize: "0.8rem", marginBottom: 4 }}>BREAK DURATION</div>
                  <div style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--text-primary)" }}>
                    {profile.break_duration_minutes} <span style={{ fontSize: "0.875rem", fontWeight: 500, color: "var(--text-secondary)" }}>minutes</span>
                  </div>
                </div>
                <div>
                  <div style={{ color: "var(--text-secondary)", fontSize: "0.8rem", marginBottom: 4 }}>WORDS PER CHUNK</div>
                  <div style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--text-primary)" }}>
                    {profile.chunk_word_limit} <span style={{ fontSize: "0.875rem", fontWeight: 500, color: "var(--text-secondary)" }}>words limit</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Card 3: Accessibility Settings */}
            <div className="glass-card animate-slide-up" style={{ padding: 28, animationDelay: "0.1s" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: "rgba(244,114,182,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Palette size={18} color="#f472b6" />
                </div>
                <h2 style={{ fontSize: "1.1rem", fontWeight: 700, margin: 0 }}>Accessibility Prefs</h2>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {[
                  { label: "Font Family", value: profile.accessibility?.font_family || "Inter" },
                  { label: "Font Size", value: `${profile.accessibility?.font_size || 16}px` },
                  { label: "Line Spacing", value: `${profile.accessibility?.line_spacing || 1.8}×` },
                  { label: "Color Theme", value: profile.accessibility?.color_theme || "default" },
                  { label: "Dyslexia-friendly Font", value: profile.accessibility?.dyslexia_font ? "Enabled" : "Disabled" },
                  { label: "High Contrast Theme", value: profile.accessibility?.high_contrast ? "Enabled" : "Disabled" },
                ].map((row) => (
                  <div key={row.label} style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", padding: "6px 0", borderBottom: "1px solid var(--border)" }}>
                    <span style={{ color: "var(--text-secondary)" }}>{row.label}</span>
                    <span style={{ fontWeight: 600, textTransform: "capitalize" }}>{row.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}