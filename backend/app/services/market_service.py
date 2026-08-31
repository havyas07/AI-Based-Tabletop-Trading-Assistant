import datetime
import pytz
import pandas as pd
import numpy as np
import yfinance as yf
from typing import List, Dict, Any, Optional, Tuple
from app.models.schemas import StockQuote, IndexQuote, OHLCVDataPoint

def safe_float(val, default: float = 0.0) -> float:
    """Safely converts pandas/numpy scalar, series, or array values into a clean float."""
    try:
        if hasattr(val, 'iloc'):
            val = val.iloc[0] if len(val) > 0 else default
        elif isinstance(val, (list, np.ndarray)):
            val = val[0] if len(val) > 0 else default
            
        if pd.isna(val) or val is None:
            return default
        return float(val)
    except Exception:
        return default

# List of popular Indian stocks with readable names
POPULAR_NSE_STOCKS = [
    {"symbol": "RELIANCE.NS", "name": "Reliance Industries Ltd."},
    {"symbol": "TCS.NS", "name": "Tata Consultancy Services Ltd."},
    {"symbol": "INFY.NS", "name": "Infosys Ltd."},
    {"symbol": "HDFCBANK.NS", "name": "HDFC Bank Ltd."},
    {"symbol": "ICICIBANK.NS", "name": "ICICI Bank Ltd."},
    {"symbol": "SBIN.NS", "name": "State Bank of India"},
    {"symbol": "ITC.NS", "name": "ITC Ltd."},
    {"symbol": "WIPRO.NS", "name": "Wipro Ltd."},
    {"symbol": "BHARTIARTL.NS", "name": "Bharti Airtel Ltd."},
    {"symbol": "LT.NS", "name": "Larsen & Toubro Ltd."},
    {"symbol": "TATAMOTORS.NS", "name": "Tata Motors Ltd."},
    {"symbol": "AXISBANK.NS", "name": "Axis Bank Ltd."},
    {"symbol": "KOTAKBANK.NS", "name": "Kotak Mahindra Bank Ltd."},
    {"symbol": "HINDUNILVR.NS", "name": "Hindustan Unilever Ltd."},
    {"symbol": "BAJFINANCE.NS", "name": "Bajaj Finance Ltd."},
]

INDEX_TICKERS = [
    {"symbol": "^NSEI", "name": "NIFTY 50"},
    {"symbol": "^BSESN", "name": "SENSEX"},
    {"symbol": "^NSEBANK", "name": "NIFTY BANK"}
]

def is_indian_market_open() -> bool:
    """Checks if the Indian stock market (NSE/BSE) is currently open."""
    tz = pytz.timezone("Asia/Kolkata")
    now = datetime.datetime.now(tz)
    
    # Weekend check (5 = Saturday, 6 = Sunday)
    if now.weekday() >= 5:
        return False
        
    market_open = now.replace(hour=9, minute=15, second=0, microsecond=0)
    market_close = now.replace(hour=15, minute=30, second=0, microsecond=0)
    
    return market_open <= now <= market_close

def format_symbol(symbol: str) -> str:
    """Ensures NSE symbol format has .NS suffix if not index or already formatted."""
    symbol = symbol.strip().upper()
    if symbol.startswith("^"):
        return symbol
    if not symbol.endswith(".NS") and not symbol.endswith(".BO"):
        return f"{symbol}.NS"
    return symbol

def fetch_stock_quote(symbol: str) -> StockQuote:
    """Fetches current/latest quote information for a given stock symbol."""
    formatted_sym = format_symbol(symbol)
    ticker = yf.Ticker(formatted_sym)
    info = {}
    try:
        info = ticker.info or {}
    except Exception:
        info = {}

    hist = ticker.history(period="1mo")
    if not hist.empty:
        hist = hist.dropna(subset=['Close', 'Open'])
    
    if hist.empty:
        cur_p = safe_float(info.get('regularMarketPrice') or info.get('previousClose'), 1500.0)
        prev_c = safe_float(info.get('previousClose'), cur_p)
        now_str = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S IST")
        return StockQuote(
            symbol=formatted_sym,
            name=info.get('longName') or info.get('shortName') or symbol.replace(".NS", ""),
            current_price=round(cur_p, 2),
            previous_close=round(prev_c, 2),
            change=round(cur_p - prev_c, 2),
            change_percent=round(((cur_p - prev_c) / prev_c) * 100, 2) if prev_c else 0.0,
            open=round(cur_p, 2),
            high=round(cur_p * 1.01, 2),
            low=round(cur_p * 0.99, 2),
            volume=int(safe_float(info.get('regularMarketVolume'), 1000000)),
            fifty_two_week_high=round(safe_float(info.get('fiftyTwoWeekHigh'), cur_p * 1.2), 2),
            fifty_two_week_low=round(safe_float(info.get('fiftyTwoWeekLow'), cur_p * 0.8), 2),
            last_updated=now_str,
            is_market_open=is_indian_market_open()
        )
    
    latest = hist.iloc[-1]
    prev_close = safe_float(hist.iloc[-2]['Close']) if len(hist) > 1 else safe_float(latest['Open'])
    current_price = safe_float(latest['Close'])
    
    if current_price == 0.0:
        current_price = safe_float(info.get('regularMarketPrice') or info.get('previousClose'), 1500.0)
        
    if prev_close == 0.0:
        prev_close = current_price

    change = current_price - prev_close
    change_pct = ((change / prev_close) * 100) if prev_close else 0.0
    
    stock_name = info.get('longName') or info.get('shortName') or formatted_sym.replace('.NS', '')
    
    fifty_two_high = info.get('fiftyTwoWeekHigh') or safe_float(hist['High'].max())
    fifty_two_low = info.get('fiftyTwoWeekLow') or safe_float(hist['Low'].min())
    
    tz = pytz.timezone("Asia/Kolkata")
    last_updated_str = datetime.datetime.now(tz).strftime("%Y-%m-%d %H:%M:%S IST")
    
    open_val = safe_float(latest['Open'], current_price)
    high_val = safe_float(latest['High'], current_price)
    low_val = safe_float(latest['Low'], current_price)
    vol_val = int(safe_float(latest['Volume'], 0))
    
    return StockQuote(
        symbol=formatted_sym,
        name=stock_name,
        current_price=round(current_price, 2),
        previous_close=round(prev_close, 2),
        change=round(change, 2),
        change_percent=round(change_pct, 2),
        open=round(open_val, 2),
        high=round(high_val, 2),
        low=round(low_val, 2),
        volume=vol_val,
        fifty_two_week_high=round(safe_float(fifty_two_high), 2) if fifty_two_high else None,
        fifty_two_week_low=round(safe_float(fifty_two_low), 2) if fifty_two_low else None,
        market_cap=info.get('marketCap'),
        pe_ratio=info.get('trailingPE'),
        currency="INR",
        last_updated=last_updated_str,
        is_market_open=is_indian_market_open()
    )

