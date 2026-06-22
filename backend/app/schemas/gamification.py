# backend/app/schemas/gamification.py
from pydantic import BaseModel


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
