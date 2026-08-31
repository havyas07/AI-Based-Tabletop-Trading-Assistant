import React from 'react';
import { LayoutDashboard, TrendingUp, BookmarkCheck, Cpu, SlidersHorizontal, Bot, ShieldAlert } from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  const navItems = [
    { id: 'dashboard', label: 'Trading Dashboard', icon: LayoutDashboard },
    { id: 'markets', label: 'Market Overview', icon: TrendingUp },
    { id: 'watchlist', label: 'Watchlist', icon: BookmarkCheck },
    { id: 'ai-analysis', label: 'AI Intelligence', icon: Cpu },
    { id: 'indicators', label: 'Technical Indicators', icon: SlidersHorizontal },
  ];

  return (
    <aside className="w-64 bg-[#151A23] border-r border-[#2A3447] flex flex-col justify-between h-screen sticky top-0 z-30 select-none">
      <div>
        {/* Brand Header */}
        <div className="p-5 border-b border-[#2A3447] flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <Bot className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-sm text-white tracking-wide leading-tight">
              Tabletop Assistant
            </h1>
            <p className="text-[11px] text-blue-400 font-medium">Phase 1 Trading Intelligence</p>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="p-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-lg font-medium text-xs transition-all duration-200 ${
                  isActive
                    ? 'bg-blue-600/15 text-blue-400 border border-blue-500/30 font-semibold'
                    : 'text-gray-400 hover:text-gray-200 hover:bg-[#1C2331]'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-blue-400' : 'text-gray-400'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Phase 1 Badge & Footer */}
      <div className="p-4 border-t border-[#2A3447] bg-[#0B0E14]/40">
        <div className="flex items-center space-x-2 text-amber-400 text-[11px] font-medium bg-amber-500/10 border border-amber-500/20 rounded-md p-2 mb-3">
          <ShieldAlert className="w-4 h-4 flex-shrink-0 text-amber-400" />
          <span>Major Project Prototype (No Auth / Direct Access)</span>
        </div>
        <p className="text-[10px] text-gray-500 text-center font-mono">
          System v1.0.0 • Indian Stock Engine
        </p>
      </div>
    </aside>
  );
};
