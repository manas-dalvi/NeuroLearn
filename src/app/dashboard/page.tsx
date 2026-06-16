"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Brain, TrendingUp, Clock, CheckCircle, Upload,
  BookOpen, Zap, ArrowRight, Loader2, Sparkles,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { api, LearningSession } from "@/lib/api";
import Sidebar from "@/components/ui/Sidebar";
import AccessibilityPanel from "@/components/accessibility/AccessibilityPanel";
import { useRouter } from "next/navigation";
import Link from "next/link";

function StatCard({
  label, value, sub, icon: Icon, color, delay: d,
}: {
  label: string; value: string; sub: string;
  icon: React.ElementType; color: string; delay: number;
}) {
  return (
    <motion.div
      className="glass-card"
      style={{ padding: 24 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: d, duration: 0.4 }}
      whileHover={{ y: -3, boxShadow: `0 12px 40px ${color}20` }}
    >
      <div
        style={{
          width: 44, height: 44, borderRadius: 12, marginBottom: 16,
          background: `${color}18`, border: `1px solid ${color}30`,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}
      >
        <Icon size={20} color={color} />
      </div>
      <div style={{ fontSize: "2rem", fontWeight: 800, fontFamily: "'Space Grotesk',sans-serif", marginBottom: 4 }}>
        {value}
      </div>
      <div style={{ fontWeight: 600, fontSize: "0.9rem", marginBottom: 2 }}>{label}</div>
      <div style={{ color: "var(--text-secondary)", fontSize: "0.8rem" }}>{sub}</div>
    </motion.div>
  );
}

export default function Dashboard() {
  const { token, user, loading: authLoading } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [uploadText, setUploadText] = useState("");
  const [uploadTitle, setUploadTitle] = useState("");
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [showDemoBanner, setShowDemoBanner] = useState(true);

  // Redirect if not logged in
  useEffect(() => {
    if (!authLoading && !user) router.push("/auth/login");
  }, [authLoading, user, router]);

  const { data: sessions = [], isLoading } = useQuery({
    queryKey: ["sessions"],
    queryFn: () => api.getSessions(token ?? "demo"),
    enabled: true,
  });

  const uploadMutation = useMutation({
    mutationFn: (data: { content_title: string; text: string }) =>
      api.createSession(token ?? "demo", data),
    onSuccess: (session: LearningSession) => {
      queryClient.invalidateQueries({ queryKey: ["sessions"] });
      router.push(`/focus?session=${session.id}`);
    },
  });

  const uploadPdfMutation = useMutation({
    mutationFn: (data: { content_title: string; file: File }) =>
      api.uploadPdf(token ?? "demo", data.file, data.content_title),

    onSuccess: (session: LearningSession) => {
      queryClient.invalidateQueries({ queryKey: ["sessions"] });
      router.push(`/focus?session=${session.id}`);
    },
  });
  
  const totalFocusMinutes = sessions.reduce((acc: number, s: LearningSession) => acc + s.total_focus_minutes, 0);
  const totalChunks = sessions.reduce((acc: number, s: LearningSession) => acc + s.completed_chunks, 0);
  const avgCompletion =
    sessions.length > 0
      ? sessions.reduce(
          (acc: number, s: LearningSession) =>
            acc + (s.chunks.length > 0 ? s.completed_chunks / s.chunks.length : 0.8),
          0
        ) /
        sessions.length *
        100
      : 0;

  if (authLoading) {
    return (
      <div style={{ minHeight: "100vh", background: "var(--bg-primary)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Loader2 size={32} color="var(--accent)" style={{ animation: "spin 1s linear infinite" }} />
      </div>
    );
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--bg-primary)" }}>
      <div className="bg-animated">
        <div className="bg-orb bg-orb-1" style={{ opacity: 0.07 }} />
        <div className="bg-orb bg-orb-2" style={{ opacity: 0.05 }} />
      </div>
      <Sidebar />

      <main style={{ flex: 1, padding: "32px 40px", overflowY: "auto" }}>
        {/* Demo Banner */}
        {showDemoBanner && (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              marginBottom: 24, padding: "12px 20px",
              background: "linear-gradient(135deg,rgba(129,140,248,0.12),rgba(167,139,250,0.08))",
              border: "1px solid rgba(129,140,248,0.25)", borderRadius: 12,
              display: "flex", alignItems: "center", justifyContent: "space-between",
              fontSize: "0.875rem",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Sparkles size={15} color="var(--accent)" />
              <span style={{ color: "var(--text-secondary)" }}>
                <strong style={{ color: "var(--accent)" }}>Demo Mode</strong> — All features work with mock AI. Add your{" "}
                <code style={{ background: "rgba(255,255,255,0.08)", padding: "1px 6px", borderRadius: 4 }}>OPENAI_API_KEY</code>{" "}
                to enable real GPT-4o chunking.
              </span>
            </div>
            <button
              onClick={() => setShowDemoBanner(false)}
              style={{ color: "var(--text-secondary)", background: "none", border: "none", cursor: "pointer", fontSize: "1rem" }}
              aria-label="Dismiss banner"
            >
              ×
            </button>
          </motion.div>
        )}

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32 }}>
          <div>
            <h1 style={{ fontSize: "1.8rem", fontWeight: 800, fontFamily: "'Space Grotesk',sans-serif", marginBottom: 4 }}>
              Welcome back, <span className="gradient-text">{user?.displayName?.split(" ")[0] || "Learner"}</span> 👋
            </h1>
            <p style={{ color: "var(--text-secondary)", margin: 0 }}>Your adaptive learning hub. Ready to focus?</p>
          </div>
          <AccessibilityPanel />
        </div>

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 18, marginBottom: 32 }}>
          <StatCard label="Focus Minutes" value={`${totalFocusMinutes}`} sub="Total logged" icon={Clock} color="#818cf8" delay={0} />
          <StatCard label="Chunks Mastered" value={`${totalChunks}`} sub="Content completed" icon={CheckCircle} color="#34d399" delay={0.05} />
          <StatCard label="Sessions" value={`${sessions.length}`} sub="Learning sessions" icon={BookOpen} color="#f472b6" delay={0.1} />
          <StatCard label="Avg Completion" value={`${Math.round(avgCompletion)}%`} sub="Per session" icon={TrendingUp} color="#fb923c" delay={0.15} />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 24, alignItems: "start" }}>
          {/* Upload Panel */}
          <motion.div
            className="glass-card"
            style={{ padding: 32 }}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 24 }}>
              <div style={{ width: 38, height: 38, borderRadius: 10, background: "rgba(129,140,248,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Upload size={18} color="var(--accent)" />
              </div>
              <div>
                <h2 style={{ fontWeight: 700, fontSize: "1.05rem", margin: 0, marginBottom: 2 }}>Start a New Focus Session</h2>
                <p style={{ color: "var(--text-secondary)", fontSize: "0.82rem", margin: 0 }}>
                  Paste any text — it will be chunked to your focus profile.
                </p>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <input
                id="content-title"
                className="input-field"
                placeholder="Session title (e.g. 'Chapter 3 — Photosynthesis')"
                value={uploadTitle}
                onChange={(e) => setUploadTitle(e.target.value)}
              />
              <textarea
                id="content-text"
                className="input-field"
                placeholder="Paste your text here. The AI will break it into personalized chunks based on your focus profile…"
                value={uploadText}
                onChange={(e) => setUploadText(e.target.value)}
                disabled={!!pdfFile}
                rows={9}
                style={{ resize: "vertical" }}
              />

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                  marginTop: 12,
                }}
              >
                <label
                  style={{
                    fontSize: "0.9rem",
                    fontWeight: 600,
                  }}
                >
                  Or Upload PDF
                </label>

                <input
                  type="file"
                  accept=".pdf"
                  onChange={(e) => {
                    const file = e.target.files?.[0] || null;
                    setPdfFile(file);

                    if (file && !uploadTitle.trim()) {
                      const nameWithoutExt = file.name.replace(/\.[^/.]+$/, "");
                      setUploadTitle(nameWithoutExt);
                    }
                  }}
                />

                {pdfFile && (
                  <button
                    type="button"
                    onClick={() => setPdfFile(null)}
                  >
                    Clear PDF
                  </button>
                )}
              </div>

              {/* Quick fill demo */}
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  onClick={() => {
                    setUploadTitle("Introduction to Photosynthesis");
                    setUploadText(
                      "Photosynthesis is the process by which green plants, algae, and certain bacteria convert light energy—usually from the sun—into chemical energy stored in glucose. This process takes place primarily in the chloroplasts of plant cells. The overall equation for photosynthesis is: 6CO₂ + 6H₂O + light energy → C₆H₁₂O₆ + 6O₂. This means six molecules of carbon dioxide and six molecules of water, using light energy, produce one molecule of glucose and six molecules of oxygen. Photosynthesis occurs in two main stages: the light-dependent reactions and the light-independent reactions (Calvin cycle). In the light-dependent reactions, chlorophyll absorbs light and uses its energy to split water molecules, releasing oxygen as a byproduct. The Calvin cycle, also known as the light-independent reactions or carbon fixation, takes place in the stroma of the chloroplast. Factors that affect the rate of photosynthesis include light intensity, carbon dioxide concentration, temperature, and water availability."
                    );
                  }}
                  style={{
                    fontSize: "0.78rem", color: "var(--accent)",
                    background: "rgba(129,140,248,0.08)", border: "1px solid rgba(129,140,248,0.2)",
                    borderRadius: 8, padding: "5px 12px", cursor: "pointer",
                  }}
                >
                  <Sparkles size={11} style={{ marginRight: 4, display: "inline" }} />
                  Load Demo Text
                </button>
              </div>

              <button
                id="start-session-btn"
                className="btn-primary"
                onClick={() =>
                  pdfFile
                    ? uploadPdfMutation.mutate({
                      content_title: uploadTitle,
                      file: pdfFile,
                    })
                  : uploadMutation.mutate({
                      content_title: uploadTitle,
                      text: uploadText,
                    })
                }
                disabled={
                  !uploadTitle.trim() ||
                  (!pdfFile && !uploadText.trim()) ||
                  uploadMutation.isPending ||
                  uploadPdfMutation.isPending
                }
                style={{ display: "flex", alignItems: "center", gap: 8, alignSelf: "flex-start" }}
              >
                {uploadMutation.isPending ? (
                  <>
                    <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} />
                    Chunking with AI…
                  </>
                ) : (
                  <>
                    <Zap size={16} /> Chunk &amp; Start Focusing <ArrowRight size={16} />
                  </>
                )}
              </button>
            </div>
          </motion.div>

          {/* Recent Sessions */}
          <motion.div
            className="glass-card"
            style={{ padding: 28 }}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
          >
            <h2 style={{ fontWeight: 700, fontSize: "1.05rem", marginBottom: 20 }}>Recent Sessions</h2>
            {isLoading ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {[1, 2, 3].map((i) => (
                  <div key={i} className="skeleton" style={{ height: 64, borderRadius: 10 }} />
                ))}
              </div>
            ) : sessions.length === 0 ? (
              <div style={{ textAlign: "center", padding: "32px 0" }}>
                <Brain size={36} color="var(--text-secondary)" style={{ marginBottom: 12 }} />
                <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem" }}>
                  No sessions yet. Start your first one!
                </p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {sessions.slice(0, 7).map((s: LearningSession) => {
                  const pct =
                      s.chunks.length > 0
                        ? Math.round(
                            (Math.min(s.completed_chunks, s.chunks.length) /
                              s.chunks.length) *
                              100
                          )
                        : s.completed_chunks > 0
                          ? 80
                          : 0;
                  return (
                    <motion.button
                      key={s.id}
                      whileHover={{ x: 4 }}
                      onClick={() => router.push(`/focus?session=${s.id}`)}
                      style={{
                        textAlign: "left", padding: "12px 14px", borderRadius: 10,
                        background: "var(--bg-secondary)", border: "1px solid var(--border)",
                        cursor: "pointer", width: "100%",
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                        <span style={{ fontWeight: 600, fontSize: "0.875rem" }}>{s.content_title}</span>
                        <span style={{ fontSize: "0.75rem", color: pct === 100 ? "#34d399" : "var(--accent)", fontWeight: 600 }}>
                          {pct}%
                        </span>
                      </div>
                      <div style={{ height: 4, background: "var(--border)", borderRadius: 2, overflow: "hidden" }}>
                        <div style={{ width: `${pct}%`, height: "100%", background: pct === 100 ? "#34d399" : "var(--accent)", borderRadius: 2, transition: "width 0.5s ease" }} />
                      </div>
                      <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginTop: 5 }}>
                        {s.completed_chunks} chunks done · {s.total_focus_minutes} min
                      </div>
                    </motion.button>
                  );
                })}
                <Link href="/focus?session=demo-session-001" style={{ textDecoration: "none" }}>
                  <button
                    style={{
                      width: "100%", padding: "10px", borderRadius: 10, marginTop: 4,
                      background: "rgba(129,140,248,0.06)", border: "1px dashed rgba(129,140,248,0.25)",
                      color: "var(--accent)", fontSize: "0.82rem", fontWeight: 600, cursor: "pointer",
                      display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                    }}
                  >
                    <Sparkles size={13} /> Open Demo Session
                  </button>
                </Link>
              </div>
            )}
          </motion.div>
        </div>
      </main>
    </div>
  );
}
