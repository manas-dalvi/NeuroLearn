# backend/app/services/study_assistant_service.py
import logging
import uuid
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload

from app.models.session import ChatMessage, LearningSession, LearningChunk
from app.models.profile import Profile
from app.services.rag_service import RagService
from app.services.ai.factory import get_ai_service
from app.services.ai.groq import GroqAIService
from app.services.ai.gemini import GeminiAIService
from app.schemas.session import ChunkChatRequest, ChunkChatResponse, SourceMetadata

logger = logging.getLogger(__name__)


class StudyAssistantService:
    def _get_cognitive_instruction(self, profile_type: str) -> str:
        """Get cognitive-profile-specific prompt rules for LLM formatting."""
        p_type = profile_type.lower()
        if p_type == "adhd":
            return (
                "Format the response to help a student with ADHD stay engaged:\n"
                "- Use bullet points frequently.\n"
                "- Highlight key definitions or takeaways in **bold**.\n"
                "- Keep explanations punchy and short (avoid long blocks of text).\n"
                "- Put the core answer in a single sentence at the very top."
            )
        elif p_type == "autism":
            return (
                "Format the response to help a student with Autism:\n"
                "- Provide a literal, objective, and logical response.\n"
                "- Do NOT use metaphors, idioms, sarcasm, or analogies.\n"
                "- Break down multi-step concepts into chronological, numbered lists.\n"
                "- Keep the language direct and clear."
            )
        elif p_type == "dyslexia":
            return (
                "Format the response to help a student with Dyslexia:\n"
                "- Use simpler vocabulary and clear, short sentences (max 15 words per sentence).\n"
                "- Do not write dense paragraphs. Insert empty line breaks (double newlines) between sentences.\n"
                "- Avoid complex structures or heavy markdown formatting. Keep the visual density low."
            )
        else:
            return "Keep explanation simple, clear, and structured."

    async def get_chat_history(self, db: AsyncSession, session_id: str) -> List[ChatMessage]:
        """Fetch message logs for a session ordered by creation time."""
        result = await db.execute(
            select(ChatMessage)
            .where(ChatMessage.session_id == session_id)
            .order_by(ChatMessage.created_at.asc())
        )
        return list(result.scalars().all())

    async def interact_with_assistant(
        self, db: AsyncSession, user_id: uuid.UUID, payload: ChunkChatRequest
    ) -> ChunkChatResponse:
        """
        Orchestrate context retrieval, prompt building, LLM execution,
        and database message persistence.
        """
        session_id = payload.session_id
        chunk_id = payload.chunk_id
        question = payload.question.strip()

        # 1. Fetch student cognitive profile settings
        prof_res = await db.execute(select(Profile).where(Profile.user_id == user_id))
        profile = prof_res.scalar_one_or_none()
        profile_type = profile.diagnosis_type if profile else "dyslexia"
        reading_level = profile.reading_level if profile else "intermediate"

        # 2. Retrieve context using RAG semantic matching
        context_block = ""
        sources: List[SourceMetadata] = []
        confidence_score = 0.0
        confidence_level = "Low"

        # Import helper inside function to prevent circular import if any
        from app.api.v1.sessions import extract_chunk_title

        # Document-wide query using RAG semantic matching
        rag = RagService()
        retrieved_chunks = rag.retrieve_context(session_id, question, top_k=4)

        # If a specific chunk_id was requested, guarantee its inclusion in context
        if chunk_id:
            has_requested_chunk = any(c.get("id") == chunk_id for c in retrieved_chunks)
            if not has_requested_chunk:
                chunk_res = await db.execute(
                    select(LearningChunk).where(
                        LearningChunk.id == chunk_id, LearningChunk.session_id == session_id
                    )
                )
                chunk = chunk_res.scalar_one_or_none()
                if chunk:
                    # Prioritize the clicked chunk
                    retrieved_chunks.insert(0, {
                        "id": chunk.id,
                        "text": chunk.simplified_text,
                        "score": 1.0,
                        "distance": 0.0,
                        "metadata": {"chunk_index": chunk.chunk_index}
                    })
                    if len(retrieved_chunks) > 5:
                        retrieved_chunks = retrieved_chunks[:5]

        if retrieved_chunks:
            context_parts = []
            max_score = 0.0
            for idx, chunk in enumerate(retrieved_chunks):
                meta = chunk.get("metadata") or {}
                chunk_idx = meta.get("chunk_index", 0)
                cid = chunk.get("id") or f"chunk-{session_id}-{chunk_idx}"
                text = chunk.get("text", "")
                
                title = extract_chunk_title(text)
                sources.append(
                    SourceMetadata(
                        chunk_id=cid, chunk_index=chunk_idx, title=title
                    )
                )
                context_parts.append(
                    f"[Context Chunk #{idx + 1} (Source Index {chunk_idx})]:\n{text}"
                )
                score = chunk.get("score", 0.0)
                if score > max_score:
                    max_score = score
            
            context_block = "\n\n---\n\n".join(context_parts)
            confidence_score = max_score
            
            # Semantic Confidence Level mapping
            if confidence_score >= 0.70:
                confidence_level = "High"
            elif confidence_score >= 0.45:
                confidence_level = "Medium"
            else:
                confidence_level = "Low"

        # 3. Handle low-confidence grounding fallbacks (prevent hallucinations)
        if not context_block or confidence_score < 0.40:
            fallback_answer = "I cannot find the answer in the provided document."
            # Persist Q&A to history database even if fallback
            user_msg = ChatMessage(session_id=session_id, chunk_id=chunk_id, role="user", content=question)
            tutor_msg = ChatMessage(session_id=session_id, chunk_id=chunk_id, role="assistant", content=fallback_answer)
            db.add_all([user_msg, tutor_msg])
            await db.commit()

            return ChunkChatResponse(
                answer=fallback_answer,
                sources=[],
                confidence_score=confidence_score,
                confidence_level="Low"
            )

        # 4. Pull chat history context (limit to last 8 messages for token savings)
        history_msgs = await db.execute(
            select(ChatMessage)
            .where(ChatMessage.session_id == session_id)
            .order_by(ChatMessage.created_at.desc())
            .limit(8)
        )
        history_list = list(history_msgs.scalars().all())
        history_list.reverse()  # Chronological order

        # 5. Format system instructions and prompt context
        cognitive_instruction = self._get_cognitive_instruction(profile_type)
        system_prompt = (
            "You are an expert educational AI tutor helping a student understand their reading material.\n"
            "Answer the user's question based strictly on the provided document context.\n"
            "If the answer cannot be found or inferred from the context, respond exactly with:\n"
            "\"I cannot find the answer in the provided document.\"\n"
            "Do not use outside knowledge. Keep the explanation simple, clear, and grounded only in the context.\n\n"
            f"{cognitive_instruction}"
        )

        user_content = f"Document Context:\n{context_block}\n\nStudent Question: {question}\n\nProvide a helpful answer:"

        logger.info(f"RAG_SERVICE: context sent to LLM: {context_block}")

        # 6. Call active AI completion client (Groq or Gemini)
        ai_service = get_ai_service()
        answer = ""

        if isinstance(ai_service, GroqAIService) and ai_service.has_client:
            logger.info(f"Orchestrating chat via Groq API. Active model: {ai_service.model}")
            messages = [{"role": "system", "content": system_prompt}]
            for msg in history_list:
                messages.append({"role": msg.role, "content": msg.content})
            messages.append({"role": "user", "content": user_content})

            try:
                response = await ai_service.client.chat.completions.create(
                    model=ai_service.model,
                    messages=messages,
                    temperature=0.2,
                )
                answer = response.choices[0].message.content.strip()
            except Exception as e:
                logger.error(f"Error calling Groq API in StudyAssistantService: {e}", exc_info=True)
                answer = "Error: Failed to fetch answer from AI client."
        elif isinstance(ai_service, GeminiAIService) and ai_service.has_client:
            logger.info("Orchestrating chat via Gemini API.")
            # Build full inline history prompt for Gemini
            prompt_parts = [system_prompt, "\nConversation History:\n"]
            for msg in history_list:
                prompt_parts.append(f"{msg.role.upper()}: {msg.content}\n")
            prompt_parts.append(f"\n{user_content}")
            full_prompt = "".join(prompt_parts)

            try:
                import asyncio
                loop = asyncio.get_event_loop()
                response = await loop.run_in_executor(
                    None,
                    lambda: ai_service.model.generate_content(full_prompt)
                )
                answer = response.text.strip()
            except Exception as e:
                logger.error(f"Error calling Gemini API in StudyAssistantService: {e}", exc_info=True)
                answer = "Error: Failed to fetch answer from AI client."
        else:
            # Fallback/Mock tutoring responses
            logger.warning("No active AI client found. Generating mock answer.")
            answer = f"[Tutor Answer for {profile_type.upper()} based on context: {question[:15]}...]"

        # 7. Persist conversation turns in database
        user_msg = ChatMessage(session_id=session_id, chunk_id=chunk_id, role="user", content=question)
        tutor_msg = ChatMessage(session_id=session_id, chunk_id=chunk_id, role="assistant", content=answer)
        db.add_all([user_msg, tutor_msg])
        await db.commit()

        return ChunkChatResponse(
            answer=answer,
            sources=sources,
            confidence_score=confidence_score,
            confidence_level=confidence_level
        )
