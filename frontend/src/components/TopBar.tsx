import React, { useState, useEffect, useRef } from 'react';
import { Search, RefreshCw, Clock, Bot, Menu, X, LayoutDashboard, TrendingUp, BookmarkCheck, Cpu, SlidersHorizontal } from 'lucide-react';
import { StockQuote, StockSearchResult } from '../types';
import { searchStocks } from '../services/api';

interface TopBarProps {
  selectedStock: StockQuote | null;
  onSelectSymbol: (symbol: string) => void;
  onRefresh: () => void;
  isLoading: boolean;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  selectedStock,
  onSelectSymbol,
  onRefresh,
  isLoading,
  activeTab,
  setActiveTab
}) => {
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState<StockSearchResult[]>([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isNavOpen, setIsNavOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState<string>('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  const navItems = [
    { id: 'dashboard', label: 'Trading Dashboard', icon: LayoutDashboard },
    { id: 'markets', label: 'Market Overview', icon: TrendingUp },
    { id: 'watchlist', label: 'Watchlist', icon: BookmarkCheck },
    { id: 'ai-analysis', label: 'AI Intelligence', icon: Cpu },
    { id: 'indicators', label: 'Technical Indicators', icon: SlidersHorizontal },
  ];

  // Live IST Clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const options: Intl.DateTimeFormatOptions = {
        timeZone: 'Asia/Kolkata',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      };
      setCurrentTime(new Intl.DateTimeFormat('en-IN', options).format(now));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Search autocomplete handler
  useEffect(() => {
    if (!query.trim()) {
      setSearchResults([]);
      setIsDropdownOpen(false);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const results = await searchStocks(query);
        setSearchResults(results);
        setIsDropdownOpen(true);
      } catch (err) {
        console.error(err);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (symbol: string) => {
    onSelectSymbol(symbol);
    setQuery('');
    setIsDropdownOpen(false);
  };

  const isMarketOpen = selectedStock?.is_market_open ?? false;

  return (
    <header className="h-16 bg-[#151A23] border-b border-[#2A3447] px-6 flex items-center justify-between sticky top-0 z-30">
      {/* Left: Brand Logo & Compact Menu Toggle */}
      <div className="flex items-center space-x-4">
        <button
          onClick={() => setIsNavOpen(!isNavOpen)}
          className="p-2 rounded-lg bg-[#0B0E14] border border-[#2A3447] text-gray-300 hover:text-white hover:border-blue-500/50 transition"
          title="Toggle Navigation Menu"
        >
          {isNavOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>

        <div className="flex items-center space-x-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div className="hidden sm:block">
            <h1 className="font-extrabold text-sm text-white tracking-wide leading-tight">
              AI Tabletop Trading Assistant
            </h1>
            <p className="text-[10px] text-blue-400 font-medium">Phase 1 Intelligence Dashboard</p>
          </div>
        </div>
      </div>

      {/* Center: Search Box */}
      <div className="relative w-72 md:w-96" ref={dropdownRef}>
        <div className="relative flex items-center">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 pointer-events-none" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search stocks (e.g. INFY, RELIANCE, TCS)..."
            className="w-full pl-9 pr-4 py-2 bg-[#0B0E14] border border-[#2A3447] rounded-lg text-xs text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition"
          />
        </div>

        {/* Autocomplete Dropdown */}
        {isDropdownOpen && searchResults.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1.5 bg-[#1C2331] border border-[#2A3447] rounded-lg shadow-xl z-50 max-h-60 overflow-y-auto">
            {searchResults.map((item) => (
              <button
                key={item.symbol}
                onClick={() => handleSelect(item.symbol)}
                className="w-full px-4 py-2.5 text-left text-xs hover:bg-blue-600/20 flex items-center justify-between transition border-b border-[#2A3447]/50 last:border-0"
              >
                <div>
                  <span className="font-semibold text-white">{item.symbol}</span>
                  <p className="text-[10px] text-gray-400 truncate max-w-[200px]">{item.name}</p>
                </div>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 font-mono">
                  {item.exchange || 'NSE'}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Right Controls: Market Status, Time, Refresh */}
      <div className="flex items-center space-x-4 text-xs">
        {/* Market Open / Closed Indicator */}
        <div className="flex items-center space-x-2 bg-[#0B0E14] px-3 py-1.5 rounded-lg border border-[#2A3447]">
          <span className={`w-2 h-2 rounded-full ${isMarketOpen ? 'bg-emerald-500 animate-ping' : 'bg-red-500'}`} />
          <span className={`font-semibold text-[11px] ${isMarketOpen ? 'text-emerald-400' : 'text-red-400'}`}>
            {isMarketOpen ? 'LIVE MARKET OPEN' : 'MARKET CLOSED (NSE)'}
          </span>
        </div>

        {/* Clock */}
        <div className="hidden xl:flex items-center space-x-2 text-gray-400 font-mono text-[11px]">
          <Clock className="w-3.5 h-3.5 text-blue-400" />
          <span>{currentTime || 'IST Time'}</span>
        </div>

        {/* Refresh Button */}
        <button
          onClick={onRefresh}
          disabled={isLoading}
          className="flex items-center space-x-2 px-3 py-1.5 bg-blue-600/10 hover:bg-blue-600/20 border border-blue-500/30 text-blue-400 rounded-lg transition font-medium text-xs disabled:opacity-50"
          title="Refresh Market Data"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Compact Slide-over Navigation Drawer */}
      {isNavOpen && (
        <div className="fixed inset-0 top-16 z-40 bg-black/60 backdrop-blur-sm flex">
          <div className="w-64 bg-[#151A23] border-r border-[#2A3447] p-4 flex flex-col justify-between h-full shadow-2xl animate-in slide-in-from-left duration-200">
            <nav className="space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id);
                      setIsNavOpen(false);
                    }}
                    className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-lg font-medium text-xs transition ${
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

            <div className="p-3 bg-[#0B0E14] rounded-lg border border-[#2A3447] text-[10px] text-gray-400 text-center font-mono">
              Phase 1 Prototype • Full Screen Trading View
            </div>
          </div>

          <div className="flex-1" onClick={() => setIsNavOpen(false)} />
        </div>
      )}
    </header>
  );
};
