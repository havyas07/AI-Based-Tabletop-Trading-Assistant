import os
import httpx
import json
from dotenv import load_dotenv

load_dotenv(dotenv_path="backend/.env", override=True)

key = os.getenv("AI_API_KEY", "")
model = os.getenv("AI_MODEL", "gemini-1.5-flash")

print(f"API Key configured: {bool(key)} (Length: {len(key)})")
print(f"Model: {model}")

if key:
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={key}"
    payload = {
        "contents": [{"parts": [{"text": "Return JSON: {\"status\": \"ok\", \"recommendation\": \"BUY\"}"}]}],
        "generationConfig": {"temperature": 0.2, "response_mime_type": "application/json"}
    }
    try:
        r = httpx.post(url, json=payload, timeout=10)
        print("Status code:", r.status_code)
        print("Response body:", r.text)
    except Exception as e:
        print("HTTP error:", e)
