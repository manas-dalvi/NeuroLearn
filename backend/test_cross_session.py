# backend/test_cross_session.py
import sys
import os
import logging

# Ensure parent directory is in path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Configure logging
logging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s")

def test_cross_session_isolation():
    print("=" * 80)
    print("RUNNING CROSS-SESSION ISOLATION VERIFICATION TEST")
    print("=" * 80)

    from app.services.rag_service import RagService
    rag = RagService()

    session_cooking = "session-cooking-999"
    session_gardening = "session-gardening-888"

    # 1. Prepare different content for both sessions
    cooking_chunks = [
        {
            "id": f"chunk-{session_cooking}-0",
            "simplified_text": "To prepare spaghetti and meatballs, simmer meatballs in thick marinara tomato sauce for 30 minutes until fully cooked.",
            "chunk_index": 0,
            "level": "intermediate"
        },
        {
            "id": f"chunk-{session_cooking}-1",
            "simplified_text": "Boil the pasta in salted water until al dente, drain, and immediately toss with the warm marinara sauce.",
            "chunk_index": 1,
            "level": "intermediate"
        }
    ]

    gardening_chunks = [
        {
            "id": f"chunk-{session_gardening}-0",
            "simplified_text": "Plant tomatoes in well-draining soil with plenty of sunlight, watering deeply once a week at the base of the plant.",
            "chunk_index": 0,
            "level": "intermediate"
        },
        {
            "id": f"chunk-{session_gardening}-1",
            "simplified_text": "Prune roses in early spring by cutting back dead wood and trimming stems at a 45-degree angle above outward-facing buds.",
            "chunk_index": 1,
            "level": "intermediate"
        }
    ]

    # 2. Index both documents
    print("Indexing cooking session chunks...")
    rag.add_document(session_cooking, cooking_chunks)
    print("Indexing gardening session chunks...")
    rag.add_document(session_gardening, gardening_chunks)
    print("All chunks indexed.")

    # 3. Cross-Session Query Verification
    print("\nExecuting Cross-Session Queries:")

    # Query cooking session with a gardening topic
    query_gardening = "How do you prune roses in early spring?"
    print(f"\nQuerying Cooking Session '{session_cooking}' with gardening query: '{query_gardening}'")
    cooking_results = rag.retrieve_context(session_id=session_cooking, query=query_gardening, top_k=2)
    
    print(f"Results returned: {len(cooking_results)}")
    for res in cooking_results:
        print(f"  - Chunk ID: {res['id']}")
        print(f"    Session ID in Metadata: {res['metadata']['session_id']}")
        print(f"    Text: {res['text']}")
        assert res['metadata']['session_id'] == session_cooking, "LEAKAGE DETECTED: Retrieved chunk from another session!"

    # Query gardening session with a cooking topic
    query_cooking = "spaghetti meatballs recipe marinara sauce"
    print(f"\nQuerying Gardening Session '{session_gardening}' with cooking query: '{query_cooking}'")
    gardening_results = rag.retrieve_context(session_id=session_gardening, query=query_cooking, top_k=2)
    
    print(f"Results returned: {len(gardening_results)}")
    for res in gardening_results:
        print(f"  - Chunk ID: {res['id']}")
        print(f"    Session ID in Metadata: {res['metadata']['session_id']}")
        print(f"    Text: {res['text']}")
        assert res['metadata']['session_id'] == session_gardening, "LEAKAGE DETECTED: Retrieved chunk from another session!"

    print("\n" + "=" * 80)
    print("SUCCESS: Cross-session retrieval did not occur. Sessions are fully isolated!")
    print("=" * 80)

if __name__ == "__main__":
    test_cross_session_isolation()
