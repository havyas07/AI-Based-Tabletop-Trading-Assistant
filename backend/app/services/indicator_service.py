import pandas as pd
import numpy as np
from typing import Dict, Any

def compute_indicators(df: pd.DataFrame) -> pd.DataFrame:
    """
    Computes technical indicators on an OHLCV pandas DataFrame.
    Expected columns: Open, High, Low, Close, Volume.
    Adds SMA_20, SMA_50, EMA_20, EMA_50, RSI_14, MACD, MACD_Signal, MACD_Hist, BB_Upper, BB_Middle, BB_Lower, Volume_MA_20.
    """
    if df.empty or len(df) < 5:
        return df

    close = df['Close']
    volume = df['Volume']

    # Simple Moving Averages
    df['SMA_20'] = close.rolling(window=20, min_periods=1).mean()
    df['SMA_50'] = close.rolling(window=50, min_periods=1).mean()

    # Exponential Moving Averages
    df['EMA_20'] = close.ewm(span=20, adjust=False).mean()
    df['EMA_50'] = close.ewm(span=50, adjust=False).mean()

    # Relative Strength Index (RSI 14)
    delta = close.diff()
    gain = (delta.where(delta > 0, 0)).rolling(window=14, min_periods=1).mean()
    loss = (-delta.where(delta < 0, 0)).rolling(window=14, min_periods=1).mean()
    rs = gain / (loss.replace(0, np.nan))
    rsi = 100 - (100 / (1 + rs))
    df['RSI_14'] = rsi.fillna(50.0)

    # MACD (12, 26, 9)
    ema_12 = close.ewm(span=12, adjust=False).mean()
    ema_26 = close.ewm(span=26, adjust=False).mean()
    macd_line = ema_12 - ema_26
    macd_signal = macd_line.ewm(span=9, adjust=False).mean()
    macd_hist = macd_line - macd_signal
    df['MACD'] = macd_line
    df['MACD_Signal'] = macd_signal
    df['MACD_Hist'] = macd_hist

    # Bollinger Bands (20, 2)
    bb_middle = close.rolling(window=20, min_periods=1).mean()
    bb_std = close.rolling(window=20, min_periods=1).std().fillna(0)
    df['BB_Middle'] = bb_middle
    df['BB_Upper'] = bb_middle + (bb_std * 2)
    df['BB_Lower'] = bb_middle - (bb_std * 2)

    # Volume Moving Average
    df['Volume_MA_20'] = volume.rolling(window=20, min_periods=1).mean()

    return df

def extract_latest_technical_summary(df: pd.DataFrame) -> Dict[str, Any]:
    """Returns a clean JSON summary of the latest technical indicator values."""
    if df.empty:
        return {}

    latest = df.iloc[-1]
    close = float(latest['Close'])

    rsi = float(latest.get('RSI_14', 50.0))
    macd = float(latest.get('MACD', 0.0))
    macd_sig = float(latest.get('MACD_Signal', 0.0))
    sma20 = float(latest.get('SMA_20', close))
    sma50 = float(latest.get('SMA_50', close))

    rsi_status = "Oversold" if rsi < 30 else ("Overbought" if rsi > 70 else "Neutral")
    macd_status = "Bullish Crossover" if macd > macd_sig else "Bearish Crossover"
    trend = "Upward (Bullish)" if close > sma20 > sma50 else ("Downward (Bearish)" if close < sma20 < sma50 else "Sideways / Neutral")

    return {
        "latest_close": round(close, 2),
        "rsi_14": round(rsi, 2),
        "rsi_status": rsi_status,
        "macd": round(macd, 2),
        "macd_signal": round(macd_sig, 2),
        "macd_status": macd_status,
        "sma_20": round(sma20, 2),
        "sma_50": round(sma50, 2),
        "trend_summary": trend
    }
