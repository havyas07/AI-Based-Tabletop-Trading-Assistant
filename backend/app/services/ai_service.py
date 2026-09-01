import json
import datetime
import pytz
from typing import Dict, Any, Optional
from app.config import settings
from app.models.schemas import AIAnalysisRequest, AIAnalysisResponse

try:
    from google import genai
    from google.genai import types
    HAS_GENAI_SDK = True
except ImportError:
    HAS_GENAI_SDK = False

def generate_fallback_analysis(
    req: AIAnalysisRequest,
    is_api_error: bool = False,
    err_msg: Optional[str] = None,
    was_request_sent: bool = False,
    used_model: Optional[str] = None
) -> AIAnalysisResponse:
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

    has_key = bool(settings.AI_API_KEY and settings.AI_API_KEY.strip())

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
        provider=settings.AI_PROVIDER or "gemini",
        model=used_model or settings.AI_MODEL or "gemini-3.6-flash",
        timestamp=now_str,
        api_key_status="Configured" if has_key else "Not Configured",
        request_status="Sent" if was_request_sent else "Not Sent",
        response_status="Fallback",
        error_message=err_msg
    )

async def get_ai_recommendation(req: AIAnalysisRequest) -> AIAnalysisResponse:
    """
    Constructs financial prompt with empirical statistical context and queries Gemini via official google-genai SDK.
    Logs clear execution events to backend terminal.
    """
    tz = pytz.timezone("Asia/Kolkata")
    now_str = datetime.datetime.now(tz).strftime("%Y-%m-%d %H:%M:%S IST")

    api_key = settings.AI_API_KEY
    has_key = bool(api_key and api_key.strip())
    model_name = settings.AI_MODEL or "gemini-3.6-flash"
    provider = settings.AI_PROVIDER or "gemini"

    # Terminal Diagnostic Logging
    print(f"[AI DEBUG] API key configured: {has_key}")
    print(f"[AI DEBUG] Provider: {provider}")
    print(f"[AI DEBUG] Model: {model_name}")
    print(f"[AI DEBUG] Entering Gemini execution path: {has_key}")

    if not has_key:
        print(f"[AI] API key not configured")
        print(f"[AI] Source: FALLBACK")
        return generate_fallback_analysis(req, is_api_error=False, was_request_sent=False)

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

    print(f"[AI] API key configured")
    print(f"[AI] Gemini request started")
    print(f"[AI] Model: {model_name}")

    if not HAS_GENAI_SDK:
        err_msg = "google-genai SDK not installed"
        print(f"[AI] Gemini request failed: {err_msg}")
        print(f"[AI] Source: FALLBACK")
        return generate_fallback_analysis(req, is_api_error=True, err_msg=err_msg, was_request_sent=True, used_model=model_name)

    models_to_try = [model_name]
    for fallback in ["gemini-3.5-flash", "gemini-2.5-flash", "gemini-flash-latest"]:
        if fallback not in models_to_try:
            models_to_try.append(fallback)

    last_error = ""

    for target_model in models_to_try:
        try:
            client = genai.Client(api_key=api_key)
            response = client.models.generate_content(
                model=target_model,
                contents=prompt_text,
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                    temperature=0.2,
                ),
            )
            
            raw_text = response.text or ""
            clean_text = raw_text.replace("```json", "").replace("```", "").strip()
            parsed = json.loads(clean_text)

            print(f"[AI] Gemini request completed successfully")
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
                provider=provider,
                model=target_model,
                timestamp=now_str,
                api_key_status="Configured",
                request_status="Sent",
                response_status="Received"
            )
        except Exception as e:
            err_str = str(e)
            err_snippet = err_str[:150].replace("\n", " ")
            last_error = f"{type(e).__name__}: {err_snippet}"
            print(f"[AI] Model {target_model} SDK call failed: {last_error}")
            if "404" in err_str or "NOT_FOUND" in err_str:
                if target_model != models_to_try[-1]:
                    print(f"[AI] Trying alternate model fallback...")
                    continue

    print(f"[AI] Gemini request failed: {last_error}")
    print(f"[AI] Source: FALLBACK")
    return generate_fallback_analysis(
        req,
        is_api_error=True,
        err_msg=last_error,
        was_request_sent=True,
        used_model=model_name
    )
