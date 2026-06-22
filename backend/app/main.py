# backend/app/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.database import engine, Base
from app.core.redis import get_redis_client
from app.models import user as user_model, profile as profile_model, session as session_model, gamification as gamification_model, routine as routine_model, notification as notification_model
from app.api.v1 import auth, profile, sessions, focus, gamification, routines, notifications

# Initialize FastAPI app
app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url=f"{settings.API_V1_STR}/docs",
    redoc_url=f"{settings.API_V1_STR}/redoc",
)

# Configure CORS middleware
if settings.BACKEND_CORS_ORIGINS:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[str(origin) for origin in settings.BACKEND_CORS_ORIGINS],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )


@app.on_event("startup")
async def startup_event():
    # Auto-create tables for local development convenience
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    # Initialize Redis connection
    await get_redis_client()


@app.on_event("shutdown")
async def shutdown_event():
    # Close database connections
    await engine.dispose()
    
    # Close Redis client
    from app.core.redis import redis_client
    if redis_client:
        await redis_client.close()


# Healthcheck Endpoint
@app.get(f"{settings.API_V1_STR}/health", tags=["Health"])
async def health_check():
    return {
        "status": "healthy",
        "database": "connected",
        "project": settings.PROJECT_NAME
    }


@app.post("/api/test-groq", tags=["Verification"])
async def test_groq_endpoint(payload: dict = None):
    from app.services.ai.factory import get_ai_service
    from app.services.ai.groq import GroqAIService
    try:
        service = get_ai_service()
        if not isinstance(service, GroqAIService):
            return {
                "status": "error",
                "message": f"Active AI provider is not Groq. Current provider: {settings.AI_PROVIDER}"
            }
        
        prompt = (payload or {}).get("prompt", "Hello! This is a test request from the Neurolearn verification suite. Please reply in one short sentence confirming that you received this.")
        
        # Call the simplify method (or generic generation)
        # Using dyslexia profile for clean simple text output
        simplified_res = await service.simplify_text(
            text=prompt,
            profile_type="dyslexia",
            reading_level="intermediate"
        )
        
        is_mock = simplified_res.startswith("• **Key Idea**:") or "Hierarchical Temporal Memory" in simplified_res or simplified_res.startswith("Step 1:")
        
        return {
            "status": "success" if not is_mock else "mock_fallback",
            "provider": "groq",
            "model": settings.GROQ_MODEL,
            "prompt": prompt,
            "response": simplified_res,
            "api_key_loaded": bool(settings.GROQ_API_KEY)
        }
    except Exception as e:
        import traceback
        return {
            "status": "error",
            "message": str(e),
            "traceback": traceback.format_exc()
        }


# Register API routers
app.include_router(auth.router, prefix=f"{settings.API_V1_STR}/auth", tags=["Authentication"])
app.include_router(profile.router, prefix=f"{settings.API_V1_STR}/profile", tags=["Profiles"])
app.include_router(sessions.router, prefix=f"{settings.API_V1_STR}", tags=["Sessions"])
app.include_router(focus.router, prefix=f"{settings.API_V1_STR}/focus", tags=["Focus"])
app.include_router(gamification.router, prefix=f"{settings.API_V1_STR}", tags=["Gamification"])
app.include_router(routines.router, prefix=f"{settings.API_V1_STR}/routines", tags=["Routines"])
app.include_router(notifications.router, prefix=f"{settings.API_V1_STR}/notifications", tags=["Notifications"])
