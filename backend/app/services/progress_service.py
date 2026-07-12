# backend/app/services/progress_service.py
import uuid
import logging
from datetime import datetime, timezone, date, time
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from app.models.gamification import Progress, XPTransaction, Badge, Achievement, Goal
from app.models.session import FocusSession, LearningSession, SimplifiedContent, QuizAttempt

logger = logging.getLogger(__name__)

# Standard platform achievements definitions mapping
ACHIEVEMENT_DEFINITIONS = [
    {
        "id": "first-upload",
        "name": "Document Explorer",
        "description": "Uploaded your first study document.",
        "xp_reward": 100,
        "criteria_type": "upload_count",
        "criteria_value": 1,
    },
    {
        "id": "simplifier-novice",
        "name": "Micro Scholar",
        "description": "Simplified 5 study documents.",
        "xp_reward": 150,
        "criteria_type": "passages_count",
        "criteria_value": 5,
    },
    {
        "id": "simplifier-master",
        "name": "Concept Curator",
        "description": "Simplified 15 study documents.",
        "xp_reward": 300,
        "criteria_type": "passages_count",
        "criteria_value": 15,
    },
    {
        "id": "segment-starter",
        "name": "Chunk Starter",
        "description": "Read your first simplified segment.",
        "xp_reward": 50,
        "criteria_type": "chunks_completed",
        "criteria_value": 1,
    },
    {
        "id": "segment-scholar",
        "name": "Segment Scholar",
        "description": "Completed 25 reading segments.",
        "xp_reward": 200,
        "criteria_type": "chunks_completed",
        "criteria_value": 25,
    },
    {
        "id": "deep-reader",
        "name": "Deep Reader",
        "description": "Completed 50 reading segments.",
        "xp_reward": 350,
        "criteria_type": "chunks_completed",
        "criteria_value": 50,
    },
    {
        "id": "volume-reader",
        "name": "Volume Reader",
        "description": "Completed 100 reading segments.",
        "xp_reward": 500,
        "criteria_type": "chunks_completed",
        "criteria_value": 100,
    },
    {
        "id": "master-scholar",
        "name": "Master Scholar",
        "description": "Completed 200 reading segments.",
        "xp_reward": 1000,
        "criteria_type": "chunks_completed",
        "criteria_value": 200,
    },
    {
        "id": "focus-initiate",
        "name": "Focus Initiate",
        "description": "Completed a Pomodoro study interval.",
        "xp_reward": 100,
        "criteria_type": "focus_sessions",
        "criteria_value": 1,
    },
    {
        "id": "deep-work-novice",
        "name": "Focus Enthusiast",
        "description": "Completed 5 Pomodoro focus sessions.",
        "xp_reward": 200,
        "criteria_type": "focus_sessions",
        "criteria_value": 5,
    },
    {
        "id": "focus-scholar",
        "name": "Focus Scholar",
        "description": "Logged 2 hours of focus study time.",
        "xp_reward": 300,
        "criteria_type": "focus_minutes",
        "criteria_value": 120,
    },
    {
        "id": "focus-titan",
        "name": "Focus Titan",
        "description": "Logged 10 hours of focus study time.",
        "xp_reward": 500,
        "criteria_type": "focus_minutes",
        "criteria_value": 600,
    },
    {
        "id": "streak-starter",
        "name": "Streak Starter",
        "description": "Maintained a 3-day learning streak.",
        "xp_reward": 150,
        "criteria_type": "streak",
        "criteria_value": 3,
    },
    {
        "id": "consistency-pro",
        "name": "Consistency Pro",
        "description": "Maintained a 7-day learning streak.",
        "xp_reward": 300,
        "criteria_type": "streak",
        "criteria_value": 7,
    },
    {
        "id": "streak-legend",
        "name": "Streak Legend",
        "description": "Maintained a 30-day learning streak.",
        "xp_reward": 1000,
        "criteria_type": "streak",
        "criteria_value": 30,
    },
    {
        "id": "quiz-starter",
        "name": "Quiz Starter",
        "description": "Completed your first adaptive quiz.",
        "xp_reward": 100,
        "criteria_type": "quizzes_completed",
        "criteria_value": 1,
    },
    {
        "id": "quiz-conqueror",
        "name": "Quiz Conqueror",
        "description": "Completed 5 adaptive quizzes.",
        "xp_reward": 150,
        "criteria_type": "quizzes_completed",
        "criteria_value": 5,
    },
    {
        "id": "quiz-master",
        "name": "Quiz Master",
        "description": "Completed 20 adaptive quizzes.",
        "xp_reward": 400,
        "criteria_type": "quizzes_completed",
        "criteria_value": 20,
    },
    {
        "id": "perfect-score",
        "name": "Perfect Score",
        "description": "Scored 100% on a comprehension check.",
        "xp_reward": 300,
        "criteria_type": "perfect_score",
        "criteria_value": 1,
    },
    {
        "id": "level-scholar",
        "name": "Level Scholar",
        "description": "Reached learner Level 3.",
        "xp_reward": 250,
        "criteria_type": "level",
        "criteria_value": 3,
    },
    {
        "id": "level-legend",
        "name": "Level Legend",
        "description": "Reached learner Level 10.",
        "xp_reward": 1000,
        "criteria_type": "level",
        "criteria_value": 10,
    },
    {
        "id": "goal-crusher",
        "name": "Goal Crusher",
        "description": "Completed your daily learning goal for the first time.",
        "xp_reward": 150,
        "criteria_type": "goals_completed",
        "criteria_value": 1,
    },
    {
        "id": "goal-legend",
        "name": "Goal Legend",
        "description": "Completed your daily learning goal 7 times.",
        "xp_reward": 400,
        "criteria_type": "goals_completed",
        "criteria_value": 7,
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
            level = 6 + int((total_xp - 4000) / 2000)
            next_threshold = 4000 + (level - 5) * 2000
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

        today = datetime.now(timezone.utc).date()
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
        from sqlalchemy import delete, update

        # 1. Migrate old vocabulary-guru badge records to segment-scholar if they exist
        await db.execute(
            update(Badge)
            .where(Badge.achievement_id == "vocabulary-guru")
            .values(achievement_id="segment-scholar")
        )
        await db.flush()

        # 2. Clean up old achievements that are no longer in our list
        current_ids = [defn["id"] for defn in ACHIEVEMENT_DEFINITIONS]
        await db.execute(delete(Achievement).where(Achievement.id.not_in(current_ids)))
        await db.flush()

        # 3. Synchronize achievement definitions (Upsert)
        for defn in ACHIEVEMENT_DEFINITIONS:
            chk = await db.execute(select(Achievement).where(Achievement.id == defn["id"]))
            ach = chk.scalar_one_or_none()
            if ach:
                ach.name = defn["name"]
                ach.description = defn["description"]
                ach.xp_reward = defn["xp_reward"]
                ach.criteria_type = defn["criteria_type"]
                ach.criteria_value = defn["criteria_value"]
            else:
                db.add(Achievement(**defn))
        await db.flush()

        unlocked_ids = []
        
        # Get user's unlocked badges
        badge_result = await db.execute(select(Badge.achievement_id).where(Badge.user_id == user_id))
        unlocked = set(badge_result.scalars().all())

        # Load all user statistics
        progress_res = await db.execute(select(Progress).where(Progress.user_id == user_id))
        progress = progress_res.scalar_one_or_none()
        streak_days = progress.streak_days if progress else 0
        current_level = progress.current_level if progress else 1
        
        # Load user profile for daily target sessions
        from app.models.profile import Profile
        profile_res = await db.execute(select(Profile).where(Profile.user_id == user_id))
        profile = profile_res.scalar_one_or_none()
        target_sessions = profile.daily_goal_target if profile else 4

        uploads_res = await db.execute(select(SimplifiedContent).where(SimplifiedContent.user_id == user_id))
        uploads_count = len(uploads_res.scalars().all())

        chunks_query = select(LearningSession.completed_chunks).where(LearningSession.user_id == user_id)
        res = await db.execute(chunks_query)
        total_chunks = sum(res.scalars().all())

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
        focus_count = len(f_sess.scalars().all())

        focus_min_query = select(LearningSession.total_focus_minutes).where(LearningSession.user_id == user_id)
        min_res = await db.execute(focus_min_query)
        total_focus_minutes = sum(min_res.scalars().all())

        quiz_query = select(QuizAttempt).join(LearningSession).where(LearningSession.user_id == user_id)
        quizzes_res = await db.execute(quiz_query)
        quizzes_list = list(quizzes_res.scalars().all())
        quizzes_count = len(quizzes_list)
        has_perfect_score = any(q.score >= 100.0 or q.accuracy >= 100.0 for q in quizzes_list)

        # Calculate completed daily goals (sessions completed today >= daily target sessions)
        # Distinct dates where user completed chunks > 0
        goal_sessions_query = (
            select(LearningSession.started_at)
            .where(
                LearningSession.user_id == user_id,
                LearningSession.completed_chunks > 0
            )
        )
        goal_res = await db.execute(goal_sessions_query)
        sessions_dates = [s.date() for s in goal_res.scalars().all()]
        from collections import Counter
        sessions_per_date = Counter(sessions_dates)
        completed_days_count = sum(1 for d, count in sessions_per_date.items() if count >= target_sessions)

        # Helper to unlock badge
        async def unlock(ach_id: str, xp: int):
            if ach_id not in unlocked:
                db.add(Badge(user_id=user_id, achievement_id=ach_id))
                await cls.add_xp(db, user_id, xp, "achievement_unlock")
                unlocked_ids.append(ach_id)

        # Evaluate all 23 achievements:
        if uploads_count >= 1:
            await unlock("first-upload", 100)
        if uploads_count >= 5:
            await unlock("simplifier-novice", 150)
        if uploads_count >= 15:
            await unlock("simplifier-master", 300)

        if total_chunks >= 1:
            await unlock("segment-starter", 50)
        if total_chunks >= 25:
            await unlock("segment-scholar", 200)
        if total_chunks >= 50:
            await unlock("deep-reader", 350)
        if total_chunks >= 100:
            await unlock("volume-reader", 500)
        if total_chunks >= 200:
            await unlock("master-scholar", 1000)

        if focus_count >= 1:
            await unlock("focus-initiate", 100)
        if focus_count >= 5:
            await unlock("deep-work-novice", 200)
        if total_focus_minutes >= 120:
            await unlock("focus-scholar", 300)
        if total_focus_minutes >= 600:
            await unlock("focus-titan", 500)

        if streak_days >= 3:
            await unlock("streak-starter", 150)
        if streak_days >= 7:
            await unlock("consistency-pro", 300)
        if streak_days >= 30:
            await unlock("streak-legend", 1000)

        if quizzes_count >= 1:
            await unlock("quiz-starter", 100)
        if quizzes_count >= 5:
            await unlock("quiz-conqueror", 150)
        if quizzes_count >= 20:
            await unlock("quiz-master", 400)
        if has_perfect_score:
            await unlock("perfect-score", 300)

        if current_level >= 3:
            await unlock("level-scholar", 250)
        if current_level >= 10:
            await unlock("level-legend", 1000)

        if completed_days_count >= 1:
            await unlock("goal-crusher", 150)
        if completed_days_count >= 7:
            await unlock("goal-legend", 400)

        if unlocked_ids:
            await db.commit()
            
        return unlocked_ids

    @classmethod
    def get_quest_details(cls, goal_type: str, target_value: int) -> dict:
        mapping = {
            "read_chunks": {
                "name": "The Scholar",
                "description": f"Complete {target_value} reading segments in the Focus workspace.",
                "xp_reward": 50
            },
            "focus_minutes": {
                "name": "Deep Work",
                "description": f"Log {target_value} minutes of active Pomodoro focus study.",
                "xp_reward": 50
            },
            "complete_quizzes": {
                "name": "Active Recaller",
                "description": f"Finish {target_value} adaptive comprehension check(s).",
                "xp_reward": 50
            },
            "upload_content": {
                "name": "Concept Creator",
                "description": f"Upload and simplify {target_value} new study document(s).",
                "xp_reward": 50
            },
            "complete_routine": {
                "name": "Daily Habit",
                "description": "Complete today's study routine.",
                "xp_reward": 50
            }
        }
        return mapping.get(goal_type, {
            "name": "Daily Quest",
            "description": f"Complete daily objective.",
            "xp_reward": 50
        })

    @classmethod
    async def get_or_create_daily_quests(cls, db: AsyncSession, user_id: uuid.UUID) -> list[Goal]:
        import random
        today = datetime.now(timezone.utc).date()
        
        # Check if quests for today exist
        stmt = (
            select(Goal)
            .where(
                Goal.user_id == user_id,
                Goal.period == "daily",
                Goal.target_date == today
            )
        )
        res = await db.execute(stmt)
        quests = list(res.scalars().all())
        
        if quests:
            # Self-healing deduplication for concurrent creation races
            unique_quests = []
            seen_types = set()
            duplicates_to_delete = []
            for q in quests:
                if q.goal_type not in seen_types:
                    seen_types.add(q.goal_type)
                    unique_quests.append(q)
                else:
                    duplicates_to_delete.append(q)
            
            if duplicates_to_delete:
                for dup in duplicates_to_delete:
                    await db.delete(dup)
                await db.commit()
            
            return unique_quests[:3]
            
        # Seed daily quests deterministically based on user ID and target date
        random.seed(f"{user_id}-{today}")
        quest_types = ["read_chunks", "focus_minutes", "complete_quizzes", "upload_content", "complete_routine"]
        selected = random.sample(quest_types, 3)
        
        targets = {
            "read_chunks": 5,
            "focus_minutes": 25,
            "complete_quizzes": 1,
            "upload_content": 1,
            "complete_routine": 1
        }
        
        new_quests = []
        for q_type in selected:
            quest = Goal(
                user_id=user_id,
                goal_type=q_type,
                target_value=targets.get(q_type, 1),
                current_value=0,
                period="daily",
                target_date=today,
                completed=False
            )
            db.add(quest)
            new_quests.append(quest)
            
        await db.commit()
        return new_quests

    @classmethod
    async def update_quest_progress(cls, db: AsyncSession, user_id: uuid.UUID, quest_type: str, increment: int):
        # Trigger lazy seed if quests don't exist yet for today
        today = datetime.now(timezone.utc).date()
        quests = await cls.get_or_create_daily_quests(db, user_id)
        
        # Find active matching quest
        target_quest = None
        for q in quests:
            if q.goal_type == quest_type:
                target_quest = q
                break
                
        if not target_quest or target_quest.completed:
            return
            
        # Update current value
        target_quest.current_value = min(target_quest.target_value, target_quest.current_value + increment)
        
        # Check completion
        if target_quest.current_value >= target_quest.target_value:
            target_quest.completed = True
            details = cls.get_quest_details(target_quest.goal_type, target_quest.target_value)
            await cls.add_xp(db, user_id, details["xp_reward"], "quest_completion")
            
            # Check if all daily quests for today are completed
            all_done = all(q.completed for q in quests)
            if all_done:
                # Award 100 XP daily completion bonus
                await cls.add_xp(db, user_id, 100, "daily_quest_bonus")
                
        await db.commit()
