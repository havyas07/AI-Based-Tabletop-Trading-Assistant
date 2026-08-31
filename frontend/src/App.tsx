import React, { useState, useEffect, useCallback } from 'react';
import { Sidebar } from './components/Sidebar';
import { TopBar } from './components/TopBar';
import { MarketOverview } from './components/MarketOverview';
import { Watchlist } from './components/Watchlist';
import { StockHeader } from './components/StockHeader';
import { InteractiveChart } from './components/Chart/InteractiveChart';
import { ChartToolbar } from './components/Chart/ChartToolbar';
import { DrawingToolbar } from './components/Chart/DrawingToolbar';
import { IndicatorSelector } from './components/Chart/IndicatorSelector';
import { PricePointPanel } from './components/Analysis/PricePointPanel';
import { AIRecommendationCard } from './components/Analysis/AIRecommendationCard';
import { TechnicalSummaryCard } from './components/TechnicalSummaryCard';
import { ErrorBanner } from './components/Common/ErrorBanner';

import {
  StockQuote,
  IndexQuote,
  StockHistoryResponse,
  OHLCVDataPoint,
  ChartTimeframe,
  ChartInterval,
  IndicatorConfig,
  DrawingTool,
  DrawingLine,
  PricePointAnalysisResponse,
  AIAnalysisResponse,
} from './types';

import {
  fetchStockQuote,
  fetchMarketIndices,
  fetchStockHistory,
  analyzePricePoint,
  fetchAIRecommendation,
} from './services/api';

