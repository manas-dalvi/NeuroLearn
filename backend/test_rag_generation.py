# backend/test_rag_generation.py
import sys
import os
import asyncio
import logging

# Ensure parent directory is in path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Configure logging
logging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s")
logger = logging.getLogger(__name__)

async def run_rag_generation_tests():
    print("=" * 80)
    print("RUNNING STAGE 3 RETRIEVAL-AUGMENTED GENERATION (RAG) VERIFICATION TEST")
    print("=" * 80)

    from app.services.rag_service import RagService
    from app.core.config import settings

    # 1. Initialize RagService
    print("1. Initializing RagService...")
    rag = RagService()

    session_id = "session-rag-gen-777"

    # 2. Define Sample Text Chunks
    print("2. Preparing sample text chunks with neuro-computational content...")
    sample_chunks = [
        {
            "id": f"chunk-{session_id}-0",
            "simplified_text": "Hierarchical Temporal Memory (HTM) is a machine learning technology that aims to capture the structural and algorithmic properties of the neocortex. The neocortex is the outer layer of the mammalian brain responsible for high-level cognitive functions.",
            "chunk_index": 0,
            "level": "intermediate"
        },
        {
            "id": f"chunk-{session_id}-1",
            "simplified_text": "Sparse Distributed Representations (SDRs) utilize a large population of neurons where only a small percentage (typically 1-2%) are active at any given time. This provides massive noise tolerance and high storage capacity.",
            "chunk_index": 1,
            "level": "intermediate"
        },
        {
            "id": f"chunk-{session_id}-2",
            "simplified_text": "The Spatial Pooler maps feedforward input vectors to sparse representations, adjusting column connections based on Hebbian learning. Hebbian learning is a neuroscientific rule where synapses strengthen when pre-synaptic and post-synaptic neurons fire together.",
            "chunk_index": 2,
            "level": "intermediate"
        },
        {
            "id": f"chunk-{session_id}-3",
            "simplified_text": "The Temporal Pooler is responsible for sequence learning and prediction, tracking transitions between active columns over time to anticipate future neural states.",
            "chunk_index": 3,
            "level": "intermediate"
        }
    ]

    # 3. Index Sample Chunks in ChromaDB
    print(f"3. Indexing {len(sample_chunks)} chunks for session {session_id} in ChromaDB...")
    rag.add_document(session_id, sample_chunks)
    print("Indexing completed successfully.")

    # 4. Perform Grounded QA Queries
    test_queries = [
        {
            "desc": "Question answered directly in the document (HTM)",
            "query": "What is Hierarchical Temporal Memory and what does it mimic?"
        },
        {
            "desc": "Question answered directly in the document (SDRs)",
            "query": "Explain what Sparse Distributed Representations are and their active percentage."
        },
        {
            "desc": "Question completely out of context (unrelated topic)",
            "query": "How do you cook chocolate chip cookies?"
        },
        {
            "desc": "Empty Query",
            "query": ""
        },
        {
            "desc": "Whitespace Query",
            "query": "     "
        }
    ]

    print("\n4. Running RAG Generation Pipeline:")
    for item in test_queries:
        desc = item["desc"]
        query = item["query"]
        print("\n" + "#" * 80)
        print(f"TEST CASE: {desc}")
        print(f"QUERY: '{query}'")
        print("#" * 80)

        # Call the generate_rag_response method
        result = await rag.generate_rag_response(session_id, query)

        # Show Retrieved Chunks
        print("\n--- RETRIEVED CHUNKS ---")
        retrieved = result["retrieved_chunks"]
        if not retrieved:
            print("[No chunks retrieved]")
        else:
            for idx, r in enumerate(retrieved):
                print(f"Match #{idx + 1}:")
                print(f"  Chunk ID: {r['id']}")
                print(f"  Similarity Score: {r['score']:.4f} (Distance: {r['distance']:.4f})")
                print(f"  Metadata: {r['metadata']}")
                print(f"  Text: {r['text']}")
                print()

        # Show Constructed Context Block
        print("--- CONSTRUCTED CONTEXT BLOCK ---")
        context_block = result["context_block"]
        if not context_block:
            print("[Context block is empty]")
        else:
            print(context_block)
        print()

        # Show Final Prompt Sent to Groq/LLM
        print("--- FINAL PROMPT SENT TO LLM ---")
        prompt_sent = result["prompt_sent"]
        if not prompt_sent:
            print("[No prompt sent]")
        else:
            print(prompt_sent)
        print()

        # Show Generated Answer
        print("--- GENERATED GROUNDED ANSWER ---")
        answer = result["answer"]
        print(answer)
        print()

        # Assertions
        if query == "":
            assert answer == "Please provide a valid question.", f"Expected query validation error, got: {answer}"
        elif query == "     ":
            assert answer == "Please provide a valid question.", f"Expected query validation error, got: {answer}"
        elif "cookies" in query:
            assert answer == "I cannot find the answer in the provided document.", f"Expected fallback response, got: {answer}"
        else:
            # Grounded response checks
            assert answer != "I cannot find the answer in the provided document.", "Expected valid grounded answer"
            assert "mock" in answer.lower() or len(answer) > 10, "Expected generated answer from LLM or high-fidelity mock response"

    print("=" * 80)
    print("STAGE 3 RAG GENERATION TEST PASSED SUCCESSFULLY!")
    print("=" * 80)

if __name__ == "__main__":
    asyncio.run(run_rag_generation_tests())
