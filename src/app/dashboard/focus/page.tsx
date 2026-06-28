"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Timer,
  Play,
  Pause,
  RotateCcw,
  ArrowLeft,
  BookOpen,
  Compass,
  Target,
  Award,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  Eye,
  CheckCircle,
  HelpCircle,
  Clock,
  Layers,
  Activity,
  Maximize2,
  Minimize2
} from "lucide-react";
import Link from "next/link";
import { useAccessibility } from "@/context/AccessibilityContext";
import { useAuth } from "@/context/AuthContext";
import { api, ContentChunk, LearningSession } from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";

function FocusPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { settings } = useAccessibility();
  const { token } = useAuth();
  const activeProfile = settings.activeProfile || "dyslexia";

  // State for session and chunks
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sessionTitle, setSessionTitle] = useState("Focus Reading Session");
  const [chunks, setChunks] = useState<ContentChunk[]>([]);
  const [currentChunkIdx, setCurrentChunkIdx] = useState(1);
  const [isSimplified, setIsSimplified] = useState(true);
  const [completedChunks, setCompletedChunks] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [xpEarned, setXpEarned] = useState(0);
  const [maxCompletedCount, setMaxCompletedCount] = useState(0);
  const initialCompletedCountRef = useRef(0);

  // Drawer collapsible state
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Dyslexia mode tools
  const [isHighlightActive, setIsHighlightActive] = useState(false);
  const [isRulerEnabled, setIsRulerEnabled] = useState(false);
  const [rulerY, setRulerY] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Set default targets based on active profile from global settings
  const focusTime = settings.focusDuration || (activeProfile === "autism" ? 30 : 25);
  const breakTime = settings.breakDuration || 5;

  // Focus Timer Pomodoro State
  const [timerSeconds, setTimerSeconds] = useState(focusTime * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [timerMode, setTimerMode] = useState<"FOCUS" | "BREAK">("FOCUS");

  // Elapsed time tracker for focus session records
  const focusStartRef = useRef<number>(Date.now());

  // Timer driven states
  const [hasStarted, setHasStarted] = useState(false);
  const [focusSessionId, setFocusSessionId] = useState<string | null>(null);
  const focusSessionIdRef = useRef<string | null>(null);
  const activeSecondsRef = useRef(0);

  const latestCompletedCountRef = useRef(0);

  const syncCompletedChunks = (count?: number) => {
    if (!token || !sessionId) return;
    const finalCount = count !== undefined ? count : Object.values(completedChunks).filter(Boolean).length;
    api.updateSession(token, sessionId, { completed_chunks: finalCount })
      .catch(err => console.error("Failed to sync completed chunks", err));
  };

  useEffect(() => {
    latestCompletedCountRef.current = Object.values(completedChunks).filter(Boolean).length;
  }, [completedChunks]);

  useEffect(() => {
    const currentCount = Object.values(completedChunks).filter(Boolean).length;
    if (currentCount > maxCompletedCount) {
      setMaxCompletedCount(currentCount);
    }
  }, [completedChunks, maxCompletedCount]);

  useEffect(() => {
    focusSessionIdRef.current = focusSessionId;
  }, [focusSessionId]);

  useEffect(() => {
    return () => {
      if (token && sessionId) {
        api.updateSession(token, sessionId, { completed_chunks: latestCompletedCountRef.current }).catch(() => {});

        // Complete the focus session on exit so focus-time XP is awarded
        if (focusSessionIdRef.current && activeSecondsRef.current > 0) {
          api.recordFocusSession(token, {
            session_id: sessionId,
            focus_session_id: focusSessionIdRef.current,
            mode: "FOCUS",
            duration_seconds: activeSecondsRef.current,
            completed: true,
          }).catch(() => {});
        }
      }
    };
  }, [token, sessionId]);

  // Load session chunks
  useEffect(() => {
    if (!token) return;

    const loadChunks = async () => {
      setLoading(true);
      try {
        let activeSessionId = searchParams.get("session_id");

        // Try localStorage if not in URL
        if (!activeSessionId) {
          const savedSessionId = localStorage.getItem("current_session_id");
          if (savedSessionId) {
            activeSessionId = savedSessionId;
          }
        }

        const sessions = await api.getSessions(token);

        // Fallback to first session if still empty
        if (!activeSessionId && sessions && sessions.length > 0) {
          activeSessionId = sessions[0].id;
        }

        if (activeSessionId) {
          setSessionId(activeSessionId);
          localStorage.setItem("current_session_id", activeSessionId);

          const currentSess = sessions.find(s => s.id === activeSessionId);
          if (currentSess) setSessionTitle(currentSess.content_title);

          const res = await api.getChunks(token, activeSessionId);
          setChunks(res.chunks || []);
          setCurrentChunkIdx(1);

          // Restore completed chunks progress based on completed_chunks count
          const completedCount = currentSess ? currentSess.completed_chunks : 0;
          initialCompletedCountRef.current = completedCount;
          setMaxCompletedCount(completedCount);
          const completedMap: Record<string, boolean> = {};
          if (completedCount > 0 && res.chunks) {
            for (let i = 0; i < Math.min(completedCount, res.chunks.length); i++) {
              completedMap[res.chunks[i].id] = true;
            }
          }
          setCompletedChunks(completedMap);
        }
      } catch (err) {
        console.error("Failed to load session chunks", err);
      } finally {
        setLoading(false);
      }
    };

    loadChunks();
  }, [searchParams, token]);

  useEffect(() => {
    // Re-initialize timer if active profile or settings change
    setIsRunning(false);
    setHasStarted(false);
    setFocusSessionId(null);
    activeSecondsRef.current = 0;
    localStorage.removeItem("active_focus_session");
    setTimerSeconds(focusTime * 60);
    setTimerMode("FOCUS");
  }, [activeProfile, focusTime]);

  const totalSeconds = timerMode === "FOCUS" ? focusTime * 60 : breakTime * 60;
  const progressPercent = (timerSeconds / totalSeconds) * 100;
  const circumference = 2 * Math.PI * 72; // radius = 72
  const strokeDashoffset = circumference * (1 - timerSeconds / totalSeconds);

  // Format seconds to MM:SS
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, "0");
    const s = (secs % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  // Recovery useEffect on mount
  useEffect(() => {
    if (!token || !sessionId || chunks.length === 0) return;

    const saved = localStorage.getItem("active_focus_session");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.sessionId === sessionId && parsed.focusSessionId) {
          const elapsed = Math.round((Date.now() - parsed.lastUpdated) / 1000);
          const remaining = parsed.timerSeconds - elapsed;

          if (remaining > 0) {
            setFocusSessionId(parsed.focusSessionId);
            setCompletedChunks(parsed.completedChunks || {});
            setTimerSeconds(remaining);
            setHasStarted(true);

            // Restore active seconds accumulation
            const totalTimerLength = focusTime * 60;
            activeSecondsRef.current = Math.max(0, totalTimerLength - remaining);
          } else {
            // Expired, clear it
            localStorage.removeItem("active_focus_session");
          }
        }
      } catch (e) {
        console.error("Failed to restore focus session state", e);
        localStorage.removeItem("active_focus_session");
      }
    }
  }, [token, sessionId, chunks.length]);

  const handleStartPause = () => {
    if (isRunning) {
      setIsRunning(false);
      syncCompletedChunks();

      // Save current state as paused in localStorage
      if (focusSessionId) {
        localStorage.setItem("active_focus_session", JSON.stringify({
          focusSessionId,
          sessionId,
          timerSeconds,
          isRunning: false,
          lastUpdated: Date.now(),
          completedChunks
        }));
      }
    } else {
      setIsRunning(true);
      if (!focusSessionId) {
        setHasStarted(true);
        if (token && sessionId && timerMode === "FOCUS") {
          api.recordFocusSession(token, {
            session_id: sessionId,
            mode: "FOCUS",
            duration_seconds: 0,
            completed: false
          }).then(res => {
            if (res.focus_session_id) {
              setFocusSessionId(res.focus_session_id);
              localStorage.setItem("active_focus_session", JSON.stringify({
                focusSessionId: res.focus_session_id,
                sessionId: sessionId,
                timerSeconds: timerSeconds,
                isRunning: true,
                lastUpdated: Date.now(),
                completedChunks: completedChunks
              }));
            }
          });
        }
      } else {
        // Resume session
        if (focusSessionId) {
          localStorage.setItem("active_focus_session", JSON.stringify({
            focusSessionId,
            sessionId,
            timerSeconds,
            isRunning: true,
            lastUpdated: Date.now(),
            completedChunks
          }));
        }
      }

      focusStartRef.current = Date.now();
    }
  };

  const handleReset = () => {
    setIsRunning(false);
    setHasStarted(false);
    setFocusSessionId(null);
    activeSecondsRef.current = 0;
    localStorage.removeItem("active_focus_session");
    setTimerSeconds(timerMode === "FOCUS" ? focusTime * 60 : breakTime * 60);
    syncCompletedChunks();
  };

  // 1. Ticking Clock Effect
  useEffect(() => {
    if (!isRunning) return;

    const interval = setInterval(() => {
      setTimerSeconds((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning]);

  // 2. Timer Tick Handler Effect (Handles completion, 60s updates, localStorage saves)
  useEffect(() => {
    if (!isRunning) return;

    // Handle timer completion
    if (timerSeconds <= 0) {
      setIsRunning(false);

      if (token && sessionId && timerMode === "FOCUS") {
        const currentChunk = chunks[currentChunkIdx - 1];
        const isChunkCompleted = currentChunk ? completedChunks[currentChunk.id] : false;

        api.recordFocusSession(token, {
          session_id: sessionId,
          focus_session_id: focusSessionId || undefined,
          mode: timerMode,
          duration_seconds: activeSecondsRef.current + 1,
          completed: true,
          chunk_id: isChunkCompleted ? currentChunk.id : undefined
        }).then(res => {
          if (res.xp_earned) setXpEarned(x => x + res.xp_earned);
          syncCompletedChunks();
          router.refresh();
        });
      }

      localStorage.removeItem("active_focus_session");
      setFocusSessionId(null);
      activeSecondsRef.current = 0;

      const nextMode = timerMode === "FOCUS" ? "BREAK" : "FOCUS";
      setTimerMode(nextMode);
      setTimerSeconds(nextMode === "FOCUS" ? focusTime * 60 : breakTime * 60);
      return;
    }

    // Normal tick side-effects during FOCUS mode
    if (timerMode === "FOCUS") {
      activeSecondsRef.current += 1;

      if (focusSessionId) {
        localStorage.setItem("active_focus_session", JSON.stringify({
          focusSessionId,
          sessionId,
          timerSeconds,
          isRunning: true,
          lastUpdated: Date.now(),
          completedChunks
        }));
      }

      // Every 60 seconds, send progress update to backend
      if (activeSecondsRef.current > 0 && activeSecondsRef.current % 60 === 0) {
        if (token && sessionId) {
          api.recordFocusSession(token, {
            session_id: sessionId,
            focus_session_id: focusSessionId || undefined,
            mode: "FOCUS",
            duration_seconds: activeSecondsRef.current,
            completed: false
          }).then(res => {
            if (res.xp_earned) setXpEarned(x => x + res.xp_earned);
            syncCompletedChunks();
          });
        }
      }
    }
  }, [timerSeconds, isRunning, timerMode, focusSessionId, completedChunks, currentChunkIdx, token, sessionId, chunks]);

  const currentChunk = chunks[currentChunkIdx - 1];

  const toggleChunkComplete = () => {
    if (!currentChunk || !hasStarted) return;

    const chunkKey = currentChunk.id;
    const isNowCompleted = !completedChunks[chunkKey];

    // Toggle local checklist state
    const newCompletedMap = {
      ...completedChunks,
      [chunkKey]: isNowCompleted
    };
    setCompletedChunks(newCompletedMap);

    if (focusSessionId) {
      localStorage.setItem("active_focus_session", JSON.stringify({
        focusSessionId,
        sessionId,
        timerSeconds,
        isRunning,
        lastUpdated: Date.now(),
        completedChunks: newCompletedMap
      }));
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isRulerEnabled || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    setRulerY(e.clientY - rect.top);
  };

  // Helper to wrap keywords in highlighting span for Dyslexia Mode
  const highlightText = (text: string) => {
    if (!isHighlightActive) return <span>{text}</span>;
    const keywords = [
      "Hierarchical Temporal Memory", "HTM", "neocortex", "SDRs",
      "Sparse Distributed Representations", "neurons", "predictions", "learning", "brain",
      "patterns", "predictive", "sparsity", "photosynthesis", "glucose", "chloroplasts", "oxygen"
    ];
    let highlighted = text;
    keywords.forEach(kw => {
      const regex = new RegExp(`\\b(${kw})\\b`, "gi");
      highlighted = highlighted.replace(regex, `<span class="important-word-highlight">$1</span>`);
    });
    return <span dangerouslySetInnerHTML={{ __html: highlighted }} />;
  };

  // Dynamically extract key concepts from the simplified text output
  const getKeyPoints = (chunk: ContentChunk | undefined) => {
    if (!chunk) return [];
    // If text has bullet items, parse them
    const matches = chunk.simplified_text.match(/(?:^|\n)[•\-*]\s*(.+)/g);
    if (matches) {
      return matches.map(m => m.replace(/^[\n•\-*\s]+/g, "").trim());
    }
    // Fallback: split by sentence
    return chunk.simplified_text
      .split(/(?<=[.!?])\s+/)
      .map(s => s.trim())
      .filter(s => s.length > 8)
      .slice(0, 3);
  };

  const getVocab = (chunk: ContentChunk | undefined) => {
    if (!chunk) return [];
    // Extract bolded text terms
    const matches = chunk.simplified_text.match(/\*\*(.*?)\*\*/g);
    if (matches && matches.length > 0) {
      return matches.map(m => m.replace(/\*\*/g, "") + ": Key concept in this section.");
    }
    return [
      "Process: Sequential logical actions.",
      "Concept: Abstract structural idea."
    ];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px] text-[var(--text-secondary)] font-semibold gap-2">
        <div className="w-5 h-5 rounded-full border-2 border-[var(--accent)] border-t-transparent animate-spin" />
        <span>Loading focus session...</span>
      </div>
    );
  }

  if (chunks.length === 0) {
    return (
      <div className="space-y-6 max-w-[1200px] mx-auto pb-16 text-center">
        <div className="bg-[var(--bg-card)] border border-[var(--border)] p-12 rounded-2xl shadow-sm space-y-4 max-w-lg mx-auto">
          <BookOpen size={48} className="text-[var(--text-secondary)] mx-auto" />
          <h2 className="text-xl font-bold">No Reading Content Selected</h2>
          <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
            Please open a reading document from the dashboard or upload material in the AI Simplifier to start focused study.
          </p>
          <Link href="/dashboard/simplifier" className="block pt-2">
            <button className="bg-[var(--accent)] text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-sm hover:opacity-90">
              Go to AI Simplifier
            </button>
          </Link>
        </div>
      </div>
    );
  }

  const completedCount = Object.values(completedChunks).filter(Boolean).length;
  const remainingCount = chunks.length - completedCount;

  // Calculate session chunk XP dynamically (50 XP per chunk completed this session)
  const sessionChunkXp = Math.max(0, maxCompletedCount - initialCompletedCountRef.current) * 50;
  const totalSessionXp = xpEarned + sessionChunkXp;

  return (
    <div
      className="space-y-6 max-w-[1200px] mx-auto pb-16 animate-fade-in text-[var(--text-primary)] relative"
      ref={containerRef}
      onMouseMove={handleMouseMove}
    >
      {/* Dyslexia reading ruler overlay */}
      {isRulerEnabled && (
        <div
          className="reading-ruler absolute left-0 right-0 pointer-events-none z-10"
          style={{ top: `${rulerY}px` }}
        />
      )}

      {/* Page Breadcrumb Header */}
      <div className="flex items-center gap-2 pb-2 border-b border-[var(--border)]">
        <Link
          href="/dashboard"
          className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] flex items-center gap-1 text-xs font-semibold transition-colors"
        >
          <ArrowLeft size={14} />
          <span>Dashboard</span>
        </Link>
        <span className="text-[var(--border)]">/</span>
        <span className="text-xs font-bold text-[var(--text-secondary)]">Focus Mode</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-10 gap-6 items-start">

        {/* Left Section (70% column span) */}
        <section className="lg:col-span-7 space-y-6 flex flex-col">

          {/* Source Header Card */}
          <div className="bg-[var(--bg-card)] p-5 rounded-2xl border border-[var(--border)] shadow-sm space-y-2 text-left">
            <div className="flex justify-between items-start flex-wrap gap-2">
              <div>
                <span className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest block">Source Content Panel</span>
                <h1 className="text-lg font-bold text-[var(--text-primary)] tracking-tight">{sessionTitle}</h1>
              </div>
              <div className="flex bg-[var(--bg-secondary)]/50 p-1 rounded-xl shadow-inner text-xs font-bold border border-[var(--border)]">
                <button
                  onClick={() => setIsSimplified(false)}
                  className={`px-3 py-1.5 rounded-lg transition-all ${!isSimplified ? "bg-[var(--bg-card)] text-[var(--accent)] shadow-sm" : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"}`}
                >
                  Original
                </button>
                <button
                  onClick={() => setIsSimplified(true)}
                  className={`px-3 py-1.5 rounded-lg transition-all ${isSimplified ? "bg-[var(--bg-card)] text-[var(--accent)] shadow-sm" : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"}`}
                >
                  Simplified
                </button>
              </div>
            </div>

            {/* Profile specific tools (Ruler/Highlighter controls for Dyslexia Mode) */}
            {activeProfile === "dyslexia" && (
              <div className="flex gap-3 pt-2 border-t border-[var(--border)]">
                <button
                  onClick={() => setIsRulerEnabled(!isRulerEnabled)}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-bold border transition-all flex items-center gap-1.5
                    ${isRulerEnabled
                      ? "bg-[var(--accent)] text-white border-[var(--accent)]"
                      : "bg-[var(--bg-secondary)]/30 text-[var(--text-secondary)] border-[var(--border)] hover:bg-[var(--bg-secondary)]/70"
                    }
                  `}
                >
                  <Layers size={12} />
                  <span>{isRulerEnabled ? "Disable Reading Ruler" : "Enable Reading Ruler"}</span>
                </button>
                <button
                  onClick={() => setIsHighlightActive(!isHighlightActive)}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-bold border transition-all flex items-center gap-1.5
                    ${isHighlightActive
                      ? "bg-[var(--accent)] text-white border-[var(--accent)]"
                      : "bg-[var(--bg-secondary)]/30 text-[var(--text-secondary)] border-[var(--border)] hover:bg-[var(--bg-secondary)]/70"
                    }
                  `}
                >
                  <Sparkles size={12} />
                  <span>{isHighlightActive ? "Disable Word Highlight" : "Highlight Important Words"}</span>
                </button>
              </div>
            )}

            <p className="text-[10px] text-[var(--text-secondary)] font-semibold leading-relaxed pt-1">
              Active profile parameters: <span className="font-bold uppercase text-[var(--accent)]">{activeProfile}</span> • Word limit: <span className="font-bold">{settings.chunkWordLimit || 80} words</span>
            </p>
          </div>

          {/* Reading Canvas */}
          <div className="bg-[var(--bg-card)] p-6 md:p-8 rounded-2xl border border-[var(--border)] shadow-sm space-y-6 text-left relative overflow-hidden">
            <div className="flex justify-between items-center pb-4 border-b border-[var(--border)]">
              <div className="space-y-0.5">
                <span className="text-[10px] font-extrabold text-[var(--accent)] uppercase tracking-wider">Chunk {currentChunkIdx} of {chunks.length}</span>
                <h3 className="text-base font-bold text-[var(--text-primary)]">Reading Segment</h3>
              </div>
              <span className="text-[10px] font-bold text-[var(--text-secondary)] bg-[var(--bg-secondary)]/50 px-2 py-0.5 rounded border border-[var(--border)]">
                {currentChunk?.word_count ?? 0} words
              </span>
            </div>

            {/* Chunk Body View (Adaptive Layouts) */}
            <div className="min-h-[160px] flex items-center py-2">
              <div className={`w-full transition-all duration-300 leading-loose
                ${activeProfile === "dyslexia" ? "font-serif text-lg leading-loose tracking-wider max-w-[65ch] mx-auto text-justify" : "text-[var(--text-primary)] text-sm font-semibold"}
              `}>
                {currentChunk ? (
                  isSimplified ? (
                    <>
                      {activeProfile === "autism" ? (
                        <div className="space-y-4">
                          <span className="text-[10px] font-black text-[var(--accent)] bg-[var(--accent-glow)] border border-[var(--accent)]/20 px-1.5 py-0.5 rounded block w-fit mb-2">Autism Step-by-Step Outline</span>
                          <div className="grid grid-cols-1 gap-3">
                            {getKeyPoints(currentChunk).map((point, idx) => (
                              <div key={idx} className="flex gap-3 items-start p-4 bg-[var(--bg-secondary)]/10 border border-[var(--border)] rounded-xl">
                                <span className="w-6 h-6 rounded-full bg-[var(--accent)] text-white flex items-center justify-center font-bold text-xs flex-shrink-0">
                                  {idx + 1}
                                </span>
                                <p className="text-sm font-semibold text-[var(--text-primary)] leading-normal">{point}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : activeProfile === "adhd" ? (
                        <div className="border-l-4 border-[var(--accent-secondary)] bg-[var(--accent-glow)] p-5 rounded-r-xl shadow-inner relative">
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-[10px] font-black text-[var(--accent-secondary)] uppercase tracking-widest">Active Focus Indicator</span>
                            <span className="animate-pulse w-2.5 h-2.5 rounded-full bg-[var(--accent-secondary)] shadow-sm" />
                          </div>
                          <p className="font-bold text-[var(--text-primary)] leading-relaxed text-base">{currentChunk.simplified_text}</p>
                        </div>
                      ) : (
                        <p className="text-[var(--text-primary)] leading-loose">{highlightText(currentChunk.simplified_text)}</p>
                      )}
                    </>
                  ) : (
                    <p className="leading-relaxed text-[var(--text-secondary)]">{highlightText(currentChunk.original_text)}</p>
                  )
                ) : (
                  <p className="text-[var(--text-secondary)] italic">Chunk could not be loaded.</p>
                )}
              </div>
            </div>

            {/* Bottom Actions Row */}
            <div className="flex justify-between items-center border-t border-[var(--border)] pt-5 flex-wrap gap-4">

              {/* Mark Complete Checkbox */}
              <button
                disabled={!hasStarted}
                onClick={toggleChunkComplete}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all border
                  ${!hasStarted
                    ? "opacity-50 cursor-not-allowed bg-[var(--bg-secondary)]/10 border-[var(--border)] text-[var(--text-secondary)]/50"
                    : currentChunk && completedChunks[currentChunk.id]
                      ? "bg-emerald-50 border-emerald-200 text-emerald-700 shadow-inner"
                      : "bg-[var(--bg-secondary)]/30 border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]/60"
                  }
                `}
              >
                <CheckCircle size={14} className={currentChunk && completedChunks[currentChunk.id] ? "fill-emerald-500 text-white" : ""} />
                <span>{(currentChunk && completedChunks[currentChunk.id]) ? "Chunk Complete!" : "Mark as Read"}</span>
              </button>

              {/* Progress dots & Previous/Next Navigation controls */}
              <div className="flex items-center gap-4">
                <button
                  disabled={currentChunkIdx <= 1}
                  onClick={() => {
                    setCurrentChunkIdx(prev => Math.max(1, prev - 1));
                    focusStartRef.current = Date.now();
                    syncCompletedChunks();
                  }}
                  className="p-1.5 rounded-lg border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] disabled:opacity-30 disabled:pointer-events-none transition-colors"
                >
                  <ChevronLeft size={16} />
                </button>
                <div className="flex gap-1.5">
                  {chunks.map((c, i) => (
                    <span
                      key={c.id}
                      className={`w-2 h-2 rounded-full transition-colors
                        ${currentChunkIdx === i + 1
                          ? "bg-[var(--accent)]"
                          : completedChunks[c.id]
                            ? "bg-emerald-400"
                            : "bg-[var(--border)]"
                        }
                      `}
                    />
                  ))}
                </div>
                <button
                  disabled={currentChunkIdx >= chunks.length}
                  onClick={() => {
                    setCurrentChunkIdx(prev => Math.min(chunks.length, prev + 1));
                    focusStartRef.current = Date.now();
                    syncCompletedChunks();
                  }}
                  className="p-1.5 rounded-lg border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] disabled:opacity-30 disabled:pointer-events-none transition-colors"
                >
                  <ChevronRight size={16} />
                </button>
              </div>

            </div>

          </div>

          {/* AI Simplification Drawer Toggle */}
          <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl shadow-sm overflow-hidden text-left">
            <button
              onClick={() => setIsDrawerOpen(!isDrawerOpen)}
              className="w-full p-4 flex justify-between items-center font-bold text-sm text-[var(--accent)] hover:bg-[var(--bg-secondary)]/50 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Sparkles size={16} />
                <span>View AI Simplification Drawer</span>
              </div>
              <span className="text-xs font-bold text-[var(--text-secondary)]">
                {isDrawerOpen ? "Hide Details" : "Show Details"}
              </span>
            </button>

            <AnimatePresence initial={false}>
              {isDrawerOpen && currentChunk && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25 }}
                  className="border-t border-[var(--border)] bg-[var(--bg-secondary)]/10 p-6 space-y-6"
                >
                  {/* Original Content panel */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-black text-[var(--text-secondary)] uppercase tracking-widest">Original Content</h4>
                    <p className="text-xs text-[var(--text-secondary)] font-semibold leading-relaxed p-4 bg-[var(--bg-card)] border border-[var(--border)] rounded-xl italic">
                      "{currentChunk.original_text}"
                    </p>
                  </div>

                  {/* AI Transformation panel */}
                  <div className="space-y-4">
                    <h4 className="text-xs font-black text-[var(--text-secondary)] uppercase tracking-widest">AI Transformation</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                      {/* Key points extracted */}
                      <div className="bg-[var(--bg-card)] p-4 rounded-xl border border-[var(--border)] space-y-2">
                        <span className="text-[10px] font-bold text-[var(--accent)] block uppercase tracking-wider">Key Takeaways</span>
                        <ul className="list-disc pl-4 space-y-1.5 text-[11px] text-[var(--text-secondary)] font-semibold leading-relaxed">
                          {getKeyPoints(currentChunk).map((p, idx) => (
                            <li key={idx}>{p}</li>
                          ))}
                        </ul>
                      </div>

                      {/* Vocabulary defined */}
                      <div className="bg-[var(--bg-card)] p-4 rounded-xl border border-[var(--border)] space-y-2">
                        <span className="text-[10px] font-bold text-[var(--accent)] block uppercase tracking-wider">Vocabulary Support</span>
                        <ul className="space-y-1.5 text-[11px] text-[var(--text-secondary)] font-semibold leading-relaxed">
                          {getVocab(currentChunk).map((v, idx) => (
                            <li key={idx} className="flex gap-2">
                              <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] mt-1.5 flex-shrink-0" />
                              <span>{v}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                    </div>
                  </div>

                  {/* Why this chunk was created logic block */}
                  <div className="p-4 bg-[var(--accent-glow)] border border-[var(--accent)]/20 rounded-xl flex gap-3">
                    <Eye size={18} className="text-[var(--accent)] flex-shrink-0" />
                    <div className="space-y-1">
                      <span className="text-[10px] font-black text-[var(--accent)] uppercase tracking-wider block">Why this chunk was created</span>
                      <p className="text-xs text-[var(--accent)] font-bold leading-normal italic">
                        {activeProfile === "dyslexia" && "This content uses larger line spacing and OpenDyslexic characters because your Dyslexia profile is active."}
                        {activeProfile === "adhd" && "This content was divided into smaller sections because your ADHD profile uses shorter focus blocks."}
                        {activeProfile === "autism" && "This content was converted into step-by-step layout blocks because your Autism profile is active."}
                      </p>
                    </div>
                  </div>

                </motion.div>
              )}
            </AnimatePresence>
          </div>

        </section>

        {/* Right Sidebar Widget Stack (30% column span) */}
        <section className="lg:col-span-3 space-y-6 flex flex-col">

          {/* Pomodoro Timer */}
          <div className="bg-[var(--bg-card)] p-5 rounded-2xl border border-[var(--border)] shadow-sm flex flex-col items-center text-center">
            <div className="w-full flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold text-[var(--text-primary)] flex items-center gap-1.5">
                <Timer size={16} className="text-[var(--accent)]" />
                Focus Timer
              </h3>
              <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider
                ${timerMode === "FOCUS" ? "bg-[var(--accent-glow)] text-[var(--accent)] border border-[var(--accent)]/10" : "bg-orange-100 text-orange-700"}
              `}>
                {timerMode}
              </span>
            </div>

            {/* Circular Timer Visual */}
            <div className="relative w-36 h-36 my-3 flex items-center justify-center select-none">
              <svg className="w-full h-full -rotate-90">
                <circle cx="72" cy="72" r="64" fill="transparent" stroke="var(--bg-secondary)" strokeWidth="6" />
                <circle
                  cx="72" cy="72" r="64" fill="transparent"
                  stroke={timerMode === "FOCUS" ? "var(--accent)" : "#F59E0B"}
                  strokeWidth="6"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  className="transition-all duration-1000"
                />
              </svg>
              <div className="absolute flex flex-col items-center justify-center">
                <span className="text-2xl font-black text-[var(--text-primary)] tracking-tight">{formatTime(timerSeconds)}</span>
                <span className="text-[8px] font-bold text-[var(--text-secondary)] uppercase tracking-widest mt-0.5">Remaining</span>
              </div>
            </div>

            {/* Timer Controllers */}
            <div className="flex gap-2 w-full mt-2">
              <button
                onClick={handleStartPause}
                className="flex-grow py-2.5 bg-[var(--accent)] hover:bg-[var(--accent)]/90 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5"
              >
                {isRunning ? <Pause size={12} fill="white" /> : <Play size={12} fill="white" />}
                <span>{isRunning ? "Pause" : "Start"}</span>
              </button>
              <button
                onClick={handleReset}
                className="p-2.5 bg-[var(--bg-secondary)]/30 border border-[var(--border)] hover:bg-[var(--bg-secondary)]/70 text-[var(--text-secondary)] rounded-xl transition-all"
              >
                <RotateCcw size={12} />
              </button>
            </div>

            {/* Details */}
            <div className="w-full flex justify-between pt-4 mt-4 border-t border-[var(--border)] text-[10px] font-bold text-[var(--text-secondary)]">
              <span>Focus: {focusTime}m</span>
              <span>•</span>
              <span>Break: {breakTime}m</span>
            </div>
          </div>

          {/* Session Progress Card */}
          <div className="bg-[var(--bg-card)] p-5 rounded-2xl border border-[var(--border)] shadow-sm text-left space-y-4">
            <h3 className="text-xs font-bold text-[var(--text-primary)] flex items-center gap-1.5 pb-2 border-b border-[var(--border)]">
              <Target size={14} className="text-[var(--accent)]" />
              Session Progress
            </h3>

            <div className="space-y-3">
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold text-[var(--text-secondary)]">Chunks Completed:</span>
                <span className="font-extrabold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">{completedCount} / {chunks.length}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold text-[var(--text-secondary)]">Remaining:</span>
                <span className="font-bold text-[var(--text-primary)]">{remainingCount} chunks</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold text-[var(--text-secondary)]">Session XP Gain:</span>
                <span className="font-bold text-[var(--accent)]">+{totalSessionXp} XP</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold text-[var(--text-secondary)]">Est. Reading Time:</span>
                <span className="font-bold text-[var(--text-primary)]">{remainingCount * 2} minutes</span>
              </div>
            </div>
          </div>

        </section>

      </div>
    </div>
  );
}

export default function FocusPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[300px] text-[var(--text-secondary)] font-semibold gap-2">
        <div className="w-5 h-5 rounded-full border-2 border-[var(--accent)] border-t-transparent animate-spin" />
        <span>Loading focus mode...</span>
      </div>
    }>
      <FocusPageContent />
    </Suspense>
  );
}
