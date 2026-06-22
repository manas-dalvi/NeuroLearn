# backend/app/services/progress_service.py
import uuid
import logging
from datetime import datetime, timezone, date, time
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from app.models.gamification import Progress, XPTransaction, Badge, Achievement, Goal
from app.models.session import FocusSession, LearningSession

logger = logging.getLogger(__name__)

# Standard platform achievements definitions mapping
ACHIEVEMENT_DEFINITIONS = [
    {
        "id": "early-bird",
        "name": "Early Bird",
        "description": "Completed a focus session before 8:00 AM.",
        "xp_reward": 150,
        "criteria_type": "early_hour",
        "criteria_value": 8,
    },
    {
        "id": "consistency-pro",
        "name": "Consistency Pro",
        "description": "Maintained a 7-day focus session streak.",
        "xp_reward": 300,
        "criteria_type": "streak",
        "criteria_value": 7,
    },
    {
        "id": "vocabulary-guru",
        "name": "Vocab Guru",
        "description": "Looked up 25 simplified words.",
        "xp_reward": 200,
        "criteria_type": "simplified_chunks",
        "criteria_value": 25,
    },
]


class ProgressService:
    
    @classmethod
    def get_level_info(cls, total_xp: int) -> tuple[int, int]:
        """Returns (current_level, next_level_xp_threshold)"""
        if total_xp < 1000:
            return 1, 1000
        elif total_xp < 1500:
            return 2, 1500
        elif total_xp < 2000:
            return 3, 2000
        elif total_xp < 3000:
            return 4, 3000
        elif total_xp < 4000:
            return 5, 4000
        else:
            # Linear scaling above level 5
            level = 5 + int((total_xp - 4000) / 2000) + 1
            next_threshold = 4000 + (level - 4) * 2000
            return level, next_threshold

    @classmethod
    async def add_xp(
        cls, 
        db: AsyncSession, 
        user_id: uuid.UUID, 
        amount: int, 
        source: str
    ) -> Progress:
        # Get progress or create one
        result = await db.execute(select(Progress).where(Progress.user_id == user_id))
        progress = result.scalar_one_or_none()
        
        if not progress:
            progress = Progress(
                user_id=user_id,
                total_xp=0,
                current_level=1,
                streak_days=0,
            )
            db.add(progress)
            await db.flush()

        # Add XP Transaction
        transaction = XPTransaction(
            user_id=user_id,
            amount=amount,
            source=source,
        )
        db.add(transaction)

        # Update total XP
        progress.total_xp += amount
        
        # Recalculate level
        new_level, _ = cls.get_level_info(progress.total_xp)
        if new_level > progress.current_level:
            progress.current_level = new_level
            logger.info(f"User {user_id} leveled up to {new_level}!")
            
        progress.updated_at = datetime.now(timezone.utc)
        return progress

    @classmethod
    async def update_daily_streak(cls, db: AsyncSession, user_id: uuid.UUID) -> int:
        result = await db.execute(select(Progress).where(Progress.user_id == user_id))
        progress = result.scalar_one_or_none()
        if not progress:
            return 0

        today = date.today()
        if progress.last_active_date is None:
            progress.streak_days = 1
            progress.last_active_date = today
            await cls.add_xp(db, user_id, 100, "daily_streak")
        else:
            diff = (today - progress.last_active_date).days
            if diff == 1:
                # Consecutive day active
                progress.streak_days += 1
                progress.last_active_date = today
                # Grant streak bonus XP
                await cls.add_xp(db, user_id, 100 * progress.streak_days, "daily_streak")
            elif diff > 1:
                # Streak broken
                progress.streak_days = 1
                progress.last_active_date = today
                await cls.add_xp(db, user_id, 100, "daily_streak")
        
        return progress.streak_days

    @classmethod
    async def evaluate_achievements(cls, db: AsyncSession, user_id: uuid.UUID) -> list[str]:
        # Pre-seed achievements in case they aren't initialized
        for defn in ACHIEVEMENT_DEFINITIONS:
            chk = await db.execute(select(Achievement).where(Achievement.id == defn["id"]))
            if not chk.scalar_one_or_none():
                db.add(Achievement(**defn))
        await db.flush()

        unlocked_ids = []
        
        # Get user's unlocked badges
        badge_result = await db.execute(select(Badge.achievement_id).where(Badge.user_id == user_id))
        unlocked = set(badge_result.scalars().all())

        # Evaluate "early-bird"
        if "early-bird" not in unlocked:
            # Check if user has completed any Focus session before 8:00 AM
            sessions_query = (
                select(FocusSession)
                .join(LearningSession)
                .where(
                    LearningSession.user_id == user_id,
                    FocusSession.completed == True,
                    FocusSession.mode == "FOCUS"
                )
            )
            f_sess = await db.execute(sessions_query)
            for fs in f_sess.scalars().all():
                local_time = fs.created_at.time()
                if local_time < time(8, 0):
                    # Unlock Badge
                    db.add(Badge(user_id=user_id, achievement_id="early-bird"))
                    await cls.add_xp(db, user_id, 150, "achievement_unlock")
                    unlocked_ids.append("early-bird")
                    break

        # Evaluate "consistency-pro"
        if "consistency-pro" not in unlocked:
            progress_res = await db.execute(select(Progress).where(Progress.user_id == user_id))
            progress = progress_res.scalar_one_or_none()
            if progress and progress.streak_days >= 7:
                db.add(Badge(user_id=user_id, achievement_id="consistency-pro"))
                await cls.add_xp(db, user_id, 300, "achievement_unlock")
                unlocked_ids.append("consistency-pro")

        # Evaluate "vocabulary-guru"
        if "vocabulary-guru" not in unlocked:
            # Check total completed chunks
            chunks_query = (
                select(LearningSession.completed_chunks)
                .where(LearningSession.user_id == user_id)
            )
            res = await db.execute(chunks_query)
            total_chunks = sum(res.scalars().all())
            if total_chunks >= 25:
                db.add(Badge(user_id=user_id, achievement_id="vocabulary-guru"))
                await cls.add_xp(db, user_id, 200, "achievement_unlock")
                unlocked_ids.append("vocabulary-guru")

        if unlocked_ids:
            await db.commit()
            
        return unlocked_ids
