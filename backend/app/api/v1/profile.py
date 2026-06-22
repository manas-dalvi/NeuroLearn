# backend/app/api/v1/profile.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from app.api.deps import get_current_user
from app.core.database import get_db
from app.models.user import User
from app.models.profile import Profile, AccessibilitySettings
from app.schemas.profile import CognitiveProfileSchema, CreateProfilePayload, UpdateProfilePayload, AccessibilityPrefsSchema

router = APIRouter()


@router.get("", response_model=CognitiveProfileSchema)
async def get_profile(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # Fetch profile with eager loaded accessibility relations
    result = await db.execute(
        select(Profile)
        .where(Profile.user_id == current_user.id)
        .options(selectinload(Profile.accessibility), selectinload(Profile.user))
    )
    profile = result.scalar_one_or_none()
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Profile not found. Please complete the assessment wizard.",
        )
    return profile

@router.post("", response_model=CognitiveProfileSchema, status_code=status.HTTP_201_CREATED)
async def create_profile(
    payload: CreateProfilePayload,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # Verify profile does not already exist
    result = await db.execute(
        select(Profile)
        .where(Profile.user_id == current_user.id)
        .options(selectinload(Profile.accessibility), selectinload(Profile.user))
    )
    existing_profile = result.scalar_one_or_none()
    if existing_profile:
        # Update existing profile
        existing_profile.full_name = payload.full_name
        if payload.avatar_url:
            existing_profile.avatar_url = payload.avatar_url
        existing_profile.diagnosis_type = payload.diagnosis_type
        existing_profile.focus_duration_minutes = payload.focus_duration_minutes
        existing_profile.break_duration_minutes = payload.break_duration_minutes
        existing_profile.chunk_word_limit = payload.chunk_word_limit
        existing_profile.reading_level = payload.reading_level
        existing_profile.daily_goal_target = payload.daily_goal_target
        
        acc_payload = payload.accessibility or AccessibilityPrefsSchema()
        if not existing_profile.accessibility:
            existing_profile.accessibility = AccessibilitySettings(profile_id=existing_profile.id)
        existing_profile.accessibility.font_family = acc_payload.font_family
        existing_profile.accessibility.font_size = acc_payload.font_size
        existing_profile.accessibility.line_spacing = acc_payload.line_spacing
        existing_profile.accessibility.word_spacing = acc_payload.word_spacing
        existing_profile.accessibility.color_theme = acc_payload.color_theme
        existing_profile.accessibility.dyslexia_font = acc_payload.dyslexia_font
        existing_profile.accessibility.high_contrast = acc_payload.high_contrast
        existing_profile.accessibility.reduce_motion = acc_payload.reduce_motion
        
        await db.commit()
        await db.refresh(existing_profile)
        return existing_profile
    
    # Create Profile
    new_profile = Profile(
        user_id=current_user.id,
        diagnosis_type=payload.diagnosis_type,
        focus_duration_minutes=payload.focus_duration_minutes,
        break_duration_minutes=payload.break_duration_minutes,
        chunk_word_limit=payload.chunk_word_limit,
        reading_level=payload.reading_level,
        daily_goal_target=payload.daily_goal_target,
    )
    db.add(new_profile)
    await db.flush()  # Generate profile id

    # Create associated Accessibility Settings
    acc_payload = payload.accessibility or AccessibilityPrefsSchema()
    new_accessibility = AccessibilitySettings(
        profile_id=new_profile.id,
        font_family=acc_payload.font_family,
        font_size=acc_payload.font_size,
        line_spacing=acc_payload.line_spacing,
        word_spacing=acc_payload.word_spacing,
        color_theme=acc_payload.color_theme,
        dyslexia_font=acc_payload.dyslexia_font,
        high_contrast=acc_payload.high_contrast,
        reduce_motion=acc_payload.reduce_motion,
    )
    db.add(new_accessibility)
    
    await db.commit()
    
    # Reload profile with relations
    result = await db.execute(
        select(Profile)
        .where(Profile.id == new_profile.id)
        .options(selectinload(Profile.accessibility), selectinload(Profile.user))
    )
    return result.scalar_one()


@router.patch("", response_model=CognitiveProfileSchema)
async def update_profile(
    payload: UpdateProfilePayload,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # Retrieve existing profile
    result = await db.execute(
        select(Profile)
        .where(Profile.user_id == current_user.id)
        .options(selectinload(Profile.accessibility), selectinload(Profile.user))
    )
    profile = result.scalar_one_or_none()
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Profile not found",
        )

    # Update base fields
    update_data = payload.model_dump(exclude_unset=True)
    if "accessibility" in update_data:
        acc_data = update_data.pop("accessibility")
        if acc_data and profile.accessibility:
            for k, v in acc_data.items():
                if v is not None:
                    setattr(profile.accessibility, k, v)
                    
    for k, v in update_data.items():
        if v is not None:
            setattr(profile, k, v)

    await db.commit()
    await db.refresh(profile)
    return profile
