# backend/app/api/v1/sessions.py
import re
import uuid
import logging
import json
from datetime import datetime, timezone
from typing import List, Optional, Tuple
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from app.api.deps import get_current_user
from app.core.database import get_db
from app.models.user import User
from app.models.profile import Profile
from app.models.session import SimplifiedContent, LearningSession, LearningChunk
from app.schemas.session import (
    LearningSessionSchema,
    CreateSessionPayload,
    UploadContentResponse,
    SimplifyPayload,
    SimplifyResponse,
    ContentChunkSchema
)
from app.services.file_service import FileProcessingService
from app.services.ai.factory import get_ai_service

router = APIRouter()
logger = logging.getLogger(__name__)


def is_list_item(line: str) -> bool:
    l = line.strip()
    if l.startswith("•"):
        return True
    return bool(re.match(r'^(\*|-|\+|\d+\.)\s+', l))


def is_heading_line(line: str) -> bool:
    l = line.strip()
    if l.startswith("#"):
        return True
    cleaned = l.replace("*", "").strip().upper()
    return cleaned.startswith("KEY IDEA")


def get_heading_level(line: str) -> int:
    l = line.strip()
    if l.startswith("#"):
        match = re.match(r'^#+', l)
        if match:
            return len(match.group(0))
    cleaned = l.replace("*", "").strip().upper()
    if cleaned.startswith("KEY IDEA"):
        return 1
    return 0


def validate_and_repair_markdown(text: str) -> Tuple[str, str]:
    """
    Validates and repairs basic markdown structures:
    - Balanced bold markers (**)
    - Correct heading format (ensures space after #)
    - Valid lists
    Returns (repaired_text, status) where status is "PASSED" or "REPAIRED"
    """
    status = "PASSED"
    
    # 1. Normalize Setext-style headers to ATX-style headers
    # H1: text followed by === underline
    new_text = re.sub(r'^([^\n]+)\n={3,}\s*$', r'# \1', text, flags=re.MULTILINE)
    # H2: text followed by --- underline
    new_text = re.sub(r'^([^\n]+)\n-{3,}\s*$', r'## \1', new_text, flags=re.MULTILINE)
    if new_text != text:
        text = new_text
        status = "REPAIRED"
    
    # 2. Repair Headers (e.g. "##Title" -> "## Title")
    repaired_lines = []
    lines = text.split("\n")
    for line in lines:
        stripped = line.strip()
        if stripped.startswith("#"):
            match = re.match(r'^(#+)([^#\s].*)$', stripped)
            if match:
                hashes = match.group(1)
                content = match.group(2)
                line = f"{hashes} {content}"
                status = "REPAIRED"
        repaired_lines.append(line)
    
    text = "\n".join(repaired_lines)
    
    # 3. Repair Bold Markers (**) per paragraph
    paragraphs = text.split("\n\n")
    repaired_paragraphs = []
    for p in paragraphs:
        p_clean = p.strip()
        if not p_clean:
            repaired_paragraphs.append("")
            continue
            
        bold_count = p_clean.count("**")
        if bold_count % 2 != 0:
            status = "REPAIRED"
            if p_clean.endswith("**"):
                p_clean = p_clean[:-2].strip()
            else:
                p_clean += "**"
                
        # Fix orphaned bold markers inside
        p_clean = re.sub(r'\s+\*\*\s+', ' ', p_clean)
        
        repaired_paragraphs.append(p_clean)
        
    text = "\n\n".join([r for r in repaired_paragraphs if r])
    return text, status


