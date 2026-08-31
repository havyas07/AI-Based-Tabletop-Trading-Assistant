import os
import httpx
from dotenv import load_dotenv

load_dotenv(dotenv_path="backend/.env", override=True)
key = os.getenv("AI_API_KEY", "")

candidates = ["gemini-2.5-flash", "gemini-flash-latest", "gemini-2.5-pro", "gemini-1.5-flash"]

for m in candidates:
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{m}:generateContent?key={key}"
    payload = {
        "contents": [{"parts": [{"text": "Respond JSON: {\"status\": \"ok\"}"}]}],
        "generationConfig": {"temperature": 0.2, "response_mime_type": "application/json"}
    }
    try:
        r = httpx.post(url, json=payload, timeout=10)
        print(f"Model {m} -> HTTP {r.status_code}")
        if r.status_code == 200:
            print(f"SUCCESS with {m}!")
            print("Response:", r.text[:200])
            break
        else:
            print("Error snippet:", r.text[:150])
    except Exception as e:
        print(f"Model {m} error: {e}")
