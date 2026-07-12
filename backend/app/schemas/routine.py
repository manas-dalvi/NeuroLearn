# backend/app/schemas/routine.py
import uuid
from typing import List, Optional
from pydantic import BaseModel, Field


class RoutineCreatePayload(BaseModel):
    title: str = Field(..., min_length=2, max_length=255)
    description: Optional[str] = None
    scheduled_time: str = Field(..., pattern=r"^\d{2}:\d{2}$")  # "HH:MM" format
    days_of_week: List[int] = Field(..., description="Array of weekdays, 0 for Mon to 6 for Sun")
    is_active: bool = True


class RoutineResponse(BaseModel):
    id: uuid.UUID
    title: str
    description: Optional[str] = None
    scheduled_time: str  # Formatted as "HH:MM"
    days_of_week: List[int]
    is_active: bool
    completed_today: bool

    class Config:
        from_attributes = True
        json_encoders = {
            # Time objects formatting
            'time': lambda v: v.strftime("%H:%M")
        }
