"use client";
import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, CheckCircle, Loader2, Sparkles, BookOpen, BarChart2 } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { useAccessibility } from "@/context/AccessibilityContext";
import { api, ContentChunk } from "@/lib/api";
import MarkdownRenderer from "@/components/MarkdownRenderer";

interface Props {
  sessionId: string;
  chunkWordLimit?: number;
}

const LEVEL_COLORS: Record<string, string> = {
  beginner: "#34d399",
  intermediate: "#818cf8",
  advanced: "#f472b6",
};

export default function FocusModeViewer({ sessionId, chunkWordLimit = 100 }: Props) {
  const { token } = useAuth();
  const { settings } = useAccessibility();
  const activeProfile = settings.activeProfile || "dyslexia";
  const [currentIndex, setCurrentIndex] = useState(0);
  const [completed, setCompleted] = useState<Set<number>>(new Set());
  const [showSimplified, setShowSimplified] = useState(true);
  const [customSimplified, setCustomSimplified] = useState<Record<number, string>>({});

  const { data, isLoading } = useQuery({
    queryKey: ["chunks", sessionId],
    queryFn: () => api.getChunks(token!, sessionId),
    enabled: !!token && !!sessionId,
  });

  const simplifyMutation = useMutation({
    mutationFn: (chunk: ContentChunk) =>
      api.simplifyChunk(token!, { 
        text: chunk.original_text, 
        level: chunk.level as "beginner" | "intermediate" | "advanced",
        profile_type: activeProfile
      }),
    onSuccess: (res) => {
      setCustomSimplified((prev) => ({
        ...prev,
        [currentIndex]: res.simplified,
      }));
    },
  });

  const chunks = data?.chunks ?? [];
  const chunk = chunks[currentIndex];

  const markComplete = useCallback(() => {
    setCompleted((prev) => new Set([...prev, currentIndex]));
    if (currentIndex < chunks.length - 1) {
      setCurrentIndex((i) => i + 1);
    }
  }, [currentIndex, chunks.length]);

  const progressPct = chunks.length > 0 ? (completed.size / chunks.length) * 100 : 0;

  if (isLoading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {[1, 2, 3].map((i) => (
          <div key={i} className="skeleton" style={{ height: 100, borderRadius: 16 }} />
        ))}
      </div>
    );
  }

  if (!chunk && chunks.length === 0) {
    return (
      <div className="glass-card" style={{ padding: 48, textAlign: "center" }}>
        <BookOpen size={48} color="var(--text-secondary)" style={{ marginBottom: 16 }} />
        <h3 style={{ color: "var(--text-secondary)", fontWeight: 500 }}>No content loaded yet</h3>
        <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem" }}>Upload content to start your focus session.</p>
      </div>
    );
  }

  const levelColor = LEVEL_COLORS[chunk?.level ?? "intermediate"];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Progress bar */}
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, fontSize: "0.85rem" }}>
          <span style={{ color: "var(--text-secondary)" }}>
            Chunk {currentIndex + 1} of {chunks.length}
          </span>
          <span style={{ color: "var(--accent)", fontWeight: 600 }}>{Math.round(progressPct)}% complete</span>
        </div>
        <div style={{ height: 6, background: "var(--bg-secondary)", borderRadius: 3, overflow: "hidden" }}>
          <motion.div
            style={{ height: "100%", background: "linear-gradient(90deg, var(--accent), #f472b6)", borderRadius: 3 }}
            animate={{ width: `${progressPct}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
        <div style={{ display: "flex", gap: 6, marginTop: 10, flexWrap: "wrap" }}>
          {chunks.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentIndex(i)}
              style={{
                width: 24, height: 8, borderRadius: 4, border: "none", cursor: "pointer",
                background: completed.has(i) ? "#34d399" : i === currentIndex ? "var(--accent)" : "var(--border)",
                transition: "background 0.2s",
              }}
              aria-label={`Go to chunk ${i + 1}`}
            />
          ))}
        </div>
      </div>

      {/* Chunk Card */}
      <AnimatePresence mode="wait">
        {chunk && (
          <motion.div
            key={chunk.id}
            className={`chunk-card ${completed.has(currentIndex) ? "completed" : currentIndex === currentIndex ? "active" : ""}`}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.28 }}
          >
            {/* Chunk header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <span
                  className="badge"
                  style={{ background: `${levelColor}15`, color: levelColor, border: `1px solid ${levelColor}30` }}
                >
                  {chunk.level}
                </span>
                <span style={{ color: "var(--text-secondary)", fontSize: "0.8rem" }}>
                  ~{chunk.word_count} words
                </span>
              </div>
              <button
                onClick={() => setShowSimplified((p) => !p)}
                style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.8rem", color: "var(--accent)", background: "none", border: "none", cursor: "pointer" }}
              >
                <BarChart2 size={14} />
                {showSimplified ? "Show Original" : "Show Simplified"}
              </button>
            </div>

            <div
              style={{
                fontSize: "var(--font-size-base, 1rem)",
                lineHeight: "var(--line-spacing, 1.8)",
                color: "var(--text-primary)",
                margin: 0,
                fontFamily: "var(--font-family)",
              }}
            >
              {showSimplified ? (
                <MarkdownRenderer content={customSimplified[currentIndex] || chunk.simplified_text} enableHighlighting={true} />
              ) : (
                chunk.original_text
              )}
            </div>

            {/* Re-simplify */}
            <div style={{ marginTop: 20, display: "flex", gap: 10 }}>
              <button
                onClick={() => simplifyMutation.mutate(chunk)}
                disabled={simplifyMutation.isPending}
                style={{
                  display: "flex", alignItems: "center", gap: 6,
                  fontSize: "0.82rem", color: "var(--accent)",
                  background: "rgba(129,140,248,0.08)", border: "1px solid rgba(129,140,248,0.2)",
                  borderRadius: 8, padding: "6px 14px", cursor: "pointer",
                }}
              >
                {simplifyMutation.isPending ? <Loader2 size={13} style={{ animation: "spin 1s linear infinite" }} /> : <Sparkles size={13} />}
                Re-simplify
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Navigation */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <button
          className="btn-secondary"
          onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
          disabled={currentIndex === 0}
          style={{ opacity: currentIndex === 0 ? 0.3 : 1, display: "flex", alignItems: "center", gap: 6, fontSize: "0.875rem" }}
        >
          <ChevronLeft size={16} /> Previous
        </button>

        <button
          className="btn-primary"
          onClick={markComplete}
          style={{ display: "flex", alignItems: "center", gap: 8 }}
        >
          {completed.has(currentIndex) ? (
            <><CheckCircle size={16} /> Done — Next</>
          ) : (
            <><CheckCircle size={16} /> Mark & Continue <ChevronRight size={16} /></>
          )}
        </button>
      </div>
    </div>
  );
}
