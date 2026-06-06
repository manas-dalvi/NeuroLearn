## backend/app/routers/sessions.py
from datetime import datetime, timezone
from typing import List
import uuid

from fastapi import APIRouter, Depends, HTTPException, status

from ..core.database import get_db
from ..core.firebase import get_current_user_id
from ..core.cache import cache_get, cache_set
from ..models.cognitive_profile import CognitiveProfileResponse
from ..models.learning_session import (
    LearningSessionCreate,
    LearningSessionUpdate,
    LearningSessionResponse,
    ChunksResponse,
    SimplifyRequest,
    SimplifyResponse,
)
from ..services.ai_service import process_content_into_chunks, simplify_text

router = APIRouter(prefix="/api", tags=["Sessions & Content"])


@router.post("/sessions", response_model=LearningSessionResponse, status_code=status.HTTP_201_CREATED)
async def create_session(
    payload: LearningSessionCreate,
    user_id: str = Depends(get_current_user_id),
):
    """
    Create a new learning session:
    1. Fetch user's cognitive profile for chunking params.
    2. Run adaptive chunking + GPT-4o simplification.
    3. Persist session + chunks to MongoDB.
    """
    db = get_db()

    # Load profile for chunking configuration
    profile_doc = await db.cognitive_profiles.find_one({"user_id": user_id})
    if profile_doc:
        profile = CognitiveProfileResponse.from_mongo(profile_doc)
        chunk_word_limit = profile.chunk_word_limit
        reading_level = profile.reading_level
    else:
        # Sensible defaults for users without a profile
        chunk_word_limit = 100
        reading_level = "intermediate"

    session_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc)

    # Process text with AI pipeline
    chunks = await process_content_into_chunks(
        session_id=session_id,
        raw_text=payload.text,
        reading_level=reading_level,
        chunk_word_limit=chunk_word_limit,
    )

    doc = {
        "_id": session_id,
        "user_id": user_id,
        "content_title": payload.content_title,
        "chunks": [c.model_dump() for c in chunks],
        "total_focus_minutes": 0,
        "completed_chunks": 0,
        "started_at": now,
        "ended_at": None,
    }

    await db.learning_sessions.insert_one(doc)
    return LearningSessionResponse.from_mongo(doc)


@router.get("/sessions", response_model=List[LearningSessionResponse])
async def get_sessions(user_id: str = Depends(get_current_user_id)):
    """List all learning sessions for the authenticated user."""
    cache_key = f"sessions:{user_id}"
    cached = await cache_get(cache_key)
    if cached:
        return [LearningSessionResponse(**s) for s in cached]

    db = get_db()
    cursor = db.learning_sessions.find({"user_id": user_id}).sort("started_at", -1).limit(50)
    sessions = []
    async for doc in cursor:
        sessions.append(LearningSessionResponse.from_mongo(doc))

    serialized = [s.model_dump(mode="json") for s in sessions]
    await cache_set(cache_key, serialized, ttl=300)
    return sessions


@router.patch("/sessions/{session_id}", response_model=LearningSessionResponse)
async def update_session(
    session_id: str,
    payload: LearningSessionUpdate,
    user_id: str = Depends(get_current_user_id),
):
    """Update focus time and completed chunks for a session."""
    db = get_db()
    update_data = {k: v for k, v in payload.model_dump(exclude_none=True).items()}
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")

    result = await db.learning_sessions.find_one_and_update(
        {"_id": session_id, "user_id": user_id},
        {"$set": update_data},
        return_document=True,
    )
    if not result:
        raise HTTPException(status_code=404, detail="Session not found")
    return LearningSessionResponse.from_mongo(result)


@router.get("/content/chunks/{session_id}", response_model=ChunksResponse)
async def get_chunks(
    session_id: str,
    user_id: str = Depends(get_current_user_id),
):
    """Retrieve all content chunks for a learning session."""
    cache_key = f"chunks:{session_id}"
    cached = await cache_get(cache_key)
    if cached:
        return ChunksResponse(**cached)

    db = get_db()
    doc = await db.learning_sessions.find_one(
        {"_id": session_id, "user_id": user_id},
        {"chunks": 1},
    )
    if not doc:
        raise HTTPException(status_code=404, detail="Session not found")

    response = ChunksResponse(chunks=doc.get("chunks", []))
    await cache_set(cache_key, response.model_dump(mode="json"), ttl=3600)
    return response


@router.post("/content/simplify", response_model=SimplifyResponse)
async def simplify_chunk(
    payload: SimplifyRequest,
    user_id: str = Depends(get_current_user_id),
):
    """Re-simplify a chunk of text at a given level."""
    simplified = await simplify_text(payload.text, level=payload.level)  # type: ignore
    return SimplifyResponse(simplified=simplified)
