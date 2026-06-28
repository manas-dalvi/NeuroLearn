# backend/scratch/debug_simplify.py
import sys
import os
import asyncio

# Ensure parent directory is in path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.config import settings
from app.services.ai.factory import get_ai_service

async def main():
    ai_service = get_ai_service()
    
    text = "Neuromorphic computing refers to computer chips designed to copy the physical structure of biological brains. By modeling the connections and signals of real biological neurons, neuromorphic chips can run AI algorithms with very low power, similar to the efficiency of the human brain."
    
    profile_type = "dyslexia"
    reading_level = "intermediate"
    
    print("=" * 80)
    print("TESTING SIMPLIFY TEXT & LOGGING RAW GROQ RESPONSE")
    print("=" * 80)
    
    # Let's inspect the simplify_text method by invoking parts of it manually
    system_instruction = ai_service._build_system_instruction(profile_type, reading_level)
    user_instruction = (
        f"Simplify the following text for a Dyslexic reader. Use 'KEY IDEA' headers for each paragraph. "
        f"Under each KEY IDEA, write a summary sentence (max 12 words) followed by short detailed sentences (9-14 words each) "
        f"separated by double newlines. Keep the total output length at least 95% of the source word count.\n\n"
        f"Source Text:\n{text}"
    )
    
    print("System Prompt:\n", system_instruction)
    print("\nUser Prompt:\n", user_instruction)
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
    print("RAW GROQ RESPONSE:")
    print("=" * 80)
    print(raw_response)
    print(f"Raw Word Count: {len(raw_response.split())}")
    
    # Now run post-processing
    processed = ai_service._post_process_dyslexia(raw_response)
    print("\n" + "=" * 80)
    print("POST-PROCESSED DYSLEXIA RESPONSE:")
    print("=" * 80)
    print(processed)
    print(f"Processed Word Count: {len(processed.split())}")

if __name__ == "__main__":
    asyncio.run(main())
