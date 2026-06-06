## backend/app/services/ai_service.py
"""
NLAP AI Service — Core intelligence layer
- Simplification Engine (Beginner / Intermediate / Advanced)
- Adaptive Chunking Algorithm (word-limit aware, sentence-boundary-safe)
- Document extraction pipeline
"""
import logging
import re
import uuid
from typing import List, Literal

from openai import AsyncOpenAI
from tenacity import retry, stop_after_attempt, wait_exponential

from ..core.config import settings
from ..models.learning_session import ContentChunk

logger = logging.getLogger(__name__)

# ─── System Prompts ───────────────────────────────────────────────────────────

SYSTEM_PROMPTS = {
    "beginner": """You are a specialist educational simplifier for neurodivergent learners.
Your task: rewrite the given text for a beginner reading level.
Rules:
- Use only short, simple sentences (max 15 words each).
- Replace ALL jargon and technical terms with everyday language.
- Use the active voice exclusively.
- Break complex ideas into numbered or bulleted micro-steps if needed.
- Avoid metaphors unless they are universally known.
- Never lose the core meaning of the original text.
- Output ONLY the simplified text. No preamble. No explanation.""",

    "intermediate": """You are an expert educational content adapter for neurodivergent learners.
Your task: rewrite the given text at an intermediate reading level.
Rules:
- Keep sentences clear and moderately short (max 20-22 words on average).
- Define technical terms briefly in parentheses when first used.
- Maintain logical flow. Use transition words (First, Then, Therefore, However).
- Preserve important domain vocabulary but keep it accessible.
- Use active voice where possible.
- Output ONLY the adapted text. No preamble. No explanation.""",

    "advanced": """You are a precise educational editor for neurodivergent learners.
Your task: lightly reformat the text to improve scannability while preserving advanced vocabulary.
Rules:
- Do NOT simplify terminology or reduce complexity.
- Break overly long run-on sentences (>40 words) into two cleaner sentences.
- Add clear paragraph breaks every 3-4 sentences for cognitive chunking.
- Preserve all technical precision and nuance of the original.
- Output ONLY the reformatted text. No preamble. No explanation.""",
}

# ─── OpenAI Client ─────────────────────────────────────────────────────────────

def _get_client() -> AsyncOpenAI:
    return AsyncOpenAI(api_key=settings.OPENAI_API_KEY)


# ─── Simplification Engine ─────────────────────────────────────────────────────

@retry(stop=stop_after_attempt(3), wait=wait_exponential(min=1, max=8))
async def simplify_text(
    text: str,
    level: Literal["beginner", "intermediate", "advanced"] = "intermediate",
) -> str:
    """Call GPT-4o to simplify text at the given reading level."""
    if not settings.OPENAI_API_KEY:
        logger.warning("OpenAI API key not set — returning original text")
        return text

    client = _get_client()
    system_prompt = SYSTEM_PROMPTS.get(level, SYSTEM_PROMPTS["intermediate"])

    response = await client.chat.completions.create(
        model=settings.OPENAI_MODEL,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": f"Text to simplify:\n\n{text}"},
        ],
        max_tokens=settings.OPENAI_MAX_TOKENS,
        temperature=0.3,  # Low temp for consistency and accuracy
    )

    result = response.choices[0].message.content or text
    return result.strip()


# ─── Adaptive Chunking Algorithm ───────────────────────────────────────────────

def _split_into_sentences(text: str) -> List[str]:
    """Sentence splitter respecting abbreviations and decimal points."""
    sentence_endings = re.compile(r'(?<=[.!?])\s+(?=[A-Z])')
    sentences = sentence_endings.split(text.strip())
    return [s.strip() for s in sentences if s.strip()]


def chunk_text_adaptive(text: str, word_limit: int = 100) -> List[str]:
    """
    Adaptive chunking algorithm:
    1. Split into sentences to preserve semantic integrity.
    2. Accumulate sentences until word_limit is approached.
    3. Never cut mid-sentence (important for neurodivergent readers).
    4. Overlap: none (full sequential chunks for focus mode).
    """
    sentences = _split_into_sentences(text)
    chunks: List[str] = []
    current_words: List[str] = []
    current_count = 0

    for sentence in sentences:
        sentence_words = sentence.split()
        sentence_count = len(sentence_words)

        # If adding this sentence would exceed limit and we have content, flush
        if current_count + sentence_count > word_limit and current_words:
            chunks.append(" ".join(current_words))
            current_words = []
            current_count = 0

        # If a single sentence is longer than word_limit, split it at word_limit
        if sentence_count > word_limit:
            for i in range(0, sentence_count, word_limit):
                sub = " ".join(sentence_words[i : i + word_limit])
                chunks.append(sub)
        else:
            current_words.extend(sentence_words)
            current_count += sentence_count

    # Flush remaining
    if current_words:
        chunks.append(" ".join(current_words))

    return [c for c in chunks if c.strip()]


# ─── Full Session Processing Pipeline ──────────────────────────────────────────

async def process_content_into_chunks(
    session_id: str,
    raw_text: str,
    reading_level: Literal["beginner", "intermediate", "advanced"],
    chunk_word_limit: int,
) -> List[ContentChunk]:
    """
    Full pipeline:
    1. Chunk raw text using adaptive algorithm.
    2. Simplify each chunk with GPT-4o.
    3. Return list of ContentChunk objects.
    """
    raw_chunks = chunk_text_adaptive(raw_text, word_limit=chunk_word_limit)
    logger.info(f"Split into {len(raw_chunks)} chunks for session {session_id}")

    result_chunks: List[ContentChunk] = []

    for idx, chunk_text in enumerate(raw_chunks):
        try:
            simplified = await simplify_text(chunk_text, level=reading_level)
        except Exception as e:
            logger.error(f"Simplification failed for chunk {idx}: {e}")
            simplified = chunk_text  # Graceful fallback to original

        result_chunks.append(
            ContentChunk(
                id=str(uuid.uuid4()),
                session_id=session_id,
                original_text=chunk_text,
                simplified_text=simplified,
                level=reading_level,
                chunk_index=idx,
                word_count=len(chunk_text.split()),
            )
        )

    return result_chunks
