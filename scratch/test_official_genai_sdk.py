import os
from dotenv import load_dotenv
from google import genai
from google.genai import types

load_dotenv(dotenv_path="backend/.env", override=True)
key = os.getenv("AI_API_KEY", "")
model_name = os.getenv("AI_MODEL", "gemini-3.6-flash")

print(f"Key configured: {bool(key)}")
print(f"Model: {model_name}")

if key:
    try:
        client = genai.Client(api_key=key)
        response = client.models.generate_content(
            model=model_name,
            contents="Return JSON: {\"status\": \"ok\", \"recommendation\": \"BUY\"}",
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                temperature=0.2,
            ),
        )
        print("Response received successfully via SDK!")
        print("Output text:", response.text)
    except Exception as e:
        print("SDK Exception:", type(e).__name__, e)