def evaluate_concept_completeness(chunk_text: str) -> float:
    text = chunk_text.strip()
    if not text:
        return 0.0
        
    score = 100.0
    lines = [l.strip() for l in text.split("\n") if l.strip()]
    
    # 1. Ends with ":" -> -50
    if text.endswith(":"):
        score -= 50.0
        
    # 2. Ends with heading only -> -80
    if lines:
        last_line = lines[-1]
        if is_heading_line(last_line):
            score -= 80.0
            
    # 3. Missing sentence-ending punctuation -> -30
    cleaned_end = re.sub(r'[\s\*`\)\}\]]+$', '', text)
    if cleaned_end and not cleaned_end[-1] in ('.', '!', '?'):
        score -= 30.0
        
    # 4. Starts mid-sentence -> -40
    cleaned_start = text.lstrip("#* \t\n•-0123456789.")
    if cleaned_start and cleaned_start[0].islower():
        score -= 40.0
        
    # 5. Unbalanced markdown (** or headings) -> -50
    bold_count = text.count("**")
    if bold_count % 2 != 0:
        score -= 50.0
        
    # 6. Heading without explanation -> -70
    has_heading = any(is_heading_line(l) for l in lines)
    if has_heading:
        for idx, line in enumerate(lines):
            is_head = is_heading_line(line)
            if is_head:
                head_level = get_heading_level(line)
                found_exp_for_this_head = False
                for sub_line in lines[idx+1:]:
                    sub_level = get_heading_level(sub_line)
                    if sub_level > 0 and sub_level <= head_level:
                        break
                    if sub_line.strip() and sub_level == 0:
                        found_exp_for_this_head = True
                        break
                if not found_exp_for_this_head:
                    score -= 70.0
                    break
                    
    # 7. List without parent heading -> -70
    has_list = any(is_list_item(l) for l in lines)
    if has_list:
        has_parent = False
        for idx, line in enumerate(lines):
            if is_list_item(line):
                if idx > 0:
                    has_parent = True
                break
        if not has_parent:
            score -= 70.0

    return max(0.0, score)


def extract_chunk_title(chunk_text: str) -> str:
    text = chunk_text.strip()
    if not text:
        return "Untitled Chunk"
        
    lines = [l.strip() for l in text.split("\n") if l.strip()]
    
    for line in lines:
        if line.startswith("#"):
            title = re.sub(r'^#+\s*', '', line)
            title = re.sub(r'[\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF]', '', title)
            return title.strip()
        cleaned = line.replace("*", "").strip().upper()
        if cleaned.startswith("KEY IDEA"):
            idx = lines.index(line)
            if idx + 1 < len(lines):
                next_line = lines[idx+1]
                return next_line.replace("**", "").replace("*", "").strip()
            return "Key Idea"
            
    def_match = re.match(r'^\*\*(.*?)\*\*:', text)
    if def_match:
        return def_match.group(1).strip()
        
    sentences = re.split(r'[.!?]+', text)
    first_sentence = sentences[0].strip() if sentences else text
    first_sentence = first_sentence.replace("**", "").replace("*", "").replace("`", "")
    words = first_sentence.split()
    if len(words) > 6:
        return " ".join(words[:6]) + "..."
    return first_sentence


def split_into_atomic_blocks(text: str) -> List[str]:
    text = text.replace("\r\n", "\n")
    lines = text.split("\n")
    
    blocks = []
    current_block = []
    
    in_code_block = False
    in_table = False
    in_list = False
    in_definition = False
    
    def is_list_line(line: str) -> bool:
        return is_list_item(line)

    def is_def_line(line: str) -> bool:
        l = line.strip()
        return bool(re.match(r'^(\*\*.*?\*\*|[^:\n]+):\s+\S+', l))

    def is_table_line(line: str) -> bool:
        l = line.strip()
        return l.startswith("|")

    for line in lines:
        line_stripped = line.strip()
        
        if line_stripped.startswith("```"):
            in_code_block = not in_code_block
            current_block.append(line)
            if not in_code_block:
                blocks.append("\n".join(current_block).strip())
                current_block = []
            continue
            
        if in_code_block:
            current_block.append(line)
            continue
            
        is_empty = not line_stripped
        is_heading = is_heading_line(line_stripped)
        is_li = is_list_line(line)
        is_def = is_def_line(line)
        is_tbl = is_table_line(line)
        
        if is_empty:
            if in_table or in_list or in_definition:
                current_block.append(line)
            else:
                if current_block:
                    blocks.append("\n".join(current_block).strip())
                    current_block = []
            continue
            
        if is_heading:
            if current_block:
                blocks.append("\n".join(current_block).strip())
            blocks.append(line_stripped)
            current_block = []
            in_table = in_list = in_definition = False
            continue
            
        if is_tbl:
            if not in_table:
                if current_block:
                    blocks.append("\n".join(current_block).strip())
                    current_block = []
                in_table = True
                in_list = in_definition = False
            current_block.append(line)
        elif is_li:
            if not in_list:
                if current_block:
                    blocks.append("\n".join(current_block).strip())
                    current_block = []
                in_list = True
                in_table = in_definition = False
            current_block.append(line)
        elif is_def:
            if not in_definition:
                if current_block:
                    blocks.append("\n".join(current_block).strip())
                    current_block = []
                in_definition = True
                in_table = in_list = False
            current_block.append(line)
        else:
            if in_table or in_list or in_definition:
                if current_block:
                    blocks.append("\n".join(current_block).strip())
                    current_block = []
                in_table = in_list = in_definition = False
            current_block.append(line)
            
    if current_block:
        blocks.append("\n".join(current_block).strip())
        
    return [b for b in blocks if b]


