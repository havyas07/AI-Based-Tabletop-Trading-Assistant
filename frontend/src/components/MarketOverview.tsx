import React from 'react';
import { TrendingUp, TrendingDown, Activity } from 'lucide-react';
import { IndexQuote } from '../types';

interface MarketOverviewProps {
  indices: IndexQuote[];
  isLoading: boolean;
}

export const MarketOverview: React.FC<MarketOverviewProps> = ({ indices, isLoading }) => {
  if (isLoading && indices.length === 0) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-20 bg-[#151A23] rounded-xl border border-[#2A3447] animate-pulse p-4" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
      {indices.map((idx) => {
        const isPositive = idx.change >= 0;
        return (
          <div
            key={idx.symbol}
            className="bg-[#151A23] border border-[#2A3447] rounded-xl p-4 flex items-center justify-between hover:border-gray-700 transition shadow-sm"
          >
            <div>
              <div className="flex items-center space-x-2">
                <Activity className="w-3.5 h-3.5 text-blue-400" />
                <span className="text-xs font-semibold text-gray-300">{idx.name}</span>
              </div>
              <div className="text-lg font-bold text-white mt-1 tracking-wide font-mono">
                ₹{idx.value.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </div>
            </div>

            <div className="text-right">
              <div
                className={`inline-flex items-center space-x-1 px-2 py-1 rounded-md text-xs font-semibold font-mono ${
                  isPositive ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'
                }`}
              >
                {isPositive ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                <span>
                  {isPositive ? '+' : ''}
                  {idx.change.toFixed(2)} ({isPositive ? '+' : ''}
                  {idx.change_percent.toFixed(2)}%)
                </span>
              </div>
              <p className="text-[10px] text-gray-500 mt-1 font-mono">{idx.last_updated}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
};
