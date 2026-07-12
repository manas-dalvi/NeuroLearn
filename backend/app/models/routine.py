# backend/app/models/routine.py
import uuid
from datetime import datetime, timezone, time, date
from sqlalchemy import String, Time, Date, ForeignKey, Boolean, Integer, DateTime, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base


class Routine(Base):
    __tablename__ = "routines"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str] = mapped_column(String(512), nullable=True)
    scheduled_time: Mapped[time] = mapped_column(Time, nullable=False)
    days_of_week: Mapped[list[int]] = mapped_column(JSON, nullable=False)  # 0-6 represent Mon-Sun
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    completions: Mapped[list["RoutineCompletion"]] = relationship("RoutineCompletion", back_populates="routine", cascade="all, delete-orphan")


class RoutineCompletion(Base):
    __tablename__ = "routine_completions"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    routine_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("routines.id", ondelete="CASCADE"), index=True, nullable=False)
    completed_date: Mapped[date] = mapped_column(Date, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    routine: Mapped["Routine"] = relationship("Routine", back_populates="completions")
