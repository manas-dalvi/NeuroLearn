import asyncio
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from app.core.database import SessionLocal, Base
from app.models.session import LearningSession, LearningChunk, FocusSession

async def check():
    db = SessionLocal()
    try:
        # Get last 5 learning sessions
        res = await db.execute(
            select(LearningSession)
            .order_by(LearningSession.started_at.desc())
            .options(selectinload(LearningSession.chunks))
            .limit(5)
        )
        sessions = res.scalars().all()
        print("--- LATEST LEARNING SESSIONS ---")
        for s in sessions:
            print(f"Session ID: {s.id}, Title: {s.content_title}, Chunks: {len(s.chunks)}, Focus Mins: {s.total_focus_minutes}, Completed Chunks: {s.completed_chunks}, Started: {s.started_at}")

        # Get last 20 focus sessions
        res_f = await db.execute(
            select(FocusSession)
            .order_by(FocusSession.created_at.desc())
            .limit(20)
        )
        focus_sessions = res_f.scalars().all()
        print("\n--- LATEST FOCUS SESSIONS ---")
        for f in focus_sessions:
            print(f"FocusSession ID: {f.id}, Session ID: {f.session_id}, Chunk ID: {f.chunk_id}, Mode: {f.mode}, Duration: {f.duration_seconds}s, Completed: {f.completed}, Created: {f.created_at}")
    finally:
        await db.close()

if __name__ == "__main__":
    asyncio.run(check())
