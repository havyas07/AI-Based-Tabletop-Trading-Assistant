import axios from 'axios';
import {
  StockQuote,
  StockHistoryResponse,
  IndexQuote,
  StockSearchResult,
  PricePointAnalysisResponse,
  AIAnalysisResponse,
  HistoricalHitStats,
  HistoricalHit
} from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const fetchStockQuote = async (symbol: string): Promise<StockQuote> => {
  const res = await api.get<StockQuote>(`/market/quote/${symbol}`);
  return res.data;
};

export const fetchMarketIndices = async (): Promise<IndexQuote[]> => {
  const res = await api.get<IndexQuote[]>('/market/indices');
  return res.data;
};

export const searchStocks = async (query: string): Promise<StockSearchResult[]> => {
  const res = await api.get<StockSearchResult[]>(`/market/search`, {
    params: { q: query }
  });
  return res.data;
};

export const fetchStockHistory = async (
  symbol: string,
  period: string = '1y',
  interval: string = '1d'
): Promise<StockHistoryResponse> => {
  const res = await api.get<StockHistoryResponse>(`/market/history/${symbol}`, {
    params: { period, interval }
  });
  return res.data;
};

export const analyzePricePoint = async (
  symbol: string,
  selectedDate: string,
  selectedPrice: number,
  tolerancePct: number = 0.5,
  futureWindowDays: number = 5
): Promise<PricePointAnalysisResponse> => {
  const res = await api.post<PricePointAnalysisResponse>('/analyze/price-point', {
    symbol,
    selected_date: selectedDate,
    selected_price: selectedPrice,
    tolerance_pct: tolerancePct,
    future_window_days: futureWindowDays,
  });
  return res.data;
};

export const fetchAIRecommendation = async (
  symbol: string,
  selectedDate: string,
  selectedPrice: number,
  analysisStats: HistoricalHitStats,
  hits: HistoricalHit[],
  currentQuote?: StockQuote,
  technicalSummary?: any
): Promise<AIAnalysisResponse> => {
  const res = await api.post<AIAnalysisResponse>('/analyze/ai', {
    symbol,
    selected_date: selectedDate,
    selected_price: selectedPrice,
    analysis_stats: analysisStats,
    hits,
    current_quote: currentQuote,
    technical_summary: technicalSummary,
  });
  return res.data;
};

export default api;
