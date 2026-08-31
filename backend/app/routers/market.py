from fastapi import APIRouter, Query, HTTPException
from typing import List, Dict, Any
from app.models.schemas import StockQuote, StockHistoryResponse, OHLCVDataPoint, IndexQuote
from app.services.market_service import (
    fetch_stock_quote,
    fetch_market_indices,
    search_stocks,
    fetch_stock_history_df,
    format_symbol
)
from app.services.indicator_service import compute_indicators, extract_latest_technical_summary

router = APIRouter(prefix="/api/market", tags=["Market Data"])

@router.get("/quote/{symbol}", response_model=StockQuote)
def get_quote(symbol: str):
    try:
        return fetch_stock_quote(symbol)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch quote for {symbol}: {str(e)}")

@router.get("/indices", response_model=List[IndexQuote])
def get_indices():
    try:
        return fetch_market_indices()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch market indices: {str(e)}")

@router.get("/search")
def search(q: str = Query("", description="Stock search query")):
    return search_stocks(q)

@router.get("/history/{symbol}", response_model=StockHistoryResponse)
def get_history(symbol: str, period: str = "1y", interval: str = "1d"):
    try:
        df = fetch_stock_history_df(symbol, period=period, interval=interval)
        if df.empty:
            raise HTTPException(status_code=404, detail=f"No historical data found for {symbol}")
            
        df = compute_indicators(df)
        df.reset_index(inplace=True)
        date_col = 'Date' if 'Date' in df.columns else df.columns[0]
        
        data_points: List[OHLCVDataPoint] = []
        for _, row in df.iterrows():
            d_val = row[date_col]
            if hasattr(d_val, 'strftime'):
                d_str = d_val.strftime('%Y-%m-%d')
                t_str = d_val.strftime('%Y-%m-%dT%H:%M:%SZ')
            else:
                d_str = str(d_val)[:10]
                t_str = str(d_val)
                
            data_points.append(OHLCVDataPoint(
                timestamp=t_str,
                date=d_str,
                open=round(float(row['Open']), 2),
                high=round(float(row['High']), 2),
                low=round(float(row['Low']), 2),
                close=round(float(row['Close']), 2),
                volume=int(row['Volume']),
                sma_20=round(float(row['SMA_20']), 2) if pd_not_null(row, 'SMA_20') else None,
                sma_50=round(float(row['SMA_50']), 2) if pd_not_null(row, 'SMA_50') else None,
                ema_20=round(float(row['EMA_20']), 2) if pd_not_null(row, 'EMA_20') else None,
                ema_50=round(float(row['EMA_50']), 2) if pd_not_null(row, 'EMA_50') else None,
                rsi_14=round(float(row['RSI_14']), 2) if pd_not_null(row, 'RSI_14') else None,
                macd=round(float(row['MACD']), 2) if pd_not_null(row, 'MACD') else None,
                macd_signal=round(float(row['MACD_Signal']), 2) if pd_not_null(row, 'MACD_Signal') else None,
                macd_hist=round(float(row['MACD_Hist']), 2) if pd_not_null(row, 'MACD_Hist') else None,
                bb_upper=round(float(row['BB_Upper']), 2) if pd_not_null(row, 'BB_Upper') else None,
                bb_middle=round(float(row['BB_Middle']), 2) if pd_not_null(row, 'BB_Middle') else None,
                bb_lower=round(float(row['BB_Lower']), 2) if pd_not_null(row, 'BB_Lower') else None,
                volume_ma_20=round(float(row['Volume_MA_20']), 2) if pd_not_null(row, 'Volume_MA_20') else None,
            ))
            
        indicators_summary = extract_latest_technical_summary(df)
        
        return StockHistoryResponse(
            symbol=format_symbol(symbol),
            period=period,
            interval=interval,
            data=data_points,
            indicators=indicators_summary
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error computing history for {symbol}: {str(e)}")

def pd_not_null(row, col):
    import pandas as pd
    return col in row and pd.notnull(row[col])
