# backend/scratch/test_htm_repetition.py
import sys
import os
import asyncio
import json

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.config import settings
from app.services.ai.factory import get_ai_service
from app.api.v1.sessions import chunk_personalized_text

async def main():
    ai_service = get_ai_service()
    
    text = (
        "Hierarchical Temporal Memory (HTM) is a machine learning technology that aims to "
        "capture the structural and algorithmic properties of the neocortex. Because HTM "
        "operates on streaming data, it can learn continuously and detect anomalies in "
        "real-time, making it well-suited for time-series forecasting."
    )
    
    profile_type = "dyslexia"
    reading_level = "intermediate"
    
    print("=" * 80)
    print("1. SHOW THE EXACT RAW GROQ RESPONSE BEFORE ANY POST-PROCESSING")
    print("=" * 80)
    
    system_instruction = ai_service._build_system_instruction(profile_type, reading_level)
    p_type = profile_type.lower()
    user_instruction = (
        f"Simplify the following text for a Dyslexic reader. Use 'KEY IDEA' headers for each paragraph. "
        f"Under each KEY IDEA, write a summary sentence (max 12 words) followed by short detailed sentences (9-14 words each) "
        f"separated by double newlines. Keep the total output length at least 95% of the source word count.\n\n"
        f"Source Text:\n{text}"
    )
    
    response = await ai_service.client.chat.completions.create(
        model=ai_service.model,
        messages=[
            {"role": "system", "content": system_instruction},
            {"role": "user", "content": user_instruction}
        ],
        temperature=0.1,
    )
    raw_response = response.choices[0].message.content.strip()
    print(raw_response)
    print(f"Raw Response Word Count: {len(raw_response.split())}")
    
    print("\n" + "=" * 80)
    print("2. SHOW THE OUTPUT IMMEDIATELY AFTER simplify_text()")
    print("=" * 80)
    processed = ai_service._post_process_dyslexia(raw_response)
    print(processed)
    print(f"simplify_text() Word Count: {len(processed.split())}")
    
    print("\n" + "=" * 80)
    print("3. SHOW THE OUTPUT OF chunk_personalized_text()")
    print("=" * 80)
    chunks = chunk_personalized_text(processed, profile_type, 75)
    for idx, chunk in enumerate(chunks):
        print(f"--- Chunk {idx} (Words: {len(chunk.split())}) ---")
        print(chunk)
    
if __name__ == "__main__":
    asyncio.run(main())
