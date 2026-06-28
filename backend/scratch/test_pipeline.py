# backend/scratch/test_pipeline.py
import sys
import os
import asyncio
import re

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.config import settings
from app.services.file_service import FileProcessingService
from app.services.ai.factory import get_ai_service
from app.api.v1.sessions import chunk_personalized_text, validate_and_repair_markdown

def deduplicate_text(text: str) -> str:
    """
    Removes duplicate sentences to clean up LLM repetitions or duplicate pages.
    Preserves formatting (headings, lists, newlines), and removes empty headers.
    """
    if not text:
        return text
        
    lines = text.split("\n")
    seen_sentences = set()
    cleaned_lines = []
    
    for line in lines:
        stripped = line.strip()
        # If it's a heading or empty line, keep it
        if not stripped or stripped.startswith("#") or stripped.upper().startswith("KEY IDEA"):
            cleaned_lines.append(line)
            continue
            
        # Split line into sentences
        sentences = re.split(r'([.!?]+(?:\s+|$))', line)
        cleaned_sentences = []
        i = 0
        while i < len(sentences):
            s = sentences[i]
            punc = sentences[i+1] if i+1 < len(sentences) else ""
            full_s = (s + punc).strip()
            if full_s:
                norm_s = re.sub(r'[^a-z0-9]', '', full_s.lower())
                if norm_s not in seen_sentences:
                    seen_sentences.add(norm_s)
                    cleaned_sentences.append(full_s)
            i += 2
            
        if cleaned_sentences:
            cleaned_lines.append(" ".join(cleaned_sentences))
            
    # Remove empty headings
    final_lines = []
    for idx, line in enumerate(cleaned_lines):
        stripped = line.strip()
        if stripped.startswith("#") or stripped.upper().startswith("KEY IDEA"):
            # Check if there is any content following this heading before another heading
            has_content = False
            for next_line in cleaned_lines[idx+1:]:
                next_stripped = next_line.strip()
                if not next_stripped:
                    continue
                if next_stripped.startswith("#") or next_stripped.upper().startswith("KEY IDEA"):
                    break
                has_content = True
                break
            if has_content:
                final_lines.append(line)
        else:
            final_lines.append(line)
            
    result = "\n".join(final_lines)
    result = re.sub(r'\n{3,}', '\n\n', result)
    return result.strip()

async def main():
    pdf_path = "test_5page.pdf"
    print("=" * 80)
    print(f"TESTING WITH 5-PAGE PDF: {pdf_path}")
    print("=" * 80)
    
    # Mock upload file object
    class MockFile:
        def __init__(self, path):
            self.filename = path
            self.file = open(path, "rb")
        async def read(self, size=-1):
            return self.file.read(size)
            
    mock_file = MockFile(pdf_path)
    
    # 1. Extract Text
    extracted_text = await FileProcessingService.extract_text(mock_file)
    mock_file.file.close()
    
    print(f"Extracted Text Length: {len(extracted_text)} chars")
    print(f"Extracted Text Word Count: {len(extracted_text.split())} words")
    
    # 2. Simplify Text (Dyslexia)
    ai_service = get_ai_service()
    profile_type = "dyslexia"
    reading_level = "intermediate"
    
    # We will do the raw call first
    system_instruction = ai_service._build_system_instruction(profile_type, reading_level)
    user_instruction = (
        f"Simplify the following text for a Dyslexic reader. Use 'KEY IDEA' headers for each paragraph. "
        f"Under each KEY IDEA, write a summary sentence (max 12 words) followed by short detailed sentences (9-14 words each) "
        f"separated by double newlines. Keep the total output length at least 95% of the source word count.\n\n"
        f"Source Text:\n{extracted_text}"
    )
    
    print("\nSending request to Groq...")
    response = await ai_service.client.chat.completions.create(
        model=ai_service.model,
        messages=[
            {"role": "system", "content": system_instruction},
            {"role": "user", "content": user_instruction}
        ],
        temperature=0.1,
    )
    raw_response = response.choices[0].message.content.strip()
    
    print("\n" + "=" * 80)
    print("RAW GROQ RESPONSE BEFORE POST-PROCESSING:")
    print("=" * 80)
    print(raw_response)
    print(f"Raw response word count: {len(raw_response.split())}")
    
    # 3. Post-process (simplify_text)
    simplified_doc = ai_service._post_process_dyslexia(raw_response)
    print("\n" + "=" * 80)
    print("OUTPUT IMMEDIATELY AFTER simplify_text():")
    print("=" * 80)
    print(simplified_doc)
    print(f"simplify_text() word count: {len(simplified_doc.split())}")
    
    # 4. Deduplicate text
    deduped_doc = deduplicate_text(simplified_doc)
    print("\n" + "=" * 80)
    print("OUTPUT AFTER deduplicate_text():")
    print("=" * 80)
    print(deduped_doc)
    print(f"Deduplicated word count: {len(deduped_doc.split())}")
    
    # 5. Validate & repair markdown
    repaired_doc, val_status = validate_and_repair_markdown(deduped_doc)
    
    # 6. Chunking
    chunks = chunk_personalized_text(repaired_doc, profile_type, 75)
    
    print("\n" + "=" * 80)
    print("CHUNKING REPORT:")
    print("=" * 80)
    print(f"Number of chunks: {len(chunks)}")
    
    total_words = sum(len(c.split()) for c in chunks)
    avg_words = total_words / len(chunks) if chunks else 0
    print(f"Average words per chunk: {avg_words:.1f}")
    
    print("\n--- FIRST 3 CHUNKS ---")
    for idx, chunk in enumerate(chunks[:3]):
        print(f"\n[Chunk {idx} (Words: {len(chunk.split())})]:")
        print(chunk)
        print("-" * 40)

if __name__ == "__main__":
    asyncio.run(main())
