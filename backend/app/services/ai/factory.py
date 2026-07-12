# backend/app/services/ai/factory.py
import logging
from app.core.config import settings
from app.services.ai.base import BaseAIService
from app.services.ai.gemini import GeminiAIService
from app.services.ai.groq import GroqAIService

logger = logging.getLogger(__name__)


def get_ai_service() -> BaseAIService:
    provider = settings.AI_PROVIDER.lower().strip()
    if provider == "groq":
        logger.info("Initializing Groq AI Service.")
        return GroqAIService()
    else:
        if provider != "gemini":
            logger.warning(f"Unknown AI_PROVIDER '{provider}'. Defaulting to Gemini.")
        logger.info("Initializing Gemini AI Service.")
        return GeminiAIService()
