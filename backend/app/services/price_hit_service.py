import pandas as pd
import numpy as np
import datetime
from typing import List, Tuple, Dict, Any
from app.models.schemas import HistoricalHit, HistoricalHitStats, PricePointAnalysisResponse
from app.services.market_service import fetch_stock_history_df

def analyze_price_point(
    symbol: str,
    selected_date: str,
    selected_price: float,
    tolerance_pct: float = 0.5,
    future_window_days: int = 5
) -> PricePointAnalysisResponse:
    """
    Executes the Historical Price-Hit Analysis algorithm.
    Analyzes historical data 1 month prior to selected_date for instances where price reached selected_price ± tolerance_pct.
    Calculates post-hit movement N trading sessions into the future.
    """
    # Fetch ample historical data (e.g. 2 years to have full context prior to selected date)
    df = fetch_stock_history_df(symbol, period="2y", interval="1d")
    
    if df.empty:
        # Fallback empty result
        return PricePointAnalysisResponse(
            symbol=symbol,
            selected_date=selected_date,
            selected_price=selected_price,
            tolerance_pct=tolerance_pct,
            stats=HistoricalHitStats(
                total_hits=0, up_count=0, down_count=0, neutral_count=0,
                up_probability_pct=0.0, down_probability_pct=0.0, avg_change_pct=0.0,
                max_gain_pct=0.0, max_loss_pct=0.0, historical_tendency="MIXED",
                observation_window_days=future_window_days
            ),
            hits=[]
        )
        
    df.reset_index(inplace=True)
    # Ensure Date column format
    date_col = 'Date' if 'Date' in df.columns else df.columns[0]
    df['FormattedDate'] = pd.to_datetime(df[date_col]).dt.strftime('%Y-%m-%d')
    
    # Locate index of selected_date or nearest date
    df_sorted = df.sort_values('FormattedDate').reset_index(drop=True)
    
    selected_idx_list = df_sorted.index[df_sorted['FormattedDate'] == selected_date].tolist()
    if selected_idx_list:
        sel_idx = selected_idx_list[0]
    else:
        # Find nearest date prior or equal
        sel_idx = len(df_sorted) - 1
        for i, r in df_sorted.iterrows():
            if r['FormattedDate'] >= selected_date:
                sel_idx = i
                break

    # Lookback window: 1 month prior (~22 trading sessions before selected index)
    lookback_sessions = 22
    start_idx = max(0, sel_idx - lookback_sessions)
    
    lookback_df = df_sorted.iloc[start_idx:sel_idx].copy()
    
    # Calculate price range tolerance
    lower_bound = selected_price * (1.0 - (tolerance_pct / 100.0))
    upper_bound = selected_price * (1.0 + (tolerance_pct / 100.0))
    
    # Identify matching candles where price range overlaps [lower_bound, upper_bound]
    matching_indices = []
    for idx, row in lookback_df.iterrows():
        candle_low = float(row['Low'])
        candle_high = float(row['High'])
        candle_close = float(row['Close'])
        
        # Check if candle range crosses or close is within bounds
        if (candle_low <= upper_bound and candle_high >= lower_bound) or (lower_bound <= candle_close <= upper_bound):
            matching_indices.append(idx)
            
    # Debounce / cluster reduction: group consecutive hits within 2 trading sessions
    grouped_hits = []
    if matching_indices:
        current_cluster = [matching_indices[0]]
        for idx in matching_indices[1:]:
            if idx - current_cluster[-1] <= 2:
                current_cluster.append(idx)
            else:
                # Select candle closest to selected_price from cluster
                best_idx = min(current_cluster, key=lambda i: abs(df_sorted.iloc[i]['Close'] - selected_price))
                grouped_hits.append(best_idx)
                current_cluster = [idx]
        if current_cluster:
            best_idx = min(current_cluster, key=lambda i: abs(df_sorted.iloc[i]['Close'] - selected_price))
            grouped_hits.append(best_idx)

    raw_hits: List[HistoricalHit] = []
    changes = []
    up_cnt = 0
    down_cnt = 0
    neutral_cnt = 0

    for hit_idx in grouped_hits:
        hit_row = df_sorted.iloc[hit_idx]
        hit_date = hit_row['FormattedDate']
        hit_price = float(hit_row['Close'])
        
        # Look forward future_window_days
        future_target_idx = hit_idx + future_window_days
        if future_target_idx < len(df_sorted):
            fut_row = df_sorted.iloc[future_target_idx]
            fut_date = fut_row['FormattedDate']
            fut_price = float(fut_row['Close'])
        else:
            fut_row = df_sorted.iloc[-1]
            fut_date = fut_row['FormattedDate']
            fut_price = float(fut_row['Close'])

        chg = fut_price - hit_price
        chg_pct = (chg / hit_price) * 100 if hit_price else 0.0
        changes.append(chg_pct)

        if chg_pct >= 0.5:
            direction = "UP"
            up_cnt += 1
            desc = f"Price increased from ₹{hit_price:.2f} to ₹{fut_price:.2f} (+{chg_pct:.2f}%) after {future_window_days} sessions."
        elif chg_pct <= -0.5:
            direction = "DOWN"
            down_cnt += 1
            desc = f"Price decreased from ₹{hit_price:.2f} to ₹{fut_price:.2f} ({chg_pct:.2f}%) after {future_window_days} sessions."
        else:
            direction = "NEUTRAL"
            neutral_cnt += 1
            desc = f"Price remained stable at ₹{fut_price:.2f} ({chg_pct:+.2f}%) after {future_window_days} sessions."

        raw_hits.append(HistoricalHit(
            date=hit_date,
            price_at_hit=round(hit_price, 2),
            future_date=fut_date,
            future_price=round(fut_price, 2),
            change=round(chg, 2),
            change_percent=round(chg_pct, 2),
            direction=direction,
            details=desc
        ))

    total_hits = len(raw_hits)
    if total_hits > 0:
        up_prob = (up_cnt / total_hits) * 100.0
        down_prob = (down_cnt / total_hits) * 100.0
        avg_chg = float(np.mean(changes))
        max_gain = float(np.max(changes))
        max_loss = float(np.min(changes))
    else:
        up_prob = 0.0
        down_prob = 0.0
        avg_chg = 0.0
        max_gain = 0.0
        max_loss = 0.0

    if up_prob >= 60.0:
        tendency = "BULLISH"
    elif down_prob >= 60.0:
        tendency = "BEARISH"
    else:
        tendency = "MIXED"

    stats = HistoricalHitStats(
        total_hits=total_hits,
        up_count=up_cnt,
        down_count=down_cnt,
        neutral_count=neutral_cnt,
        up_probability_pct=round(up_prob, 1),
        down_probability_pct=round(down_prob, 1),
        avg_change_pct=round(avg_chg, 2),
        max_gain_pct=round(max_gain, 2),
        max_loss_pct=round(max_loss, 2),
        historical_tendency=tendency,
        observation_window_days=future_window_days
    )

    return PricePointAnalysisResponse(
        symbol=symbol,
        selected_date=selected_date,
        selected_price=round(selected_price, 2),
        tolerance_pct=tolerance_pct,
        stats=stats,
        hits=raw_hits
    )
