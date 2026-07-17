"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { Brain, Mail, Lock, User, Eye, EyeOff, ArrowRight, Loader2, CheckCircle } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function RegisterPage() {
  const router = useRouter();
  const { signUp } = useAuth();  
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password.length < 6) { setError("Password must be at least 6 characters"); return; }
    setLoading(true); setError("");
    try {
      await signUp(form.email, form.password, form.name);
      router.push("/assessment");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  };


  const perks = ["WCAG 2.1 AA accessible", "AI-powered chunking", "Pomodoro focus timer", "OpenDyslexic font support"];

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-primary)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div className="bg-animated"><div className="bg-orb bg-orb-1" /><div className="bg-orb bg-orb-3" /></div>

      <motion.div
        className="glass-card"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ width: "100%", maxWidth: 460, padding: "44px 40px" }}
      >
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{ width: 48, height: 48, borderRadius: 14, background: "linear-gradient(135deg,var(--accent),#f472b6)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
            <Brain size={24} color="#fff" />
          </div>
          <h1 style={{ fontWeight: 800, fontSize: "1.6rem", fontFamily: "'Space Grotesk',sans-serif", marginBottom: 6 }}>
            Start learning <span className="gradient-text">your way</span>
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem" }}>Free forever. No credit card required.</p>
        </div>

        {/* Perks */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 24 }}>
          {perks.map((p) => (
            <div key={p} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.78rem", color: "var(--text-secondary)" }}>
              <CheckCircle size={12} color="#34d399" /> {p}
            </div>
          ))}
        </div>

        {error && (
          <div style={{ padding: "12px 16px", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 10, marginBottom: 16, fontSize: "0.875rem", color: "#f87171" }}>
            {error}
          </div>
        )}

        <form onSubmit={handleRegister} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {[
            { id: "reg-name", key: "name", label: "Full Name", icon: User, type: "text", placeholder: "Your name" },
            { id: "reg-email", key: "email", label: "Email", icon: Mail, type: "email", placeholder: "you@example.com" },
          ].map((f) => (
            <div key={f.key}>
              <label style={{ display: "block", fontWeight: 600, fontSize: "0.875rem", marginBottom: 8 }}>{f.label}</label>
              <div style={{ position: "relative" }}>
                <f.icon size={16} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "var(--text-secondary)" }} />
                <input
                  id={f.id}
                  className="input-field"
                  type={f.type}
                  placeholder={f.placeholder}
                  value={form[f.key as keyof typeof form]}
                  onChange={(e) => setForm((p) => ({ ...p, [f.key]: e.target.value }))}
                  required
                  style={{ paddingLeft: 42 }}
                />
              </div>
            </div>
          ))}

          <div>
            <label style={{ display: "block", fontWeight: 600, fontSize: "0.875rem", marginBottom: 8 }}>Password</label>
            <div style={{ position: "relative" }}>
              <Lock size={16} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "var(--text-secondary)" }} />
              <input
                id="reg-password"
                className="input-field"
                type={showPw ? "text" : "password"}
                placeholder="Min. 6 characters"
                value={form.password}
                onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
                required
                style={{ paddingLeft: 42, paddingRight: 42 }}
              />
              <button type="button" onClick={() => setShowPw((p) => !p)}
                style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--text-secondary)" }}
                aria-label={showPw ? "Hide password" : "Show password"}
              >
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button id="reg-submit" type="submit" className="btn-primary" disabled={loading}
            style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 4 }}>
            {loading ? <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> : <ArrowRight size={16} />}
            {loading ? "Creating account..." : "Create Free Account"}
          </button>
        </form>

        <p style={{ textAlign: "center", marginTop: 24, fontSize: "0.875rem", color: "var(--text-secondary)" }}>
          Already have an account?{" "}
          <Link href="/auth/login" style={{ color: "var(--accent)", fontWeight: 600 }}>Sign in</Link>
        </p>
      </motion.div>
    </div>
  );
}
