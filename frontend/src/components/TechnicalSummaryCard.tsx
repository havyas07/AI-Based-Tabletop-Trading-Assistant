import React from 'react';
import { SlidersHorizontal, ArrowUpRight, ArrowDownRight, Activity } from 'lucide-react';

interface TechnicalSummaryCardProps {
  indicators: any;
}

export const TechnicalSummaryCard: React.FC<TechnicalSummaryCardProps> = ({ indicators }) => {
  if (!indicators || Object.keys(indicators).length === 0) return null;

  const rsi = indicators.rsi_14 ?? 50;
  const macd = indicators.macd ?? 0;
  const macdSig = indicators.macd_signal ?? 0;

  return (
    <div className="bg-[#151A23] border border-[#2A3447] rounded-xl p-4 mb-5">
      <div className="flex items-center space-x-2 pb-2.5 border-b border-[#2A3447] mb-3">
        <SlidersHorizontal className="w-4 h-4 text-blue-400" />
        <h3 className="text-xs font-bold text-white uppercase tracking-wider">
          Technical Indicator Snapshot
        </h3>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs font-mono">
        <div className="bg-[#0B0E14] p-3 rounded-lg border border-[#2A3447]">
          <span className="text-[10px] text-gray-500 block uppercase">RSI (14)</span>
          <div className="text-sm font-bold text-cyan-400 mt-0.5">{rsi.toFixed(1)}</div>
          <span className="text-[10px] text-gray-400">{indicators.rsi_status || 'Neutral'}</span>
        </div>

        <div className="bg-[#0B0E14] p-3 rounded-lg border border-[#2A3447]">
          <span className="text-[10px] text-gray-500 block uppercase">MACD</span>
          <div className="text-sm font-bold text-emerald-400 mt-0.5">{macd.toFixed(2)}</div>
          <span className="text-[10px] text-gray-400">Signal: {macdSig.toFixed(2)}</span>
        </div>

        <div className="bg-[#0B0E14] p-3 rounded-lg border border-[#2A3447]">
          <span className="text-[10px] text-gray-500 block uppercase">SMA 20 vs 50</span>
          <div className="text-sm font-bold text-amber-400 mt-0.5">
            ₹{indicators.sma_20?.toFixed(1)} / ₹{indicators.sma_50?.toFixed(1)}
          </div>
          <span className="text-[10px] text-gray-400">Moving Averages</span>
        </div>

        <div className="bg-[#0B0E14] p-3 rounded-lg border border-[#2A3447]">
          <span className="text-[10px] text-gray-500 block uppercase">Primary Trend</span>
          <div className="text-sm font-bold text-blue-400 mt-0.5">
            {indicators.trend_summary || 'Sideways'}
          </div>
          <span className="text-[10px] text-gray-400">Trend Alignment</span>
        </div>
      </div>
    </div>
  );
};
