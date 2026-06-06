"use client";
import Link from "next/link";
import { motion } from "framer-motion";
import { Brain, Zap, Eye, Focus, ArrowRight, CheckCircle, Sparkles, Star } from "lucide-react";

const features = [
  {
    icon: Brain,
    title: "Cognitive Profiling",
    description: "Personalized assessment maps your unique learning style, focus capacity, and reading level.",
    color: "#818cf8",
  },
  {
    icon: Zap,
    title: "AI-Powered Chunking",
    description: "GPT-4o breaks complex content into digestible micro-chunks sized for your focus window.",
    color: "#f472b6",
  },
  {
    icon: Eye,
    title: "Simplification Engine",
    description: "Three-tier simplification (Beginner → Advanced) adapts text to your reading level instantly.",
    color: "#34d399",
  },
  {
    icon: Focus,
    title: "Focus Mode + Pomodoro",
    description: "Distraction-free reading with integrated Pomodoro timer tuned to your optimal focus duration.",
    color: "#fb923c",
  },
];

const stats = [
  { value: "3.2×", label: "Better retention" },
  { value: "68%", label: "Less cognitive load" },
  { value: "91%", label: "User satisfaction" },
  { value: "50+", label: "Accessibility options" },
];

export default function LandingPage() {
  return (
    <div style={{ background: "var(--bg-primary)", minHeight: "100vh", overflowX: "hidden" }}>
      {/* Animated background */}
      <div className="bg-animated">
        <div className="bg-orb bg-orb-1" />
        <div className="bg-orb bg-orb-2" />
        <div className="bg-orb bg-orb-3" />
      </div>

      {/* Nav */}
      <nav
        style={{
          position: "sticky", top: 0, zIndex: 50,
          background: "rgba(15,15,26,0.8)",
          backdropFilter: "blur(20px)",
          borderBottom: "1px solid var(--border)",
          padding: "16px 40px",
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{
            width: 38, height: 38, borderRadius: 10,
            background: "linear-gradient(135deg, var(--accent), #f472b6)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Brain size={20} color="#fff" />
          </div>
          <span style={{ fontWeight: 800, fontSize: "1.2rem", fontFamily: "'Space Grotesk', sans-serif" }}>
            NL<span className="gradient-text">AP</span>
          </span>
        </div>
        <div style={{ display: "flex", gap: 12 }}>
          <Link href="/auth/login">
            <button className="btn-secondary" style={{ padding: "9px 20px", fontSize: "0.875rem" }}>
              Sign In
            </button>
          </Link>
          <Link href="/auth/register">
            <button className="btn-primary" style={{ padding: "9px 20px", fontSize: "0.875rem" }}>
              Get Started Free
            </button>
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section style={{ padding: "100px 40px 80px", textAlign: "center", maxWidth: 900, margin: "0 auto" }}>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="badge badge-purple" style={{ display: "inline-flex", marginBottom: 24 }}>
            <Sparkles size={12} />
            AI-Powered Adaptive Learning
          </div>

          <h1
            style={{
              fontSize: "clamp(2.5rem, 6vw, 4.5rem)",
              fontWeight: 900,
              lineHeight: 1.1,
              marginBottom: 24,
              fontFamily: "'Space Grotesk', sans-serif",
            }}
          >
            Learning built for{" "}
            <span className="gradient-text">every mind</span>
          </h1>

          <p
            style={{
              fontSize: "1.2rem",
              color: "var(--text-secondary)",
              maxWidth: 640,
              margin: "0 auto 40px",
              lineHeight: 1.7,
            }}
          >
            NLAP uses GPT-4o to break down complex content into personalized, accessible chunks for ADHD, dyslexia, and autism spectrum learners. Your cognitive profile. Your pace.
          </p>

          <div style={{ display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap" }}>
            <Link href="/auth/register">
              <button className="btn-primary" style={{ fontSize: "1rem", padding: "14px 32px", display: "flex", alignItems: "center", gap: 8 }}>
                Start Learning Free <ArrowRight size={18} />
              </button>
            </Link>
            <Link href="/dashboard">
              <button className="btn-secondary" style={{ fontSize: "1rem", padding: "14px 32px" }}>
                View Demo
              </button>
            </Link>
          </div>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          style={{
            display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 24,
            marginTop: 80,
          }}
        >
          {stats.map((s) => (
            <div key={s.label} className="glass-card" style={{ padding: "24px 16px" }}>
              <div style={{ fontSize: "2rem", fontWeight: 800, color: "var(--accent)", fontFamily: "'Space Grotesk', sans-serif" }}>
                {s.value}
              </div>
              <div style={{ color: "var(--text-secondary)", fontSize: "0.875rem", marginTop: 4 }}>{s.label}</div>
            </div>
          ))}
        </motion.div>
      </section>

      {/* Features */}
      <section style={{ padding: "80px 40px", maxWidth: 1100, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 60 }}>
          <h2 style={{ fontSize: "2.2rem", fontWeight: 800, marginBottom: 12, fontFamily: "'Space Grotesk', sans-serif" }}>
            Built around <span className="gradient-text">your neurology</span>
          </h2>
          <p style={{ color: "var(--text-secondary)", fontSize: "1.05rem" }}>
            Every feature is researched and designed for neurodivergent learners.
          </p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 24 }}>
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              className="glass-card"
              style={{ padding: 32 }}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              viewport={{ once: true }}
              whileHover={{ y: -4, boxShadow: `0 20px 60px ${f.color}20` }}
            >
              <div
                style={{
                  width: 52, height: 52, borderRadius: 14,
                  background: `${f.color}20`,
                  border: `1px solid ${f.color}40`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  marginBottom: 20,
                }}
              >
                <f.icon size={24} color={f.color} />
              </div>
              <h3 style={{ fontWeight: 700, marginBottom: 10, fontSize: "1.05rem" }}>{f.title}</h3>
              <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", lineHeight: 1.65 }}>{f.description}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: "80px 40px", textAlign: "center" }}>
        <div
          className="glass-card"
          style={{
            maxWidth: 700, margin: "0 auto", padding: "60px 40px",
            background: "linear-gradient(135deg, rgba(129,140,248,0.08), rgba(244,114,182,0.05))",
            border: "1px solid rgba(129,140,248,0.2)",
          }}
        >
          <Star size={40} color="var(--accent)" style={{ marginBottom: 20 }} />
          <h2 style={{ fontSize: "2rem", fontWeight: 800, marginBottom: 16, fontFamily: "'Space Grotesk', sans-serif" }}>
            Ready to learn <span className="gradient-text">your way?</span>
          </h2>
          <p style={{ color: "var(--text-secondary)", marginBottom: 32 }}>
            Join thousands of neurodivergent learners who have transformed their study experience.
          </p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", marginBottom: 24 }}>
            {["No credit card", "WCAG 2.1 AA", "Privacy-first"].map((t) => (
              <div key={t} style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--text-secondary)", fontSize: "0.875rem" }}>
                <CheckCircle size={14} color="#34d399" /> {t}
              </div>
            ))}
          </div>
          <Link href="/auth/register">
            <button className="btn-primary" style={{ fontSize: "1.05rem", padding: "14px 36px", display: "inline-flex", alignItems: "center", gap: 8 }}>
              Create Free Account <ArrowRight size={18} />
            </button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ textAlign: "center", padding: "32px 40px", borderTop: "1px solid var(--border)", color: "var(--text-secondary)", fontSize: "0.875rem" }}>
        © 2025 NLAP. Built with ♿ accessibility at the core. WCAG 2.1 AA Compliant.
      </footer>
    </div>
  );
}
