from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

class StockQuote(BaseModel):
    symbol: str
    name: str
    current_price: float
    previous_close: float
    change: float
    change_percent: float
    open: float
    high: float
    low: float
    volume: int
    fifty_two_week_high: Optional[float] = None
    fifty_two_week_low: Optional[float] = None
    market_cap: Optional[float] = None
    pe_ratio: Optional[float] = None
    currency: str = "INR"
    last_updated: str
    is_market_open: bool

class IndexQuote(BaseModel):
    symbol: str
    name: str
    value: float
    change: float
    change_percent: float
    last_updated: str

class OHLCVDataPoint(BaseModel):
    timestamp: str
    date: str
    open: float
    high: float
    low: float
    close: float
    volume: int
    sma_20: Optional[float] = None
    sma_50: Optional[float] = None
    ema_20: Optional[float] = None
    ema_50: Optional[float] = None
    rsi_14: Optional[float] = None
    macd: Optional[float] = None
    macd_signal: Optional[float] = None
    macd_hist: Optional[float] = None
    bb_upper: Optional[float] = None
    bb_middle: Optional[float] = None
    bb_lower: Optional[float] = None
    volume_ma_20: Optional[float] = None

class StockHistoryResponse(BaseModel):
    symbol: str
    period: str
    interval: str
    data: List[OHLCVDataPoint]
    indicators: Dict[str, Any]

class StockSearchResult(BaseModel):
    symbol: str
    name: str
    exchange: str = "NSE"
    type: str = "EQUITY"

class PricePointAnalysisRequest(BaseModel):
    symbol: str
    selected_date: str
    selected_price: float
    tolerance_pct: Optional[float] = 0.5
    future_window_days: Optional[int] = 5

class HistoricalHit(BaseModel):
    date: str
    price_at_hit: float
    future_date: str
    future_price: float
    change: float
    change_percent: float
    direction: str  # "UP", "DOWN", "NEUTRAL"
    details: str

class HistoricalHitStats(BaseModel):
    total_hits: int
    up_count: int
    down_count: int
    neutral_count: int
    up_probability_pct: float
    down_probability_pct: float
    avg_change_pct: float
    max_gain_pct: float
    max_loss_pct: float
    historical_tendency: str  # "BULLISH", "BEARISH", "MIXED"
    observation_window_days: int

class PricePointAnalysisResponse(BaseModel):
    symbol: str
    selected_date: str
    selected_price: float
    tolerance_pct: float
    stats: HistoricalHitStats
    hits: List[HistoricalHit]

class AIAnalysisRequest(BaseModel):
    symbol: str
    selected_date: str
    selected_price: float
    analysis_stats: HistoricalHitStats
    hits: List[HistoricalHit]
    current_quote: Optional[StockQuote] = None
    technical_summary: Optional[Dict[str, Any]] = None

class AIAnalysisResponse(BaseModel):
    recommendation: str  # "BUY", "SELL", "HOLD"
    confidence: int  # 0 to 100
    risk_level: str  # "LOW", "MEDIUM", "HIGH"
    summary: str
    key_factors: List[str]
    technical_view: str
    historical_evidence_summary: str
    disclaimer: str = "AI-generated analysis based on historical market data. Not financial advice."
    is_fallback: bool = False
    source: str = "fallback"  # "ai" or "fallback"
    ai_status: str = "demo_fallback"  # "connected", "demo_fallback", "api_error_fallback"
    ai_status_label: str = "AI Engine: Demo / Fallback Mode"
    provider: str = "gemini"
    model: str = "gemini-1.5-flash"
    timestamp: str = ""
    api_key_status: str = "Not Configured"  # "Configured" or "Not Configured"
    request_status: str = "Not Sent"  # "Sent" or "Not Sent"
    response_status: str = "Fallback"  # "Received" or "Fallback"
    error_message: Optional[str] = None


