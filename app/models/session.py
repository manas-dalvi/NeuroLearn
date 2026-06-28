# backend/app/models/session.py
import uuid
from datetime import datetime, timezone
from typing import Optional
from sqlalchemy import String, Integer, Float, Text, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base


class SimplifiedContent(Base):
    __tablename__ = "simplified_contents"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    original_text: Mapped[str] = mapped_column(Text, nullable=False)
    source_file_url: Mapped[str] = mapped_column(String(512), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    sessions: Mapped[list["LearningSession"]] = relationship("LearningSession", back_populates="simplified_content")


class LearningSession(Base):
    __tablename__ = "learning_sessions"

    # Match frontend string session ID, e.g. "session-1718625123"
    id: Mapped[str] = mapped_column(String(100), primary_key=True)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)
    simplified_content_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("simplified_contents.id", ondelete="SET NULL"), nullable=True)
    content_title: Mapped[str] = mapped_column(String(255), nullable=False)
    total_focus_minutes: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    completed_chunks: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    started_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    ended_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=True)

    # Relationships
    simplified_content: Mapped["SimplifiedContent"] = relationship("SimplifiedContent", back_populates="sessions")
    chunks: Mapped[list["LearningChunk"]] = relationship("LearningChunk", back_populates="session", cascade="all, delete-orphan")
    focus_sessions: Mapped[list["FocusSession"]] = relationship("FocusSession", back_populates="learning_session", cascade="all, delete-orphan")


class LearningChunk(Base):
    __tablename__ = "learning_chunks"

    # Match frontend chunk ID, e.g. "chunk-session-1718625123-0"
    id: Mapped[str] = mapped_column(String(100), primary_key=True)
    session_id: Mapped[str] = mapped_column(ForeignKey("learning_sessions.id", ondelete="CASCADE"), index=True, nullable=False)
    original_text: Mapped[str] = mapped_column(Text, nullable=False)
    simplified_text: Mapped[str] = mapped_column(Text, nullable=False)
    level: Mapped[str] = mapped_column(String(50), nullable=False)
    chunk_index: Mapped[int] = mapped_column(Integer, nullable=False)
    word_count: Mapped[int] = mapped_column(Integer, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    session: Mapped["LearningSession"] = relationship("LearningSession", back_populates="chunks")


class FocusSession(Base):
    __tablename__ = "focus_sessions"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    session_id: Mapped[str] = mapped_column(ForeignKey("learning_sessions.id", ondelete="CASCADE"), index=True, nullable=False)
    chunk_id: Mapped[str] = mapped_column(ForeignKey("learning_chunks.id", ondelete="SET NULL"), nullable=True)
    mode: Mapped[str] = mapped_column(String(50), default="FOCUS", nullable=False)  # "FOCUS" or "BREAK"
    duration_seconds: Mapped[int] = mapped_column(Integer, nullable=False)
    completed: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    learning_session: Mapped["LearningSession"] = relationship("LearningSession", back_populates="focus_sessions")


class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    session_id: Mapped[str] = mapped_column(ForeignKey("learning_sessions.id", ondelete="CASCADE"), index=True, nullable=False)
    chunk_id: Mapped[str] = mapped_column(ForeignKey("learning_chunks.id", ondelete="SET NULL"), nullable=True)
    role: Mapped[str] = mapped_column(String(50), nullable=False)  # "user" or "assistant"
    content: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    session: Mapped["LearningSession"] = relationship("LearningSession")


class QuizAttempt(Base):
    __tablename__ = "quiz_attempts"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    session_id: Mapped[str] = mapped_column(ForeignKey("learning_sessions.id", ondelete="CASCADE"), index=True, nullable=False)
    chunk_id: Mapped[str] = mapped_column(ForeignKey("learning_chunks.id", ondelete="SET NULL"), nullable=True)  # can store single chunk_id or be null for entire doc
    difficulty: Mapped[str] = mapped_column(String(50), nullable=False)  # "easy" | "medium" | "hard"
    profile: Mapped[str] = mapped_column(String(50), nullable=False)  # diagnosis profile
    total_questions: Mapped[int] = mapped_column(Integer, nullable=False)
    score: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    accuracy: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)  # accuracy percentage
    attempt_number: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    questions_json: Mapped[str] = mapped_column(Text, nullable=False)  # Generated questions JSON
    user_answers: Mapped[Optional[str]] = mapped_column(Text, nullable=True)  # User submitted answers JSON
    time_taken: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)  # Seconds taken

    # Relationships
    session: Mapped["LearningSession"] = relationship("LearningSession")

