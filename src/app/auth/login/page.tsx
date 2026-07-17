"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { Brain, Mail, Lock, Eye, EyeOff, ArrowRight, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function LoginPage() {
  const router = useRouter();
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError("");
    try {
      await signIn(email, password);
      router.push("/dashboard");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Invalid credentials");
    } finally {
      setLoading(false);
    }
  }; 

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-primary)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div className="bg-animated"><div className="bg-orb bg-orb-1" /><div className="bg-orb bg-orb-2" /></div>

      <motion.div
        className="glass-card"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ width: "100%", maxWidth: 440, padding: "44px 40px" }}
      >
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ width: 48, height: 48, borderRadius: 14, background: "linear-gradient(135deg,var(--accent),#f472b6)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
            <Brain size={24} color="#fff" />
          </div>
          <h1 style={{ fontWeight: 800, fontSize: "1.6rem", fontFamily: "'Space Grotesk',sans-serif", marginBottom: 6 }}>
            Welcome back
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>Sign in to your NLAP account</p>
        </div>
        
        {error && (
          <div style={{ padding: "12px 16px", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 10, marginBottom: 16, fontSize: "0.875rem", color: "#f87171" }}>
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <label style={{ display: "block", fontWeight: 600, fontSize: "0.875rem", marginBottom: 8 }}>Email</label>
            <div style={{ position: "relative" }}>
              <Mail size={16} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "var(--text-secondary)" }} />
              <input
                id="login-email"
                className="input-field"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={{ paddingLeft: 42 }}
              />
            </div>
          </div>
          <div>
            <label style={{ display: "block", fontWeight: 600, fontSize: "0.875rem", marginBottom: 8 }}>Password</label>
            <div style={{ position: "relative" }}>
              <Lock size={16} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "var(--text-secondary)" }} />
              <input
                id="login-password"
                className="input-field"
                type={showPw ? "text" : "password"}
                placeholder="Your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={{ paddingLeft: 42, paddingRight: 42 }}
              />
              <button
                type="button"
                onClick={() => setShowPw((p) => !p)}
                style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--text-secondary)" }}
                aria-label={showPw ? "Hide password" : "Show password"}
              >
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button
            id="login-submit"
            type="submit"
            className="btn-primary"
            disabled={loading}
            style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 4 }}
          >
            {loading ? <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> : <ArrowRight size={16} />}
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <p style={{ textAlign: "center", marginTop: 24, fontSize: "0.875rem", color: "var(--text-secondary)" }}>
          Don&apos;t have an account?{" "}
          <Link href="/auth/register" style={{ color: "var(--accent)", fontWeight: 600 }}>Create one free</Link>
        </p>
      </motion.div>
    </div>
  );
}
