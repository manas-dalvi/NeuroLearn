## backend/app/models/learning_session.py
from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field


class ContentChunk(BaseModel):
    id: str
    session_id: str
    original_text: str
    simplified_text: str
    level: str
    chunk_index: int
    word_count: int


class LearningSessionCreate(BaseModel):
    content_title: str = Field(..., min_length=1, max_length=200)
    text: str = Field(..., min_length=10, description="Raw content to chunk")


class LearningSessionUpdate(BaseModel):
    completed_chunks: Optional[int] = None
    total_focus_minutes: Optional[int] = None
    ended_at: Optional[datetime] = None


class LearningSessionResponse(BaseModel):
    id: str
    user_id: str
    content_title: str
    chunks: List[ContentChunk] = []
    total_focus_minutes: int = 0
    completed_chunks: int = 0
    started_at: datetime
    ended_at: Optional[datetime] = None

    @classmethod
    def from_mongo(cls, doc: dict) -> "LearningSessionResponse":
        doc["id"] = str(doc.pop("_id", ""))
        return cls(**doc)


class SimplifyRequest(BaseModel):
    text: str = Field(..., min_length=1)
    level: str = Field(default="intermediate", pattern="^(beginner|intermediate|advanced)$")


class SimplifyResponse(BaseModel):
    simplified: str


class ChunksResponse(BaseModel):
    chunks: List[ContentChunk]
