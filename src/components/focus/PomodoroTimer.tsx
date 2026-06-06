"use client";
import { useEffect, useRef } from "react";
import { usePomodoroStore } from "@/store/pomodoroStore";
import { formatTime } from "@/lib/utils";
import { Play, Pause, RotateCcw, Coffee } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const CIRCUMFERENCE = 2 * Math.PI * 45; // r=45

interface Props {
  sessionMinutes?: number;
  breakMinutes?: number;
}

export default function PomodoroTimer({ sessionMinutes = 25, breakMinutes = 5 }: Props) {
  const { secondsLeft, isRunning, isBreak, cycleCount, start, pause, reset, tick, setDurations } =
    usePomodoroStore();

  useEffect(() => {
    setDurations(sessionMinutes, breakMinutes);
  }, [sessionMinutes, breakMinutes, setDurations]);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => tick(), 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [isRunning, tick]);

  const totalSeconds = isBreak ? breakMinutes * 60 : sessionMinutes * 60;
  const progress = secondsLeft / totalSeconds;
  const strokeDashoffset = CIRCUMFERENCE * (1 - progress);

  return (
    <div
      className="glass-card"
      style={{
        padding: 28, textAlign: "center",
        background: isBreak
          ? "linear-gradient(135deg,rgba(52,211,153,0.06),rgba(5,150,105,0.04))"
          : "linear-gradient(135deg,rgba(129,140,248,0.06),rgba(167,139,250,0.04))",
      }}
    >
      {/* Label */}
      <AnimatePresence mode="wait">
        <motion.div
          key={isBreak ? "break" : "focus"}
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 8 }}
          className={`badge ${isBreak ? "badge-green" : "badge-purple"}`}
          style={{ display: "inline-flex", marginBottom: 20 }}
        >
          {isBreak ? <><Coffee size={11} /> Break Time</> : <><Play size={11} fill="currentColor" /> Focus Mode</>}
        </motion.div>
      </AnimatePresence>

      {/* Ring */}
      <div style={{ position: "relative", width: 160, height: 160, margin: "0 auto 20px" }}>
        <svg width="160" height="160" className="progress-ring">
          <circle cx="80" cy="80" r="45" fill="none" stroke="var(--border)" strokeWidth="8" />
          <circle
            cx="80" cy="80" r="45" fill="none"
            stroke={isBreak ? "#34d399" : "var(--accent)"}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={strokeDashoffset}
            className="progress-ring-circle"
            style={{ filter: `drop-shadow(0 0 8px ${isBreak ? "#34d399" : "var(--accent)"})` }}
          />
        </svg>
        <div style={{
          position: "absolute", inset: 0, display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center",
        }}>
          <span style={{ fontSize: "1.9rem", fontWeight: 800, fontFamily: "'Space Grotesk', sans-serif", color: isBreak ? "#34d399" : "var(--accent)" }}>
            {formatTime(secondsLeft)}
          </span>
          <span style={{ fontSize: "0.7rem", color: "var(--text-secondary)", marginTop: 2 }}>
            Cycle #{cycleCount + 1}
          </span>
        </div>
      </div>

      {/* Controls */}
      <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
        <button
          onClick={reset}
          className="btn-secondary"
          style={{ padding: "10px 16px", display: "flex", alignItems: "center", gap: 6, fontSize: "0.85rem" }}
          aria-label="Reset timer"
        >
          <RotateCcw size={15} /> Reset
        </button>
        <button
          onClick={isRunning ? pause : start}
          className="btn-primary"
          style={{
            padding: "10px 24px", display: "flex", alignItems: "center", gap: 8, fontSize: "0.9rem",
            background: isBreak ? "linear-gradient(135deg,#34d399,#059669)" : undefined,
          }}
          aria-label={isRunning ? "Pause timer" : "Start timer"}
        >
          {isRunning ? <><Pause size={16} /> Pause</> : <><Play size={16} fill="#fff" /> Start</>}
        </button>
      </div>
    </div>
  );
}