def calculate_concept_retention(text: str) -> float:
    concept_patterns = {
        "neocortex": r'neocortex',
        "streaming data": r'streaming|stream\s+data',
        "sparse distributed representations": r'sparse\s+distributed|SDR',
        "spatial pooler": r'spatial\s+pooler',
        "temporal pooler": r'temporal\s+pooler',
        "predictive state": r'predictive\s+state',
        "synaptic": r'synaps|synapt',
        "anomaly": r'anomal',
        "noise tolerance": r'noise\s+toleran',
        "learning": r'learn'
    }
    retained = 0
    for concept, pattern in concept_patterns.items():
        if re.search(pattern, text, re.IGNORECASE):
            retained += 1
    return (retained / len(concept_patterns)) * 100



def is_title_case_or_all_caps(line: str) -> bool:
    line = line.strip()
    if not line:
        return False
        
    # Check if all alphabetic characters are uppercase (ALL CAPS)
    alpha_chars = [c for c in line if c.isalpha()]
    if alpha_chars and all(c.isupper() for c in alpha_chars):
        return True
        
    words = line.split()
    if not words:
        return False
        
    # Exclude lines starting with lowercase
    first_word_cleaned = re.sub(r'^[^a-zA-Z0-9]+', '', words[0])
    if first_word_cleaned and first_word_cleaned[0].islower():
        return False
        
    lowercase_exceptions = {
        "a", "an", "the", "and", "but", "or", "for", "nor", "on", "in", "at", "to", "by", "with", "of", "vs", "versus", "from"
    }
    
    total_relevant = 0
    capitalized = 0
    for w in words:
        cleaned = re.sub(r'^[^a-zA-Z0-9]+|[^a-zA-Z0-9]+$', '', w)
        if not cleaned:
            continue
        if cleaned.isdigit():
            continue
        total_relevant += 1
        if cleaned[0].isupper() or cleaned.isupper() or cleaned.lower() in lowercase_exceptions:
            capitalized += 1
            
    if total_relevant == 0:
        return False
        
    # Treat as Title Case if at least 75% of the words are capitalized or standard exceptions
    return (capitalized / total_relevant) >= 0.75


def normalize_plain_text_headings(text: str) -> str:
    if not text:
        return text
    lines = text.split("\n")
    normalized_lines = []
    
    for i in range(len(lines)):
        line = lines[i]
        stripped = line.strip()
        
        # If it's already a markdown heading or KEY IDEA, keep it as is
        if stripped.startswith("#") or "KEY IDEA" in stripped.upper():
            normalized_lines.append(line)
            continue
            
        # Check heuristics
        # 1. Not empty and short (< 12 words)
        words = stripped.split()
        if not (1 <= len(words) < 12):
            normalized_lines.append(line)
            continue
            
        # 2. Does not end with sentence-ending punctuation
        if stripped[-1] in ('.', '?', '!', ':', ';', ','):
            normalized_lines.append(line)
            continue
            
        # 3. Surrounded by blank lines (or start/end of document)
        prev_empty = (i == 0 or not lines[i-1].strip())
        next_empty = (i == len(lines)-1 or not lines[i+1].strip())
        if not (prev_empty and next_empty):
            normalized_lines.append(line)
            continue
            
        # 4. Title Case or Mostly Capitalized
        if not is_title_case_or_all_caps(stripped):
            normalized_lines.append(line)
            continue
            
        # 5. Followed by explanatory paragraphs/lists
        next_non_empty = ""
        for k in range(i + 1, len(lines)):
            if lines[k].strip():
                next_non_empty = lines[k].strip()
                break
                
        if not next_non_empty:
            normalized_lines.append(line)
            continue
            
        # Check if the next non-empty line starts with uppercase or digit
        first_char = next_non_empty.lstrip("*-\u2022• \t")[0] if next_non_empty.lstrip("*-\u2022• \t") else ""
        if not (first_char.isupper() or first_char.isdigit()):
            normalized_lines.append(line)
            continue
            
        # If all heuristics match, convert to H2 markdown heading!
        normalized_lines.append(f"## {stripped}")
        
    return "\n".join(normalized_lines)