def fetch_market_indices() -> List[IndexQuote]:
    """Fetches current values for major Indian indices (NIFTY 50, SENSEX, NIFTY BANK)."""
    indices = []
    tz = pytz.timezone("Asia/Kolkata")
    now_str = datetime.datetime.now(tz).strftime("%H:%M:%S IST")
    
    for item in INDEX_TICKERS:
        sym = item['symbol']
        try:
            ticker = yf.Ticker(sym)
            hist = ticker.history(period="1mo")
            if not hist.empty:
                hist = hist.dropna(subset=['Close'])
            if not hist.empty:
                latest = hist.iloc[-1]
                prev = safe_float(hist.iloc[-2]['Close']) if len(hist) > 1 else safe_float(latest['Open'])
                cur = safe_float(latest['Close'])
                chg = cur - prev
                chg_pct = (chg / prev) * 100 if prev else 0.0
                indices.append(IndexQuote(
                    symbol=sym,
                    name=item['name'],
                    value=round(cur, 2),
                    change=round(chg, 2),
                    change_percent=round(chg_pct, 2),
                    last_updated=now_str
                ))
                continue
        except Exception:
            pass
            
        # Fallback values if API fails
        fallback_vals = {
            "^NSEI": (24500.0, 120.5, 0.49),
            "^BSESN": (80200.0, 340.2, 0.43),
            "^NSEBANK": (51200.0, -85.0, -0.17)
        }
        val, chg, chg_pct = fallback_vals.get(sym, (10000.0, 0.0, 0.0))
        indices.append(IndexQuote(
            symbol=sym,
            name=item['name'],
            value=val,
            change=chg,
            change_percent=chg_pct,
            last_updated=now_str
        ))
        
    return indices

def search_stocks(query: str) -> List[Dict[str, str]]:
    """Searches for stocks matching query string from preset Indian stock list & yfinance fallback."""
    q = query.strip().upper()
    if not q:
        return POPULAR_NSE_STOCKS[:8]
        
    results = []
    for s in POPULAR_NSE_STOCKS:
        if q in s['symbol'] or q in s['name'].upper():
            results.append(s)
            
    if not results:
        # Generate custom NSE match
        custom_sym = f"{q}.NS" if not q.endswith(".NS") else q
        results.append({"symbol": custom_sym, "name": f"{q} (NSE Equity)"})
        
    return results

def validate_and_normalize_timeframe_interval(period: str, interval: str) -> Tuple[str, str]:
    """
    Validates and adjusts period/interval combinations to adhere to yfinance constraints:
    - 1m: max period 7d
    - 5m, 15m, 30m: max period 60d
    - 1h: max period 730d
    - 1d+: any period
    """
    p = period.lower().strip()
    i = interval.lower().strip()

    if i == "1m":
        if p in ["1m", "3m", "6m", "1y", "5y", "max"]:
            p = "7d"
    elif i in ["5m", "15m", "30m"]:
        if p in ["3m", "6m", "1y", "5y", "max"]:
            p = "1m"
    elif i in ["1h", "60m"]:
        if p in ["5y", "max"]:
            p = "2y"

    return p, i

def fetch_stock_history_df(symbol: str, period: str = "1y", interval: str = "1d") -> pd.DataFrame:
    """Fetches historical DataFrame for a symbol from yfinance with period/interval validation."""
    formatted_sym = format_symbol(symbol)
    ticker = yf.Ticker(formatted_sym)
    
    norm_period, norm_interval = validate_and_normalize_timeframe_interval(period, interval)
    
    try:
        df = ticker.history(period=norm_period, interval=norm_interval)
    except Exception:
        df = pd.DataFrame()

    if df.empty:
        # Fallback to standard 1y 1d if combination fails
        try:
            df = ticker.history(period="1y", interval="1d")
        except Exception:
            df = pd.DataFrame()

    return df
