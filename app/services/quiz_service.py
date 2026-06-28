# backend/app/services/quiz_service.py
import json
import logging
import re
import uuid
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload

from app.models.session import QuizAttempt, LearningSession, LearningChunk
from app.models.profile import Profile
from app.services.ai.factory import get_ai_service
from app.services.ai.groq import GroqAIService
from app.services.ai.gemini import GeminiAIService
from app.services.progress_service import ProgressService
from app.schemas.session import (
    QuizGenerationRequest,
    QuizGenerationResponse,
    QuizQuestionSchema,
    QuizSubmissionRequest,
    QuizSubmissionResponse,
    QuizQuestionEvaluation,
    QuizHistoryItem
)

logger = logging.getLogger(__name__)


class QuizService:
    def _get_question_type_counts(self, difficulty: str, total: int) -> Dict[str, int]:
        """Calculates adaptive distribution of question types based on difficulty."""
        diff = difficulty.lower()
        if diff == "easy":
            # 70% MCQ, 20% True/False, 10% Short Answer
            mcq = max(1, round(total * 0.7))
            tf = max(0, round(total * 0.2))
            sa = max(0, total - mcq - tf)
            # Adjust to ensure exact sum matching total
            if mcq + tf + sa != total:
                sa = total - mcq - tf
            return {"multiple_choice": mcq, "true_false": tf, "short_answer": sa, "fill_in_the_blank": 0}
        elif diff == "hard":
            # 30% MCQ, 20% True/False, 30% Short Answer, 20% Fill in the Blank
            mcq = max(1, round(total * 0.3))
            tf = max(1, round(total * 0.2))
            sa = max(1, round(total * 0.3))
            fitb = total - mcq - tf - sa
            return {"multiple_choice": mcq, "true_false": tf, "short_answer": sa, "fill_in_the_blank": fitb}
        else:  # medium (default)
            # 50% MCQ, 20% True/False, 30% Short Answer
            mcq = max(1, round(total * 0.5))
            tf = max(1, round(total * 0.2))
            sa = total - mcq - tf
            return {"multiple_choice": mcq, "true_false": tf, "short_answer": sa, "fill_in_the_blank": 0}

    def _get_profile_adaptation_instruction(self, profile: str) -> str:
        """Constructs profile-specific instruction rules for the quiz generator."""
        p = profile.lower()
        if p == "adhd":
            return (
                "Format the questions specifically for a student with ADHD:\n"
                "- Keep question text short, highly direct, and engaging.\n"
                "- Use bold formatting on key vocabulary terms or core keywords.\n"
                "- Minimize dense explanatory text or long option strings."
            )
        elif p == "autism":
            return (
                "Format the questions specifically for a student with Autism:\n"
                "- Use objective, literal, and highly concrete language.\n"
                "- Avoid metaphors, analogies, assumptions, sarcasm, or ambiguous wording."
            )
        elif p == "dyslexia":
            return (
                "Format the questions specifically for a student with Dyslexia:\n"
                "- Use simpler vocabulary and short, uncomplicated sentence structures.\n"
                "- Keep reading density low and use straightforward question phrasings."
            )
        else:
            return "Keep questions simple, clear, and direct."

    def _parse_json_list(self, text: str) -> List[Dict[str, Any]]:
        """Defensively parses a JSON array from LLM string output."""
        cleaned = text.strip()
        if cleaned.startswith("```"):
            cleaned = re.sub(r"^```(?:json)?\n", "", cleaned)
            cleaned = re.sub(r"\n```$", "", cleaned)
        cleaned = cleaned.strip()

        try:
            return json.loads(cleaned)
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse quiz JSON from LLM: {text}. Error: {e}")
            # Try a regex-based block extraction
            match = re.search(r"\[\s*\{.*\}\s*\]", cleaned, re.DOTALL)
            if match:
                try:
                    return json.loads(match.group(0))
                except json.JSONDecodeError:
                    pass
            raise ValueError("LLM response did not contain a valid JSON array of questions.")

    def _generate_mock_questions(self, count_dict: Dict[str, int]) -> List[Dict[str, Any]]:
        """Generates fallback/mock questions when active AI models are unloaded or offline."""
        questions = []
        idx = 1
        for qtype, count in count_dict.items():
            for _ in range(count):
                qid = f"q{idx}"
                if qtype == "multiple_choice":
                    questions.append({
                        "id": qid,
                        "question_text": f"This is a mock multiple choice question {idx}. Which is correct?",
                        "question_type": qtype,
                        "options": ["Option A (Correct)", "Option B", "Option C", "Option D"],
                        "correct_answer": "Option A (Correct)"
                    })
                elif qtype == "true_false":
                    questions.append({
                        "id": qid,
                        "question_text": f"True or False: This is mock question {idx}.",
                        "question_type": qtype,
                        "options": ["True", "False"],
                        "correct_answer": "True"
                    })
                elif qtype == "fill_in_the_blank":
                    questions.append({
                        "id": qid,
                        "question_text": f"This is a mock fill in the blank question {idx} containing a ___.",
                        "question_type": qtype,
                        "options": ["blank", "filled", "empty", "space"],
                        "correct_answer": "blank"
                    })
                elif qtype == "short_answer":
                    questions.append({
                        "id": qid,
                        "question_text": f"Describe the main purpose of mock concept {idx} in your own words.",
                        "question_type": qtype,
                        "correct_answer": "mock concept, main purpose, testing"
                    })
                idx += 1
        return questions

    async def _call_llm_json(self, system_prompt: str, user_prompt: str) -> str:
        """Orchestrates structural API calls to Groq or Gemini in JSON format."""
        ai_service = get_ai_service()

        if isinstance(ai_service, GroqAIService) and ai_service.has_client:
            logger.info(f"Orchestrating Quiz LLM call via Groq API. Model: {ai_service.model}")
            messages = [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ]
            try:
                response = await ai_service.client.chat.completions.create(
                    model=ai_service.model,
                    messages=messages,
                    temperature=0.3,
                    response_format={"type": "json_object"}
                )
                return response.choices[0].message.content.strip()
            except Exception as e:
                logger.error(f"Error calling Groq API for quiz: {e}", exc_info=True)
                raise
        elif isinstance(ai_service, GeminiAIService) and ai_service.has_client:
            logger.info("Orchestrating Quiz LLM call via Gemini API.")
            full_prompt = f"{system_prompt}\n\nUser Context:\n{user_prompt}"
            try:
                import asyncio
                loop = asyncio.get_event_loop()
                response = await loop.run_in_executor(
                    None,
                    lambda: ai_service.model.generate_content(full_prompt)
                )
                return response.text.strip()
            except Exception as e:
                logger.error(f"Error calling Gemini API for quiz: {e}", exc_info=True)
                raise
        else:
            logger.warning("No active AI client found. Falling back to mock generator.")
            return ""

    async def generate_quiz(
        self, db: AsyncSession, user_id: uuid.UUID, payload: QuizGenerationRequest
    ) -> QuizGenerationResponse:
        """Generates or retrieves cached adaptive quiz questions based on difficulty, scope, and cognitive profile."""
        session_id = payload.session_id
        chunk_id = payload.chunk_id
        difficulty = payload.difficulty.lower()
        num_questions = payload.num_questions

        # 1. Fetch user profile
        prof_res = await db.execute(select(Profile).where(Profile.user_id == user_id))
        profile = prof_res.scalar_one_or_none()
        profile_type = payload.profile_type or (profile.diagnosis_type if profile else "dyslexia")

        # 2. Performance Cache check: Reuse existing matching generated quiz
        prior_res = await db.execute(
            select(QuizAttempt)
            .where(
                QuizAttempt.session_id == session_id,
                QuizAttempt.chunk_id == chunk_id,
                QuizAttempt.difficulty == difficulty,
                QuizAttempt.total_questions == num_questions,
                QuizAttempt.profile == profile_type
            )
            .order_by(QuizAttempt.created_at.desc())
            .limit(1)
        )
        prior_attempt = prior_res.scalar_one_or_none()

        # Count total attempts to determine attempt_number
        attempts_res = await db.execute(
            select(QuizAttempt).where(
                QuizAttempt.session_id == session_id,
                QuizAttempt.chunk_id == chunk_id
            )
        )
        attempt_number = len(attempts_res.scalars().all()) + 1

        if prior_attempt:
            logger.info(f"Performance: Reusing cached quiz from attempt {prior_attempt.id}")
            new_attempt = QuizAttempt(
                session_id=session_id,
                chunk_id=chunk_id,
                difficulty=difficulty,
                profile=profile_type,
                total_questions=num_questions,
                score=0.0,
                accuracy=0.0,
                attempt_number=attempt_number,
                questions_json=prior_attempt.questions_json,
                user_answers=None,
                time_taken=None
            )
            db.add(new_attempt)
            await db.commit()
            await db.refresh(new_attempt)

            # Return sanitized questions list (exposing no answers)
            questions_list = json.loads(new_attempt.questions_json)
            sanitized = [
                QuizQuestionSchema(
                    id=q["id"],
                    question_text=q["question_text"],
                    question_type=q["question_type"],
                    options=q.get("options")
                )
                for q in questions_list
            ]
            return QuizGenerationResponse(quiz_attempt_id=new_attempt.id, questions=sanitized)

        # 3. Pull context content using RAG semantic matching
        from app.services.rag_service import RagService
        rag = RagService()
        query_text = ""
        if chunk_id:
            # Selected Chunk Scope: use the chunk text to retrieve relevant chunks
            chunk_res = await db.execute(
                select(LearningChunk).where(
                    LearningChunk.id == chunk_id, LearningChunk.session_id == session_id
                )
            )
            chunk = chunk_res.scalar_one_or_none()
            if chunk:
                query_text = chunk.simplified_text
            else:
                query_text = "key concepts"
        else:
            # Entire Document Scope: query using session title
            sess_res = await db.execute(
                select(LearningSession).where(LearningSession.id == session_id)
            )
            sess = sess_res.scalar_one_or_none()
            query_text = sess.content_title if sess else "key concepts"

        # Retrieve top 5 most relevant chunks from ChromaDB
        try:
            retrieved_chunks = rag.retrieve_context(session_id, query_text, top_k=5)
            if retrieved_chunks:
                context_text = "\n\n".join([c["text"] for c in retrieved_chunks])
            else:
                # Fallback to database
                chunks_res = await db.execute(
                    select(LearningChunk)
                    .where(LearningChunk.session_id == session_id)
                    .order_by(LearningChunk.chunk_index.asc())
                )
                chunks = chunks_res.scalars().all()
                context_text = "\n\n".join([c.simplified_text for c in chunks])
        except Exception as e:
            logger.error(f"RAG retrieval failed for quiz generation: {e}", exc_info=True)
            # Fallback to database
            chunks_res = await db.execute(
                select(LearningChunk)
                .where(LearningChunk.session_id == session_id)
                .order_by(LearningChunk.chunk_index.asc())
            )
            chunks = chunks_res.scalars().all()
            context_text = "\n\n".join([c.simplified_text for c in chunks])

        if not context_text:
            context_text = "No study material was found for this session."

        # 4. Determine question type counts based on difficulty
        counts = self._get_question_type_counts(difficulty, num_questions)
        mcq_count = counts["multiple_choice"]
        tf_count = counts["true_false"]
        sa_count = counts["short_answer"]
        fitb_count = counts["fill_in_the_blank"]

        # 5. Build Generator Prompts
        profile_instruction = self._get_profile_adaptation_instruction(profile_type)
        system_prompt = (
            "You are an expert quiz generator. Generate a quiz of exactly {total} questions "
            "based strictly on the provided document context. The quiz must contain exactly:\n"
            "- {mcq} multiple_choice questions\n"
            "- {tf} true_false questions\n"
            "- {sa} short_answer questions\n"
            "- {fitb} fill_in_the_blank questions\n\n"
            "Difficulty Level: {difficulty}\n"
            "{profile_rules}\n\n"
            "Respond ONLY with a JSON array of questions. Ensure correct JSON array syntax. "
            "Structure each question EXACTLY like this:\n"
            "[\n"
            "  {{\n"
            "    \"id\": \"q1\",\n"
            "    \"question_text\": \"Question text here...\",\n"
            "    \"question_type\": \"multiple_choice\",\n"
            "    \"options\": [\"Option A\", \"Option B\", \"Option C\", \"Option D\"],\n"
            "    \"correct_answer\": \"Option A\"\n"
            "  }},\n"
            "  {{\n"
            "    \"id\": \"q2\",\n"
            "    \"question_text\": \"True or False: Statement here...\",\n"
            "    \"question_type\": \"true_false\",\n"
            "    \"options\": [\"True\", \"False\"],\n"
            "    \"correct_answer\": \"True\"\n"
            "  }},\n"
            "  {{\n"
            "    \"id\": \"q3\",\n"
            "    \"question_text\": \"Fill in the blank: The neocortex is responsible for ___ functions.\",\n"
            "    \"question_type\": \"fill_in_the_blank\",\n"
            "    \"options\": [\"cognitive\", \"motor\", \"reflexive\", \"vascular\"],\n"
            "    \"correct_answer\": \"cognitive\"\n"
            "  }},\n"
            "  {{\n"
            "    \"id\": \"q4\",\n"
            "    \"question_text\": \"Question text here...\",\n"
            "    \"question_type\": \"short_answer\",\n"
            "    \"correct_answer\": \"Key concepts or points that should be in the student's answer\"\n"
            "  }}\n"
            "]\n\n"
            "Keep all facts and answers grounded strictly in the context. Do not use external facts."
        ).format(
            total=num_questions,
            mcq=mcq_count,
            tf=tf_count,
            sa=sa_count,
            fitb=fitb_count,
            difficulty=difficulty.upper(),
            profile_rules=profile_instruction
        )

        user_prompt = f"Document context:\n{context_text}\n\nGenerate Quiz JSON:"

        logger.info(f"RAG_SERVICE: context sent to LLM: {context_text}")

        # 6. Call LLM
        raw_output = await self._call_llm_json(system_prompt, user_prompt)
        
        # 7. Parse and save
        if raw_output:
            try:
                raw_qs = self._parse_json_list(raw_output)
            except Exception as e:
                logger.error(f"Error parsing generated quiz JSON: {e}. Falling back to mock quiz.", exc_info=True)
                raw_qs = self._generate_mock_questions(counts)
        else:
            raw_qs = self._generate_mock_questions(counts)

        # Normalize keys and structure
        normalized = []
        for i, q in enumerate(raw_qs):
            qid = q.get("id") or f"q{i+1}"
            qtext = q.get("question_text") or q.get("question") or f"Question {i+1}"
            qtype = q.get("question_type") or "multiple_choice"
            options = q.get("options")
            correct_ans = q.get("correct_answer") or q.get("correct") or ""

            normalized.append({
                "id": qid,
                "question_text": qtext,
                "question_type": qtype,
                "options": options,
                "correct_answer": correct_ans
            })

        new_attempt = QuizAttempt(
            session_id=session_id,
            chunk_id=chunk_id,
            difficulty=difficulty,
            profile=profile_type,
            total_questions=len(normalized),
            score=0.0,
            accuracy=0.0,
            attempt_number=attempt_number,
            questions_json=json.dumps(normalized),
            user_answers=None,
            time_taken=None
        )
        db.add(new_attempt)
        await db.commit()
        await db.refresh(new_attempt)

        sanitized = [
            QuizQuestionSchema(
                id=q["id"],
                question_text=q["question_text"],
                question_type=q["question_type"],
                options=q.get("options")
            )
            for q in normalized
        ]
        return QuizGenerationResponse(quiz_attempt_id=new_attempt.id, questions=sanitized)

    async def submit_quiz(
        self, db: AsyncSession, user_id: uuid.UUID, payload: QuizSubmissionRequest
    ) -> QuizSubmissionResponse:
        """Evaluates quiz submission, grades short answers semantically, logs attempt details, and updates XP progress."""
        attempt_id = payload.quiz_attempt_id
        time_taken = payload.time_taken

        # 1. Fetch attempt and verify ownership
        attempt_res = await db.execute(
            select(QuizAttempt)
            .options(selectinload(QuizAttempt.session))
            .where(QuizAttempt.id == attempt_id)
        )
        attempt = attempt_res.scalar_one_or_none()
        if not attempt or attempt.session.user_id != user_id:
            raise ValueError("Quiz attempt not found or access denied.")

        # 2. Match questions and user answers
        questions = json.loads(attempt.questions_json)
        answers_dict = {ans.question_id: ans.user_answer.strip() for ans in payload.answers}

        # Programmatic grading for objective types, collect items for LLM evaluation and explanations
        evaluations: List[QuizQuestionEvaluation] = []
        llm_grading_list = []

        for q in questions:
            qid = q["id"]
            qtype = q["question_type"]
            correct_ans = q["correct_answer"]
            user_ans = answers_dict.get(qid, "")

            is_correct = False
            if qtype in ("multiple_choice", "true_false", "fill_in_the_blank"):
                # Programmatic check
                is_correct = user_ans.lower() == correct_ans.lower()

            llm_grading_list.append({
                "question_id": qid,
                "question_text": q["question_text"],
                "question_type": qtype,
                "correct_answer": correct_ans,
                "user_answer": user_ans,
                "is_correct_objective": is_correct
            })

        # 3. Call LLM to grade short answers and generate explanations
        llm_graded_dict = {}
        ai_service = get_ai_service()

        if (isinstance(ai_service, GroqAIService) and ai_service.has_client) or (
            isinstance(ai_service, GeminiAIService) and ai_service.has_client
        ):
            grading_system_prompt = (
                "You are an academic grading assistant. Review the provided quiz questions, correct answers, "
                "and student submissions. Grade the short_answer questions semantically, and generate a brief, "
                "helpful explanation for the correct answer of every question.\n\n"
                "Student cognitive profile: {profile}\n"
                "Adapt explanations to match this cognitive profile (e.g., direct objective terms for Autism, "
                "short bolded definitions for ADHD, simple sentence layouts for Dyslexia).\n\n"
                "Respond ONLY with a JSON array of graded results in this format:\n"
                "[\n"
                "  {{\n"
                "    \"question_id\": \"q1\",\n"
                "    \"is_correct\": true/false,  // Semantically grade short_answer. For objective questions, you can just echo true/false.\n"
                "    \"explanation\": \"A helpful explanation of the correct answer adapted to the profile. Keep it under 2 sentences. Avoid long descriptions.\"\n"
                "  }}\n"
                "]"
            ).format(profile=attempt.profile)

            grading_user_prompt = f"Quiz Data to Grade:\n{json.dumps(llm_grading_list, indent=2)}\n\nGrade and Explain JSON:"

            try:
                raw_grading_output = await self._call_llm_json(grading_system_prompt, grading_user_prompt)
                if raw_grading_output:
                    graded_items = self._parse_json_list(raw_grading_output)
                    llm_graded_dict = {item["question_id"]: item for item in graded_items}
            except Exception as e:
                logger.error(f"Failed to grade/explain quiz submission via LLM: {e}", exc_info=True)

        # 4. Finalize evaluations list
        for q in questions:
            qid = q["id"]
            qtype = q["question_type"]
            correct_ans = q["correct_answer"]
            user_ans = answers_dict.get(qid, "")

            # Set correct key
            correct_flag = False
            if qtype in ("multiple_choice", "true_false", "fill_in_the_blank"):
                correct_flag = user_ans.lower() == correct_ans.lower()
            else:
                # Short Answer: read LLM evaluation
                llm_eval = llm_graded_dict.get(qid)
                if llm_eval:
                    correct_flag = bool(llm_eval.get("is_correct", False))
                else:
                    # Semantic fallback: keyword containment
                    correct_flag = any(kw.strip().lower() in user_ans.lower() for kw in correct_ans.split(","))

            # Set explanation
            explanation = ""
            llm_eval = llm_graded_dict.get(qid)
            if llm_eval and llm_eval.get("explanation"):
                explanation = llm_eval["explanation"]
            else:
                explanation = f"The correct answer is '{correct_ans}'."

            evaluations.append(
                QuizQuestionEvaluation(
                    question_id=qid,
                    question_text=q["question_text"],
                    question_type=qtype,
                    options=q.get("options"),
                    correct_answer=correct_ans,
                    user_answer=user_ans,
                    is_correct=correct_flag,
                    explanation=explanation
                )
            )

        # 5. Record Score and Save Results in DB
        total_questions = len(evaluations)
        correct_count = sum(1 for ev in evaluations if ev.is_correct)
        accuracy = (correct_count / total_questions) * 100.0 if total_questions > 0 else 0.0
        score = accuracy

        attempt.score = score
        attempt.accuracy = accuracy
        attempt.time_taken = time_taken

        # Store explanations with quiz attempts so Review Answers works without regenerating responses
        answers_to_save = [
            {
                "question_id": ev.question_id,
                "user_answer": ev.user_answer,
                "is_correct": ev.is_correct,
                "explanation": ev.explanation
            }
            for ev in evaluations
        ]
        attempt.user_answers = json.dumps(answers_to_save)
        db.add(attempt)

        # 6. Gamification System: Award XP
        # Calculate XP: 20 XP per correct answer. Extra 50 XP bonus for perfect score
        base_xp = correct_count * 20
        perfect_bonus = 50 if accuracy == 100.0 else 0
        total_xp_earned = base_xp + perfect_bonus

        progress = await ProgressService.add_xp(db, user_id, total_xp_earned, "quiz_completion")
        await ProgressService.update_daily_streak(db, user_id)
        await ProgressService.evaluate_achievements(db, user_id)

        await db.commit()
        await db.refresh(attempt)

        return QuizSubmissionResponse(
            quiz_attempt_id=attempt.id,
            score=score,
            accuracy=accuracy,
            correct_count=correct_count,
            total_questions=total_questions,
            evaluations=evaluations,
            xp_earned=total_xp_earned,
            new_xp=progress.total_xp,
            new_level=progress.current_level
        )

    async def get_quiz_history(self, db: AsyncSession, session_id: str) -> List[QuizHistoryItem]:
        """Loads and returns all previous quiz attempts and achievements associated with the session."""
        result = await db.execute(
            select(QuizAttempt)
            .where(QuizAttempt.session_id == session_id)
            .order_by(QuizAttempt.created_at.desc())
        )
        attempts = result.scalars().all()
        return [
            QuizHistoryItem(
                quiz_attempt_id=a.id,
                difficulty=a.difficulty,
                score=a.score,
                accuracy=a.accuracy,
                total_questions=a.total_questions,
                created_at=a.created_at,
                attempt_number=a.attempt_number
            )
            for a in attempts
        ]

    async def get_quiz_attempt(self, db: AsyncSession, user_id: uuid.UUID, attempt_id: uuid.UUID) -> QuizSubmissionResponse:
        """Loads a past attempt, reconstructs the evaluations, and returns the graded response for review."""
        attempt_res = await db.execute(
            select(QuizAttempt)
            .options(selectinload(QuizAttempt.session))
            .where(QuizAttempt.id == attempt_id)
        )
        attempt = attempt_res.scalar_one_or_none()
        if not attempt or attempt.session.user_id != user_id:
            raise ValueError("Quiz attempt not found or access denied.")

        questions = json.loads(attempt.questions_json)
        answers = json.loads(attempt.user_answers) if attempt.user_answers else []
        answers_dict = {ans["question_id"]: ans for ans in answers}

        evaluations = []
        for q in questions:
            qid = q["id"]
            ans_data = answers_dict.get(qid, {})
            user_ans = ans_data.get("user_answer", "")
            is_correct = ans_data.get("is_correct", False)
            explanation = ans_data.get("explanation", f"The correct answer is '{q['correct_answer']}'.")

            evaluations.append(
                QuizQuestionEvaluation(
                    question_id=qid,
                    question_text=q["question_text"],
                    question_type=q["question_type"],
                    options=q.get("options"),
                    correct_answer=q["correct_answer"],
                    user_answer=user_ans,
                    is_correct=is_correct,
                    explanation=explanation
                )
            )

        return QuizSubmissionResponse(
            quiz_attempt_id=attempt.id,
            score=attempt.score,
            accuracy=attempt.accuracy,
            correct_count=sum(1 for ev in evaluations if ev.is_correct),
            total_questions=attempt.total_questions,
            evaluations=evaluations,
            xp_earned=0,  # XP is earned only once during submission
            new_xp=0,
            new_level=0
        )
