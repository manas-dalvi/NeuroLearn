# backend/app/api/v1/gamification.py
from datetime import datetime, timezone, timedelta, date
from typing import List
from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func
from app.api.deps import get_current_user
from app.core.database import get_db
from app.models.user import User
from app.models.gamification import Progress, Achievement, Badge, XPTransaction
from app.models.session import FocusSession, LearningSession
from app.schemas.gamification import ProgressStatsResponse, BadgeResponse, WeeklyXPSchema
from app.services.progress_service import ProgressService, ACHIEVEMENT_DEFINITIONS

router = APIRouter()


@router.get("/progress/stats", response_model=ProgressStatsResponse)
async def get_progress_stats(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # Fetch Progress
    result = await db.execute(select(Progress).where(Progress.user_id == current_user.id))
    progress = result.scalar_one_or_none()
    
    if not progress:
        # Create default progress row if not present
        progress = Progress(
            user_id=current_user.id,
            total_xp=0,
            current_level=1,
            streak_days=0,
        )
        db.add(progress)
        await db.commit()
        await db.refresh(progress)

    # Compute next level threshold
    _, next_level_xp = ProgressService.get_level_info(progress.total_xp)

    # Compute focus minutes completed today
    today_start = datetime.combine(datetime.now(timezone.utc).date(), datetime.min.time()).replace(tzinfo=timezone.utc)
    focus_query = (
        select(func.sum(FocusSession.duration_seconds))
        .join(LearningSession)
        .where(
            LearningSession.user_id == current_user.id,
            FocusSession.mode == "FOCUS",
            FocusSession.created_at >= today_start
        )
    )
    focus_res = await db.execute(focus_query)
    total_seconds_today = focus_res.scalar() or 0
    focus_minutes_today = float(total_seconds_today / 60.0)

    return {
        "level": progress.current_level,
        "xp": progress.total_xp,
        "next_level_xp": next_level_xp,
        "streak": progress.streak_days,
        "focus_minutes_today": focus_minutes_today,
    }


@router.get("/gamification/badges", response_model=List[BadgeResponse])
async def get_badges(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # Pre-seed achievements in database
    for defn in ACHIEVEMENT_DEFINITIONS:
        chk = await db.execute(select(Achievement).where(Achievement.id == defn["id"]))
        if not chk.scalar_one_or_none():
            db.add(Achievement(**defn))
    await db.flush()

    # Query all achievements
    achievements_res = await db.execute(select(Achievement))
    achievements = achievements_res.scalars().all()

    # Query user's badges
    badges_res = await db.execute(
        select(Badge).where(Badge.user_id == current_user.id)
    )
    user_badges = {b.achievement_id: b for b in badges_res.scalars().all()}

    response = []
    for ach in achievements:
        unlocked = ach.id in user_badges
        date_str = "Locked"
        if unlocked:
            badge = user_badges[ach.id]
            unlocked_at = badge.unlocked_at
            if unlocked_at.tzinfo is None:
                unlocked_at = unlocked_at.replace(tzinfo=timezone.utc)
            days_ago = (datetime.now(timezone.utc) - unlocked_at).days
            if days_ago == 0:
                date_str = "Unlocked Today"
            elif days_ago == 1:
                date_str = "Unlocked Yesterday"
            else:
                date_str = f"Unlocked {days_ago} days ago"

        response.append({
            "id": ach.id,
            "name": ach.name,
            "description": ach.description,
            "xp_reward": ach.xp_reward,
            "unlocked": unlocked,
            "date": date_str,
        })

    return response


@router.get("/progress/weekly-xp", response_model=List[WeeklyXPSchema])
async def get_weekly_xp(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # Compute the past 7 days in chronological order
    today = datetime.now(timezone.utc).date()
    days = [today - timedelta(days=i) for i in range(6, -1, -1)]
    start_date = days[0]
    
    # Query transactions starting at midnight UTC of the oldest day
    start_datetime = datetime.combine(start_date, datetime.min.time()).replace(tzinfo=timezone.utc)
    
    result = await db.execute(
        select(XPTransaction)
        .where(
            XPTransaction.user_id == current_user.id,
            XPTransaction.created_at >= start_datetime
        )
    )
    transactions = result.scalars().all()
    
    # Group and sum XP by date
    daily_xp = {d: 0 for d in days}
    for tx in transactions:
        tx_dt = tx.created_at
        if isinstance(tx_dt, str):
            try:
                val = tx_dt.split(".")[0]
                dt = datetime.strptime(val, "%Y-%m-%d %H:%M:%S")
                tx_date = dt.date()
            except ValueError:
                continue
        elif isinstance(tx_dt, datetime):
            tx_date = tx_dt.date()
        elif isinstance(tx_dt, date):
            tx_date = tx_dt
        else:
            continue
            
        if tx_date in daily_xp:
            daily_xp[tx_date] += tx.amount
            
    # Serialize to schema
    response_data = []
    for d in days:
        response_data.append({
            "day": d.strftime("%a"),
            "xp": daily_xp[d]
        })
        
    return response_data
