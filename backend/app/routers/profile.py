## backend/app/routers/profile.py
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status

from ..core.database import get_db
from ..core.firebase import get_current_user_id
from ..core.cache import cache_get, cache_set, cache_delete
from ..models.cognitive_profile import (
    CognitiveProfileCreate,
    CognitiveProfileUpdate,
    CognitiveProfileResponse,
)

router = APIRouter(prefix="/api/profile", tags=["Cognitive Profile"])


def _profile_cache_key(user_id: str) -> str:
    return f"profile:{user_id}"


@router.get("", response_model=CognitiveProfileResponse)
async def get_profile(user_id: str = Depends(get_current_user_id)):
    """Fetch the current user's cognitive profile."""
    # Try cache first
    cached = await cache_get(_profile_cache_key(user_id))
    if cached:
        return CognitiveProfileResponse(**cached)

    db = get_db()
    doc = await db.cognitive_profiles.find_one({"user_id": user_id})
    if not doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Profile not found. Please complete the assessment wizard.",
        )

    profile = CognitiveProfileResponse.from_mongo(doc)
    await cache_set(_profile_cache_key(user_id), profile.model_dump(mode="json"))
    return profile


@router.post("", response_model=CognitiveProfileResponse, status_code=status.HTTP_201_CREATED)
async def create_profile(
    payload: CognitiveProfileCreate,
    user_id: str = Depends(get_current_user_id),
):
    """Create a cognitive profile for the authenticated user."""
    db = get_db()

    # Check for existing profile
    existing = await db.cognitive_profiles.find_one({"user_id": user_id})
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Profile already exists. Use PATCH to update.",
        )

    now = datetime.now(timezone.utc)
    doc = {
        **payload.model_dump(),
        "user_id": user_id,
        "created_at": now,
        "updated_at": now,
    }

    result = await db.cognitive_profiles.insert_one(doc)
    doc["_id"] = result.inserted_id

    profile = CognitiveProfileResponse.from_mongo(doc)
    await cache_set(_profile_cache_key(user_id), profile.model_dump(mode="json"))
    return profile


@router.patch("", response_model=CognitiveProfileResponse)
async def update_profile(
    payload: CognitiveProfileUpdate,
    user_id: str = Depends(get_current_user_id),
):
    """Partially update the authenticated user's profile."""
    db = get_db()

    update_data = {k: v for k, v in payload.model_dump(exclude_none=True).items()}
    if not update_data:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No fields to update")

    update_data["updated_at"] = datetime.now(timezone.utc)

    result = await db.cognitive_profiles.find_one_and_update(
        {"user_id": user_id},
        {"$set": update_data},
        return_document=True,
    )

    if not result:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Profile not found")

    profile = CognitiveProfileResponse.from_mongo(result)
    await cache_delete(_profile_cache_key(user_id))
    await cache_set(_profile_cache_key(user_id), profile.model_dump(mode="json"))
    return profile

