import os
import httpx
from dotenv import load_dotenv

load_dotenv(dotenv_path="backend/.env", override=True)
key = os.getenv("AI_API_KEY", "")
model = os.getenv("AI_MODEL", "gemini-2.5-flash")

# Handle models/ prefix if present or clean model name
model_clean = model.replace("models/", "")
url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_clean}:generateContent?key={key}"

payload = {
    "contents": [{"parts": [{"text": "You are a stock trading assistant. Respond ONLY with valid JSON: {\"recommendation\": \"BUY\", \"confidence\": 85, \"risk_level\": \"LOW\", \"summary\": \"Strong bullish momentum on NSE.\", \"key_factors\": [\"RSI positive\", \"Volume surge\"]}"}]}],
    "generationConfig": {"temperature": 0.2, "response_mime_type": "application/json"}
}

r = httpx.post(url, json=payload, timeout=10)
print("Status code:", r.status_code)
print("Response body:", r.text)
