# backend/test_retrieval.py
import sys
import os
import logging

# Ensure parent directory is in path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Configure logging
logging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s")

def test_retrieval_pipeline():
    print("=" * 80)
    print("RUNNING STAGE 2 RETRIEVAL PIPELINE TEST")
    print("=" * 80)

    from app.services.rag_service import RagService
    
    # 1. Initialize RagService (creates ChromaDB collection and loads embeddings model)
    print("1. Initializing RagService...")
    rag = RagService()
    
    session_id = "session-test-retrieval-123"
    
    # 2. Define Sample Text Chunks
    print("2. Preparing sample text chunks...")
    sample_chunks = [
        {
            "id": f"chunk-{session_id}-0",
            "simplified_text": "Hierarchical Temporal Memory (HTM) is a machine learning technology that aims to capture the structural and algorithmic properties of the neocortex.",
            "chunk_index": 0,
            "level": "intermediate"
        },
        {
            "id": f"chunk-{session_id}-1",
            "simplified_text": "Sparse Distributed Representations (SDRs) utilize a large population of neurons where only a small percentage are active at any given time.",
            "chunk_index": 1,
            "level": "intermediate"
        },
        {
            "id": f"chunk-{session_id}-2",
            "simplified_text": "The Spatial Pooler maps feedforward input vectors to sparse representations, adjusting column connections based on Hebbian learning.",
            "chunk_index": 2,
            "level": "intermediate"
        },
        {
            "id": f"chunk-{session_id}-3",
            "simplified_text": "The Temporal Pooler is responsible for sequence learning and prediction, tracking transitions between active columns over time.",
            "chunk_index": 3,
            "level": "intermediate"
        }
    ]
    
    # 3. Index Sample Chunks in ChromaDB
    print(f"3. Indexing {len(sample_chunks)} chunks for session {session_id}...")
    rag.add_document(session_id, sample_chunks)
    print("Indexing completed.")
    
    # 4. Perform Queries
    queries = [
        "What is Sparse Distributed Representation?",
        "How does the neocortex memory system work in HTM?",
        "Explain Hebbian learning and input vector mapping."
    ]
    
    print("\n4. Running Semantic Queries:")
    for query in queries:
        print(f"\nQuery: '{query}'")
        print("-" * 50)
        
        # Retrieve context
        results = rag.retrieve_context(session_id=session_id, query=query, top_k=2)
        
        for idx, res in enumerate(results):
            print(f"  Match #{idx + 1}:")
            print(f"    Chunk ID: {res['id']}")
            print(f"    Similarity Score: {res['score']:.4f} (Distance: {res['distance']:.4f})")
            print(f"    Metadata: {res['metadata']}")
            print(f"    Text: {res['text']}")
            print()
            
    print("=" * 80)
    print("RETRIEVAL PIPELINE TEST PASSED SUCCESSFULLY!")
    print("=" * 80)

if __name__ == "__main__":
    test_retrieval_pipeline()
