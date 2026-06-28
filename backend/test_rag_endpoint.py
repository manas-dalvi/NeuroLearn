# backend/test_rag_endpoint.py
import requests
import random
import json
import time

BASE_URL = "http://127.0.0.1:8000"

def test_rag_qa_flow():
    session = requests.Session()
    test_id = random.randint(1000, 9999)
    email = f"rag_user_{test_id}@neurolearn.com"
    password = f"Password123_{test_id}"
    fullname = f"RAG Test User {test_id}"
    
    # 1. Sign Up
    signup_data = {
        "email": email,
        "password": password,
        "full_name": fullname
    }
    res = session.post(f"{BASE_URL}/api/v1/auth/signup", json=signup_data)
    if res.status_code not in (200, 201):
        print(f"Signup failed: {res.text}")
        return

    # 2. Log In
    login_data = {
        "email": email,
        "password": password
    }
    res = session.post(f"{BASE_URL}/api/v1/auth/login", json=login_data)
    login_res = res.json()
    token = login_res["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 3. Create Learning Session
    session_payload = {
        "content_title": "Understanding Neuromorphic Computing",
        "text": "Neuromorphic computing refers to computer chips designed to copy the physical structure of biological brains. By modeling the connections and signals of real biological neurons, neuromorphic chips can run AI algorithms with very low power, similar to the efficiency of the human brain."
    }
    
    print("\n--- CREATE SESSION PAYLOAD ---")
    print(json.dumps(session_payload, indent=2))
    
    res = session.post(f"{BASE_URL}/api/v1/sessions", json=session_payload, headers=headers)
    session_res = res.json()
    
    print("\n--- CREATE SESSION RESPONSE ---")
    print(json.dumps(session_res, indent=2))
    
    session_id = session_res["id"]
    
    # Give the indexing thread a moment to finish adding vectors to ChromaDB
    time.sleep(3)

    # 4. Ask a Question (RAG QA)
    qa_payload = {
        "question": "What structure do neuromorphic chips copy and why are they efficient?"
    }
    
    print("\n--- EXACT REQUEST PAYLOAD (POST /api/v1/sessions/{session_id}/ask) ---")
    print(json.dumps(qa_payload, indent=2))
    
    res = session.post(f"{BASE_URL}/api/v1/sessions/{session_id}/ask", json=qa_payload, headers=headers)
    
    print("\n--- EXACT JSON RESPONSE ---")
    print(json.dumps(res.json(), indent=2))

if __name__ == "__main__":
    test_rag_qa_flow()
