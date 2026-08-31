import os
import httpx
import json
from dotenv import load_dotenv

load_dotenv(dotenv_path="backend/.env", override=True)
key = os.getenv("AI_API_KEY", "")

url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key={key}"

prompt_text = """
You are an expert AI Stock Trading Analyst. Analyze the following empirical financial data for Indian stock INFY.NS:
- Stock Symbol: INFY.NS
- Selected Chart Date: 2026-08-25
- Selected Price Level: ₹1125.00
- 1-Month Historical Hits at this Price: 4
- Post-Hit Upward Movements: 3 (75.0%)
- Post-Hit Downward Movements: 1 (25.0%)
- Average 5-Day Movement Post-Hit: +2.5%
- Maximum Upward Gain: +5.0%
- Maximum Downward Drawdown: -1.2%
- Historical Tendency: BULLISH

Return ONLY a raw valid JSON object with the following schema:
{
  "recommendation": "BUY",
  "confidence": 85,
  "risk_level": "LOW",
  "summary": "Solid historical upward momentum around ₹1125.00 level.",
  "key_factors": ["75% post-hit gain rate", "RSI neutral", "High probability setup"],
  "technical_view": "RSI 52 | Bullish Trend",
  "historical_evidence_summary": "4 hits in prior 1-month window"
}
"""

payload = {
    "contents": [{"parts": [{"text": prompt_text}]}],
    "generationConfig": {"temperature": 0.2, "response_mime_type": "application/json"}
}

r = httpx.post(url, json=payload, timeout=10)
print("Status code:", r.status_code)
if r.status_code == 200:
    data = r.json()
    part = data['candidates'][0]['content']['parts'][0]
    print("Parsed JSON text:")
    print(part['text'])
else:
    print("Error:", r.text)
