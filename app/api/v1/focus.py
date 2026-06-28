# backend/app/api/v1/focus.py
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.api.deps import get_current_user
from app.core.database import get_db
from app.models.user import User
from app.models.session import LearningSession, FocusSession
from app.schemas.focus import FocusRecordPayload, FocusRecordResponse
from app.services.progress_service import ProgressService

router = APIRouter()


@router.post("/record", response_model=FocusRecordResponse)
async def record_focus_session(
    payload: FocusRecordPayload,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # Retrieve user's learning session
    result = await db.execute(
        select(LearningSession)
        .where(LearningSession.id == payload.session_id, LearningSession.user_id == current_user.id)
    )
    learning_session = result.scalar_one_or_none()
    if not learning_session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Parent learning session not found",
        )

    db_focus = None
    if payload.focus_session_id:
        # Retrieve existing session
        import uuid
        try:
            focus_uuid = uuid.UUID(payload.focus_session_id)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid focus_session_id format",
            )
        focus_res = await db.execute(
            select(FocusSession)
            .where(FocusSession.id == focus_uuid, FocusSession.session_id == payload.session_id)
        )
        db_focus = focus_res.scalar_one_or_none()
        if not db_focus:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Focus session not found",
            )
            
        # Prevent double-completion
        if db_focus.completed:
            return {
                "status": "already_completed",
                "xp_earned": 0,
                "focus_session_id": str(db_focus.id)
            }
            
        # Prevent timer manipulation (Wall-clock verification)
        created_at_naive = db_focus.created_at.replace(tzinfo=None) if db_focus.created_at.tzinfo else db_focus.created_at
        elapsed_wall_clock = (datetime.now(timezone.utc).replace(tzinfo=None) - created_at_naive).total_seconds()
        if payload.duration_seconds > elapsed_wall_clock + 15:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid session duration: exceeds elapsed wall-clock time"
            )
            
        # Calculate duration difference to update learning_session.total_focus_minutes
        old_duration = db_focus.duration_seconds
        db_focus.duration_seconds = payload.duration_seconds
        db_focus.completed = payload.completed
        if payload.chunk_id:
            db_focus.chunk_id = payload.chunk_id
        duration_diff = payload.duration_seconds - old_duration
    else:
        # Create a new session
        db_focus = FocusSession(
            session_id=payload.session_id,
            chunk_id=payload.chunk_id,
            mode=payload.mode.upper(),
            duration_seconds=payload.duration_seconds,
            completed=payload.completed,
        )
        db.add(db_focus)
        await db.flush() # Populate db_focus.id
        duration_diff = payload.duration_seconds

    xp_earned = 0
    
    if payload.mode.upper() == "FOCUS":
        # Increment parent session total focus minutes by the difference
        learning_session.total_focus_minutes += (duration_diff / 60.0)
        
        # Award base XP and completion rewards ONLY when completed
        if payload.completed:
            minutes_focused = payload.duration_seconds / 60.0
            base_xp = int(minutes_focused * 2)
            xp_earned += base_xp
                
            # Award focus-time XP (chunk XP is handled by update_session)
            if xp_earned > 0:
                await ProgressService.add_xp(db, current_user.id, xp_earned, "focus_session")
                
            # Update daily streak
            await ProgressService.update_daily_streak(db, current_user.id)
            
            # Trigger achievements check
            await ProgressService.evaluate_achievements(db, current_user.id)

    await db.commit()
    
    return {
        "status": "recorded",
        "xp_earned": xp_earned,
        "focus_session_id": str(db_focus.id)
    }
