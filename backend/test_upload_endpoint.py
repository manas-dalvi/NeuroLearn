import requests

BASE_URL = "http://127.0.0.1:8000"

def test_upload():
    session = requests.Session()
    
    # 1. Sign up/Login
    email = "pdf_tester@neurolearn.com"
    password = "Password123!"
    
    # Try logging in first
    login_res = session.post(f"{BASE_URL}/api/v1/auth/login", json={"email": email, "password": password})
    if login_res.status_code != 200:
        # Sign up if not exist
        signup_res = session.post(f"{BASE_URL}/api/v1/auth/signup", json={"email": email, "password": password, "full_name": "PDF Tester"})
        assert signup_res.status_code in (200, 201), f"Signup failed: {signup_res.text}"
        login_res = session.post(f"{BASE_URL}/api/v1/auth/login", json={"email": email, "password": password})
    
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    # 2. Upload PDF
    pdf_path = "../test_document.pdf"
    with open(pdf_path, "rb") as f:
        files = {"file": ("test_document.pdf", f, "application/pdf")}
        data = {"title": "Test PDF Upload"}
        
        print("Sending upload request to backend...")
        res = session.post(f"{BASE_URL}/api/v1/content/upload", files=files, data=data, headers=headers)
        
        print(f"Status Code: {res.status_code}")
        print(f"Response Body: {res.text}")

if __name__ == "__main__":
    test_upload()
