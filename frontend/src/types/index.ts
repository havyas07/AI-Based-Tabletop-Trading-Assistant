export interface StockQuote {
  symbol: string;
  name: string;
  current_price: number;
  previous_close: number;
  change: number;
  change_percent: number;
  open: number;
  high: number;
  low: number;
  volume: number;
  fifty_two_week_high?: number;
  fifty_two_week_low?: number;
  market_cap?: number;
  pe_ratio?: number;
  currency: string;
  last_updated: string;
  is_market_open: boolean;
}

export interface IndexQuote {
  symbol: string;
  name: string;
  value: number;
  change: number;
  change_percent: number;
  last_updated: string;
}

export interface OHLCVDataPoint {
  timestamp: string;
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  sma_20?: number;
  sma_50?: number;
  ema_20?: number;
  ema_50?: number;
  rsi_14?: number;
  macd?: number;
  macd_signal?: number;
  macd_hist?: number;
  bb_upper?: number;
  bb_middle?: number;
  bb_lower?: number;
  volume_ma_20?: number;
}

export interface StockHistoryResponse {
  symbol: string;
  period: string;
  interval: string;
  data: OHLCVDataPoint[];
  indicators: {
    latest_close?: number;
    rsi_14?: number;
    rsi_status?: string;
    macd?: number;
    macd_signal?: number;
    macd_status?: string;
    sma_20?: number;
    sma_50?: number;
    trend_summary?: string;
  };
}

export interface StockSearchResult {
  symbol: string;
  name: string;
  exchange?: string;
}

export interface HistoricalHit {
  date: string;
  price_at_hit: number;
  future_date: string;
  future_price: number;
  change: number;
  change_percent: number;
  direction: 'UP' | 'DOWN' | 'NEUTRAL';
  details: string;
}

export interface HistoricalHitStats {
  total_hits: number;
  up_count: number;
  down_count: number;
  neutral_count: number;
  up_probability_pct: number;
  down_probability_pct: number;
  avg_change_pct: number;
  max_gain_pct: number;
  max_loss_pct: number;
  historical_tendency: 'BULLISH' | 'BEARISH' | 'MIXED';
  observation_window_days: number;
}

export interface PricePointAnalysisResponse {
  symbol: string;
  selected_date: string;
  selected_price: number;
  tolerance_pct: number;
  stats: HistoricalHitStats;
  hits: HistoricalHit[];
}

export interface AIAnalysisResponse {
  recommendation: 'BUY' | 'SELL' | 'HOLD';
  confidence: number;
  risk_level: 'LOW' | 'MEDIUM' | 'HIGH';
  summary: string;
  key_factors: string[];
  technical_view: string;
  historical_evidence_summary: string;
  disclaimer: string;
  is_fallback: boolean;
  source?: 'ai' | 'fallback';
  ai_status?: string;
  ai_status_label?: string;
  provider?: string;
  model?: string;
  timestamp?: string;
  api_key_status?: string;
  request_status?: string;
  response_status?: string;
  error_message?: string;
}

export type ChartTimeframe = '1D' | '5D' | '1M' | '3M' | '6M' | '1Y' | '5Y';
export type ChartInterval = '1m' | '5m' | '15m' | '30m' | '1h' | '1d';


export interface IndicatorConfig {
  sma20: boolean;
  sma50: boolean;
  ema20: boolean;
  ema50: boolean;
  rsi14: boolean;
  macd: boolean;
  bollinger: boolean;
  volume: boolean;
}

export type DrawingTool = 'select' | 'trendline' | 'horizontal' | 'vertical' | 'clear';

export interface DrawingLine {
  id: string;
  type: 'trendline' | 'horizontal' | 'vertical';
  startX: number;
  startY: number;
  endX?: number;
  endY?: number;
  priceStart?: number;
  priceEnd?: number;
  dateStart?: string;
  dateEnd?: string;
  color: string;
}
