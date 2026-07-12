# backend/app/schemas/gamification.py
from pydantic import BaseModel
from typing import List


class ProgressStatsResponse(BaseModel):
    level: int
    xp: int
    next_level_xp: int
    streak: int
    focus_minutes_today: float


class BadgeResponse(BaseModel):
    id: str
    name: str
    description: str
    xp_reward: int
    unlocked: bool
    date: str


class WeeklyXPSchema(BaseModel):
    day: str
    xp: int


class QuestResponse(BaseModel):
    id: str
    goal_type: str
    target_value: int
    current_value: int
    completed: bool
    xp_reward: int
    description: str
    name: str


class ActivityItem(BaseModel):
    date: str
    xp: int
    focus_minutes: float
    completed_chunks: int
    quizzes_completed: int
    documents_uploaded: int
    routines_completed: int
    activity_score: int


class ActivitySummary(BaseModel):
    current_streak: int
    longest_streak: int
    study_days: int
    total_active_days: int


class StudyActivityResponse(BaseModel):
    today: str
    summary: ActivitySummary
    calendar: List[ActivityItem]
