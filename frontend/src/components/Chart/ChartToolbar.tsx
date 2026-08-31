import React from 'react';
import { ChartTimeframe, ChartInterval } from '../../types';
import { CandlestickChart, LineChart, Clock } from 'lucide-react';

interface ChartToolbarProps {
  timeframe: ChartTimeframe;
  setTimeframe: (tf: ChartTimeframe) => void;
  interval: ChartInterval;
  setInterval: (intv: ChartInterval) => void;
  chartType: 'candlestick' | 'line';
  setChartType: (type: 'candlestick' | 'line') => void;
}

export const ChartToolbar: React.FC<ChartToolbarProps> = ({
  timeframe,
  setTimeframe,
  interval,
  setInterval,
  chartType,
  setChartType,
}) => {
  const timeframes: ChartTimeframe[] = ['1D', '5D', '1M', '3M', '6M', '1Y', '5Y'];
  const intervals: ChartInterval[] = ['1m', '5m', '15m', '30m', '1h', '1d'];

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-[#151A23] border-b border-[#2A3447] text-xs">
      <div className="flex items-center space-x-3 flex-wrap gap-y-2">
        {/* Timeframe Selector */}
        <div className="flex items-center space-x-1 bg-[#0B0E14] p-1 rounded-lg border border-[#2A3447]">
          <span className="text-[10px] text-gray-500 font-bold px-1.5 uppercase">Period:</span>
          {timeframes.map((tf) => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf)}
              className={`px-2.5 py-1 rounded-md font-mono font-semibold transition ${
                timeframe === tf
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-[#1C2331]'
              }`}
            >
              {tf}
            </button>
          ))}
        </div>

        {/* Interval Selector */}
        <div className="flex items-center space-x-1 bg-[#0B0E14] p-1 rounded-lg border border-[#2A3447]">
          <span className="text-[10px] text-gray-500 font-bold px-1.5 uppercase flex items-center space-x-1">
            <Clock className="w-3 h-3 text-blue-400 inline" />
            <span>Interval:</span>
          </span>
          {intervals.map((intv) => (
            <button
              key={intv}
              onClick={() => setInterval(intv)}
              className={`px-2 py-1 rounded-md font-mono font-semibold transition ${
                interval === intv
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-[#1C2331]'
              }`}
            >
              {intv}
            </button>
          ))}
        </div>
      </div>

      {/* Chart Type Toggle */}
      <div className="flex items-center space-x-1 bg-[#0B0E14] p-1 rounded-lg border border-[#2A3447]">
        <button
          onClick={() => setChartType('candlestick')}
          className={`flex items-center space-x-1 px-2.5 py-1 rounded-md font-medium transition ${
            chartType === 'candlestick'
              ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30 font-semibold'
              : 'text-gray-400 hover:text-gray-200'
          }`}
        >
          <CandlestickChart className="w-3.5 h-3.5" />
          <span>Candles</span>
        </button>

        <button
          onClick={() => setChartType('line')}
          className={`flex items-center space-x-1 px-2.5 py-1 rounded-md font-medium transition ${
            chartType === 'line'
              ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30 font-semibold'
              : 'text-gray-400 hover:text-gray-200'
          }`}
        >
          <LineChart className="w-3.5 h-3.5" />
          <span>Line</span>
        </button>
      </div>
    </div>
  );
};
