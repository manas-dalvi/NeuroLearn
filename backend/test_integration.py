import requests
import random
import time
import sys

BASE_URL = "http://127.0.0.1:8000"

def test_flow():
    session = requests.Session()
    print("1. Testing Health Endpoint...")
    try:
        res = session.get(f"{BASE_URL}/api/v1/health")
        print(f"Health Response Status: {res.status_code}")
        print(f"Health Response Body: {res.json()}")
        if res.status_code != 200 or res.json().get("status") != "healthy":
            raise Exception("Health check failed")
    except Exception as e:
        print(f"Error connecting to server: {e}")
        sys.exit(1)

    print("\n2. Testing Sign Up...")
    test_id = random.randint(1000, 9999)
    email = f"user_{test_id}@neurolearn.com"
    password = f"Password123_{test_id}"
    fullname = f"Test User {test_id}"
    
    signup_data = {
        "email": email,
        "password": password,
        "full_name": fullname
    }
    res = session.post(f"{BASE_URL}/api/v1/auth/signup", json=signup_data)
    print(f"Signup Status: {res.status_code}")
    print(f"Signup Response: {res.json()}")
    if res.status_code not in (200, 201):
        raise Exception("Signup failed")

    print("\n3. Testing Log In...")
    login_data = {
        "email": email,
        "password": password
    }
    res = session.post(f"{BASE_URL}/api/v1/auth/login", json=login_data)
    print(f"Login Status: {res.status_code}")
    login_res = res.json()
    print(f"Login Response: {login_res}")
    if res.status_code != 200 or "access_token" not in login_res:
        raise Exception("Login failed")
    
    token = login_res["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    print("\n4. Testing Patch Cognitive Profile...")
    profile_payload = {
        "diagnosis_type": "dyslexia",
        "focus_duration_minutes": 25,
        "break_duration_minutes": 5,
        "chunk_word_limit": 15,
        "reading_level": "intermediate",
        "accessibility": {
            "font_family": "OpenDyslexic",
            "font_size": 18,
            "line_spacing": 1.5,
            "word_spacing": 0.2,
            "color_theme": "cream",
            "dyslexia_font": True,
            "high_contrast": False,
            "reduce_motion": False
        }
    }
    res = session.patch(f"{BASE_URL}/api/v1/profile", json=profile_payload, headers=headers)
    print(f"Patch Profile Status: {res.status_code}")
    print(f"Patch Profile Response: {res.json()}")
    if res.status_code not in (200, 201):
        raise Exception("Patch profile failed")

    print("\n5. Testing Get Profile...")
    res = session.get(f"{BASE_URL}/api/v1/profile", headers=headers)
    print(f"Get Profile Status: {res.status_code}")
    profile = res.json()
    print(f"Get Profile Response: {profile}")
    if res.status_code != 200 or profile.get("diagnosis_type") != "dyslexia":
        raise Exception("Get profile failed")

    print("\n6. Testing Groq AI API directly...")
    res = session.post(f"{BASE_URL}/api/test-groq", json={"prompt": "Cognitive load refers to the total amount of mental effort being used in the working memory."}, headers=headers)
    print(f"Test Groq Status: {res.status_code}")
    groq_res = res.json()
    print(f"Test Groq Response: {groq_res}")
    if groq_res.get("status") not in ("success", "mock_fallback"):
        raise Exception(f"Groq verification failed: {groq_res.get('message')}")

    print("\n7. Creating Learning Session & Simplification...")
    session_payload = {
        "content_title": "NeuroLearn AI Intro",
        "text": "NeuroLearn is an AI-powered cognitive enhancement dashboard. It simplifies complex textual content into chunks tailored to cognitive profiles like dyslexia or ADHD. Users read chunks of simplified text, complete focus timers, earn experience points (XP), and unlock badges."
    }
    res = session.post(f"{BASE_URL}/api/v1/sessions", json=session_payload, headers=headers)
    print(f"Create Session Status: {res.status_code}")
    sess_info = res.json()
    print(f"Create Session Response (metadata): title={sess_info.get('content_title')}, chunks={len(sess_info.get('chunks', []))}")
    if res.status_code != 201 or not sess_info.get("chunks"):
        raise Exception("Create learning session failed")
    
    first_chunk = sess_info["chunks"][0]
    session_id = sess_info["id"]
    chunk_id = first_chunk["id"]
    print(f"Chunk 0 Original Text: {first_chunk.get('original_text')}")
    print(f"Chunk 0 Simplified Text: {first_chunk.get('simplified_text')}")

    print("\n8. Recording Focus Session (Chunk completion)...")
    focus_payload = {
        "session_id": session_id,
        "chunk_id": chunk_id,
        "mode": "FOCUS",
        "duration_seconds": 60,
        "completed": True
    }
    res = session.post(f"{BASE_URL}/api/v1/focus/record", json=focus_payload, headers=headers)
    print(f"Record Focus Status: {res.status_code}")
    print(f"Record Focus Response: {res.json()}")
    if res.status_code != 200:
        raise Exception("Record focus session failed")

    print("\n9. Testing GET Progress Stats...")
    res = session.get(f"{BASE_URL}/api/v1/progress/stats", headers=headers)
    print(f"Progress Stats Status: {res.status_code}")
    stats = res.json()
    print(f"Progress Stats Response: {stats}")
    if res.status_code != 200 or stats.get("xp", 0) <= 0:
        raise Exception("Progress stats verification failed")

    print("\n10. Testing GET Badges...")
    res = session.get(f"{BASE_URL}/api/v1/gamification/badges", headers=headers)
    print(f"Gamification Badges Status: {res.status_code}")
    badges = res.json()
    print(f"Gamification Badges Response: {badges}")
    if res.status_code != 200:
        raise Exception("Gamification badges verification failed")

    print("\n=======================================================")
    print("INTEGRATION TESTS COMPLETED SUCCESSFULLY!")
    print("=======================================================")

if __name__ == "__main__":
    test_flow()
