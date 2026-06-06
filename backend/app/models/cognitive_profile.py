## backend/app/models/cognitive_profile.py
from datetime import datetime
from typing import Literal, Optional
from pydantic import BaseModel, Field
from bson import ObjectId


class AccessibilityPrefs(BaseModel):
    font_family: str = "Inter"
    font_size: int = Field(default=16, ge=10, le=32)
    line_spacing: float = Field(default=1.8, ge=1.0, le=3.0)
    color_theme: Literal["default", "dark", "sepia", "high_contrast"] = "dark"
    dyslexia_font: bool = False
    high_contrast: bool = False


class CognitiveProfileCreate(BaseModel):
    diagnosis_type: str = Field(..., description="ADHD, dyslexia, autism, etc.")
    focus_duration_minutes: int = Field(default=25, ge=5, le=120)
    break_duration_minutes: int = Field(default=5, ge=1, le=60)
    chunk_word_limit: int = Field(default=100, ge=30, le=500)
    reading_level: Literal["beginner", "intermediate", "advanced"] = "intermediate"
    accessibility: AccessibilityPrefs = Field(default_factory=AccessibilityPrefs)


class CognitiveProfileUpdate(BaseModel):
    diagnosis_type: Optional[str] = None
    focus_duration_minutes: Optional[int] = Field(default=None, ge=5, le=120)
    break_duration_minutes: Optional[int] = Field(default=None, ge=1, le=60)
    chunk_word_limit: Optional[int] = Field(default=None, ge=30, le=500)
    reading_level: Optional[Literal["beginner", "intermediate", "advanced"]] = None
    accessibility: Optional[AccessibilityPrefs] = None


class CognitiveProfileResponse(CognitiveProfileCreate):
    id: str
    user_id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        populate_by_name = True

    @classmethod
    def from_mongo(cls, doc: dict) -> "CognitiveProfileResponse":
        doc["id"] = str(doc.pop("_id", ""))
        return cls(**doc)
