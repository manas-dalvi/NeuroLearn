# backend/app/services/ai/base.py
from abc import ABC, abstractmethod


class BaseAIService(ABC):
    @abstractmethod
    async def simplify_text(self, text: str, profile_type: str, reading_level: str) -> str:
        """
        Simplify the provided text according to the cognitive profile type and reading level.
        
        Args:
            text (str): The original source text to simplify.
            profile_type (str): The neurodivergent profile ('adhd', 'dyslexia', 'autism').
            reading_level (str): The reading level ('beginner', 'intermediate', 'advanced').
            
        Returns:
            str: The simplified/adapted text content.
        """
        pass
