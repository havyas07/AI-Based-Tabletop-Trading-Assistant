import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface ErrorBannerProps {
  message: string;
  onRetry?: () => void;
}

export const ErrorBanner: React.FC<ErrorBannerProps> = ({ message, onRetry }) => {
  return (
    <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-5 flex items-center justify-between text-xs text-red-300">
      <div className="flex items-center space-x-2.5">
        <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0" />
        <span>{message}</span>
      </div>

      {onRetry && (
        <button
          onClick={onRetry}
          className="flex items-center space-x-1 px-3 py-1.5 bg-red-600/20 hover:bg-red-600/30 border border-red-500/40 text-red-200 rounded-lg transition font-medium"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Retry</span>
        </button>
      )}
    </div>
  );
};
