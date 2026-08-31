import os
import httpx
from dotenv import load_dotenv

load_dotenv(dotenv_path="backend/.env", override=True)
key = os.getenv("AI_API_KEY", "")

models_to_test = ["gemini-2.5-flash", "gemini-3.5-flash", "gemini-flash-latest", "gemini-3.1-flash-lite"]

for m in models_to_test:
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{m}:generateContent?key={key}"
    payload = {
        "contents": [{"parts": [{"text": "Respond JSON: {\"status\": \"ok\"}"}]}],
        "generationConfig": {"temperature": 0.2, "response_mime_type": "application/json"}
    }
    try:
        r = httpx.post(url, json=payload, timeout=8)
        print(f"--- Model {m} ---")
        print("Status:", r.status_code)
        print("Response:", r.text[:300])
    except Exception as e:
        print(f"Model {m} error: {e}")
