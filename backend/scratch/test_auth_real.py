import requests
import json
import time

BASE_URL = "http://localhost:8000"

def test_flow():
    # 1. Sign up/Login test
    email = f"test_auth_{int(time.time())}@neurolearn.com"
    signup_data = {
        "email": email,
        "password": "Password123!",
        "full_name": "Test Auth User"
    }
    
    print("Sending SIGNUP request to /api/v1/auth/signup...")
    r = requests.post(f"{BASE_URL}/api/v1/auth/signup", json=signup_data)
    print(f"Signup Response Status: {r.status_code}")
    print(f"Signup Response Body: {r.text}\n")
    
    # 2. Login
    login_data = {
        "email": email,
        "password": "Password123!"
    }
    print("Sending LOGIN request to /api/v1/auth/login...")
    r = requests.post(f"{BASE_URL}/api/v1/auth/login", json=login_data)
    print(f"Login Response Status: {r.status_code}")
    print(f"Login Response Body: {r.text}")
    
    if r.status_code != 200:
        print("Login failed, aborting.")
        return
        
    res_data = r.json()
    token = res_data.get("access_token")
    print(f"Access Token: {token[:20]}... [length={len(token)}]\n")
    
    # 3. Call get profile (authenticated)
    headers = {
        "Authorization": f"Bearer {token}"
    }
    print("Sending GET request to /api/v1/profile (with auth header)...")
    r = requests.get(f"{BASE_URL}/api/v1/profile", headers=headers)
    print(f"Profile Response Status: {r.status_code}")
    print(f"Profile Response Body: {r.text}\n")
    
    # 4. Call simplify (authenticated)
    simplify_data = {
        "text": "This is a test sentence for authentication validation.",
        "level": "intermediate",
        "profile_type": "dyslexia"
    }
    print("Sending POST request to /api/v1/content/simplify...")
    r = requests.post(f"{BASE_URL}/api/v1/content/simplify", json=simplify_data, headers=headers)
    print(f"Simplify Response Status: {r.status_code}")
    print(f"Simplify Response Body: {r.text}\n")

if __name__ == "__main__":
    test_flow()