def is_concept_boundary(line: str) -> bool:
    """
    Returns True if the line represents a major parent-topic concept boundary:
    - H1 heading (starts with '# ')
    - H2 heading (starts with '## '), except those containing subtopic/child keywords
    - Dyslexia 'KEY IDEA' marker
    """
    l = line.strip()
    if l.startswith("#"):
        hashes = len(l) - len(l.lstrip("#"))
        if hashes == 1:
            return True
        elif hashes == 2:
            heading_text = l.lstrip("#").strip().lower()
            exclude_keywords = [
                "advantage", "disadvantage", "feature", "characteristic", 
                "working process", "how it works", "how works", "step", 
                "example", "definition", "type", "method"
            ]
            if any(keyword in heading_text for keyword in exclude_keywords):
                return False
            return True
        return False
    cleaned = l.replace("*", "").strip().upper()
    return cleaned.startswith("KEY IDEA")


def starts_with_concept_boundary(chunk_text: str) -> bool:
    """
    Returns True if the chunk text starts with a major concept boundary.
    """
    lines = [l.strip() for l in chunk_text.split("\n") if l.strip()]
    if not lines:
        return False
    return is_concept_boundary(lines[0])


def is_heading_only(chunk_text: str) -> bool:
    """
    Returns True if the chunk text consists entirely of heading lines.
    """
    lines = [l.strip() for l in chunk_text.split("\n") if l.strip()]
    if not lines:
        return True
    return all(is_heading_line(l) for l in lines)


def extract_concept_name(chunk_text: str) -> str:
    """
    Extracts the clean, emoji-free major concept name from the first H1/H2 heading or KEY IDEA.
    """
    text = chunk_text.strip()
    if not text:
        return "General Concept"
        
    lines = [l.strip() for l in text.split("\n") if l.strip()]
    
    for line in lines:
        if line.startswith("#"):
            hashes = len(line) - len(line.lstrip("#"))
            if hashes in (1, 2):
                name = re.sub(r'^#+\s*', '', line)
                name = re.sub(r'[\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF]', '', name)
                return name.strip()
        cleaned = line.replace("*", "").strip().upper()
        if cleaned.startswith("KEY IDEA"):
            idx = lines.index(line)
            if idx + 1 < len(lines):
                next_line = lines[idx+1]
                return next_line.replace("**", "").replace("*", "").strip()
            return "Key Idea"
            
    return extract_chunk_title(chunk_text)


def chunk_personalized_text(text: str, profile_type: str, target_limit: int) -> List[str]:
    profile = profile_type.lower()
    normalized_text = normalize_plain_text_headings(text)
    repaired_text, val_status = validate_and_repair_markdown(normalized_text)
    
    blocks = split_into_atomic_blocks(repaired_text)
    if not blocks:
        return []
        
    draft_chunks = []
    current_chunk_blocks = []
    
    for block in blocks:
        if is_concept_boundary(block):
            if current_chunk_blocks:
                draft_chunks.append(current_chunk_blocks)
            current_chunk_blocks = [block]
        else:
            current_chunk_blocks.append(block)
            
    if current_chunk_blocks:
        draft_chunks.append(current_chunk_blocks)
        
    text_chunks = ["\n\n".join(dc) for dc in draft_chunks]
    
    # Merge heading-only chunks into the next chunk so headings stay with their body text.
    i = 0
    while i < len(text_chunks) - 1:
        if is_heading_only(text_chunks[i]):
            text_chunks[i] = text_chunks[i] + "\n\n" + text_chunks[i+1]
            text_chunks.pop(i+1)
        else:
            i += 1
            
    if len(text_chunks) > 1:
        if is_heading_only(text_chunks[-1]):
            last_chunk = text_chunks.pop()
            text_chunks[-1] = text_chunks[-1] + "\n\n" + last_chunk
            
    return [c.strip() for c in text_chunks if c.strip()]




