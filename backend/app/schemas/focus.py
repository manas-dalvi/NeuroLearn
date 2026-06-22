# backend/app/schemas/focus.py
from typing import Optional
from pydantic import BaseModel


class FocusRecordPayload(BaseModel):
    session_id: str
    chunk_id: Optional[str] = None
    mode: str  # "FOCUS" | "BREAK"
    duration_seconds: int
    completed: bool = True


class FocusRecordResponse(BaseModel):
    status: str
    xp_earned: int
