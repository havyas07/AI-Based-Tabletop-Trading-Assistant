import React from 'react';
import { IndicatorConfig } from '../../types';
import { SlidersHorizontal } from 'lucide-react';

interface IndicatorSelectorProps {
  indicators: IndicatorConfig;
  setIndicators: React.Dispatch<React.SetStateAction<IndicatorConfig>>;
}

export const IndicatorSelector: React.FC<IndicatorSelectorProps> = ({
  indicators,
  setIndicators,
}) => {
  const toggle = (key: keyof IndicatorConfig) => {
    setIndicators((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const list: { key: keyof IndicatorConfig; label: string; color: string }[] = [
    { key: 'sma20', label: 'SMA 20', color: 'text-amber-400 border-amber-500/30' },
    { key: 'sma50', label: 'SMA 50', color: 'text-blue-400 border-blue-500/30' },
    { key: 'ema20', label: 'EMA 20', color: 'text-purple-400 border-purple-500/30' },
    { key: 'ema50', label: 'EMA 50', color: 'text-pink-400 border-pink-500/30' },
    { key: 'rsi14', label: 'RSI (14)', color: 'text-cyan-400 border-cyan-500/30' },
    { key: 'macd', label: 'MACD (12,26,9)', color: 'text-[#10B981] border-emerald-500/30' },
    { key: 'bollinger', label: 'Bollinger Bands', color: 'text-indigo-400 border-indigo-500/30' },
    { key: 'volume', label: 'Volume MA', color: 'text-gray-400 border-gray-500/30' },
  ];

  return (
    <div className="flex flex-wrap items-center gap-1.5 p-2.5 bg-[#151A23] border-b border-[#2A3447] text-xs">
      <div className="flex items-center space-x-1.5 text-gray-400 font-medium mr-2">
        <SlidersHorizontal className="w-3.5 h-3.5 text-blue-400" />
        <span className="text-[11px]">Indicators:</span>
      </div>

      {list.map((item) => {
        const isActive = indicators[item.key];
        return (
          <button
            key={item.key}
            onClick={() => toggle(item.key)}
            className={`px-2.5 py-1 rounded-md text-[11px] font-mono font-medium transition border ${
              isActive
                ? `bg-[#0B0E14] ${item.color} font-bold shadow-sm`
                : 'bg-[#0B0E14]/40 text-gray-500 border-[#2A3447] hover:text-gray-300'
            }`}
          >
            {isActive ? '✓ ' : '+ '}
            {item.label}
          </button>
        );
      })}
    </div>
  );
};
