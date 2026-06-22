import asyncio
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from app.core.database import SessionLocal, Base
from app.models.session import LearningSession, LearningChunk

async def check():
    db = SessionLocal()
    try:
        # Get last 5 sessions
        res = await db.execute(
            select(LearningSession)
            .order_by(LearningSession.started_at.desc())
            .options(selectinload(LearningSession.chunks))
            .limit(5)
        )
        sessions = res.scalars().all()
        for s in sessions:
            print(f"Session ID: {s.id}, Title: {s.content_title}, Chunks: {len(s.chunks)}")
            for c in s.chunks:
                print(f"  Chunk {c.chunk_index}: Original (len {len(c.original_text)}): {c.original_text[:100]}")
                print(f"  Chunk {c.chunk_index}: Simplified (len {len(c.simplified_text)}): {c.simplified_text[:100]}")
    finally:
        await db.close()

if __name__ == "__main__":
    asyncio.run(check())
