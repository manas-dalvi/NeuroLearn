# backend/app/schemas/session.py
import uuid
from datetime import datetime
from typing import List, Optional, Dict, Any
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


class AskQuestionRequest(BaseModel):
    question: str


class AskQuestionResponse(BaseModel):
    answer: str
    retrieved_context: List[str]


class ChatMessagePayload(BaseModel):
    role: str  # "user" or "assistant"
    content: str
    created_at: datetime

    class Config:
        from_attributes = True


class SourceMetadata(BaseModel):
    chunk_id: str
    chunk_index: int
    title: str


class ChunkChatRequest(BaseModel):
    session_id: str
    chunk_id: Optional[str] = None
    question: str
    mode: str = "CHAT"
    parameters: Optional[Dict[str, Any]] = None


class ChunkChatResponse(BaseModel):
    answer: str
    sources: List[SourceMetadata]
    confidence_score: float
    confidence_level: str


# ─── Quiz Generator Schemas ───────────────────────────────────────────────

class QuizQuestionSchema(BaseModel):
    id: str
    question_text: str
    question_type: str  # "multiple_choice" | "true_false" | "short_answer" | "fill_in_the_blank"
    options: Optional[List[str]] = None


class QuizGenerationRequest(BaseModel):
    session_id: str
    chunk_id: Optional[str] = None
    difficulty: str = "medium"  # "easy" | "medium" | "hard"
    num_questions: int = 5  # 5, 10, 15
    profile_type: Optional[str] = None


class QuizGenerationResponse(BaseModel):
    quiz_attempt_id: uuid.UUID
    questions: List[QuizQuestionSchema]


class QuestionSubmission(BaseModel):
    question_id: str
    user_answer: str


class QuizSubmissionRequest(BaseModel):
    quiz_attempt_id: uuid.UUID
    answers: List[QuestionSubmission]
    time_taken: Optional[int] = None  # in seconds


class QuizQuestionEvaluation(BaseModel):
    question_id: str
    question_text: str
    question_type: str
    options: Optional[List[str]] = None
    correct_answer: str
    user_answer: str
    is_correct: bool
    explanation: str


class QuizSubmissionResponse(BaseModel):
    quiz_attempt_id: uuid.UUID
    score: float  # correct percentage (0.0 to 100.0)
    accuracy: float  # accuracy percentage
    correct_count: int
    total_questions: int
    evaluations: List[QuizQuestionEvaluation]
    xp_earned: int
    new_xp: int
    new_level: int


class QuizHistoryItem(BaseModel):
    quiz_attempt_id: uuid.UUID
    difficulty: str
    score: float
    accuracy: float
    total_questions: int
    created_at: datetime
    attempt_number: int


class SummaryResponse(BaseModel):
    summary: str