export function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [symbol, setSymbol] = useState('INFY.NS');

  // Market Data States
  const [quote, setQuote] = useState<StockQuote | null>(null);
  const [indices, setIndices] = useState<IndexQuote[]>([]);
  const [history, setHistory] = useState<StockHistoryResponse | null>(null);

  // Chart States
  const [timeframe, setTimeframe] = useState<ChartTimeframe>('1M');
  const [interval, setInterval] = useState<ChartInterval>('1d');
  const [chartType, setChartType] = useState<'candlestick' | 'line'>('candlestick');
  const [activeTool, setActiveTool] = useState<DrawingTool>('select');
  const [drawings, setDrawings] = useState<DrawingLine[]>([]);

  // Indicators Toggle State
  const [indicators, setIndicators] = useState<IndicatorConfig>({
    sma20: true,
    sma50: true,
    ema20: false,
    ema50: false,
    rsi14: true,
    macd: true,
    bollinger: false,
    volume: true,
  });

  // Price Point & AI Analysis States
  const [selectedPoint, setSelectedPoint] = useState<{ date: string; price: number } | null>(null);
  const [analysis, setAnalysis] = useState<PricePointAnalysisResponse | null>(null);
  const [aiResult, setAiResult] = useState<AIAnalysisResponse | null>(null);
  const [futureWindow, setFutureWindow] = useState<number>(5);
  const [isPanelOpen, setIsPanelOpen] = useState<boolean>(false);

  // Loading & Error States
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Load Market Indices & Quote & History
  const loadDashboardData = useCallback(async (targetSymbol: string, tf: ChartTimeframe, intv: ChartInterval) => {
    setIsLoading(true);
    setError(null);
    try {
      // Map timeframe to yfinance period
      const tfMap: Record<ChartTimeframe, string> = {
        '1D': '1d',
        '5D': '5d',
        '1M': '1m',
        '3M': '3m',
        '6M': '6m',
        '1Y': '1y',
        '5Y': '5y',
      };

      const [quoteRes, indicesRes, historyRes] = await Promise.all([
        fetchStockQuote(targetSymbol),
        fetchMarketIndices(),
        fetchStockHistory(targetSymbol, tfMap[tf], intv),
      ]);

      setQuote(quoteRes);
      setIndices(indicesRes);
      setHistory(historyRes);
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.detail || 'Failed to load stock market data. Please check network connection.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboardData(symbol, timeframe, interval);
  }, [symbol, timeframe, interval, loadDashboardData]);

  // Handle Chart Click Anywhere (Price Hit & AI Analysis)
  const handlePointClick = async (date: string, price: number, candle: OHLCVDataPoint) => {
    setSelectedPoint({ date, price });
    setIsAnalyzing(true);
    setIsPanelOpen(true);
    try {
      const res = await analyzePricePoint(symbol, date, price, 0.5, futureWindow);
      setAnalysis(res);

      const aiRes = await fetchAIRecommendation(
        symbol,
        date,
        price,
        res.stats,
        res.hits,
        quote || undefined,
        history?.indicators
      );
      setAiResult(aiRes);
    } catch (err: any) {
      console.error('Point analysis failed:', err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Re-trigger analysis if user changes post-hit window (1D, 3D, 5D, 10D)
  useEffect(() => {
    if (selectedPoint) {
      analyzePricePoint(symbol, selectedPoint.date, selectedPoint.price, 0.5, futureWindow).then((res) => {
        setAnalysis(res);
      });
    }
  }, [futureWindow, symbol, selectedPoint]);

  return (
    <div className="min-h-screen bg-[#0B0E14] text-[#F3F4F6] flex flex-col overflow-x-hidden">
      {/* Top Navigation Bar with Integrated Menu Drawer */}
      <TopBar
        selectedStock={quote}
        onSelectSymbol={(s) => {
          setSymbol(s);
          setSelectedPoint(null);
          setAnalysis(null);
          setAiResult(null);
        }}
        onRefresh={() => loadDashboardData(symbol, timeframe, interval)}
        isLoading={isLoading}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      {/* Main Full-Width Workspace Area */}
      <div className="flex-1 flex flex-col">

        {/* Content Body */}
        <main className="p-6 space-y-6 flex-1">
          {/* Error Banner */}
          {error && <ErrorBanner message={error} onRetry={() => loadDashboardData(symbol, timeframe, interval)} />}

          {/* Indices Overview Tickers */}
          <MarketOverview indices={indices} isLoading={isLoading} />

          {/* Stock Info & Metrics Header */}
          <StockHeader stock={quote} isLoading={isLoading} />

          {/* Main Grid: Chart & AI Analysis Card (Left) vs Watchlist (Right) */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Left 3 Columns: Interactive Candlestick Chart + Controls + AI Card */}
            <div className="lg:col-span-3 space-y-5">
              {/* Chart Card */}
              <div className="bg-[#151A23] border border-[#2A3447] rounded-xl overflow-hidden shadow-xl">
                {/* Timeframe & Chart Type Toolbar */}
                <ChartToolbar
                  timeframe={timeframe}
                  setTimeframe={setTimeframe}
                  interval={interval}
                  setInterval={setInterval}
                  chartType={chartType}
                  setChartType={setChartType}
                />

                {/* Technical Indicator Toggle Bar */}
                <IndicatorSelector indicators={indicators} setIndicators={setIndicators} />

                {/* Drawing Tools Bar */}
                <DrawingToolbar
                  activeTool={activeTool}
                  setActiveTool={setActiveTool}
                  onClearDrawings={() => setDrawings([])}
                  drawingCount={drawings.length}
                />

                {/* Canvas Interactive Chart */}
                {history && history.data.length > 0 ? (
                  <InteractiveChart
                    data={history.data}
                    indicators={indicators}
                    activeTool={activeTool}
                    onPointClick={handlePointClick}
                    selectedPoint={selectedPoint}
                    historicalHits={analysis?.hits || []}
                    chartType={chartType}
                    drawings={drawings}
                    setDrawings={setDrawings}
                  />
                ) : (
                  <div className="h-[480px] bg-[#0B0E14] flex items-center justify-center text-gray-500 text-xs">
                    {isLoading ? 'Loading stock chart data from NSE...' : 'No historical chart data available.'}
                  </div>
                )}
              </div>

              {/* Technical Indicator Snapshot Card */}
              {history?.indicators && <TechnicalSummaryCard indicators={history.indicators} />}

              {/* AI Recommendation Card */}
              <AIRecommendationCard
                aiData={aiResult}
                isLoading={isAnalyzing}
                selectedPrice={selectedPoint?.price}
                symbol={symbol}
              />
            </div>

            {/* Right Column: Watchlist Panel */}
            <div className="lg:col-span-1">
              <Watchlist
                currentSymbol={symbol}
                onSelectStock={(s) => {
                  setSymbol(s);
                  setSelectedPoint(null);
                  setAnalysis(null);
                  setAiResult(null);
                }}
              />
            </div>
          </div>
        </main>
      </div>

      {/* AI Historical Price Point Analysis Side Drawer */}
      <PricePointPanel
        analysis={analysis}
        isOpen={isPanelOpen}
        onClose={() => setIsPanelOpen(false)}
        futureWindow={futureWindow}
        setFutureWindow={setFutureWindow}
      />
    </div>
  );
}
