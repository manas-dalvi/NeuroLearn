"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Brain, CheckCircle, ArrowRight, ArrowLeft, User, Focus, BookOpen, Palette } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";

const STEPS = [
  { id: 1, title: "About You", icon: User },
  { id: 2, title: "Focus Profile", icon: Focus },
  { id: 3, title: "Reading Level", icon: BookOpen },
  { id: 4, title: "Accessibility", icon: Palette },
];

const DIAGNOSES = [
  { id: "adhd", label: "ADHD / ADD", desc: "Attention deficit, hyperactivity" },
  { id: "dyslexia", label: "Dyslexia", desc: "Reading & processing differences" },
  { id: "autism", label: "Autism Spectrum", desc: "ASD / Asperger's" },
  { id: "dyscalculia", label: "Dyscalculia", desc: "Math processing differences" },
  { id: "multiple", label: "Multiple", desc: "More than one condition" },
  { id: "undiagnosed", label: "Self-identified", desc: "No formal diagnosis" },
];

export default function AssessmentWizard() {
  const router = useRouter();
  const { token } = useAuth();
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    diagnosis_type: "",
    focus_duration_minutes: 25,
    break_duration_minutes: 5,
    chunk_word_limit: 100,
    reading_level: "intermediate" as "beginner" | "intermediate" | "advanced",
    accessibility: {
      font_family: "Inter",
      font_size: 16,
      line_spacing: 1.8,
      color_theme: "dark" as "default" | "dark" | "sepia" | "high_contrast",
      dyslexia_font: false,
      high_contrast: false,
    },
  });

  const update = (patch: Partial<typeof form>) => setForm((p) => ({ ...p, ...patch }));
  const updateA11y = (patch: Partial<typeof form.accessibility>) =>
    setForm((p) => ({ ...p, accessibility: { ...p.accessibility, ...patch } }));

  const handleSubmit = async () => {
    setSaving(true);
    try {
      await api.createProfile(token ?? "demo", form);
      router.push("/dashboard");
    } catch {
      setSaving(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh", background: "var(--bg-primary)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: 24,
      }}
    >
      <div className="bg-animated">
        <div className="bg-orb bg-orb-1" />
        <div className="bg-orb bg-orb-2" />
      </div>

      <div style={{ width: "100%", maxWidth: 680 }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, marginBottom: 16 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: "linear-gradient(135deg, var(--accent), #f472b6)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Brain size={20} color="#fff" />
            </div>
            <span style={{ fontWeight: 800, fontSize: "1.3rem", fontFamily: "'Space Grotesk', sans-serif" }}>NLAP</span>
          </div>
          <h1 style={{ fontSize: "1.8rem", fontWeight: 800, marginBottom: 8, fontFamily: "'Space Grotesk', sans-serif" }}>
            Build Your <span className="gradient-text">Cognitive Profile</span>
          </h1>
          <p style={{ color: "var(--text-secondary)" }}>This helps us personalize every learning session for you.</p>
        </div>

        {/* Step Indicators */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 40 }}>
          {STEPS.map((s, i) => (
            <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div
                className={`wizard-step-circle ${step === s.id ? "active" : step > s.id ? "done" : ""}`}
                title={s.title}
              >
                {step > s.id ? <CheckCircle size={18} /> : <s.icon size={16} />}
              </div>
              {i < STEPS.length - 1 && (
                <div style={{ width: 48, height: 2, background: step > s.id ? "var(--accent)" : "var(--border)", borderRadius: 1, transition: "background 0.3s" }} />
              )}
            </div>
          ))}
        </div>

        {/* Step Content */}
        <div className="glass-card" style={{ padding: 40 }}>
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25 }}
            >
              {step === 1 && (
                <div>
                  <h2 style={{ fontWeight: 700, marginBottom: 8 }}>What describes you best?</h2>
                  <p style={{ color: "var(--text-secondary)", marginBottom: 28, fontSize: "0.9rem" }}>
                    Select all that apply. This shapes your content delivery style.
                  </p>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    {DIAGNOSES.map((d) => (
                      <button
                        key={d.id}
                        onClick={() => update({ diagnosis_type: d.id })}
                        style={{
                          textAlign: "left", padding: "16px 20px",
                          background: form.diagnosis_type === d.id ? "rgba(129,140,248,0.15)" : "var(--bg-secondary)",
                          border: `2px solid ${form.diagnosis_type === d.id ? "var(--accent)" : "var(--border)"}`,
                          borderRadius: 12, cursor: "pointer",
                          transition: "all 0.2s",
                          color: "var(--text-primary)",
                        }}
                      >
                        <div style={{ fontWeight: 600, marginBottom: 4 }}>{d.label}</div>
                        <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>{d.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {step === 2 && (
                <div>
                  <h2 style={{ fontWeight: 700, marginBottom: 8 }}>Your Focus Window</h2>
                  <p style={{ color: "var(--text-secondary)", marginBottom: 32, fontSize: "0.9rem" }}>
                    How long can you comfortably focus before needing a break?
                  </p>
                  <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
                        <label style={{ fontWeight: 600 }}>Focus Duration</label>
                        <span style={{ color: "var(--accent)", fontWeight: 700 }}>{form.focus_duration_minutes} min</span>
                      </div>
                      <input
                        type="range" min={5} max={90} step={5}
                        value={form.focus_duration_minutes}
                        onChange={(e) => update({ focus_duration_minutes: +e.target.value })}
                      />
                      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4, fontSize: "0.8rem", color: "var(--text-secondary)" }}>
                        <span>5 min</span><span>90 min</span>
                      </div>
                    </div>
                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
                        <label style={{ fontWeight: 600 }}>Break Duration</label>
                        <span style={{ color: "var(--accent)", fontWeight: 700 }}>{form.break_duration_minutes} min</span>
                      </div>
                      <input
                        type="range" min={1} max={30} step={1}
                        value={form.break_duration_minutes}
                        onChange={(e) => update({ break_duration_minutes: +e.target.value })}
                      />
                    </div>
                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
                        <label style={{ fontWeight: 600 }}>Words per Chunk</label>
                        <span style={{ color: "var(--accent)", fontWeight: 700 }}>{form.chunk_word_limit} words</span>
                      </div>
                      <input
                        type="range" min={30} max={300} step={10}
                        value={form.chunk_word_limit}
                        onChange={(e) => update({ chunk_word_limit: +e.target.value })}
                      />
                      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4, fontSize: "0.8rem", color: "var(--text-secondary)" }}>
                        <span>30 (short)</span><span>300 (long)</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {step === 3 && (
                <div>
                  <h2 style={{ fontWeight: 700, marginBottom: 8 }}>Reading Level</h2>
                  <p style={{ color: "var(--text-secondary)", marginBottom: 28, fontSize: "0.9rem" }}>
                    The AI will simplify content to match your preferred complexity.
                  </p>
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    {[
                      { id: "beginner", label: "Beginner", desc: "Simple sentences, everyday vocabulary, step-by-step explanations", color: "#34d399" },
                      { id: "intermediate", label: "Intermediate", desc: "Clear language with some technical terms when necessary", color: "#818cf8" },
                      { id: "advanced", label: "Advanced", desc: "Original complexity preserved, minimal simplification", color: "#f472b6" },
                    ].map((l) => (
                      <button
                        key={l.id}
                        onClick={() => update({ reading_level: l.id as "beginner" | "intermediate" | "advanced" })}
                        style={{
                          textAlign: "left", padding: "20px 24px",
                          background: form.reading_level === l.id ? `${l.color}12` : "var(--bg-secondary)",
                          border: `2px solid ${form.reading_level === l.id ? l.color : "var(--border)"}`,
                          borderRadius: 12, cursor: "pointer", transition: "all 0.2s",
                          color: "var(--text-primary)",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                          <div style={{ width: 10, height: 10, borderRadius: "50%", background: l.color, flexShrink: 0 }} />
                          <div>
                            <div style={{ fontWeight: 600, marginBottom: 3 }}>{l.label}</div>
                            <div style={{ fontSize: "0.82rem", color: "var(--text-secondary)" }}>{l.desc}</div>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {step === 4 && (
                <div>
                  <h2 style={{ fontWeight: 700, marginBottom: 8 }}>Accessibility Preferences</h2>
                  <p style={{ color: "var(--text-secondary)", marginBottom: 28, fontSize: "0.9rem" }}>
                    Fine-tune the reading experience for maximum comfort.
                  </p>
                  <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
                    <div>
                      <label style={{ fontWeight: 600, display: "block", marginBottom: 12 }}>Color Theme</label>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10 }}>
                        {[
                          { id: "dark", label: "Dark", bg: "#050508" },
                          { id: "default", label: "Indigo", bg: "#0f0f1a" },
                          { id: "sepia", label: "Sepia", bg: "#2c2015" },
                          { id: "high_contrast", label: "High Contrast", bg: "#000" },
                        ].map((t) => (
                          <button
                            key={t.id}
                            onClick={() => updateA11y({ color_theme: t.id as "dark" | "default" | "sepia" | "high_contrast" })}
                            style={{
                              padding: "12px 8px", borderRadius: 10,
                              background: t.bg,
                              border: `2px solid ${form.accessibility.color_theme === t.id ? "var(--accent)" : "var(--border)"}`,
                              cursor: "pointer", color: "#fff", fontSize: "0.78rem", fontWeight: 500,
                            }}
                          >
                            {t.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", background: "var(--bg-secondary)", borderRadius: 12, border: "1px solid var(--border)" }}>
                      <div>
                        <div style={{ fontWeight: 600, marginBottom: 2 }}>OpenDyslexic Font</div>
                        <div style={{ fontSize: "0.82rem", color: "var(--text-secondary)" }}>Specially designed for dyslexic readers</div>
                      </div>
                      <button
                        role="switch"
                        aria-checked={form.accessibility.dyslexia_font}
                        onClick={() => updateA11y({ dyslexia_font: !form.accessibility.dyslexia_font })}
                        style={{
                          width: 48, height: 26, borderRadius: 13,
                          background: form.accessibility.dyslexia_font ? "var(--accent)" : "var(--border)",
                          border: "none", cursor: "pointer", position: "relative", transition: "background 0.2s",
                        }}
                      >
                        <div style={{
                          position: "absolute", top: 3, width: 20, height: 20, borderRadius: "50%", background: "#fff",
                          left: form.accessibility.dyslexia_font ? 25 : 3, transition: "left 0.2s",
                        }} />
                      </button>
                    </div>

                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
                        <label style={{ fontWeight: 600 }}>Font Size</label>
                        <span style={{ color: "var(--accent)", fontWeight: 700 }}>{form.accessibility.font_size}px</span>
                      </div>
                      <input
                        type="range" min={12} max={28} step={1}
                        value={form.accessibility.font_size}
                        onChange={(e) => updateA11y({ font_size: +e.target.value })}
                      />
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Navigation */}
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 36 }}>
            <button
              className="btn-secondary"
              onClick={() => setStep((p) => p - 1)}
              disabled={step === 1}
              style={{ opacity: step === 1 ? 0.3 : 1, display: "flex", alignItems: "center", gap: 8 }}
            >
              <ArrowLeft size={16} /> Back
            </button>

            {step < STEPS.length ? (
              <button
                className="btn-primary"
                onClick={() => setStep((p) => p + 1)}
                style={{ display: "flex", alignItems: "center", gap: 8 }}
              >
                Next <ArrowRight size={16} />
              </button>
            ) : (
              <button
                className="btn-primary"
                onClick={handleSubmit}
                disabled={saving}
                style={{ display: "flex", alignItems: "center", gap: 8 }}
              >
                {saving ? "Saving..." : "Complete Setup"} {!saving && <CheckCircle size={16} />}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
