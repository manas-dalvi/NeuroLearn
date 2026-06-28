"use client";
import { useAccessibility } from "@/context/AccessibilityContext";
import { Eye, Type, Moon, Zap, RotateCcw, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function AccessibilityPanel() {
  const { settings, update, reset } = useAccessibility();
  const [open, setOpen] = useState(false);

  return (
    <div style={{ position: "relative" }}>
      <button
        onClick={() => setOpen((p) => !p)}
        className="btn-secondary"
        style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "0.875rem", padding: "9px 16px" }}
        aria-expanded={open}
        aria-label="Accessibility settings"
      >
        <Eye size={16} />
        Accessibility
        {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.97 }}
            transition={{ duration: 0.2 }}
            className="glass-card"
            style={{
              position: "absolute", right: 0, top: "calc(100% + 8px)",
              width: 340, padding: 24, zIndex: 100,
              boxShadow: "0 20px 60px rgba(0,0,0,0.4)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <span style={{ fontWeight: 700, fontSize: "0.95rem" }}>Accessibility Settings</span>
              <button
                onClick={reset}
                style={{ display: "flex", alignItems: "center", gap: 4, fontSize: "0.75rem", color: "var(--text-secondary)", background: "none", border: "none", cursor: "pointer" }}
              >
                <RotateCcw size={12} /> Reset
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              {/* Theme */}
              <div>
                <label style={{ display: "flex", alignItems: "center", gap: 6, fontWeight: 600, fontSize: "0.85rem", marginBottom: 10 }}>
                  <Moon size={14} /> Color Theme
                </label>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 8 }}>
                  {[
                    { id: "dark", label: "Dark" },
                    { id: "default", label: "Indigo" },
                    { id: "sepia", label: "Sepia" },
                    { id: "high_contrast", label: "High Contrast" },
                  ].map((t) => (
                    <button
                      key={t.id}
                      onClick={() => update({ colorTheme: t.id as "dark" | "default" | "sepia" | "high_contrast" })}
                      style={{
                        padding: "8px 10px", borderRadius: 8, fontSize: "0.8rem", fontWeight: 500,
                        border: `1px solid ${settings.colorTheme === t.id ? "var(--accent)" : "var(--border)"}`,
                        background: settings.colorTheme === t.id ? "rgba(129,140,248,0.12)" : "var(--bg-secondary)",
                        color: settings.colorTheme === t.id ? "var(--accent)" : "var(--text-secondary)",
                        cursor: "pointer",
                      }}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Font size */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                  <label style={{ display: "flex", alignItems: "center", gap: 6, fontWeight: 600, fontSize: "0.85rem" }}>
                    <Type size={14} /> Font Size
                  </label>
                  <span style={{ color: "var(--accent)", fontSize: "0.82rem", fontWeight: 600 }}>{settings.fontSize}px</span>
                </div>
                <input
                  type="range" min={12} max={28} step={1}
                  value={settings.fontSize}
                  onChange={(e) => update({ fontSize: +e.target.value })}
                />
              </div>

              {/* Line spacing */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                  <label style={{ fontWeight: 600, fontSize: "0.85rem" }}>Line Spacing</label>
                  <span style={{ color: "var(--accent)", fontSize: "0.82rem", fontWeight: 600 }}>{settings.lineSpacing}×</span>
                </div>
                <input
                  type="range" min={1.2} max={3} step={0.1}
                  value={settings.lineSpacing}
                  onChange={(e) => update({ lineSpacing: +e.target.value })}
                />
              </div>

              {/* Toggles */}
              {[
                { key: "dyslexiaFont", label: "OpenDyslexic Font", icon: <Eye size={14} />, desc: "Specialized dyslexia font" },
                { key: "highContrast", label: "High Contrast", icon: <Zap size={14} />, desc: "Enhanced contrast ratios" },
                { key: "reduceMotion", label: "Reduce Motion", icon: <Zap size={14} />, desc: "Minimize animations" },
              ].map((t) => (
                <div
                  key={t.key}
                  style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    padding: "10px 14px", background: "var(--bg-secondary)", borderRadius: 10, border: "1px solid var(--border)",
                  }}
                >
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, fontWeight: 600, fontSize: "0.85rem" }}>
                      {t.icon} {t.label}
                    </div>
                    <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginTop: 2 }}>{t.desc}</div>
                  </div>
                  <button
                    role="switch"
                    aria-checked={settings[t.key as keyof typeof settings] as boolean}
                    onClick={() => update({ [t.key]: !settings[t.key as keyof typeof settings] })}
                    style={{
                      width: 42, height: 24, borderRadius: 12,
                      background: settings[t.key as keyof typeof settings] ? "var(--accent)" : "var(--border)",
                      border: "none", cursor: "pointer", position: "relative", transition: "background 0.2s", flexShrink: 0,
                    }}
                  >
                    <div style={{
                      position: "absolute", top: 3, width: 18, height: 18, borderRadius: "50%", background: "#fff",
                      left: settings[t.key as keyof typeof settings] ? 21 : 3, transition: "left 0.2s",
                    }} />
                  </button>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
