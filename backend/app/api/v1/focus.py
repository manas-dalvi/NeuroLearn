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
    # Verify learning session exists and belongs to user
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

    # Save granular FocusSession interval in DB
    db_focus = FocusSession(
        session_id=payload.session_id,
        chunk_id=payload.chunk_id,
        mode=payload.mode.upper(),
        duration_seconds=payload.duration_seconds,
        completed=payload.completed,
    )
    db.add(db_focus)

    xp_earned = 0
    
    # Process stats updates on successful Focus blocks
    if payload.completed and payload.mode.upper() == "FOCUS":
        # Calculate focus minutes increment
        minutes_focused = payload.duration_seconds / 60.0
        learning_session.total_focus_minutes += minutes_focused
        
        # Award base XP (e.g., 2 XP per focus minute)
        base_xp = int(minutes_focused * 2)
        xp_earned += base_xp
        await ProgressService.add_xp(db, current_user.id, base_xp, "focus_time")

        if payload.chunk_id:
            # Increment chunk count in parent session
            learning_session.completed_chunks += 1
            
            # Award chunk completion XP bonus (50 XP)
            chunk_xp = 50
            xp_earned += chunk_xp
            await ProgressService.add_xp(db, current_user.id, chunk_xp, "chunk_complete")
            
        # Update daily streak
        await ProgressService.update_daily_streak(db, current_user.id)
        
        # Trigger achievements check
        await ProgressService.evaluate_achievements(db, current_user.id)

    await db.commit()
    
    return {
        "status": "recorded",
        "xp_earned": xp_earned
    }
