import React from 'react';
import { TrendingUp, TrendingDown, Info, Calendar } from 'lucide-react';
import { StockQuote } from '../types';

interface StockHeaderProps {
  stock: StockQuote | null;
  isLoading: boolean;
}

export const StockHeader: React.FC<StockHeaderProps> = ({ stock, isLoading }) => {
  if (isLoading || !stock) {
    return (
      <div className="bg-[#151A23] border border-[#2A3447] rounded-xl p-5 mb-5 animate-pulse">
        <div className="h-6 bg-gray-800 rounded w-1/4 mb-3" />
        <div className="h-8 bg-gray-800 rounded w-1/3" />
      </div>
    );
  }

  const isPositive = stock.change >= 0;

  return (
    <div className="bg-[#151A23] border border-[#2A3447] rounded-xl p-5 mb-5">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Left: Symbol, Name & Price */}
        <div>
          <div className="flex items-center space-x-3">
            <h1 className="text-xl font-extrabold text-white tracking-tight font-mono">
              {stock.symbol}
            </h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20 font-mono">
              NSE • {stock.currency}
            </span>
            <span className="text-xs text-gray-400 font-medium">{stock.name}</span>
          </div>

          <div className="flex items-baseline space-x-3 mt-2">
            <span className="text-3xl font-extrabold text-white font-mono tracking-tight">
              ₹{stock.current_price.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </span>

            <div
              className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-md text-xs font-bold font-mono ${
                isPositive ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' : 'bg-red-500/15 text-red-400 border border-red-500/30'
              }`}
            >
              {isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
              <span>
                {isPositive ? '+' : ''}
                {stock.change.toFixed(2)} ({isPositive ? '+' : ''}
                {stock.change_percent.toFixed(2)}%)
              </span>
            </div>
          </div>
        </div>

        {/* Right Metrics Grid */}
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 pt-3 lg:pt-0 border-t lg:border-t-0 border-[#2A3447] text-xs font-mono">
          <div className="bg-[#0B0E14] p-2.5 rounded-lg border border-[#2A3447]/60">
            <span className="text-[10px] text-gray-500 block uppercase">Open</span>
            <span className="font-semibold text-gray-200">₹{stock.open.toFixed(2)}</span>
          </div>

          <div className="bg-[#0B0E14] p-2.5 rounded-lg border border-[#2A3447]/60">
            <span className="text-[10px] text-gray-500 block uppercase">High</span>
            <span className="font-semibold text-emerald-400">₹{stock.high.toFixed(2)}</span>
          </div>

          <div className="bg-[#0B0E14] p-2.5 rounded-lg border border-[#2A3447]/60">
            <span className="text-[10px] text-gray-500 block uppercase">Low</span>
            <span className="font-semibold text-red-400">₹{stock.low.toFixed(2)}</span>
          </div>

          <div className="bg-[#0B0E14] p-2.5 rounded-lg border border-[#2A3447]/60">
            <span className="text-[10px] text-gray-500 block uppercase">Volume</span>
            <span className="font-semibold text-gray-200">{stock.volume.toLocaleString('en-IN')}</span>
          </div>

          <div className="bg-[#0B0E14] p-2.5 rounded-lg border border-[#2A3447]/60">
            <span className="text-[10px] text-gray-500 block uppercase">52W High</span>
            <span className="font-semibold text-gray-300">
              {stock.fifty_two_week_high ? `₹${stock.fifty_two_week_high.toFixed(2)}` : 'N/A'}
            </span>
          </div>

          <div className="bg-[#0B0E14] p-2.5 rounded-lg border border-[#2A3447]/60">
            <span className="text-[10px] text-gray-500 block uppercase">52W Low</span>
            <span className="font-semibold text-gray-300">
              {stock.fifty_two_week_low ? `₹${stock.fifty_two_week_low.toFixed(2)}` : 'N/A'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
