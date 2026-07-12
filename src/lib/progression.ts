/**
 * Progression and level-rank utilities.
 * Handles level-specific base XP, progress normalization, and cognitive rank titles.
 */

import type React from "react";

/** Number of days the Study Activity Calendar displays. Change to extend to 180-day or yearly views. */
export const DAYS_TO_SHOW = 90;

export const getLevelBaseXP = (level: number): number => {
  if (level <= 1) return 0;
  if (level === 2) return 1000;
  if (level === 3) return 1500;
  if (level === 4) return 2000;
  if (level === 5) return 3000;
  // Level 6 starts at 4000 XP. Every level above requires exactly 2000 XP.
  return 4000 + (level - 6) * 2000;
};

export interface LevelProgressInfo {
  xpPercent: number;
  currentProgressXP: number;
  levelXPRequirement: number;
}

export const getLevelProgressInfo = (
  currentXP: number,
  nextLevelXP: number,
  level: number
): LevelProgressInfo => {
  const baseLevelXP = getLevelBaseXP(level);
  const range = nextLevelXP - baseLevelXP;
  const xpPercent = range > 0
    ? Math.min(100, Math.round(((currentXP - baseLevelXP) / range) * 100))
    : 100;
  return {
    xpPercent,
    currentProgressXP: currentXP - baseLevelXP,
    levelXPRequirement: range
  };
};

export const getLevelRankTitle = (level: number): string => {
  const titles: Record<number, string> = {
    1: "Curious Beginner",
    2: "Quick Learner",
    3: "Knowledge Seeker",
    4: "Focus Explorer",
    5: "Focus Scholar",
    6: "Deep Thinker",
    7: "Learning Master",
    8: "Neuro Navigator",
    9: "Mind Architect",
    10: "Cognitive Champion",
    11: "Attention Alchemist",
    12: "Memory Maestro",
    13: "Intellect Catalyst",
    14: "Wisdom Seeker",
    15: "Synapse Sculptor",
    16: "Cognitive Commander",
    17: "Focus Elite",
    18: "Deep Work Devotee",
    19: "Brain Emperor",
    20: "Neuro Legend"
  };
  return titles[level] || "Neuro Legend";
};

export interface ActivityLevel {
  max: number;
  style: React.CSSProperties;
  label: string;
}

export const ACTIVITY_LEVELS: ActivityLevel[] = [
  { max: 0, style: { background: "rgba(100, 116, 139, 0.08)", border: "1px solid rgba(100, 116, 139, 0.15)" }, label: "No activity" },
  { max: 15, style: { background: "rgba(129, 140, 248, 0.2)", border: "1px solid rgba(129, 140, 248, 0.15)" }, label: "Light activity" },
  { max: 35, style: { background: "rgba(129, 140, 248, 0.45)", border: "1px solid rgba(129, 140, 248, 0.3)" }, label: "Medium activity" },
  { max: 70, style: { background: "rgba(129, 140, 248, 0.7)", border: "1px solid rgba(129, 140, 248, 0.5)" }, label: "High activity" },
  { max: Infinity, style: { background: "#818cf8", border: "1px solid #818cf8" }, label: "Exceptional activity" }
];

export const getActivityLevelStyle = (score: number): React.CSSProperties => {
  for (const level of ACTIVITY_LEVELS) {
    if (score <= level.max) {
      return level.style;
    }
  }
  return ACTIVITY_LEVELS[ACTIVITY_LEVELS.length - 1].style;
};
