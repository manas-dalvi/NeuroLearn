# backend/app/models/profile.py
import uuid
from datetime import datetime, timezone
from sqlalchemy import String, Integer, Float, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base


class Profile(Base):
    __tablename__ = "profiles"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), unique=True, index=True, nullable=False)
    full_name: Mapped[str] = mapped_column(String(255), nullable=False)
    avatar_url: Mapped[str] = mapped_column(String(512), nullable=True)
    diagnosis_type: Mapped[str] = mapped_column(String(50), default="dyslexia", nullable=False)
    reading_level: Mapped[str] = mapped_column(String(50), default="intermediate", nullable=False)
    focus_duration_minutes: Mapped[int] = mapped_column(Integer, default=25, nullable=False)
    break_duration_minutes: Mapped[int] = mapped_column(Integer, default=5, nullable=False)
    chunk_word_limit: Mapped[int] = mapped_column(Integer, default=80, nullable=False)
    daily_goal_target: Mapped[int] = mapped_column(Integer, default=4, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="profile")
    accessibility: Mapped["AccessibilitySettings"] = relationship("AccessibilitySettings", back_populates="profile", uselist=False, cascade="all, delete-orphan")

    @property
    def email(self) -> str:
        return self.user.email if self.user else ""


class AccessibilitySettings(Base):
    __tablename__ = "accessibility_settings"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    profile_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("profiles.id", ondelete="CASCADE"), unique=True, index=True, nullable=False)
    font_family: Mapped[str] = mapped_column(String(100), default="Inter", nullable=False)
    font_size: Mapped[int] = mapped_column(Integer, default=16, nullable=False)
    line_spacing: Mapped[float] = mapped_column(Float, default=1.8, nullable=False)
    word_spacing: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    color_theme: Mapped[str] = mapped_column(String(50), default="default", nullable=False)
    dyslexia_font: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    high_contrast: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    reduce_motion: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    profile: Mapped["Profile"] = relationship("Profile", back_populates="accessibility")
