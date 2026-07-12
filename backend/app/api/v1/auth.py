# backend/app/api/v1/auth.py
from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Depends, HTTPException, Response, Request, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.core.config import settings
from app.core.database import get_db
from app.core.security import (
    get_password_hash,
    verify_password,
    create_access_token,
    create_refresh_token,
    decode_token,
)
from app.core.redis import blacklist_token, is_token_blacklisted
from app.models.user import User
from app.models.profile import Profile, AccessibilitySettings
from app.schemas.user import UserCreate, UserResponse, Token
from pydantic import BaseModel, EmailStr

router = APIRouter()


class LoginPayload(BaseModel):
    email: EmailStr
    password: str


@router.post("/signup", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def signup(payload: UserCreate, db: AsyncSession = Depends(get_db)):
    # Check if user already exists
    result = await db.execute(select(User).where(User.email == payload.email))
    existing_user = result.scalar_one_or_none()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email address already exists.",
        )
    
    # Create new User inside a transaction
    hashed_pwd = get_password_hash(payload.password)
    new_user = User(
        email=payload.email,
        hashed_password=hashed_pwd,
        role="student",
        is_active=True,
        is_verified=False,
    )
    db.add(new_user)
    await db.flush()  # Generate user id

    # Create associated default Profile
    new_profile = Profile(
        user_id=new_user.id,
        full_name=payload.full_name,
        diagnosis_type="dyslexia",
        reading_level="intermediate",
        focus_duration_minutes=25,
        break_duration_minutes=5,
        chunk_word_limit=80,
    )
    db.add(new_profile)
    await db.flush()  # Generate profile id

    # Create associated default Accessibility Settings
    new_accessibility = AccessibilitySettings(
        profile_id=new_profile.id,
        font_family="Inter",
        font_size=16,
        line_spacing=1.8,
        word_spacing=0.0,
        color_theme="default",
        dyslexia_font=False,
        high_contrast=False,
        reduce_motion=False,
    )
    db.add(new_accessibility)
    
    await db.commit()
    await db.refresh(new_user)
    return new_user


@router.post("/login", response_model=Token)
async def login(payload: LoginPayload, response: Response, db: AsyncSession = Depends(get_db)):
    # Retrieve user by email
    result = await db.execute(select(User).where(User.email == payload.email))
    user = result.scalar_one_or_none()
    
    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incorrect email or password",
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user account",
        )

    # Generate access and refresh tokens
    access_token = create_access_token(subject=user.id)
    refresh_token = create_refresh_token(subject=user.id)

    # Set secure HTTPOnly cookie for the refresh token
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        max_age=settings.REFRESH_TOKEN_EXPIRE_DAYS * 24 * 3600,
        expires=settings.REFRESH_TOKEN_EXPIRE_DAYS * 24 * 3600,
        secure=settings.COOKIE_SECURE,  # Set True in production to enforce HTTPS
        samesite="lax",
    )

    return {"access_token": access_token, "token_type": "bearer"}


@router.post("/refresh", response_model=Token)
async def refresh(request: Request, response: Response, db: AsyncSession = Depends(get_db)):
    refresh_token = request.cookies.get("refresh_token")
    if not refresh_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token is missing from requests",
        )

    payload = decode_token(refresh_token)
    if not payload or payload.get("type") != "refresh":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token",
        )

    user_id = payload.get("sub")
    
    try:
        import uuid
        user_uuid = uuid.UUID(user_id) if user_id else None
    except ValueError:
        user_uuid = None

    if not user_uuid:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid user ID format in token",
        )

    # Check Redis blacklist
    jti = payload.get("jti") or refresh_token[-20:]  # Fallback tracker index
    if await is_token_blacklisted(jti):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has been blacklisted",
        )

    # Verify user is active
    result = await db.execute(select(User).where(User.id == user_uuid))
    user = result.scalar_one_or_none()
    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or inactive",
        )

    # Issue new access and fresh refresh token (Rotate refresh token)
    new_access_token = create_access_token(subject=user.id)
    new_refresh_token = create_refresh_token(subject=user.id)

    # Blacklist old refresh token in Redis
    exp = payload.get("exp")
    if exp:
        now_ts = datetime.now(timezone.utc).timestamp()
        ttl = int(exp - now_ts)
        if ttl > 0:
            await blacklist_token(jti, ttl)

    # Update cookie
    response.set_cookie(
        key="refresh_token",
        value=new_refresh_token,
        httponly=True,
        max_age=settings.REFRESH_TOKEN_EXPIRE_DAYS * 24 * 3600,
        expires=settings.REFRESH_TOKEN_EXPIRE_DAYS * 24 * 3600,
        secure=settings.COOKIE_SECURE,
        samesite="lax",
    )

    return {"access_token": new_access_token, "token_type": "bearer"}


@router.post("/logout")
async def logout(request: Request, response: Response):
    refresh_token = request.cookies.get("refresh_token")
    if refresh_token:
        payload = decode_token(refresh_token)
        if payload:
            jti = payload.get("jti") or refresh_token[-20:]
            exp = payload.get("exp")
            if exp:
                now_ts = datetime.now(timezone.utc).timestamp()
                ttl = int(exp - now_ts)
                if ttl > 0:
                    await blacklist_token(jti, ttl)
    
    response.delete_cookie("refresh_token", secure=settings.COOKIE_SECURE, samesite="lax")
    return {"detail": "Logged out successfully"}
