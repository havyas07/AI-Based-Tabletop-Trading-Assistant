import json
import httpx
import datetime
import pytz
from typing import Dict, Any, Optional
from app.config import settings
from app.models.schemas import AIAnalysisRequest, AIAnalysisResponse

def generate_fallback_analysis(req: AIAnalysisRequest, is_api_error: bool = False, err_msg: Optional[str] = None) -> AIAnalysisResponse:
    """
    Generates a high-quality, deterministic AI decision analysis based directly on empirical historical stats & technical indicators.
    Used when AI_API_KEY is not set or external AI service is unreachable.
    """
    stats = req.analysis_stats
    symbol_name = req.symbol.replace(".NS", "")
    price = req.selected_price
    
    tech = req.technical_summary or {}
    rsi = tech.get("rsi_14", 50.0)
    trend = tech.get("trend_summary", "Neutral")
    
    # Recommendation logic based on statistical tendency & RSI
    if stats.historical_tendency == "BULLISH" and rsi < 70:
        rec = "BUY"
        conf = min(92, max(65, int(stats.up_probability_pct)))
        risk = "LOW" if stats.max_loss_pct > -3.0 else "MEDIUM"
        summary = (f"The price level ₹{price:.2f} for {symbol_name} has shown a strong historical upward tendency ({stats.up_probability_pct}% of past occurrences moved up). "
                   f"With RSI at {rsi:.1f} and supportive post-hit momentum (+{stats.avg_change_pct:.2f}% avg gain), current price point offers a favorable risk/reward setup.")
    elif stats.historical_tendency == "BEARISH" or rsi > 70:
        rec = "SELL"
        conf = min(90, max(60, int(stats.down_probability_pct)))
        risk = "HIGH" if stats.max_loss_pct < -6.0 else "MEDIUM"
        summary = (f"Historical price-hit analysis indicates key overhead resistance around ₹{price:.2f}. "
                   f"Past hits resulted in downward corrections in {stats.down_probability_pct}% of cases, with an average drawdown of {stats.avg_change_pct:.2f}%. Caution is recommended.")
    else:
        rec = "HOLD"
        conf = 75
        risk = "MEDIUM"
        summary = (f"The selected price point ₹{price:.2f} represents a balanced consolidation zone. "
                   f"Out of {stats.total_hits} historical hits in the prior month, {stats.up_count} moved up and {stats.down_count} moved down, showing a neutral distribution.")

    key_factors = [
        f"Historical Price Level Hits: {stats.total_hits} occurrences in prior 1-month window",
        f"Post-hit Directional Split: {stats.up_count} Up ({stats.up_probability_pct}%) | {stats.down_count} Down ({stats.down_probability_pct}%)",
        f"Average 5-Day Post-Hit Movement: {stats.avg_change_pct:+.2f}%",
        f"Max Gain: {stats.max_gain_pct:+.2f}% | Max Drawdown: {stats.max_loss_pct:.2f}%",
        f"Technical Confluence: RSI {rsi:.1f} ({tech.get('rsi_status', 'Neutral')}), Trend: {trend}"
    ]

    hist_ev = (f"Analyzed {stats.total_hits} historical touchpoints at ₹{price:.2f} (±{req.analysis_stats.observation_window_days}d window). "
               f"Upward probability is {stats.up_probability_pct}%, downward probability is {stats.down_probability_pct}%.")

    status_key = "api_error_fallback" if is_api_error else "demo_fallback"
    status_text = "AI Engine: API Error — Using Fallback" if is_api_error else "AI Engine: Demo / Fallback Mode"
    
    tz = pytz.timezone("Asia/Kolkata")
    now_str = datetime.datetime.now(tz).strftime("%Y-%m-%d %H:%M:%S IST")

    return AIAnalysisResponse(
        recommendation=rec,
        confidence=conf,
        risk_level=risk,
        summary=summary,
        key_factors=key_factors,
        technical_view=f"RSI: {rsi:.1f} | Trend: {trend} | MACD: {tech.get('macd_status', 'Neutral')}",
        historical_evidence_summary=hist_ev,
        is_fallback=True,
        source="fallback",
        ai_status=status_key,
        ai_status_label=status_text,
        provider=settings.AI_PROVIDER,
        model=settings.AI_MODEL,
        timestamp=now_str,
        api_key_status="Configured" if settings.AI_API_KEY else "Not Configured",
        error_message=err_msg
    )

