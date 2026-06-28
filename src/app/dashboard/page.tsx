"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { 
  PlayCircle, 
  Sparkles, 
  BookOpen, 
  LineChart, 
  Clock, 
  Timer, 
  Flame, 
  ChevronRight, 
  Users, 
  Lightbulb, 
  ArrowRight,
  TrendingUp,
  Award,
  Layers
} from "lucide-react";
import { motion } from "framer-motion";
import { useAccessibility } from "@/context/AccessibilityContext";
import { useAuth } from "@/context/AuthContext";
import { api, ProgressStats, LearningSession, CognitiveProfile } from "@/lib/api";

export default function DashboardPage() {
  const { settings } = useAccessibility();
  const { user, token } = useAuth();
  const activeProfile = settings.activeProfile || "dyslexia";

  const [stats, setStats] = useState<ProgressStats | null>(null);
  const [sessions, setSessions] = useState<LearningSession[]>([]);
  const [profile, setProfile] = useState<CognitiveProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;

    const loadDashboardData = async () => {
      try {
        const [statsData, sessionsData, profileData] = await Promise.all([
          api.getProgressStats(token),
          api.getSessions(token),
          api.getProfile(token)
        ]);
        setStats(statsData);
        setSessions(sessionsData);
        setProfile(profileData);

        const saved = localStorage.getItem("current_session_id");
        if (saved && sessionsData.some(s => s.id === saved)) {
          setCurrentSessionId(saved);
        } else if (sessionsData.length > 0) {
          setCurrentSessionId(sessionsData[0].id);
        }
      } catch (err) {
        console.error("Failed to load dashboard data", err);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();

    // Focus and visibility listeners as a fallback to refresh stats
    const handleRefresh = () => {
      loadDashboardData();
    };
    window.addEventListener("focus", handleRefresh);
    document.addEventListener("visibilitychange", handleRefresh);

    return () => {
      window.removeEventListener("focus", handleRefresh);
      document.removeEventListener("visibilitychange", handleRefresh);
    };
  }, [token]);

  // Adaptive content based on profile
  const getAdaptiveTip = () => {
    switch (activeProfile) {
      case "adhd":
        return {
          title: "ADHD Pomodoro Recommendation",
          desc: "Try the standard 25-minute focus window. Break learning into smaller chunks and use a 5-minute movement break to sustain motivation.",
          color: "bg-[var(--accent-glow)] border-[var(--accent)] text-[var(--accent-secondary)]",
          icon: Clock
        };
      case "autism":
        return {
          title: "Structured Layout Tip",
          desc: "Use the step-by-step display layout in Focus Mode. Predictable fixed positions and reduced visual animations support structured learning.",
          color: "bg-[var(--accent-glow)] border-[var(--accent)] text-[var(--accent)]",
          icon: Layers
        };
      case "dyslexia":
      default:
        return {
          title: "Dyslexia Reading Guideline",
          desc: "Enable the Reading Guide Ruler on the Focus page to scan line-by-line easily. Use increased word/line spacing to prevent visual rotations.",
          color: "bg-[var(--accent-glow)] border-[var(--accent)] text-[var(--accent)]",
          icon: BookOpen
        };
    }
  };

  const adaptiveTip = getAdaptiveTip();
  const TipIcon = adaptiveTip.icon;

  const getRelativeTime = (isoString: string) => {
    try {
      const utcString = isoString.endsWith("Z") || isoString.includes("+") ? isoString : isoString + "Z";
      const date = new Date(utcString.replace(" ", "T"));
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      if (diffMins < 60) return `${diffMins} minutes ago`;
      if (diffHours < 24) return `${diffHours} hours ago`;
      return date.toLocaleDateString();
    } catch {
      return "recently";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px] text-[var(--text-secondary)] font-semibold gap-2">
        <div className="w-5 h-5 rounded-full border-2 border-[var(--accent)] border-t-transparent animate-spin" />
        <span>Loading dashboard statistics...</span>
      </div>
    );
  }

  // Calculate focus target percentage (target: user's focus duration minutes)
  const focusMinutes = stats?.focus_minutes_today ?? 0;
  const targetFocusMinutes = profile?.focus_duration_minutes ?? 25;
  const focusPercent = Math.min(100, Math.round((focusMinutes / targetFocusMinutes) * 100));

  // Calculate session count target (target: user's daily goal target) for TODAY only
  const todayStr = new Date().toDateString();
  const sessionCount = sessions.filter(s => {
    if (s.completed_chunks <= 0) return false;
    const sDateStr = s.started_at.endsWith("Z") || s.started_at.includes("+") ? s.started_at : s.started_at + "Z";
    const sDate = new Date(sDateStr.replace(" ", "T"));
    return sDate.toDateString() === todayStr;
  }).length;
  const targetSessions = profile?.daily_goal_target ?? 4;
  const sessionPercent = Math.min(100, Math.round((sessionCount / targetSessions) * 100));

  return (
    <div className="space-y-6 max-w-[1200px] mx-auto pb-12 animate-fade-in text-[var(--text-primary)]">
      
      {/* Welcome Hero Section */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[var(--accent)] to-[var(--accent)]/85 p-8 text-white flex justify-between items-center shadow-md shadow-[var(--accent)]/10">
        <div className="relative z-10 max-w-xl space-y-4">
          <h1 className="text-3xl font-black tracking-tight">Welcome back, {user?.displayName || "Learner"}.</h1>
          <p className="text-base text-sky-100/90 leading-relaxed font-semibold">
            "Small steps today lead to big discoveries tomorrow. You've got this."
          </p>
          <div className="flex gap-4 pt-2">
            <Link href={currentSessionId ? `/dashboard/focus?session_id=${currentSessionId}` : "/dashboard/focus"}>
              <button className="bg-white hover:bg-slate-50 text-[var(--accent)] font-bold text-sm px-6 py-3 rounded-xl shadow-sm transition-all hover:scale-[1.02] active:scale-[0.98]">
                Resume Session
              </button>
            </Link>
          </div>
        </div>

        {/* Serene image resting on desk */}
        <div className="hidden lg:block z-10 flex-shrink-0">
          <img 
            className="w-44 h-44 rounded-2xl object-cover border-4 border-white/20 shadow-lg" 
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuCGDumtjTZaiY0QODXi_BW6sev4D_lygALT2sqi_f473C81cZ1P0S3SFms3QO_21FvYOFUL8KeYgzaD2C8_wL6w4mTMqEpqu-pcVbnJiWPtExEXoEHX0b17VmTwXSmqsJ4IMJqtGtPWVPNrij1dYgFFCDks7NMSAe947Dor8eMDydAPnKSVNJxKHeq4RFp_YuREekmv8DGS5YMJ0QCJandc8jxiTTqQigKwRgDzI1gB0D-cgppm0X0cYpFgnKVYWldHoFgaf9tv8A"
            alt="A serene open book and succulent promoting focused study" 
          />
        </div>
      </section>

      {/* Bento Grid Stats */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Stat Card 1 */}
        <div className="bg-[var(--bg-card)] p-6 rounded-2xl border border-[var(--border)] shadow-sm flex flex-col justify-between h-[150px] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
          <div className="flex justify-between items-start">
            <div className="p-2.5 bg-[var(--accent-glow)] text-[var(--accent)] rounded-xl">
              <Clock size={20} />
            </div>
            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">Live Stats</span>
          </div>
          <div className="space-y-1">
            <div className="text-3xl font-black text-[var(--text-primary)] tracking-tight">
              {Math.round(stats?.focus_minutes_today ?? 0)}
            </div>
            <div className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">Focus Minutes Today</div>
          </div>
        </div>

        {/* Stat Card 2 */}
        <div className="bg-[var(--bg-card)] p-6 rounded-2xl border border-[var(--border)] shadow-sm flex flex-col justify-between h-[150px] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
          <div className="flex justify-between items-start">
            <div className="p-2.5 bg-[var(--accent-glow)] text-[var(--accent)] rounded-xl">
              <BookOpen size={20} />
            </div>
            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">Active</span>
          </div>
          <div className="space-y-1">
            <div className="text-3xl font-black text-[var(--text-primary)] tracking-tight">{sessions.length}</div>
            <div className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">Total Documents</div>
          </div>
        </div>

        {/* Stat Card 3 */}
        <div className="bg-[var(--bg-card)] p-6 rounded-2xl border border-[var(--border)] shadow-sm flex flex-col justify-between h-[150px] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
          <div className="flex justify-between items-start">
            <div className="p-2.5 bg-[var(--accent-glow)] text-[var(--accent)] rounded-xl">
              <Timer size={20} />
            </div>
            <span className="text-xs font-bold text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full">XP Rank</span>
          </div>
          <div className="space-y-1">
            <div className="text-3xl font-black text-[var(--text-primary)] tracking-tight">{stats?.xp ?? 0} XP</div>
            <div className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">Total Points Earned</div>
          </div>
        </div>

        {/* Stat Card 4 */}
        <div className="bg-[var(--bg-card)] p-6 rounded-2xl border border-[var(--border)] shadow-sm flex flex-col justify-between h-[150px] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
          <div className="flex justify-between items-start">
            <div className="p-2.5 bg-[var(--accent-glow)] text-[var(--accent)] rounded-xl">
              <Flame size={20} />
            </div>
            <span className="text-xs font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full">Level {stats?.level ?? 1}</span>
          </div>
          <div className="space-y-1">
            <div className="text-3xl font-black text-[var(--text-primary)] tracking-tight">{stats?.streak ?? 0}</div>
            <div className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">Day Streak</div>
          </div>
        </div>
      </section>

      {/* Main Interactive Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left column - Actions & Activities */}
        <div className="lg:col-span-2 space-y-6">
          <div className="space-y-3">
            <h3 className="text-lg font-bold text-[var(--text-primary)] tracking-tight uppercase">Quick Actions</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              <Link href="/dashboard/focus" className="group flex items-center p-4 bg-[var(--bg-card)] rounded-2xl border border-[var(--border)] shadow-sm hover:border-[var(--accent)] hover:shadow-md transition-all text-left">
                <div className="w-12 h-12 rounded-xl bg-[var(--accent-glow)] text-[var(--accent)] flex items-center justify-center mr-4 group-hover:scale-105 transition-transform flex-shrink-0">
                  <PlayCircle size={24} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-[var(--text-primary)]">Start Focus</h4>
                  <p className="text-xs text-[var(--text-secondary)] font-semibold">Deep work Pomodoro timer</p>
                </div>
              </Link>

              <Link href="/dashboard/simplifier" className="group flex items-center p-4 bg-[var(--bg-card)] rounded-2xl border border-[var(--border)] shadow-sm hover:border-[var(--accent)] hover:shadow-md transition-all text-left">
                <div className="w-12 h-12 rounded-xl bg-[var(--accent-glow)] text-[var(--accent)] flex items-center justify-center mr-4 group-hover:scale-105 transition-transform flex-shrink-0">
                  <Sparkles size={24} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-[var(--text-primary)]">AI Simplifier</h4>
                  <p className="text-xs text-[var(--text-secondary)] font-semibold">Make reading materials easier</p>
                </div>
              </Link>

              <Link href="/dashboard/focus" className="group flex items-center p-4 bg-[var(--bg-card)] rounded-2xl border border-[var(--border)] shadow-sm hover:border-[var(--accent)] hover:shadow-md transition-all text-left">
                <div className="w-12 h-12 rounded-xl bg-[var(--accent-glow)] text-[var(--accent)] flex items-center justify-center mr-4 group-hover:scale-105 transition-transform flex-shrink-0">
                  <BookOpen size={24} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-[var(--text-primary)]">Continue Reading</h4>
                  <p className="text-xs text-[var(--text-secondary)] font-semibold">Pick up where you left off</p>
                </div>
              </Link>

              <Link href="/dashboard/progress" className="group flex items-center p-4 bg-[var(--bg-card)] rounded-2xl border border-[var(--border)] shadow-sm hover:border-[var(--accent)] hover:shadow-md transition-all text-left">
                <div className="w-12 h-12 rounded-xl bg-[var(--accent-glow)] text-[var(--accent)] flex items-center justify-center mr-4 group-hover:scale-105 transition-transform flex-shrink-0">
                  <LineChart size={24} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-[var(--text-primary)]">View Progress</h4>
                  <p className="text-xs text-[var(--text-secondary)] font-semibold">Detailed analytics & insights</p>
                </div>
              </Link>

            </div>
          </div>

          {/* Recent Activity */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-[var(--text-primary)] tracking-tight uppercase">Recent Activity</h3>
              <Link href="/dashboard/progress" className="text-sm font-bold text-[var(--accent)] hover:underline">
                View all
              </Link>
            </div>

            <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border)] shadow-sm divide-y divide-[var(--border)] overflow-hidden">
              {sessions.length === 0 ? (
                <div className="p-8 text-center text-xs text-[var(--text-secondary)] font-bold">
                  No learning sessions found. Paste or upload text on the AI Simplifier page to get started!
                </div>
              ) : (
                sessions.slice(0, 4).map((session) => (
                  <Link 
                    key={session.id}
                    href={`/dashboard/focus?session_id=${session.id}`}
                    className="p-4 flex items-center justify-between hover:bg-[var(--bg-secondary)]/50 transition-colors text-left"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-[var(--bg-secondary)] text-[var(--text-secondary)] flex items-center justify-center flex-shrink-0">
                        <BookOpen size={18} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-[var(--text-primary)] truncate max-w-[200px] sm:max-w-xs md:max-w-sm lg:max-w-md" title={session.content_title}>{session.content_title}</p>
                        <p className="text-[11px] text-[var(--text-secondary)] font-semibold">
                          Completed: {session.completed_chunks} chunks • {getRelativeTime(session.started_at)}
                        </p>
                      </div>
                    </div>
                    <ChevronRight size={16} className="text-[var(--text-secondary)]" />
                  </Link>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right column - Goals, Groups, and Tips */}
        <div className="space-y-6">
          {/* Daily Goal Card */}
          <div className="bg-[var(--bg-card)] p-6 rounded-2xl border border-[var(--border)] shadow-sm space-y-5">
            <div className="flex justify-between items-center">
              <h3 className="text-base font-bold text-[var(--text-primary)] tracking-tight">Daily Goal Progress</h3>
              <span className="text-[var(--accent)] font-extrabold text-sm bg-[var(--accent-glow)] px-2 py-0.5 rounded">
                {Math.round((focusPercent + sessionPercent) / 2)}%
              </span>
            </div>
            
            <div className="space-y-4">
              {/* Reading Target */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-bold text-[var(--text-secondary)]">
                  <span>Reading Target</span>
                  <span>{Math.round(focusMinutes)} / {targetFocusMinutes} mins</span>
                </div>
                <div className="w-full bg-[var(--bg-secondary)] h-2.5 rounded-full overflow-hidden border border-[var(--border)]">
                  <div className="bg-[var(--accent)] h-full rounded-full transition-all duration-300" style={{ width: `${focusPercent}%` }} />
                </div>
              </div>

              {/* Focus Sessions */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-bold text-[var(--text-secondary)]">
                  <span>Completed Sessions</span>
                  <span>{sessionCount} / {targetSessions}</span>
                </div>
                <div className="w-full bg-[var(--bg-secondary)] h-2.5 rounded-full overflow-hidden border border-[var(--border)]">
                  <div className="bg-[var(--accent)] h-full rounded-full transition-all duration-300" style={{ width: `${sessionPercent}%` }} />
                </div>
              </div>

              <Link href="/dashboard/profile" className="block w-full">
                <button className="w-full py-2.5 mt-2 border-2 border-[var(--accent)]/85 text-[var(--accent)] font-bold text-sm rounded-xl hover:bg-[var(--accent-glow)] transition-colors">
                  Adjust Goals
                </button>
              </Link>
            </div>
          </div>

          {/* Collaborative Learning (Coming Soon) Card */}
          <div className="bg-[var(--bg-card)]/50 p-6 rounded-2xl border border-[var(--border)] shadow-sm relative overflow-hidden group opacity-75">
            <div className="relative z-10 space-y-3">
              <h3 className="text-base font-bold text-[var(--text-secondary)] flex items-center gap-2">
                <Users size={18} />
                Collaborative Learning
              </h3>
              <p className="text-xs font-semibold text-[var(--text-secondary)] leading-normal">
                Study groups, live focus rooms, and peer accountability features will be available in a future update.
              </p>
              
              <span className="inline-block bg-[var(--bg-secondary)] text-[var(--text-secondary)] text-[10px] font-extrabold px-2.5 py-1 rounded-lg border border-[var(--border)]">
                Coming Soon
              </span>
            </div>
            
            {/* Background design */}
            <div className="absolute -right-4 -bottom-4 opacity-5 pointer-events-none">
              <Users size={120} className="text-[var(--text-secondary)]" />
            </div>
          </div>

          {/* Daily Tip Card (Adaptive) */}
          <div className="bg-[var(--accent-glow)] p-5 rounded-2xl border border-[var(--border)] flex gap-4 text-left">
            <TipIcon size={24} className="text-[var(--accent)] flex-shrink-0" />
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-[var(--text-primary)]">{adaptiveTip.title}</h4>
              <p className="text-xs font-semibold text-[var(--text-secondary)] leading-normal">
                {adaptiveTip.desc}
              </p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
