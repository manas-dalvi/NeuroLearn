# backend/app/schemas/profile.py
import uuid
from typing import Optional
from pydantic import BaseModel, Field


class AccessibilityPrefsSchema(BaseModel):
    font_family: str = "Inter"
    font_size: int = 16
    line_spacing: float = 1.8
    word_spacing: float = 0.0
    color_theme: str = "default"
    dyslexia_font: bool = False
    high_contrast: bool = False
    reduce_motion: bool = False

    class Config:
        from_attributes = True


class CognitiveProfileSchema(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    full_name: str
    avatar_url: Optional[str] = None
    diagnosis_type: str
    focus_duration_minutes: int
    break_duration_minutes: int
    chunk_word_limit: int
    reading_level: str
    email: str
    daily_goal_target: int
    accessibility: AccessibilityPrefsSchema

    class Config:
        from_attributes = True


class CreateProfilePayload(BaseModel):
    full_name: str
    avatar_url: Optional[str] = None
    diagnosis_type: str
    focus_duration_minutes: int = 25
    break_duration_minutes: int = 5
    chunk_word_limit: int = 80
    reading_level: str = "intermediate"
    daily_goal_target: int = 4
    accessibility: Optional[AccessibilityPrefsSchema] = None


class UpdateProfilePayload(BaseModel):
    full_name: Optional[str] = None
    avatar_url: Optional[str] = None
    diagnosis_type: Optional[str] = None
    focus_duration_minutes: Optional[int] = None
    break_duration_minutes: Optional[int] = None
    chunk_word_limit: Optional[int] = None
    reading_level: Optional[str] = None
    daily_goal_target: Optional[int] = None
    accessibility: Optional[AccessibilityPrefsSchema] = None
