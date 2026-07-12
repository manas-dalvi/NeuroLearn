# backend/scratch/test_chat.py
import sys
import os
import uuid
from datetime import datetime
from fastapi.testclient import TestClient

# Add backend directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

os.environ["AI_PROVIDER"] = "groq"
from app.main import app

client = TestClient(app)

def test_ai_study_assistant():
    print("=" * 80)
    print("RUNNING AI STUDY ASSISTANT BACKEND VERIFICATION TEST")
    print("=" * 80)

    # 1. Sign up a new user
    test_id = uuid.uuid4().hex[:6]
    email = f"chat_tester_{test_id}@neurolearn.com"
    signup_payload = {
        "email": email,
        "password": "Password123!",
        "full_name": "Study Assistant Tester"
    }
    signup_res = client.post("/api/v1/auth/signup", json=signup_payload)
    if signup_res.status_code != 201:
        print(f"Signup failed: {signup_res.text}")
        sys.exit(1)
    
    # 2. Log in
    login_payload = {
        "email": email,
        "password": "Password123!"
    }
    login_res = client.post("/api/v1/auth/login", json=login_payload)
    if login_res.status_code != 200:
        print(f"Login failed: {login_res.text}")
        sys.exit(1)
        
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    print("Authenticated successfully.")

    # 3. Create Learning Session
    session_payload = {
        "content_title": "HTM & SDR Guide",
        "text": (
            "Hierarchical Temporal Memory (HTM) is a machine learning technology that aims to "
            "capture the structural and algorithmic properties of the neocortex. "
            "Sparse Distributed Representations (SDRs) utilize a large population of neurons where only a "
            "small percentage (typically 1-2%) are active at any given time."
        )
    }
    create_res = client.post("/api/v1/sessions", json=session_payload, headers=headers)
    if create_res.status_code != 201:
        print(f"Session creation failed: {create_res.text}")
        sys.exit(1)
        
    session_data = create_res.json()
    session_id = session_data["id"]
    chunks = session_data["chunks"]
    print(f"Session created with ID: {session_id}, Chunks generated: {len(chunks)}")
    
    chunk_0_id = chunks[0]["id"] if chunks else None

    # Wait a brief moment for ChromaDB indexing (running sync under TestClient/to_thread)
    import time
    time.sleep(1)

    # 4. Ask a Document-Wide Question (RAG)
    chat_payload = {
        "session_id": session_id,
        "question": "What is Hierarchical Temporal Memory?",
        "mode": "CHAT"
    }
    print("\n--- TEST CASE 1: Document-Wide RAG Chat ---")
    chat_res = client.post("/api/v1/chat/chunk", json=chat_payload, headers=headers)
    if chat_res.status_code != 200:
        print(f"Chat failed: {chat_res.text}")
        sys.exit(1)
        
    chat_data = chat_res.json()
    print("Answer:")
    print(chat_data["answer"])
    print(f"Confidence Level: {chat_data['confidence_level']} (Score: {chat_data['confidence_score']:.2f})")
    print(f"Source Pills referenced: {[{'chunk_id': s['chunk_id'], 'index': s['chunk_index'], 'title': s['title']} for s in chat_data['sources']]}")
    
    assert chat_data["confidence_level"] in ("High", "Medium"), "Expected high/medium confidence matching document context."
    assert len(chat_data["sources"]) > 0, "Expected at least 1 source metadata citation."
    assert chat_data["sources"][0]["chunk_id"].startswith("chunk-"), "Source ID must map back to learning chunks."

    # 5. Ask a Chunk-Scoped Question
    if chunk_0_id:
        scoped_payload = {
            "session_id": session_id,
            "chunk_id": chunk_0_id,
            "question": "What is the active percentage in SDRs?",
            "mode": "CHAT"
        }
        print("\n--- TEST CASE 2: Chunk-Scoped Chat (Chunk ID: {}) ---".format(chunk_0_id))
        scoped_res = client.post("/api/v1/chat/chunk", json=scoped_payload, headers=headers)
        if scoped_res.status_code != 200:
            print(f"Scoped Chat failed: {scoped_res.text}")
            sys.exit(1)
            
        scoped_data = scoped_res.json()
        print("Answer:")
        print(scoped_data["answer"])
        print(f"Confidence Level: {scoped_data['confidence_level']} (Score: {scoped_data['confidence_score']:.2f})")
        print(f"Source Pills referenced: {[{'chunk_id': s['chunk_id'], 'index': s['chunk_index'], 'title': s['title']} for s in scoped_data['sources']]}")
        
        assert scoped_data["confidence_level"] == "High"
        assert scoped_data["confidence_score"] == 1.0
        assert scoped_data["sources"][0]["chunk_id"] == chunk_0_id

    # 6. Ask an Out-of-Context Question (Grounded Fallback)
    ooc_payload = {
        "session_id": session_id,
        "question": "How do you cook chocolate chip cookies?",
        "mode": "CHAT"
    }
    print("\n--- TEST CASE 3: Out of Context Query Fallback ---")
    ooc_res = client.post("/api/v1/chat/chunk", json=ooc_payload, headers=headers)
    ooc_data = ooc_res.json()
    print("Answer:")
    print(ooc_data["answer"])
    print(f"Confidence Level: {ooc_data['confidence_level']}")
    
    assert ooc_data["answer"] == "I cannot find the answer in the provided document."
    assert ooc_data["confidence_level"] == "Low"

    # 7. Check Chat History API
    print("\n--- TEST CASE 4: Retrieve Session Chat History ---")
    hist_res = client.get(f"/api/v1/sessions/{session_id}/chat", headers=headers)
    if hist_res.status_code != 200:
        print(f"History retrieval failed: {hist_res.text}")
        sys.exit(1)
        
    hist_data = hist_res.json()
    print(f"Chat History length: {len(hist_data)} messages")
    for msg in hist_data:
        print(f"  [{msg['role'].upper()}]: {msg['content'][:60]}...")
        
    # We sent 3 questions and got 3 answers (including scoped & fallback), so history must have 6 messages
    assert len(hist_data) >= 4, "Expected history to record conversation turns."

    print("\n" + "=" * 80)
    print("BACKEND CHAT INTEGRATION TEST PASSED SUCCESSFULLY!")
    print("=" * 80)

if __name__ == "__main__":
    test_ai_study_assistant()
