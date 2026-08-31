import React from 'react';
import { Bookmark, TrendingUp, TrendingDown, ChevronRight } from 'lucide-react';
import { StockQuote } from '../types';

interface WatchlistProps {
  currentSymbol: string;
  onSelectStock: (symbol: string) => void;
}

const DEFAULT_WATCHLIST = [
  { symbol: 'RELIANCE.NS', name: 'Reliance Industries', price: 3020.45, change: 1.24 },
  { symbol: 'TCS.NS', name: 'Tata Consultancy Services', price: 4350.10, change: -0.52 },
  { symbol: 'INFY.NS', name: 'Infosys Ltd.', price: 1845.80, change: 0.83 },
  { symbol: 'HDFCBANK.NS', name: 'HDFC Bank Ltd.', price: 1640.25, change: 0.42 },
  { symbol: 'ICICIBANK.NS', name: 'ICICI Bank Ltd.', price: 1210.60, change: -0.31 },
  { symbol: 'SBIN.NS', name: 'State Bank of India', price: 825.90, change: 1.45 },
  { symbol: 'ITC.NS', name: 'ITC Ltd.', price: 495.30, change: 0.15 },
  { symbol: 'WIPRO.NS', name: 'Wipro Ltd.', price: 530.40, change: -0.75 },
  { symbol: 'BHARTIARTL.NS', name: 'Bharti Airtel Ltd.', price: 1480.00, change: 1.85 },
  { symbol: 'LT.NS', name: 'Larsen & Toubro', price: 3710.50, change: 0.92 },
];

export const Watchlist: React.FC<WatchlistProps> = ({ currentSymbol, onSelectStock }) => {
  return (
    <div className="bg-[#151A23] border border-[#2A3447] rounded-xl p-4 flex flex-col h-full">
      <div className="flex items-center justify-between pb-3 border-b border-[#2A3447] mb-3">
        <div className="flex items-center space-x-2">
          <Bookmark className="w-4 h-4 text-blue-400" />
          <h2 className="text-xs font-bold text-white tracking-wide uppercase">Watchlist (NSE)</h2>
        </div>
        <span className="text-[10px] text-gray-400 bg-[#0B0E14] px-2 py-0.5 rounded border border-[#2A3447] font-mono">
          {DEFAULT_WATCHLIST.length} Stocks
        </span>
      </div>

      <div className="space-y-1.5 overflow-y-auto flex-1 pr-1">
        {DEFAULT_WATCHLIST.map((item) => {
          const isSelected = currentSymbol.toUpperCase() === item.symbol.toUpperCase();
          const isPositive = item.change >= 0;

          return (
            <button
              key={item.symbol}
              onClick={() => onSelectStock(item.symbol)}
              className={`w-full p-2.5 rounded-lg text-left flex items-center justify-between transition-all duration-150 border ${
                isSelected
                  ? 'bg-blue-600/15 border-blue-500/40 shadow-sm'
                  : 'bg-[#1C2331]/60 hover:bg-[#1C2331] border-[#2A3447]/60 hover:border-gray-700'
              }`}
            >
              <div>
                <div className="flex items-center space-x-1.5">
                  <span className={`font-bold text-xs ${isSelected ? 'text-blue-400' : 'text-white'}`}>
                    {item.symbol.replace('.NS', '')}
                  </span>
                  <span className="text-[9px] text-gray-500 font-mono">NSE</span>
                </div>
                <p className="text-[10px] text-gray-400 truncate max-w-[110px] mt-0.5">{item.name}</p>
              </div>

              <div className="text-right">
                <div className="text-xs font-bold font-mono text-gray-200">
                  ₹{item.price.toLocaleString('en-IN')}
                </div>
                <div
                  className={`text-[10px] font-semibold font-mono flex items-center justify-end space-x-0.5 mt-0.5 ${
                    isPositive ? 'text-emerald-400' : 'text-red-400'
                  }`}
                >
                  {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  <span>
                    {isPositive ? '+' : ''}
                    {item.change}%
                  </span>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
