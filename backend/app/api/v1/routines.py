# backend/app/api/v1/routines.py
import uuid
from datetime import datetime, timezone, date, time
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from app.api.deps import get_current_user
from app.core.database import get_db
from app.models.user import User
from app.models.routine import Routine, RoutineCompletion
from app.schemas.routine import RoutineCreatePayload, RoutineResponse
from app.services.progress_service import ProgressService

router = APIRouter()


@router.get("", response_model=List[RoutineResponse])
async def get_routines(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # Retrieve user's routines along with completions relation
    result = await db.execute(
        select(Routine)
        .where(Routine.user_id == current_user.id)
        .options(selectinload(Routine.completions))
    )
    routines = result.scalars().all()
    
    today = date.today()
    response = []
    for r in routines:
        # Check if routine has been completed today
        completed_today = any(c.completed_date == today for c in r.completions)
        
        # Format time to string
        time_str = r.scheduled_time.strftime("%H:%M")
        
        response.append({
            "id": r.id,
            "title": r.title,
            "description": r.description,
            "scheduled_time": time_str,
            "days_of_week": r.days_of_week,
            "is_active": r.is_active,
            "completed_today": completed_today,
        })
        
    return response


@router.post("", response_model=RoutineResponse, status_code=status.HTTP_201_CREATED)
async def create_routine(
    payload: RoutineCreatePayload,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # Parse scheduled_time HH:MM to time object
    try:
        hour, minute = map(int, payload.scheduled_time.split(":"))
        parsed_time = time(hour, minute)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid time format. Please provide HH:MM.",
        )

    # Save Routine in DB
    db_routine = Routine(
        user_id=current_user.id,
        title=payload.title,
        description=payload.description,
        scheduled_time=parsed_time,
        days_of_week=payload.days_of_week,
        is_active=payload.is_active,
    )
    db.add(db_routine)
    await db.commit()
    await db.refresh(db_routine)

    return {
        "id": db_routine.id,
        "title": db_routine.title,
        "description": db_routine.description,
        "scheduled_time": payload.scheduled_time,
        "days_of_week": db_routine.days_of_week,
        "is_active": db_routine.is_active,
        "completed_today": False,
    }


@router.post("/{id}/complete")
async def complete_routine(
    id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # Verify routine exists and belongs to user
    result = await db.execute(
        select(Routine)
        .where(Routine.id == id, Routine.user_id == current_user.id)
        .options(selectinload(Routine.completions))
    )
    routine = result.scalar_one_or_none()
    if not routine:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Routine schedule not found",
        )

    today = date.today()
    # Check if already completed today
    already_completed = any(c.completed_date == today for c in routine.completions)
    if already_completed:
        return {
            "completed": True,
            "date": str(today),
            "detail": "Routine already completed today"
        }

    # Record RoutineCompletion
    completion = RoutineCompletion(
        routine_id=id,
        completed_date=today,
    )
    db.add(completion)

    # Grant routine completion XP (e.g., 50 XP)
    await ProgressService.add_xp(db, current_user.id, 50, "routine_complete")
    await ProgressService.update_daily_streak(db, current_user.id)

    await db.commit()
    
    return {
        "completed": True,
        "date": str(today)
    }