async def get_ai_recommendation(req: AIAnalysisRequest) -> AIAnalysisResponse:
    """
    Constructs financial prompt with empirical statistical context and queries AI API.
    Logs clear execution events to backend terminal.
    """
    tz = pytz.timezone("Asia/Kolkata")
    now_str = datetime.datetime.now(tz).strftime("%Y-%m-%d %H:%M:%S IST")

    if not settings.AI_API_KEY or not settings.AI_API_KEY.strip():
        print(f"[AI] API key not configured")
        print(f"[AI] Source: FALLBACK")
        return generate_fallback_analysis(req, is_api_error=False)

    stats = req.analysis_stats
    prompt_text = f"""
    You are an expert AI Stock Trading Analyst. Analyze the following empirical financial data for Indian stock {req.symbol}:

    - Stock Symbol: {req.symbol}
    - Selected Chart Date: {req.selected_date}
    - Selected Price Level: ₹{req.selected_price}
    - 1-Month Historical Hits at this Price: {stats.total_hits}
    - Post-Hit Upward Movements: {stats.up_count} ({stats.up_probability_pct}%)
    - Post-Hit Downward Movements: {stats.down_count} ({stats.down_probability_pct}%)
    - Average 5-Day Movement Post-Hit: {stats.avg_change_pct}%
    - Maximum Upward Gain: {stats.max_gain_pct}%
    - Maximum Downward Drawdown: {stats.max_loss_pct}%
    - Historical Tendency: {stats.historical_tendency}
    - Technical Overview: {json.dumps(req.technical_summary or {})}

    Return ONLY a raw valid JSON object with the following schema (no markdown blocks, no extra commentary):
    {{
      "recommendation": "BUY" or "SELL" or "HOLD",
      "confidence": integer 0-100,
      "risk_level": "LOW" or "MEDIUM" or "HIGH",
      "summary": "2-3 sentences concise professional reasoning",
      "key_factors": ["bullet 1", "bullet 2", "bullet 3", "bullet 4"],
      "technical_view": "Short technical momentum analysis",
      "historical_evidence_summary": "Summary of historical hit proof"
    }}
    """

    print(f"[AI] Gemini request started")
    print(f"[AI] Model: {settings.AI_MODEL}")

    try:
        if settings.AI_PROVIDER == "gemini":
            url = settings.AI_ENDPOINT or f"https://generativelanguage.googleapis.com/v1beta/models/{settings.AI_MODEL}:generateContent?key={settings.AI_API_KEY}"
            payload = {
                "contents": [{"parts": [{"text": prompt_text}]}],
                "generationConfig": {"temperature": 0.2, "response_mime_type": "application/json"}
            }
            async with httpx.AsyncClient(timeout=10.0) as client:
                res = await client.post(url, json=payload)
                if res.status_code == 200:
                    data = res.json()
                    raw_text = data['candidates'][0]['content']['parts'][0]['text']
                    clean_text = raw_text.replace("```json", "").replace("```", "").strip()
                    parsed = json.loads(clean_text)
                    
                    print(f"[AI] Request successful")
                    print(f"[AI] Response received")
                    print(f"[AI] Source: AI")

                    return AIAnalysisResponse(
                        recommendation=parsed.get("recommendation", "HOLD").upper(),
                        confidence=int(parsed.get("confidence", 70)),
                        risk_level=parsed.get("risk_level", "MEDIUM").upper(),
                        summary=parsed.get("summary", ""),
                        key_factors=parsed.get("key_factors", []),
                        technical_view=parsed.get("technical_view", ""),
                        historical_evidence_summary=parsed.get("historical_evidence_summary", ""),
                        is_fallback=False,
                        source="ai",
                        ai_status="connected",
                        ai_status_label="AI Engine: Connected",
                        provider=settings.AI_PROVIDER,
                        model=settings.AI_MODEL,
                        timestamp=now_str,
                        api_key_status="Configured"
                    )
                else:
                    err_msg = f"HTTP {res.status_code}: {res.text[:200]}"
                    print(f"[AI] Gemini request failed: {err_msg}")
                    print(f"[AI] Source: FALLBACK")
                    return generate_fallback_analysis(req, is_api_error=True, err_msg=err_msg)
        elif settings.AI_PROVIDER == "openai":
            url = "https://api.openai.com/v1/chat/completions"
            headers = {"Authorization": f"Bearer {settings.AI_API_KEY}"}
            payload = {
                "model": settings.AI_MODEL or "gpt-4o-mini",
                "messages": [{"role": "user", "content": prompt_text}],
                "response_format": {"type": "json_object"}
            }
            async with httpx.AsyncClient(timeout=10.0) as client:
                res = await client.post(url, json=payload, headers=headers)
                if res.status_code == 200:
                    data = res.json()
                    content = data['choices'][0]['message']['content']
                    clean_text = content.replace("```json", "").replace("```", "").strip()
                    parsed = json.loads(clean_text)
                    
                    print(f"[AI] Request successful")
                    print(f"[AI] Response received")
                    print(f"[AI] Source: AI")

                    return AIAnalysisResponse(
                        recommendation=parsed.get("recommendation", "HOLD").upper(),
                        confidence=int(parsed.get("confidence", 70)),
                        risk_level=parsed.get("risk_level", "MEDIUM").upper(),
                        summary=parsed.get("summary", ""),
                        key_factors=parsed.get("key_factors", []),
                        technical_view=parsed.get("technical_view", ""),
                        historical_evidence_summary=parsed.get("historical_evidence_summary", ""),
                        is_fallback=False,
                        source="ai",
                        ai_status="connected",
                        ai_status_label="AI Engine: Connected",
                        provider=settings.AI_PROVIDER,
                        model=settings.AI_MODEL,
                        timestamp=now_str,
                        api_key_status="Configured"
                    )
                else:
                    err_msg = f"HTTP {res.status_code}: {res.text[:200]}"
                    print(f"[AI] OpenAI request failed: {err_msg}")
                    print(f"[AI] Source: FALLBACK")
                    return generate_fallback_analysis(req, is_api_error=True, err_msg=err_msg)
    except Exception as e:
        err_msg = str(e)
        print(f"[AI] Gemini request failed: {err_msg}")
        print(f"[AI] Source: FALLBACK")
        return generate_fallback_analysis(req, is_api_error=True, err_msg=err_msg)

    return generate_fallback_analysis(req, is_api_error=True)
