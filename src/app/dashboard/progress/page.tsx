"use client";

import { useEffect, useState } from "react";
import { 
  Award, 
  Flame, 
  TrendingUp, 
  Clock, 
  BookOpen, 
  Sparkles, 
  Target, 
  Zap, 
  ChevronRight,
  Trophy,
  Calendar,
  Layers,
  Heart,
  FileText,
  Play,
  HelpCircle,
  CheckCircle,
  Lock
} from "lucide-react";
import { motion } from "framer-motion";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from "recharts";
import { api, ProgressStats, Badge, LearningSession, CognitiveProfile, WeeklyXpItem } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

// Mock data for Weekly XP Growth (retained for visualization purposes)
const WEEKLY_XP_DATA = [
  { day: "Mon", xp: 120 },
  { day: "Tue", xp: 250 },
  { day: "Wed", xp: 180 },
  { day: "Thu", xp: 320 },
  { day: "Fri", xp: 210 },
  { day: "Sat", xp: 450 },
  { day: "Sun", xp: 390 }
];

export default function ProgressPage() {
  const { token } = useAuth();
  const [hoveredBadge, setHoveredBadge] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "unlocked" | "locked">("all");
  
  const [stats, setStats] = useState<ProgressStats | null>(null);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [sessions, setSessions] = useState<LearningSession[]>([]);
  const [profile, setProfile] = useState<CognitiveProfile | null>(null);
  const [weeklyXp, setWeeklyXp] = useState<WeeklyXpItem[]>(WEEKLY_XP_DATA);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;

    const loadProgressData = async () => {
      try {
        const [statsData, badgesData, sessionsData, profileData, weeklyXpData] = await Promise.all([
          api.getProgressStats(token),
          api.getBadges(token),
          api.getSessions(token),
          api.getProfile(token),
          api.getWeeklyXp(token).catch(err => {
            console.warn("Failed to load weekly XP, falling back to mock data", err);
            return null;
          })
        ]);
        setStats(statsData);
        setBadges(badgesData);
        setSessions(sessionsData);
        setProfile(profileData);
        if (weeklyXpData) {
          if (weeklyXpData.length === 0) {
            const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
            setWeeklyXp(dayNames.map(day => ({ day, xp: 0 })));
          } else {
            setWeeklyXp(weeklyXpData);
          }
        }
      } catch (err) {
        console.error("Failed to load progress data", err);
      } finally {
        setLoading(false);
      }
    };

    loadProgressData();
  }, [token]);

  // Helper to map badge ids to Lucide icons
  const getBadgeIcon = (id: string) => {
    switch (id) {
      case "first-upload":
      case "first_upload":
        return FileText;
      case "simplifier-novice":
      case "simplifier_novice":
        return Layers;
      case "simplifier-master":
      case "simplifier_master":
        return Sparkles;
      case "segment-starter":
      case "segment_starter":
        return BookOpen;
      case "segment-scholar":
      case "segment_scholar":
        return Layers;
      case "deep-reader":
      case "deep_reader":
        return BookOpen;
      case "volume-reader":
      case "volume_reader":
      case "master-scholar":
      case "master_scholar":
        return Trophy;
      case "focus-initiate":
      case "focus_initiate":
        return Play;
      case "deep-work-novice":
      case "deep_work_novice":
        return Target;
      case "focus-scholar":
      case "focus_scholar":
      case "focus-titan":
      case "focus_titan":
        return Clock;
      case "streak-starter":
      case "streak_starter":
      case "consistency-pro":
      case "consistency_pro":
      case "streak-legend":
      case "streak_legend":
        return Flame;
      case "quiz-starter":
      case "quiz_starter":
        return HelpCircle;
      case "quiz-conqueror":
      case "quiz_conqueror":
        return CheckCircle;
      case "quiz-master":
      case "quiz_master":
      case "perfect-score":
      case "perfect_score":
        return Award;
      case "level-scholar":
      case "level_scholar":
      case "level-legend":
      case "level_legend":
      case "goal-legend":
      case "goal_legend":
        return Trophy;
      case "goal-crusher":
      case "goal_crusher":
        return Target;
      default:
        return Award;
    }
  };

  // Helper to map badge ids to layout colors
  const getBadgeColor = (id: string, unlocked: boolean) => {
    if (!unlocked) return "bg-[var(--bg-secondary)]/50 text-[var(--text-secondary)]/60 border-[var(--border)]";
    switch (id) {
      case "first-upload":
      case "first_upload":
      case "segment-starter":
      case "segment_starter":
      case "quiz-starter":
      case "quiz_starter":
        return "bg-blue-500/10 text-blue-500 border-blue-500/20";
      case "simplifier-novice":
      case "simplifier_novice":
        return "bg-indigo-500/10 text-indigo-500 border-indigo-500/20";
      case "simplifier-master":
      case "simplifier_master":
      case "quiz-master":
      case "quiz_master":
        return "bg-purple-500/10 text-purple-500 border-purple-500/20";
      case "segment-scholar":
      case "segment_scholar":
        return "bg-cyan-500/10 text-cyan-500 border-cyan-500/20";
      case "deep-reader":
      case "deep_reader":
        return "bg-teal-500/10 text-teal-500 border-teal-500/20";
      case "volume-reader":
      case "volume_reader":
      case "focus-initiate":
      case "focus_initiate":
        return "bg-green-500/10 text-green-500 border-green-500/20";
      case "master-scholar":
      case "master_scholar":
      case "perfect-score":
      case "perfect_score":
      case "streak-legend":
      case "streak_legend":
      case "level-legend":
      case "level_legend":
        return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20";
      case "deep-work-novice":
      case "deep_work_novice":
      case "quiz-conqueror":
      case "quiz_conqueror":
        return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20";
      case "focus-scholar":
      case "focus_scholar":
        return "bg-rose-500/10 text-rose-500 border-rose-500/20";
      case "focus-titan":
      case "focus_titan":
        return "bg-pink-500/10 text-pink-500 border-pink-500/20";
      case "streak-starter":
      case "streak_starter":
        return "bg-orange-500/10 text-orange-500 border-orange-500/20";
      case "consistency-pro":
      case "consistency_pro":
        return "bg-red-500/10 text-red-500 border-red-500/20";
      case "level-scholar":
      case "level_scholar":
        return "bg-amber-600/10 text-amber-600 border-amber-600/20";
      case "goal-crusher":
      case "goal_crusher":
        return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20";
      case "goal-legend":
      case "goal_legend":
        return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20";
      default:
        return "bg-blue-500/10 text-blue-500 border-blue-500/20";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px] text-[var(--text-secondary)] font-semibold gap-2">
        <div className="w-5 h-5 rounded-full border-2 border-[var(--accent)] border-t-transparent animate-spin" />
        <span>Loading progress reports...</span>
      </div>
    );
  }

  // Calculate stats parameters
  const currentXP = stats?.xp ?? 0;
  const nextLevelXP = stats?.next_level_xp ?? 1000;
  const xpPercent = Math.min(100, Math.round((currentXP / nextLevelXP) * 100));
  
  // Sum focus minutes across sessions
  const totalFocusHrs = sessions.reduce((acc, s) => acc + (s.total_focus_minutes || 0), 0) / 60;
  
  const unlockedBadgesCount = badges.filter(b => b.unlocked).length;

  const filteredBadges = badges.filter((b) => {
    if (filter === "unlocked") return b.unlocked;
    if (filter === "locked") return !b.unlocked;
    return true;
  });

  return (
    <div className="space-y-6 max-w-[1200px] mx-auto pb-12 animate-fade-in text-[var(--text-primary)]">
      
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-black tracking-tight text-[var(--text-primary)]">Your Progress</h1>
        <p className="text-[var(--text-secondary)] font-semibold text-sm mt-1 leading-relaxed">
          Celebrate your learning journey and look at how your focus habits are improving every day.
        </p>
      </div>

      {/* Top Card: Level & XP Badge */}
      <section className="bg-[var(--bg-card)] p-6 rounded-2xl border border-[var(--border)] shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          
          {/* Level Info */}
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-[var(--accent-glow)] border border-[var(--border)] flex items-center justify-center text-[var(--accent)] flex-shrink-0">
              <Trophy size={32} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-xl text-[var(--text-primary)]">Level {stats?.level ?? 1} Learner</span>
                <span className="bg-emerald-50 border border-emerald-100 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Active Rank
                </span>
              </div>
              <p className="text-[var(--text-secondary)] font-bold text-xs uppercase tracking-wider mt-0.5">Focus Scholar</p>
            </div>
          </div>

          {/* XP Progress Bar */}
          <div className="flex-1 max-w-md space-y-2">
            <div className="flex justify-between text-xs font-bold text-[var(--text-secondary)]">
              <span>XP Progress</span>
              <span>{currentXP} / {nextLevelXP} XP</span>
            </div>
            <div className="w-full bg-[var(--bg-secondary)]/50 h-3 rounded-full overflow-hidden border border-[var(--border)]">
              <div className="bg-[var(--accent)] h-full rounded-full transition-all duration-500" style={{ width: `${xpPercent}%` }} />
            </div>
            <p className="text-[11px] font-semibold text-[var(--text-secondary)]">
              {nextLevelXP - currentXP} XP needed to reach next Level
            </p>
          </div>

          {/* Mini Stats (Streak & Badges counts) */}
          <div className="flex gap-4 md:border-l border-[var(--border)] md:pl-8">
            <div className="text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start gap-1 text-orange-600">
                <Flame size={20} className="fill-orange-500" />
                <span className="text-2xl font-black text-[var(--text-primary)]">{stats?.streak ?? 0}</span>
              </div>
              <span className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">Day Streak</span>
            </div>

            <div className="text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start gap-1 text-[var(--accent)]">
                <Award size={20} />
                <span className="text-2xl font-black text-[var(--text-primary)]">{unlockedBadgesCount} / {badges.length}</span>
              </div>
              <span className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">Achievements</span>
            </div>
          </div>

        </div>
      </section>

      {/* Middle Section: XP Growth Chart & Stats Cards */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Weekly XP Growth Chart */}
        <div className="lg:col-span-2 bg-[var(--bg-card)] p-6 rounded-2xl border border-[var(--border)] shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-center pb-4 border-b border-[var(--border)] mb-4">
            <div>
              <h3 className="font-bold text-[var(--text-primary)] text-base">Weekly XP Growth</h3>
              <p className="text-xs font-semibold text-[var(--text-secondary)]">Your daily XP accumulation this week</p>
            </div>
            <div className="flex items-center gap-1 bg-[var(--accent-glow)] text-[var(--accent)] px-3 py-1 rounded-xl text-xs font-bold border border-[var(--accent)]/10">
              <TrendingUp size={14} />
              <span>XP Sync Active</span>
            </div>
          </div>

          {/* Recharts Area Chart */}
          <div className="h-64 w-full overflow-hidden select-none">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={weeklyXp} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorXp" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--accent)" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="var(--accent)" stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis 
                  dataKey="day" 
                  stroke="var(--text-secondary)" 
                  fontSize={11} 
                  fontWeight="bold"
                  tickLine={false} 
                  axisLine={false} 
                />
                <YAxis 
                  stroke="var(--text-secondary)" 
                  fontSize={11} 
                  fontWeight="bold"
                  tickLine={false} 
                  axisLine={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "var(--bg-card)",
                    borderRadius: "12px",
                    border: "1px solid var(--border)",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
                    fontSize: "12px",
                    color: "var(--text-primary)",
                    fontWeight: "bold"
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="xp" 
                  stroke="var(--accent)" 
                  strokeWidth={3} 
                  fillOpacity={1} 
                  fill="url(#colorXp)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Stats Cards Column */}
        <div className="space-y-6">
          
          {/* Stat 1: Total Study Time */}
          <div className="bg-[var(--bg-card)] p-6 rounded-2xl border border-[var(--border)] shadow-sm flex flex-col justify-between h-[155px]">
            <div className="flex justify-between items-start">
              <div className="p-3 bg-[var(--accent-glow)] text-[var(--accent)] rounded-2xl">
                <Clock size={22} />
              </div>
              <span className="text-[10px] font-extrabold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-full uppercase border border-emerald-500/20">
                Daily Goal: {profile?.focus_duration_minutes ?? 25}m
              </span>
            </div>
            <div className="space-y-1">
              <div className="text-3xl font-black text-[var(--text-primary)] tracking-tight">
                {totalFocusHrs.toFixed(1)}h
              </div>
              <div className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">Total Focus Time</div>
            </div>
          </div>

          {/* Stat 2: Lessons Completed */}
          <div className="bg-[var(--bg-card)] p-6 rounded-2xl border border-[var(--border)] shadow-sm flex flex-col justify-between h-[155px]">
            <div className="flex justify-between items-start">
              <div className="p-3 bg-purple-500/10 text-purple-500 rounded-2xl">
                <Layers size={22} />
              </div>
              <span className="text-[10px] font-extrabold text-purple-500 bg-purple-500/10 px-2 py-0.5 rounded-full uppercase border border-purple-500/20">
                Active Chunks
              </span>
            </div>
            <div className="space-y-1">
              <div className="text-3xl font-black text-[var(--text-primary)] tracking-tight">
                {sessions.reduce((acc, s) => acc + s.completed_chunks, 0)}
              </div>
              <div className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">Completed Chunks</div>
            </div>
          </div>

        </div>

      </section>

      {/* Bottom Section: Achievements Grid */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
          <div>
            <h3 className="font-bold text-[var(--text-primary)] text-base">Achievement Badges</h3>
            <p className="text-xs font-semibold text-[var(--text-secondary)]">Milestones unlocked throughout your learning experience</p>
          </div>

          {/* Filter Toggles */}
          <div className="flex bg-[var(--bg-secondary)]/50 p-1 rounded-xl border border-[var(--border)] self-start sm:self-auto select-none">
            {(["all", "unlocked", "locked"] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setFilter(mode)}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all capitalize
                  ${filter === mode 
                    ? "bg-[var(--bg-card)] text-[var(--text-primary)] shadow-sm" 
                    : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                  }
                `}
              >
                {mode} ({mode === "all" ? badges.length : mode === "unlocked" ? badges.filter(b => b.unlocked).length : badges.filter(b => !b.unlocked).length})
              </button>
            ))}
          </div>
        </div>

        {badges.length === 0 ? (
          <div className="p-8 text-center text-xs text-[var(--text-secondary)] font-bold bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl">
            No achievement definitions found in the database.
          </div>
        ) : filteredBadges.length === 0 ? (
          <div className="p-12 text-center text-xs text-[var(--text-secondary)] font-semibold bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl">
            No {filter} achievements found.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredBadges.map((badge) => {
              const Icon = getBadgeIcon(badge.id);
              const colorClass = getBadgeColor(badge.id, badge.unlocked);
              return (
                <div 
                  key={badge.id}
                  onMouseEnter={() => setHoveredBadge(badge.id)}
                  onMouseLeave={() => setHoveredBadge(null)}
                  className={`p-5 rounded-2xl border transition-all duration-200 relative overflow-hidden flex items-start gap-4 bg-[var(--bg-card)]
                    ${badge.unlocked 
                      ? "border-[var(--border)] shadow-sm opacity-100 hover:shadow-md hover:-translate-y-0.5" 
                      : "border-[var(--border)]/40 opacity-50 bg-[var(--bg-secondary)]/10"
                    }
                  `}
                >
                  <div className={`p-3 rounded-xl border flex-shrink-0 relative ${colorClass}`}>
                    <Icon size={20} />
                    {!badge.unlocked && (
                      <div className="absolute -bottom-1 -right-1 bg-[var(--bg-card)] border border-[var(--border)] p-0.5 rounded-full text-[var(--text-secondary)]">
                        <Lock size={8} />
                      </div>
                    )}
                  </div>
                  <div className="space-y-1 min-w-0 flex-1">
                    <h4 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-1.5 truncate">
                      {badge.name}
                      {!badge.unlocked && (
                        <span className="text-[9px] font-bold text-[var(--text-secondary)]/60 bg-[var(--bg-secondary)]/80 px-1.5 py-0.5 rounded uppercase flex items-center gap-0.5">
                          <Lock size={8} /> Locked
                        </span>
                      )}
                    </h4>
                    <p className="text-xs text-[var(--text-secondary)] leading-normal font-semibold pr-4">
                      {badge.description}
                    </p>
                    {badge.unlocked && badge.date && (
                      <span className="text-[10px] font-bold text-[var(--text-secondary)] block pt-1">
                        Unlocked on {badge.date}
                      </span>
                    )}
                  </div>
                  
                  {badge.unlocked && hoveredBadge === badge.id && (
                    <div className="absolute right-3 top-3 text-emerald-500 bg-emerald-500/10 p-1 rounded-full border border-emerald-500/20">
                      <CheckCircleIcon />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Visual Anchor Quote Card */}
      <section className="bg-gradient-to-br from-[var(--accent)]/15 to-[var(--accent-glow)] p-8 rounded-2xl border border-[var(--border)] shadow-sm relative overflow-hidden flex flex-col justify-center min-h-[160px]">
        <div className="relative z-10 max-w-2xl space-y-2">
          <p className="text-sm font-black text-[var(--accent)] uppercase tracking-wider">Weekly Reflection</p>
          <h3 className="text-xl font-black text-[var(--text-primary)] leading-snug">
            "Your learning pace is uniquely yours. Celebrating small accomplishments paves the road to mastering complex concepts."
          </h3>
          <p className="text-xs text-[var(--text-secondary)] font-semibold">— NeuroLearn Advisor</p>
        </div>
      </section>

    </div>
  );
}

function CheckCircleIcon() {
  return (
    <svg 
      className="w-4 h-4" 
      fill="none" 
      viewBox="0 0 24 24" 
      stroke="currentColor" 
      strokeWidth={3}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}