def chunk_original_text_into_n(text: str, n: int) -> List[str]:
    if n <= 1:
        return [text]
    paragraphs = [p.strip() for p in text.split("\n\n") if p.strip()]
    if len(paragraphs) >= n:
        chunks = []
        chunk_size = len(paragraphs) // n
        remainder = len(paragraphs) % n
        start_idx = 0
        for i in range(n):
            extra = 1 if i < remainder else 0
            end_idx = start_idx + chunk_size + extra
            chunks.append("\n\n".join(paragraphs[start_idx:end_idx]))
            start_idx = end_idx
        return chunks
        
    sentences = re.findall(r'[^.!?]+[.!?]+', text)
    if not sentences:
        sentences = [line for line in text.split("\n") if line.strip()]
    if not sentences:
        return [text] * n
        
    total_sentences = len(sentences)
    if total_sentences <= n:
        res = sentences + [""] * (n - total_sentences)
        return res
        
    chunks = []
    chunk_size = total_sentences // n
    remainder = total_sentences % n
    start_idx = 0
    for i in range(n):
        extra = 1 if i < remainder else 0
        end_idx = start_idx + chunk_size + extra
        chunk_sentences = sentences[start_idx:end_idx]
        chunks.append(" ".join(chunk_sentences).strip())
        start_idx = end_idx
    return chunks


