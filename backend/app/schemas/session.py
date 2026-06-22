# backend/app/schemas/session.py
import uuid
from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel


class ContentChunkSchema(BaseModel):
    id: str
    session_id: str
    original_text: str
    simplified_text: str
    level: str
    chunk_index: int
    word_count: int

    class Config:
        from_attributes = True


class LearningSessionSchema(BaseModel):
    id: str
    user_id: uuid.UUID
    content_title: str
    chunks: List[ContentChunkSchema] = []
    total_focus_minutes: float
    completed_chunks: int
    started_at: datetime
    ended_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class CreateSessionPayload(BaseModel):
    content_title: str
    text: str
    profile_type: Optional[str] = None


class UploadContentResponse(BaseModel):
    session_id: str
    chunk_count: int


class SimplifyPayload(BaseModel):
    text: str
    level: str  # "beginner" | "intermediate" | "advanced"
    profile_type: Optional[str] = None


class SimplifyResponse(BaseModel):
    simplified: str
