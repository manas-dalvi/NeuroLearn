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
from app.models.gamification import Progress, Achievement, Badge, XPTransaction, Goal
from app.models.session import FocusSession, LearningSession
from app.schemas.gamification import ProgressStatsResponse, BadgeResponse, WeeklyXPSchema, QuestResponse, StudyActivityResponse
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


@router.get("/progress/quests", response_model=List[QuestResponse])
async def get_daily_quests(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    quests = await ProgressService.get_or_create_daily_quests(db, current_user.id)
    response = []
    for q in quests:
        details = ProgressService.get_quest_details(q.goal_type, q.target_value)
        response.append({
            "id": str(q.id),
            "goal_type": q.goal_type,
            "target_value": q.target_value,
            "current_value": q.current_value,
            "completed": q.completed,
            "xp_reward": details["xp_reward"],
            "description": details["description"],
            "name": details["name"],
        })
    return response


@router.get("/progress/activity", response_model=StudyActivityResponse)
async def get_study_activity(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # Calculate start date (90 days ago)
    start_date = datetime.now(timezone.utc) - timedelta(days=90)
    
    # 1. Fetch all XP transactions for the user
    xp_stmt = (
        select(XPTransaction)
        .where(XPTransaction.user_id == current_user.id)
        .order_by(XPTransaction.created_at.asc())
    )
    xp_res = await db.execute(xp_stmt)
    transactions = list(xp_res.scalars().all())
    
    # 2. Fetch all focus sessions for the user
    focus_stmt = (
        select(FocusSession)
        .join(LearningSession, FocusSession.session_id == LearningSession.id)
        .where(
            LearningSession.user_id == current_user.id,
            FocusSession.mode == "FOCUS",
            FocusSession.completed == True
        )
    )
    focus_res = await db.execute(focus_stmt)
    focus_sessions = list(focus_res.scalars().all())
    
    # Helpers for date processing
    def get_date_only(dt):
        if isinstance(dt, str):
            try:
                val = dt.split(".")[0]
                return datetime.strptime(val, "%Y-%m-%d %H:%M:%S").date()
            except ValueError:
                return None
        elif isinstance(dt, datetime):
            return dt.date()
        elif isinstance(dt, date):
            return dt
        return None

    # Distinct dates of activity
    activity_dates = set()
    historical_daily = {}
    
    # Process XP transactions
    for tx in transactions:
        tx_date = get_date_only(tx.created_at)
        if not tx_date:
            continue
        activity_dates.add(tx_date)
        if tx_date not in historical_daily:
            historical_daily[tx_date] = {
                "xp": 0, "focus_minutes": 0.0, "completed_chunks": 0,
                "quizzes_completed": 0, "documents_uploaded": 0, "routines_completed": 0
            }
        historical_daily[tx_date]["xp"] += tx.amount
        if tx.source == "chunk_complete":
            historical_daily[tx_date]["completed_chunks"] += int(tx.amount / 50)
        elif tx.source == "routine_complete":
            historical_daily[tx_date]["routines_completed"] += 1
        elif tx.source == "quiz_completion":
            historical_daily[tx_date]["quizzes_completed"] += 1
        elif tx.source == "upload_content":
            historical_daily[tx_date]["documents_uploaded"] += 1

    # Process Focus sessions
    for fs in focus_sessions:
        fs_date = get_date_only(fs.created_at)
        if not fs_date:
            continue
        activity_dates.add(fs_date)
        if fs_date not in historical_daily:
            historical_daily[fs_date] = {
                "xp": 0, "focus_minutes": 0.0, "completed_chunks": 0,
                "quizzes_completed": 0, "documents_uploaded": 0, "routines_completed": 0
            }
        historical_daily[fs_date]["focus_minutes"] += (fs.duration_seconds / 60.0)

    # Calculate streaks
    sorted_dates = sorted(list(activity_dates))
    current_streak = 0
    longest_streak = 0
    
    if sorted_dates:
        # Calculate longest streak
        temp_streak = 1
        for i in range(1, len(sorted_dates)):
            diff = (sorted_dates[i] - sorted_dates[i-1]).days
            if diff == 1:
                temp_streak += 1
            elif diff > 1:
                longest_streak = max(longest_streak, temp_streak)
                temp_streak = 1
        longest_streak = max(longest_streak, temp_streak)
        
        # Calculate current streak
        today_date = datetime.now(timezone.utc).date()
        yesterday_date = today_date - timedelta(days=1)
        if sorted_dates[-1] == today_date or sorted_dates[-1] == yesterday_date:
            current_streak = 1
            for i in range(len(sorted_dates) - 2, -1, -1):
                diff = (sorted_dates[i+1] - sorted_dates[i]).days
                if diff == 1:
                    current_streak += 1
                else:
                    break
        else:
            current_streak = 0

    # Calculate study_days (active days in the last 90 days)
    today_date = datetime.now(timezone.utc).date()
    start_date_only = today_date - timedelta(days=90)
    study_days_count = sum(1 for d in sorted_dates if d >= start_date_only)
    total_active_days_count = len(sorted_dates)

    # Formulate responses for the last 90 days
    calendar_items = []
    # DAYS_TO_SHOW = 90
    for i in range(90, -1, -1):
        day = today_date - timedelta(days=i)
        stats = historical_daily.get(day, {
            "xp": 0, "focus_minutes": 0.0, "completed_chunks": 0,
            "quizzes_completed": 0, "documents_uploaded": 0, "routines_completed": 0
        })
        
        # Calculate weighted activity score
        activity_score = (
            stats["completed_chunks"] * 10 +
            int(round(stats["focus_minutes"] * 2)) +
            stats["routines_completed"] * 10 +
            stats["quizzes_completed"] * 20 +
            stats["documents_uploaded"] * 15
        )
        
        calendar_items.append({
            "date": str(day),
            "xp": stats["xp"],
            "focus_minutes": round(stats["focus_minutes"], 1),
            "completed_chunks": stats["completed_chunks"],
            "quizzes_completed": stats["quizzes_completed"],
            "documents_uploaded": stats["documents_uploaded"],
            "routines_completed": stats["routines_completed"],
            "activity_score": activity_score
        })

    return {
        "today": str(today_date),
        "summary": {
            "current_streak": current_streak,
            "longest_streak": longest_streak,
            "study_days": study_days_count,
            "total_active_days": total_active_days_count
        },
        "calendar": calendar_items
    }