@router.post("/sessions", response_model=LearningSessionSchema, status_code=status.HTTP_201_CREATED)
async def create_session(
    payload: CreateSessionPayload,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # Get user profile or fallback defaults
    result = await db.execute(select(Profile).where(Profile.user_id == current_user.id))
    profile = result.scalar_one_or_none()
    db_profile_type = profile.diagnosis_type if profile else "dyslexia"
    reading_level = profile.reading_level if profile else "intermediate"
    
    # Route active profile
    profile_type = payload.profile_type or db_profile_type

    print(f"FRONTEND_ACTIVE_PROFILE={payload.profile_type}", flush=True)
    print(f"REQUEST_PAYLOAD={payload.model_dump_json() if hasattr(payload, 'model_dump_json') else str(payload)}", flush=True)
    print(f"BACKEND_PROFILE_RECEIVED={profile_type}", flush=True)
    print(f"PROFILE_FROM_DATABASE={db_profile_type}", flush=True)

    # Enforce strict profile-specific chunking limits
    if profile_type.lower() == "adhd":
        word_limit = 50
    elif profile_type.lower() == "autism":
        word_limit = 125
    elif profile_type.lower() == "dyslexia":
        word_limit = 75
    else:
        word_limit = 80

    # Initialize AI service
    ai_service = get_ai_service()
    
    # Normalize plain text headings on ingestion
    payload.text = normalize_plain_text_headings(payload.text)

    # Simplify the ENTIRE document first to preserve full context and logical topic flow
    simplified_doc = await ai_service.simplify_text(payload.text, profile_type, reading_level)

    # Validate and repair markdown
    repaired_doc, val_status = validate_and_repair_markdown(simplified_doc)

    # Chunk the personalized text using the semantic chunker
    simplified_chunks = chunk_personalized_text(repaired_doc, profile_type, word_limit)
    
    # Chunk the original text into matching chunks
    original_chunks = chunk_original_text_into_n(payload.text, len(simplified_chunks))

    # Log metrics
    orig_words = len(payload.text.split())
    pers_words = len(repaired_doc.split())
    retention_pct = (pers_words / orig_words) * 100 if orig_words > 0 else 0
    concept_retention = calculate_concept_retention(repaired_doc)
    chunk_count = len(simplified_chunks)

    print(f"ORIGINAL_WORD_COUNT={orig_words}", flush=True)
    print(f"PERSONALIZED_WORD_COUNT={pers_words}", flush=True)
    print(f"RETENTION_PERCENTAGE={retention_pct:.2f}%", flush=True)
    
    print(f"CONTENT_RETENTION_PERCENT={retention_pct:.2f}", flush=True)
    print(f"CONCEPT_RETENTION_PERCENT={concept_retention:.2f}", flush=True)
    print(f"PROFILE_TYPE={profile_type.upper()}", flush=True)
    print(f"CHUNK_COUNT={chunk_count}", flush=True)
    print(f"MARKDOWN_VALIDATION_STATUS={val_status}", flush=True)

    print(f"TOTAL_SOURCE_WORDS={orig_words}", flush=True)
    print(f"TOTAL_SIMPLIFIED_WORDS={pers_words}", flush=True)
    print(f"WORD_RETENTION_PERCENT={retention_pct:.2f}", flush=True)

    for chunk in simplified_chunks:
        title = extract_chunk_title(chunk)
        words = len(chunk.split())
        score = evaluate_concept_completeness(chunk)
        concept_name = extract_concept_name(chunk)
        print(f"CHUNK_TITLE={title}", flush=True)
        print(f"WORD_COUNT={words}", flush=True)
        print(f"CONCEPT_COMPLETENESS_SCORE={score:.2f}", flush=True)
        print(f"CONCEPT_NAME={concept_name}", flush=True)
        
        # Topic verification logging
        lines = [l.strip() for l in chunk.split("\n") if l.strip()]
        start_topic = lines[0] if lines else ""
        end_topic = lines[-1] if lines else ""
        topic_complete = score >= 70.0
        print(f"TOPIC_NAME={concept_name}", flush=True)
        print(f"START_TOPIC={start_topic}", flush=True)
        print(f"END_TOPIC={end_topic}", flush=True)
        print(f"TOPIC_COMPLETE={topic_complete}", flush=True)

    session_id = f"session-{int(datetime.now().timestamp())}-{uuid.uuid4().hex[:6]}"

    # Build DB LearningSession object
    db_session = LearningSession(
        id=session_id,
        user_id=current_user.id,
        content_title=payload.content_title,
        total_focus_minutes=0.0,
        completed_chunks=0,
    )
    db.add(db_session)
    await db.flush()

    # Create chunks from the personalized content
    for i in range(len(simplified_chunks)):
        raw_text = original_chunks[i] if i < len(original_chunks) else ""
        simplified_text = simplified_chunks[i]
        db_chunk = LearningChunk(
            id=f"chunk-{session_id}-{i}",
            session_id=session_id,
            original_text=raw_text,
            simplified_text=simplified_text,
            level=reading_level,
            chunk_index=i,
            word_count=len(raw_text.split()),
        )
        db.add(db_chunk)

    await db.commit()
    
    # Reload session with relation
    session_result = await db.execute(
        select(LearningSession)
        .where(LearningSession.id == session_id)
        .options(selectinload(LearningSession.chunks))
    )
    db_session_loaded = session_result.scalar_one()

    # Log final response to UI
    response_data = {
        "id": db_session_loaded.id,
        "user_id": str(db_session_loaded.user_id),
        "content_title": db_session_loaded.content_title,
        "total_focus_minutes": db_session_loaded.total_focus_minutes,
        "completed_chunks": db_session_loaded.completed_chunks,
        "started_at": db_session_loaded.started_at.isoformat() if db_session_loaded.started_at else None,
        "ended_at": db_session_loaded.ended_at.isoformat() if db_session_loaded.ended_at else None,
        "chunks": [
            {
                "id": c.id,
                "session_id": c.session_id,
                "original_text": c.original_text,
                "simplified_text": c.simplified_text,
                "level": c.level,
                "chunk_index": c.chunk_index,
                "word_count": c.word_count
            }
            for c in db_session_loaded.chunks
        ]
    }
    print(f"FINAL_RESPONSE_TO_UI={json.dumps(response_data)}", flush=True)

    return db_session_loaded


@router.get("/sessions", response_model=List[LearningSessionSchema])
async def get_sessions(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    query = (
        select(LearningSession)
        .where(LearningSession.user_id == current_user.id)
        .options(selectinload(LearningSession.chunks))
        .order_by(LearningSession.started_at.desc())
    )
    result = await db.execute(query)
    return result.scalars().all()


@router.patch("/sessions/{session_id}", response_model=LearningSessionSchema)
async def update_session(
    session_id: str,
    payload: dict,  # Free schema for partial session edits
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(LearningSession)
        .where(LearningSession.id == session_id, LearningSession.user_id == current_user.id)
        .options(selectinload(LearningSession.chunks))
    )
    session_obj = result.scalar_one_or_none()
    if not session_obj:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found",
        )
        
    for k, v in payload.items():
        if k == "chunks":
            continue
        if v is not None:
            if k == "ended_at" and isinstance(v, str):
                try:
                    v = datetime.fromisoformat(v.replace("Z", "+00:00"))
                except ValueError:
                    pass
            setattr(session_obj, k, v)

    await db.commit()
    await db.refresh(session_obj)
    return session_obj


@router.post("/content/upload", response_model=UploadContentResponse)
async def upload_content(
    file: UploadFile = File(...),
    title: str = Form(...),
    profile_type: Optional[str] = Form(None),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # Extract text from PDF/TXT using processing service
    extracted_text = await FileProcessingService.extract_text(file)
    extracted_text = normalize_plain_text_headings(extracted_text)

    # Save to SimplifiedContent
    db_content = SimplifiedContent(
        user_id=current_user.id,
        title=title,
        original_text=extracted_text,
    )
    db.add(db_content)
    await db.flush()

    # Get profile settings
    result = await db.execute(select(Profile).where(Profile.user_id == current_user.id))
    profile = result.scalar_one_or_none()
    db_profile_type = profile.diagnosis_type if profile else "dyslexia"
    reading_level = profile.reading_level if profile else "intermediate"
    
    # Route active profile
    resolved_profile_type = profile_type or db_profile_type

    print(f"FRONTEND_ACTIVE_PROFILE={profile_type}", flush=True)
    print(f"REQUEST_PAYLOAD={json.dumps({'title': title, 'profile_type': profile_type})}", flush=True)
    print(f"BACKEND_PROFILE_RECEIVED={resolved_profile_type}", flush=True)
    print(f"PROFILE_FROM_DATABASE={db_profile_type}", flush=True)

    # Enforce strict profile-specific chunking limits
    if resolved_profile_type.lower() == "adhd":
        word_limit = 50
    elif resolved_profile_type.lower() == "autism":
        word_limit = 125
    elif resolved_profile_type.lower() == "dyslexia":
        word_limit = 75
    else:
        word_limit = 80

    # Initialize AI service
    ai_service = get_ai_service()

    # Simplify the ENTIRE document first to preserve full context and logical topic flow
    simplified_doc = await ai_service.simplify_text(extracted_text, resolved_profile_type, reading_level)

    # Validate and repair markdown
    repaired_doc, val_status = validate_and_repair_markdown(simplified_doc)

    # Chunk the personalized text using the semantic chunker
    simplified_chunks = chunk_personalized_text(repaired_doc, resolved_profile_type, word_limit)
    
    # Chunk the original text into matching chunks
    original_chunks = chunk_original_text_into_n(extracted_text, len(simplified_chunks))

    # Log metrics
    orig_words = len(extracted_text.split())
    pers_words = len(repaired_doc.split())
    retention_pct = (pers_words / orig_words) * 100 if orig_words > 0 else 0
    concept_retention = calculate_concept_retention(repaired_doc)
    chunk_count = len(simplified_chunks)

    print(f"ORIGINAL_WORD_COUNT={orig_words}", flush=True)
    print(f"PERSONALIZED_WORD_COUNT={pers_words}", flush=True)
    print(f"RETENTION_PERCENTAGE={retention_pct:.2f}%", flush=True)
    
    print(f"CONTENT_RETENTION_PERCENT={retention_pct:.2f}", flush=True)
    print(f"CONCEPT_RETENTION_PERCENT={concept_retention:.2f}", flush=True)
    print(f"PROFILE_TYPE={resolved_profile_type.upper()}", flush=True)
    print(f"CHUNK_COUNT={chunk_count}", flush=True)
    print(f"MARKDOWN_VALIDATION_STATUS={val_status}", flush=True)

    print(f"TOTAL_SOURCE_WORDS={orig_words}", flush=True)
    print(f"TOTAL_SIMPLIFIED_WORDS={pers_words}", flush=True)
    print(f"WORD_RETENTION_PERCENT={retention_pct:.2f}", flush=True)

    for chunk in simplified_chunks:
        title = extract_chunk_title(chunk)
        words = len(chunk.split())
        score = evaluate_concept_completeness(chunk)
        concept_name = extract_concept_name(chunk)
        print(f"CHUNK_TITLE={title}", flush=True)
        print(f"WORD_COUNT={words}", flush=True)
        print(f"CONCEPT_COMPLETENESS_SCORE={score:.2f}", flush=True)
        print(f"CONCEPT_NAME={concept_name}", flush=True)
        
        # Topic verification logging
        lines = [l.strip() for l in chunk.split("\n") if l.strip()]
        start_topic = lines[0] if lines else ""
        end_topic = lines[-1] if lines else ""
        topic_complete = score >= 70.0
        print(f"TOPIC_NAME={concept_name}", flush=True)
        print(f"START_TOPIC={start_topic}", flush=True)
        print(f"END_TOPIC={end_topic}", flush=True)
        print(f"TOPIC_COMPLETE={topic_complete}", flush=True)

    session_id = f"session-{int(datetime.now().timestamp())}-{uuid.uuid4().hex[:6]}"
    
    db_session = LearningSession(
        id=session_id,
        user_id=current_user.id,
        simplified_content_id=db_content.id,
        content_title=title,
        total_focus_minutes=0.0,
        completed_chunks=0,
    )
    db.add(db_session)
    await db.flush()

    # Create chunks from the personalized content
    for i in range(len(simplified_chunks)):
        raw_text = original_chunks[i] if i < len(original_chunks) else ""
        simplified_text = simplified_chunks[i]
        db_chunk = LearningChunk(
            id=f"chunk-{session_id}-{i}",
            session_id=session_id,
            original_text=raw_text,
            simplified_text=simplified_text,
            level=reading_level,
            chunk_index=i,
            word_count=len(raw_text.split()),
        )
        db.add(db_chunk)

    await db.commit()
    response_data = {"session_id": session_id, "chunk_count": len(simplified_chunks)}
    print(f"FINAL_RESPONSE_TO_UI={json.dumps(response_data)}", flush=True)
    return response_data


@router.get("/content/chunks/{session_id}")
async def get_chunks(
    session_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # Verify session belongs to user
    sess_result = await db.execute(
        select(LearningSession).where(LearningSession.id == session_id, LearningSession.user_id == current_user.id)
    )
    if not sess_result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found or access denied",
        )

    result = await db.execute(
        select(LearningChunk)
        .where(LearningChunk.session_id == session_id)
        .order_by(LearningChunk.chunk_index.asc())
    )
    chunks = result.scalars().all()
    return {"chunks": chunks}


@router.post("/content/simplify", response_model=SimplifyResponse)
async def simplify_content(
    payload: SimplifyPayload,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # Fetch active profile
    result = await db.execute(select(Profile).where(Profile.user_id == current_user.id))
    profile = result.scalar_one_or_none()
    db_profile_type = profile.diagnosis_type if profile else "dyslexia"
    
    # Route active profile
    resolved_profile_type = payload.profile_type or db_profile_type

    print(f"FRONTEND_ACTIVE_PROFILE={payload.profile_type}", flush=True)
    print(f"REQUEST_PAYLOAD={payload.model_dump_json() if hasattr(payload, 'model_dump_json') else str(payload)}", flush=True)
    print(f"BACKEND_PROFILE_RECEIVED={resolved_profile_type}", flush=True)
    print(f"PROFILE_FROM_DATABASE={db_profile_type}", flush=True)

    payload.text = normalize_plain_text_headings(payload.text)
    simplified = await ai_service.simplify_text(payload.text, resolved_profile_type, payload.level)
    
    # Validate and repair markdown
    repaired, val_status = validate_and_repair_markdown(simplified)

    orig_words = len(payload.text.split())
    pers_words = len(repaired.split())
    retention_pct = (pers_words / orig_words) * 100 if orig_words > 0 else 0
    concept_retention = calculate_concept_retention(repaired)

    print(f"CONTENT_RETENTION_PERCENT={retention_pct:.2f}", flush=True)
    print(f"CONCEPT_RETENTION_PERCENT={concept_retention:.2f}", flush=True)
    print(f"PROFILE_TYPE={resolved_profile_type.upper()}", flush=True)
    print(f"CHUNK_COUNT=1", flush=True)
    print(f"MARKDOWN_VALIDATION_STATUS={val_status}", flush=True)

    print(f"TOTAL_SOURCE_WORDS={orig_words}", flush=True)
    print(f"TOTAL_SIMPLIFIED_WORDS={pers_words}", flush=True)
    print(f"WORD_RETENTION_PERCENT={retention_pct:.2f}", flush=True)

    # Treated as 1 single chunk since simplify endpoint doesn't split
    title = extract_chunk_title(repaired)
    words = len(repaired.split())
    score = evaluate_concept_completeness(repaired)
    concept_name = extract_concept_name(repaired)
    print(f"CHUNK_TITLE={title}", flush=True)
    print(f"WORD_COUNT={words}", flush=True)
    print(f"CONCEPT_COMPLETENESS_SCORE={score:.2f}", flush=True)
    print(f"CONCEPT_NAME={concept_name}", flush=True)
    
    # Topic verification logging
    lines = [l.strip() for l in repaired.split("\n") if l.strip()]
    start_topic = lines[0] if lines else ""
    end_topic = lines[-1] if lines else ""
    topic_complete = score >= 70.0
    print(f"TOPIC_NAME={concept_name}", flush=True)
    print(f"START_TOPIC={start_topic}", flush=True)
    print(f"END_TOPIC={end_topic}", flush=True)
    print(f"TOPIC_COMPLETE={topic_complete}", flush=True)

    response_data = {"simplified": repaired}
    print(f"FINAL_RESPONSE_TO_UI={json.dumps(response_data)}", flush=True)
    return response_data
