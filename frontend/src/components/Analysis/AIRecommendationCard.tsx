import React, { useState } from 'react';
import { Cpu, ShieldAlert, CheckCircle2, Lightbulb, Sparkles, ChevronDown, ChevronUp, Terminal } from 'lucide-react';
import { AIAnalysisResponse } from '../../types';

interface AIRecommendationCardProps {
  aiData: AIAnalysisResponse | null;
  isLoading: boolean;
  selectedPrice?: number;
  symbol?: string;
}

export const AIRecommendationCard: React.FC<AIRecommendationCardProps> = ({
  aiData,
  isLoading,
  selectedPrice,
  symbol,
}) => {
  const [isDebugExpanded, setIsDebugExpanded] = useState(false);

  if (isLoading) {
    return (
      <div className="bg-[#151A23] border border-[#2A3447] rounded-xl p-5 mb-5 animate-pulse space-y-3">
        <div className="h-5 bg-gray-800 rounded w-1/3" />
        <div className="h-10 bg-gray-800 rounded w-1/2" />
        <div className="h-16 bg-gray-800 rounded w-full" />
      </div>
    );
  }

  if (!aiData) {
    return (
      <div className="bg-[#151A23] border border-[#2A3447] rounded-xl p-6 mb-5 text-center">
        <Cpu className="w-8 h-8 text-blue-400 mx-auto mb-2 opacity-60" />
        <h3 className="text-sm font-semibold text-gray-300">AI Market Intelligence Engine</h3>
        <p className="text-xs text-gray-500 mt-1 max-w-md mx-auto">
          Click any price candle or point on the interactive chart to trigger AI historical price-level analysis and generate a BUY / SELL / HOLD recommendation.
        </p>
      </div>
    );
  }

  const {
    recommendation,
    confidence,
    risk_level,
    summary,
    key_factors,
    technical_view,
    disclaimer,
    is_fallback,
    source,
    ai_status,
    ai_status_label,
    provider,
    model,
    timestamp,
    api_key_status,
  } = aiData;

  const isBuy = recommendation === 'BUY';
  const isSell = recommendation === 'SELL';

  const badgeColor = isBuy
    ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40 glow-green'
    : isSell
    ? 'bg-red-500/20 text-red-400 border-red-500/40 glow-red'
    : 'bg-amber-500/20 text-amber-400 border-amber-500/40';

  const riskBadge =
    risk_level === 'LOW'
      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
      : risk_level === 'HIGH'
      ? 'bg-red-500/10 text-red-400 border-red-500/20'
      : 'bg-amber-500/10 text-amber-400 border-amber-500/20';

  const displayStatusLabel =
    ai_status_label ||
    (source === 'ai'
      ? 'AI Engine: Connected'
      : ai_status === 'api_error_fallback'
      ? 'AI Engine: API Error — Using Fallback'
      : 'AI Engine: Demo / Fallback Mode');

  const statusBadgeStyle =
    source === 'ai'
      ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30 font-semibold'
      : ai_status === 'api_error_fallback'
      ? 'bg-red-500/15 text-red-400 border-red-500/30 font-semibold'
      : 'bg-amber-500/15 text-amber-400 border-amber-500/30 font-semibold';

  const sourceTitle =
    source === 'ai'
      ? 'Gemini AI Analysis'
      : 'Deterministic Historical Analysis (Fallback)';

  return (
    <div className="bg-[#151A23] border border-blue-500/30 rounded-xl p-5 mb-5 shadow-xl relative overflow-hidden">
      {/* Top Banner */}
      <div className="flex flex-wrap items-center justify-between pb-3 border-b border-[#2A3447] mb-4 gap-2">
        <div className="flex items-center space-x-2">
          <div className="p-1.5 rounded-lg bg-blue-600/20 border border-blue-500/30">
            <Sparkles className="w-4 h-4 text-blue-400" />
          </div>
          <div>
            <h2 className="text-xs font-bold text-white uppercase tracking-wider">
              AI Market Recommendation Engine
            </h2>
            <span className="text-[10px] text-gray-400 font-mono">
              {symbol} • Selected Level: ₹{selectedPrice?.toFixed(2)}
            </span>
          </div>
        </div>

        <div className={`flex items-center space-x-1.5 text-[10px] font-mono px-2.5 py-1 rounded-md border ${statusBadgeStyle}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${source === 'ai' ? 'bg-emerald-400 animate-pulse' : ai_status === 'api_error_fallback' ? 'bg-red-400' : 'bg-amber-400'}`} />
          <span>{displayStatusLabel}</span>
        </div>
      </div>

      {/* Main Signal Box */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        {/* Recommendation Badge */}
        <div className="bg-[#0B0E14] p-4 rounded-xl border border-[#2A3447] flex flex-col justify-center items-center text-center">
          <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1">
            Recommendation
          </span>
          <div className={`text-2xl font-black font-mono px-6 py-2 rounded-xl border ${badgeColor}`}>
            {recommendation}
          </div>
        </div>

        {/* Confidence Gauge */}
        <div className="bg-[#0B0E14] p-4 rounded-xl border border-[#2A3447] flex flex-col justify-center items-center text-center">
          <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1">
            AI Confidence
          </span>
          <div className="text-2xl font-black text-white font-mono">{confidence}%</div>
          <div className="w-3/4 h-1.5 bg-gray-800 rounded-full mt-2 overflow-hidden">
            <div
              style={{ width: `${confidence}%` }}
              className={`h-full ${isBuy ? 'bg-emerald-500' : isSell ? 'bg-red-500' : 'bg-amber-500'}`}
            />
          </div>
        </div>

        {/* Risk Level */}
        <div className="bg-[#0B0E14] p-4 rounded-xl border border-[#2A3447] flex flex-col justify-center items-center text-center">
          <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1">
            Assessed Risk
          </span>
          <span className={`text-sm font-bold font-mono px-3 py-1 rounded-md border ${riskBadge}`}>
            {risk_level} RISK
          </span>
        </div>
      </div>

      {/* Reasoning Summary */}
      <div className="bg-[#0B0E14] p-4 rounded-xl border border-[#2A3447] mb-4">
        <h3 className="text-xs font-bold uppercase mb-1.5 flex items-center justify-between">
          <span className="flex items-center space-x-1.5 text-gray-300">
            <Lightbulb className="w-4 h-4 text-amber-400" />
            <span>{sourceTitle}</span>
          </span>
          <span className={`text-[9px] font-mono px-2 py-0.5 rounded ${source === 'ai' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'}`}>
            Source: {source === 'ai' ? 'AI' : 'Fallback'}
          </span>
        </h3>
        <p className="text-xs text-gray-300 leading-relaxed font-sans">{summary}</p>
      </div>

      {/* Key Factors Bullet Points */}
      {key_factors.length > 0 && (
        <div className="mb-4 space-y-1.5">
          <h4 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
            Key Evidence Factors:
          </h4>
          <ul className="space-y-1">
            {key_factors.map((factor, i) => (
              <li key={i} className="text-xs text-gray-300 flex items-start space-x-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-blue-400 flex-shrink-0 mt-0.5" />
                <span>{factor}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Technical View Line */}
      {technical_view && (
        <div className="p-2.5 bg-[#0B0E14]/60 rounded-lg border border-[#2A3447] text-xs font-mono text-cyan-400 mb-3">
          <strong>Technical Momentum:</strong> {technical_view}
        </div>
      )}

      {/* Expandable AI Execution Details Debug Section (Requirement 7) */}
      <div className="mb-3 border border-[#2A3447] rounded-lg overflow-hidden bg-[#0B0E14]">
        <button
          onClick={() => setIsDebugExpanded(!isDebugExpanded)}
          className="w-full px-3 py-2 text-left flex items-center justify-between text-[11px] font-mono text-gray-400 hover:text-gray-200 hover:bg-[#1C2331] transition"
        >
          <span className="flex items-center space-x-1.5">
            <Terminal className="w-3.5 h-3.5 text-blue-400" />
            <span>AI Execution Details</span>
          </span>
          {isDebugExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>

        {isDebugExpanded && (
          <div className="p-3 border-t border-[#2A3447] grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px] font-mono">
            <div>
              <span className="text-gray-500 block">AI MODE</span>
              <span className={source === 'ai' ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold'}>
                {source === 'ai' ? 'Connected' : 'Fallback'}
              </span>
            </div>

            <div>
              <span className="text-gray-500 block">PROVIDER</span>
              <span className="text-white font-semibold">{provider || 'Gemini'}</span>
            </div>

            <div>
              <span className="text-gray-500 block">MODEL</span>
              <span className="text-white font-semibold">{model || 'gemini-1.5-flash'}</span>
            </div>

            <div>
              <span className="text-gray-500 block">API KEY</span>
              <span className={api_key_status === 'Configured' ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold'}>
                {api_key_status || 'Not Configured'}
              </span>
            </div>

            <div>
              <span className="text-gray-500 block">REQUEST</span>
              <span className="text-gray-300">{source === 'ai' ? 'Sent' : 'Not Sent'}</span>
            </div>

            <div>
              <span className="text-gray-500 block">RESPONSE</span>
              <span className="text-gray-300">{source === 'ai' ? 'Received' : 'Fallback'}</span>
            </div>

            <div>
              <span className="text-gray-500 block">SOURCE</span>
              <span className="text-blue-400 font-bold">{source === 'ai' ? 'AI' : 'Fallback'}</span>
            </div>

            <div>
              <span className="text-gray-500 block">TIMESTAMP</span>
              <span className="text-gray-400 truncate block">{timestamp || 'Latest'}</span>
            </div>
          </div>
        )}
      </div>

      {/* Disclaimer */}
      <div className="text-[10px] text-gray-500 flex items-center space-x-1.5 italic">
        <ShieldAlert className="w-3.5 h-3.5 text-gray-500 flex-shrink-0" />
        <span>{disclaimer}</span>
      </div>
    </div>
  );
};
