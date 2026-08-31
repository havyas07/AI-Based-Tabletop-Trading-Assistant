import os
import httpx
from dotenv import load_dotenv

load_dotenv(dotenv_path="backend/.env", override=True)
key = os.getenv("AI_API_KEY", "")

url = f"https://generativelanguage.googleapis.com/v1beta/models?key={key}"
r = httpx.get(url)
print("ListModels Status:", r.status_code)
if r.status_code == 200:
    models = [m['name'] for m in r.json().get('models', []) if 'generateContent' in m.get('supportedGenerationMethods', [])]
    print("Available generateContent models:", models)
else:
    print("Response:", r.text)
