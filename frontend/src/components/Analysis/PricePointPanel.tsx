import React from 'react';
import { X, TrendingUp, TrendingDown, Clock, ShieldCheck, Target } from 'lucide-react';
import { PricePointAnalysisResponse } from '../../types';

interface PricePointPanelProps {
  analysis: PricePointAnalysisResponse | null;
  isOpen: boolean;
  onClose: () => void;
  futureWindow: number;
  setFutureWindow: (w: number) => void;
}

export const PricePointPanel: React.FC<PricePointPanelProps> = ({
  analysis,
  isOpen,
  onClose,
  futureWindow,
  setFutureWindow,
}) => {
  if (!isOpen || !analysis) return null;

  const { stats, hits, selected_price, selected_date, symbol } = analysis;
  const isBullish = stats.historical_tendency === 'BULLISH';
  const isBearish = stats.historical_tendency === 'BEARISH';

  return (
    <div className="fixed inset-y-0 right-0 w-full max-w-md bg-[#151A23] border-l border-[#2A3447] shadow-2xl z-50 flex flex-col justify-between animate-in slide-in-from-right duration-300">
      {/* Header */}
      <div>
        <div className="p-4 border-b border-[#2A3447] flex items-center justify-between bg-[#0B0E14]">
          <div className="flex items-center space-x-2">
            <Target className="w-5 h-5 text-blue-400" />
            <div>
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                AI Historical Point Analysis
              </h2>
              <p className="text-[10px] text-gray-400 font-mono">
                {symbol} • Lookback: 1 Month Prior
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-[#1C2331] transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Selected Point Badge & Window Controls */}
        <div className="p-4 bg-[#1C2331]/40 border-b border-[#2A3447] space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[10px] text-gray-500 block uppercase">Selected Price Point</span>
              <span className="text-xl font-extrabold text-white font-mono">
                ₹{selected_price.toFixed(2)}
              </span>
            </div>

            <div className="text-right">
              <span className="text-[10px] text-gray-500 block uppercase">Candle Date</span>
              <span className="text-xs font-semibold text-blue-400 font-mono">{selected_date}</span>
            </div>
          </div>

          {/* Observation Window Selector */}
          <div className="flex items-center justify-between text-xs pt-1">
            <span className="text-[11px] text-gray-400 font-medium">Post-Hit Window:</span>
            <div className="flex space-x-1 bg-[#0B0E14] p-1 rounded-lg border border-[#2A3447]">
              {[1, 3, 5, 10].map((w) => (
                <button
                  key={w}
                  onClick={() => setFutureWindow(w)}
                  className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold transition ${
                    futureWindow === w
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  {w}D
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Aggregate Stats Cards */}
        <div className="p-4 space-y-3">
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="bg-[#0B0E14] p-3 rounded-lg border border-[#2A3447]">
              <span className="text-[10px] text-gray-500 block uppercase">Historical Touch Hits</span>
              <span className="text-lg font-bold text-white font-mono">{stats.total_hits} Times</span>
              <span className="text-[10px] text-gray-400 block mt-0.5">Tolerance ±{analysis.tolerance_pct}%</span>
            </div>

            <div className="bg-[#0B0E14] p-3 rounded-lg border border-[#2A3447]">
              <span className="text-[10px] text-gray-500 block uppercase">Historical Tendency</span>
              <span
                className={`inline-block px-2 py-0.5 rounded text-xs font-bold font-mono mt-1 ${
                  isBullish
                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                    : isBearish
                    ? 'bg-red-500/15 text-red-400 border border-red-500/30'
                    : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                }`}
              >
                {stats.historical_tendency}
              </span>
            </div>
          </div>

          {/* Up vs Down breakdown */}
          <div className="bg-[#0B0E14] p-3 rounded-lg border border-[#2A3447] space-y-2">
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-emerald-400 flex items-center space-x-1">
                <TrendingUp className="w-3.5 h-3.5" />
                <span>UP: {stats.up_count} ({stats.up_probability_pct}%)</span>
              </span>
              <span className="text-red-400 flex items-center space-x-1">
                <TrendingDown className="w-3.5 h-3.5" />
                <span>DOWN: {stats.down_count} ({stats.down_probability_pct}%)</span>
              </span>
            </div>

            {/* Visual Probability Bar */}
            <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden flex">
              <div
                style={{ width: `${stats.up_probability_pct}%` }}
                className="bg-emerald-500 transition-all duration-500"
              />
              <div
                style={{ width: `${stats.down_probability_pct}%` }}
                className="bg-red-500 transition-all duration-500"
              />
            </div>

            <div className="grid grid-cols-3 gap-2 text-[10px] font-mono text-center pt-1 border-t border-[#2A3447]/60">
              <div>
                <span className="text-gray-500 block">AVG MOVE</span>
                <span className={stats.avg_change_pct >= 0 ? 'text-emerald-400 font-bold' : 'text-red-400 font-bold'}>
                  {stats.avg_change_pct >= 0 ? '+' : ''}{stats.avg_change_pct}%
                </span>
              </div>
              <div>
                <span className="text-gray-500 block">MAX GAIN</span>
                <span className="text-emerald-400 font-bold">+{stats.max_gain_pct}%</span>
              </div>
              <div>
                <span className="text-gray-500 block">MAX DRAWDOWN</span>
                <span className="text-red-400 font-bold">{stats.max_loss_pct}%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Detailed Timeline Table of Hits */}
        <div className="px-4 pb-4">
          <h3 className="text-xs font-bold text-gray-300 uppercase tracking-wider mb-2 flex items-center space-x-1.5">
            <Clock className="w-3.5 h-3.5 text-blue-400" />
            <span>Past Occurrence Timeline ({hits.length})</span>
          </h3>

          <div className="max-h-56 overflow-y-auto space-y-2 pr-1">
            {hits.length === 0 ? (
              <p className="text-xs text-gray-500 italic p-3 text-center bg-[#0B0E14] rounded-lg">
                No matching price hits found in 1-month lookback.
              </p>
            ) : (
              hits.map((h, i) => (
                <div
                  key={i}
                  className="bg-[#0B0E14] p-2.5 rounded-lg border border-[#2A3447] text-xs font-mono flex items-center justify-between"
                >
                  <div>
                    <span className="text-gray-400 block text-[10px]">Hit Date: {h.date}</span>
                    <span className="text-white font-semibold">₹{h.price_at_hit.toFixed(2)}</span>
                  </div>

                  <div className="text-right">
                    <span className="text-gray-400 block text-[10px]">After {futureWindow}D: {h.future_date}</span>
                    <span
                      className={`font-bold flex items-center justify-end space-x-1 ${
                        h.direction === 'UP'
                          ? 'text-emerald-400'
                          : h.direction === 'DOWN'
                          ? 'text-red-400'
                          : 'text-amber-400'
                      }`}
                    >
                      {h.direction === 'UP' ? '▲' : h.direction === 'DOWN' ? '▼' : '●'}
                      <span>₹{h.future_price.toFixed(2)} ({h.change_percent >= 0 ? '+' : ''}{h.change_percent}%)</span>
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Footer Info */}
      <div className="p-3 bg-[#0B0E14] border-t border-[#2A3447] text-center text-[10px] text-gray-500">
        Calculated from empirical NSE historical data • Tolerance ±{analysis.tolerance_pct}%
      </div>
    </div>
  );
};
