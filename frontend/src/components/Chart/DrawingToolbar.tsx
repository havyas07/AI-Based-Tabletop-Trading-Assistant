import React from 'react';
import { DrawingTool } from '../../types';
import { MousePointer, TrendingUp, Minus, MoveVertical, Trash2 } from 'lucide-react';

interface DrawingToolbarProps {
  activeTool: DrawingTool;
  setActiveTool: (tool: DrawingTool) => void;
  onClearDrawings: () => void;
  drawingCount: number;
}

export const DrawingToolbar: React.FC<DrawingToolbarProps> = ({
  activeTool,
  setActiveTool,
  onClearDrawings,
  drawingCount,
}) => {
  const tools: { id: DrawingTool; label: string; icon: any }[] = [
    { id: 'select', label: 'Select / Click Point', icon: MousePointer },
    { id: 'trendline', label: 'Trend Line', icon: TrendingUp },
    { id: 'horizontal', label: 'Horizontal Line', icon: Minus },
    { id: 'vertical', label: 'Vertical Line', icon: MoveVertical },
  ];

  return (
    <div className="flex items-center space-x-1.5 p-2 bg-[#0B0E14] border-b border-[#2A3447] text-xs">
      <span className="text-[10px] text-gray-500 font-bold uppercase px-2">Draw Tools:</span>

      {tools.map((t) => {
        const Icon = t.icon;
        const isActive = activeTool === t.id;
        return (
          <button
            key={t.id}
            onClick={() => setActiveTool(t.id)}
            className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition ${
              isActive
                ? 'bg-blue-600 text-white shadow-sm font-semibold'
                : 'text-gray-400 hover:text-gray-200 hover:bg-[#1C2331]'
            }`}
            title={t.label}
          >
            <Icon className="w-3.5 h-3.5" />
            <span>{t.label}</span>
          </button>
        );
      })}

      <div className="h-4 w-px bg-[#2A3447] mx-1" />

      <button
        onClick={onClearDrawings}
        disabled={drawingCount === 0}
        className="flex items-center space-x-1 px-2.5 py-1 rounded-md text-xs font-medium text-red-400 hover:bg-red-500/10 hover:border-red-500/30 border border-transparent transition disabled:opacity-40"
        title="Clear All Drawings"
      >
        <Trash2 className="w-3.5 h-3.5" />
        <span>Clear ({drawingCount})</span>
      </button>
    </div>
  );
};
