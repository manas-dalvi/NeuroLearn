"use client";
import { Suspense, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import FocusModeViewer from "@/components/focus/FocusModeViewer";
import PomodoroTimer from "@/components/focus/PomodoroTimer";
import Sidebar from "@/components/ui/Sidebar";
import AccessibilityPanel from "@/components/accessibility/AccessibilityPanel";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import { Focus, ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";

function FocusContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session") ?? "demo-session-001";
  const { token } = useAuth();

  const { data: profile } = useQuery({
    queryKey: ["profile"],
    queryFn: () => api.getProfile(token ?? "demo"),
    retry: false,
  });

  return (
    <div style={{ display: "flex", gap: 28, flex: 1, minWidth: 0 }}>
      {/* Main reading area */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 28 }}>
          <Link
            href="/dashboard"
            style={{ color: "var(--text-secondary)", display: "flex", alignItems: "center", gap: 6, fontSize: "0.875rem", textDecoration: "none" }}
          >
            <ArrowLeft size={16} /> Dashboard
          </Link>
          <span style={{ color: "var(--border)" }}>/</span>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Focus size={18} color="var(--accent)" />
            <span style={{ fontWeight: 700 }}>Focus Mode</span>
          </div>
        </div>

        <FocusModeViewer
          sessionId={sessionId}
          chunkWordLimit={profile?.chunk_word_limit ?? 80}
        />
      </div>

      {/* Right sidebar */}
      <div style={{ width: 280, flexShrink: 0, display: "flex", flexDirection: "column", gap: 18 }}>
        <PomodoroTimer
          sessionMinutes={profile?.focus_duration_minutes ?? 25}
          breakMinutes={profile?.break_duration_minutes ?? 5}
        />

        <div className="glass-card" style={{ padding: 20 }}>
          <h3 style={{ fontWeight: 700, fontSize: "0.9rem", marginBottom: 14 }}>Cognitive Profile</h3>
          {profile ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {[
                { label: "Condition", value: profile.diagnosis_type },
                { label: "Focus window", value: `${profile.focus_duration_minutes} min` },
                { label: "Break", value: `${profile.break_duration_minutes} min` },
                { label: "Reading level", value: profile.reading_level },
                { label: "Chunk size", value: `${profile.chunk_word_limit} words` },
              ].map((row) => (
                <div key={row.label} style={{ display: "flex", justifyContent: "space-between", fontSize: "0.82rem", padding: "6px 0", borderBottom: "1px solid var(--border)" }}>
                  <span style={{ color: "var(--text-secondary)" }}>{row.label}</span>
                  <span style={{ fontWeight: 600, textTransform: "capitalize" }}>{row.value}</span>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="skeleton" style={{ height: 16, borderRadius: 4 }} />
              ))}
              <Link href="/assessment" style={{ textDecoration: "none" }}>
                <button
                  style={{
                    marginTop: 8, width: "100%", padding: "9px", borderRadius: 8,
                    background: "rgba(129,140,248,0.1)", border: "1px solid rgba(129,140,248,0.25)",
                    color: "var(--accent)", fontSize: "0.82rem", fontWeight: 600, cursor: "pointer",
                  }}
                >
                  Set up your profile →
                </button>
              </Link>
            </div>
          )}
        </div>

        <div className="glass-card" style={{ padding: 18 }}>
          <h3 style={{ fontWeight: 700, fontSize: "0.85rem", marginBottom: 10 }}>Session Tips</h3>
          {[
            "✓ Read one chunk at a time",
            "✓ Mark done before moving on",
            "✓ Take breaks when the timer rings",
            "✓ Toggle simplified/original anytime",
          ].map((tip) => (
            <p key={tip} style={{ fontSize: "0.8rem", color: "var(--text-secondary)", margin: "0 0 6px" }}>{tip}</p>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function FocusPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.push("/auth/login");
  }, [loading, user, router]);

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: "var(--bg-primary)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Loader2 size={32} color="var(--accent)" style={{ animation: "spin 1s linear infinite" }} />
      </div>
    );
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--bg-primary)" }}>
      <div className="bg-animated">
        <div className="bg-orb bg-orb-1" style={{ opacity: 0.06 }} />
      </div>
      <Sidebar />
      <main style={{ flex: 1, padding: "32px 40px", overflowY: "auto", display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 20 }}>
          <AccessibilityPanel />
        </div>
        <Suspense
          fallback={
            <div style={{ display: "flex", alignItems: "center", gap: 10, color: "var(--text-secondary)" }}>
              <Loader2 size={18} style={{ animation: "spin 1s linear infinite" }} /> Loading session…
            </div>
          }
        >
          <FocusContent />
        </Suspense>
      </main>
    </div>
  );
}
