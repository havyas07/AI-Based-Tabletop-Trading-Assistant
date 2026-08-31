import React, { useRef, useEffect, useState, useCallback } from 'react';
import { OHLCVDataPoint, IndicatorConfig, DrawingTool, DrawingLine, HistoricalHit } from '../../types';

interface InteractiveChartProps {
  data: OHLCVDataPoint[];
  indicators: IndicatorConfig;
  activeTool: DrawingTool;
  onPointClick: (date: string, price: number, candle: OHLCVDataPoint) => void;
  selectedPoint: { date: string; price: number } | null;
  historicalHits: HistoricalHit[];
  chartType: 'candlestick' | 'line';
  drawings: DrawingLine[];
  setDrawings: React.Dispatch<React.SetStateAction<DrawingLine[]>>;
}

export const InteractiveChart: React.FC<InteractiveChartProps> = ({
  data,
  indicators,
  activeTool,
  onPointClick,
  selectedPoint,
  historicalHits,
  chartType,
  drawings,
  setDrawings,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mainCanvasRef = useRef<HTMLCanvasElement>(null);

  // Visible Window State for Panning & Zooming
  const [visibleCount, setVisibleCount] = useState<number>(60);
  const [viewEndIndex, setViewEndIndex] = useState<number>(data.length);

  // Mouse / Pointer Interaction State
  const [hoveredCandle, setHoveredCandle] = useState<OHLCVDataPoint | null>(null);
  const [crosshair, setCrosshair] = useState<{ x: number; y: number; price: number; date: string; timeStr: string } | null>(null);
  const [isPanning, setIsPanning] = useState<boolean>(false);
  const [panStartX, setPanStartX] = useState<number>(0);
  const [panStartEndIndex, setPanStartEndIndex] = useState<number>(0);

  // Drawing State
  const [drawingStart, setDrawingStart] = useState<{ x: number; y: number; price: number; date: string } | null>(null);

  // Keep viewEndIndex bounded when data changes
  useEffect(() => {
    setViewEndIndex(data.length);
  }, [data.length]);

  // Layout geometry dimensions
  const paddingRight = 70; // Price Y-axis width
  const paddingBottom = 25; // Date X-axis height
  const rsiHeight = indicators.rsi14 ? 90 : 0;
  const macdHeight = indicators.macd ? 90 : 0;
  const volumeHeight = indicators.volume ? 70 : 0;

  // Format Volume string (e.g. 1.24M, 450K)
  const formatVolume = (vol: number): string => {
    if (vol >= 1_000_000) return `${(vol / 1_000_000).toFixed(2)}M`;
    if (vol >= 1_000) return `${(vol / 1_000).toFixed(1)}K`;
    return vol.toString();
  };

  // Format Timestamp for live HUD (Intraday hh:mm AM/PM IST or Daily Date)
  const formatCandleTime = (item: OHLCVDataPoint): { dateStr: string; timeStr: string } => {
    if (!item) return { dateStr: '', timeStr: '' };
    try {
      const dt = new Date(item.timestamp || item.date);
      if (!isNaN(dt.getTime()) && item.timestamp.includes('T')) {
        const timeStr = dt.toLocaleTimeString('en-IN', {
          timeZone: 'Asia/Kolkata',
          hour: '2-digit',
          minute: '2-digit',
          hour12: true,
        });
        const dateStr = dt.toLocaleDateString('en-IN', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        });
        return { dateStr, timeStr: `${timeStr} IST` };
      }
    } catch (e) {
      // fallback
    }
    return { dateStr: item.date, timeStr: 'Daily' };
  };

  // Calculate slice of data currently in visible window
  const startIndex = Math.max(0, Math.min(viewEndIndex - visibleCount, data.length - 1));
  const endIndex = Math.max(1, Math.min(viewEndIndex, data.length));
  const visibleData = data.slice(startIndex, endIndex);

  // Render Canvas
  useEffect(() => {
    const canvas = mainCanvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container || visibleData.length === 0) return;

    const width = container.clientWidth;
    const height = container.clientHeight;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, width, height);

    const mainHeight = height - paddingBottom - rsiHeight - macdHeight - volumeHeight;
    const chartWidth = width - paddingRight;

    // Price range min/max
    let minPrice = Math.min(...visibleData.map((d) => d.low));
    let maxPrice = Math.max(...visibleData.map((d) => d.high));

    if (indicators.bollinger) {
      const u = visibleData.map((d) => d.bb_upper).filter(Boolean) as number[];
      const l = visibleData.map((d) => d.bb_lower).filter(Boolean) as number[];
      if (u.length) maxPrice = Math.max(maxPrice, ...u);
      if (l.length) minPrice = Math.min(minPrice, ...l);
    }

    const priceMargin = (maxPrice - minPrice) * 0.06 || 10;
    minPrice -= priceMargin;
    maxPrice += priceMargin;
    const priceRange = maxPrice - minPrice;

    const numCandles = visibleData.length;
    const candleGap = chartWidth / numCandles;
    const candleWidth = Math.max(2, candleGap * 0.72);

    const getX = (i: number) => i * candleGap + candleGap / 2;
    const getY = (price: number) => mainHeight - ((price - minPrice) / priceRange) * mainHeight;

    // Grid lines
    ctx.strokeStyle = '#1F2937';
    ctx.lineWidth = 1;
    ctx.fillStyle = '#9CA3AF';
    ctx.font = '10px monospace';

    const priceSteps = 5;
    for (let i = 0; i <= priceSteps; i++) {
      const p = minPrice + (priceRange / priceSteps) * i;
      const y = getY(p);
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(chartWidth, y);
      ctx.stroke();
      ctx.fillText(`₹${p.toFixed(1)}`, chartWidth + 6, y + 3);
    }

    // Date X-Axis Grid
    const dateStep = Math.max(1, Math.floor(numCandles / 6));
    for (let i = 0; i < numCandles; i += dateStep) {
      const x = getX(i);
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, mainHeight);
      ctx.stroke();

      const dStr = visibleData[i].date.substring(5);
      ctx.fillText(dStr, x - 12, height - 8);
    }

    // Render Candles or Line
    visibleData.forEach((d, i) => {
      const x = getX(i);
      const openY = getY(d.open);
      const closeY = getY(d.close);
      const highY = getY(d.high);
      const lowY = getY(d.low);

      const isUp = d.close >= d.open;
      const color = isUp ? '#10B981' : '#EF4444';

      if (chartType === 'candlestick') {
        ctx.strokeStyle = color;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(x, highY);
        ctx.lineTo(x, lowY);
        ctx.stroke();

        const bodyY = Math.min(openY, closeY);
        const bodyH = Math.max(2, Math.abs(closeY - openY));
        ctx.fillStyle = color;
        ctx.fillRect(x - candleWidth / 2, bodyY, candleWidth, bodyH);
      } else {
        if (i === 0) {
          ctx.beginPath();
          ctx.moveTo(x, closeY);
        } else {
          ctx.lineTo(x, closeY);
        }
      }
    });

    if (chartType === 'line') {
      ctx.strokeStyle = '#3B82F6';
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    // Render Technical Indicator Lines
    const drawLineIndicator = (key: keyof OHLCVDataPoint, strokeColor: string, width = 1.5) => {
      ctx.beginPath();
      let started = false;
      visibleData.forEach((d, i) => {
        const val = d[key] as number;
        if (val !== undefined && val !== null) {
          const x = getX(i);
          const y = getY(val);
          if (!started) {
            ctx.moveTo(x, y);
            started = true;
          } else {
            ctx.lineTo(x, y);
          }
        }
      });
      if (started) {
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = width;
        ctx.stroke();
      }
    };

    if (indicators.sma20) drawLineIndicator('sma_20', '#F59E0B');
    if (indicators.sma50) drawLineIndicator('sma_50', '#3B82F6');
    if (indicators.ema20) drawLineIndicator('ema_20', '#C084FC');
    if (indicators.ema50) drawLineIndicator('ema_50', '#F472B6');

    if (indicators.bollinger) {
      drawLineIndicator('bb_upper', '#818CF8', 1);
      drawLineIndicator('bb_middle', '#6366F1', 1);
      drawLineIndicator('bb_lower', '#818CF8', 1);
    }

    // Render Volume Panel
    if (indicators.volume) {
      const volYStart = mainHeight;
      const maxVol = Math.max(...visibleData.map((d) => d.volume)) || 1;
      visibleData.forEach((d, i) => {
        const x = getX(i);
        const vH = (d.volume / maxVol) * (volumeHeight - 10);
        ctx.fillStyle = d.close >= d.open ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)';
        ctx.fillRect(x - candleWidth / 2, volYStart + volumeHeight - vH, candleWidth, vH);
      });
    }

    // Render RSI Panel
    if (indicators.rsi14) {
      const rsiYStart = mainHeight + volumeHeight;
      ctx.fillStyle = '#151A23';
      ctx.fillRect(0, rsiYStart, chartWidth, rsiHeight);

      ctx.strokeStyle = '#374151';
      ctx.lineWidth = 1;
      const y70 = rsiYStart + rsiHeight * 0.3;
      const y30 = rsiYStart + rsiHeight * 0.7;

      ctx.beginPath();
      ctx.moveTo(0, y70);
      ctx.lineTo(chartWidth, y70);
      ctx.moveTo(0, y30);
      ctx.lineTo(chartWidth, y30);
      ctx.stroke();

      ctx.fillStyle = '#9CA3AF';
      ctx.fillText('RSI 70', chartWidth + 6, y70 + 3);
      ctx.fillText('RSI 30', chartWidth + 6, y30 + 3);

      ctx.beginPath();
      let startedRSI = false;
      visibleData.forEach((d, i) => {
        if (d.rsi_14 !== undefined) {
          const x = getX(i);
          const ry = rsiYStart + rsiHeight - (d.rsi_14 / 100) * rsiHeight;
          if (!startedRSI) {
            ctx.moveTo(x, ry);
            startedRSI = true;
          } else {
            ctx.lineTo(x, ry);
          }
        }
      });
      if (startedRSI) {
        ctx.strokeStyle = '#06B6D4';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }
    }

    // Render User Drawings
    drawings.forEach((line) => {
      ctx.strokeStyle = line.color || '#3B82F6';
      ctx.lineWidth = 2;
      ctx.beginPath();
      if (line.type === 'horizontal' && line.priceStart !== undefined) {
        const y = getY(line.priceStart);
        ctx.moveTo(0, y);
        ctx.lineTo(chartWidth, y);
      } else if (line.type === 'vertical' && line.startX !== undefined) {
        ctx.moveTo(line.startX, 0);
        ctx.lineTo(line.startX, mainHeight);
      } else if (line.type === 'trendline' && line.startX !== undefined && line.endX !== undefined) {
        ctx.moveTo(line.startX, line.startY);
        ctx.lineTo(line.endX, line.endY || line.startY);
      }
      ctx.stroke();
    });

    // Render Historical Price-Hit Markers
    historicalHits.forEach((hit) => {
      const idx = visibleData.findIndex((d) => d.date === hit.date);
      if (idx !== -1) {
        const x = getX(idx);
        const y = getY(hit.price_at_hit);

        const isUp = hit.direction === 'UP';
        const markerColor = isUp ? '#10B981' : hit.direction === 'DOWN' ? '#EF4444' : '#F59E0B';

        ctx.beginPath();
        ctx.arc(x, y, 7, 0, 2 * Math.PI);
        ctx.fillStyle = markerColor;
        ctx.fill();
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        ctx.fillStyle = '#0B0E14';
        ctx.fillRect(x - 14, y - 22, 28, 14);
        ctx.strokeStyle = markerColor;
        ctx.strokeRect(x - 14, y - 22, 28, 14);

        ctx.fillStyle = markerColor;
        ctx.font = 'bold 9px monospace';
        ctx.fillText(isUp ? '▲UP' : hit.direction === 'DOWN' ? '▼DN' : '●MID', x - 11, y - 12);
      }
    });

    // Highlight Selected Clicked Candle
    if (selectedPoint) {
      const selIdx = visibleData.findIndex((d) => d.date === selectedPoint.date);
      if (selIdx !== -1) {
        const x = getX(selIdx);
        const y = getY(selectedPoint.price);

        ctx.beginPath();
        ctx.arc(x, y, 9, 0, 2 * Math.PI);
        ctx.strokeStyle = '#3B82F6';
        ctx.lineWidth = 2.5;
        ctx.stroke();
        ctx.fillStyle = 'rgba(59, 130, 246, 0.4)';
        ctx.fill();

        ctx.setLineDash([4, 4]);
        ctx.strokeStyle = '#3B82F6';
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(chartWidth, y);
        ctx.stroke();
        ctx.setLineDash([]);
      }
    }

    // Render Live Crosshair
    if (crosshair) {
      ctx.setLineDash([2, 2]);
      ctx.strokeStyle = '#9CA3AF';
      ctx.lineWidth = 1;

      // Vertical cursor line
      ctx.beginPath();
      ctx.moveTo(crosshair.x, 0);
      ctx.lineTo(crosshair.x, height - paddingBottom);
      ctx.stroke();

      // Horizontal price line
      if (crosshair.y <= mainHeight) {
        ctx.beginPath();
        ctx.moveTo(0, crosshair.y);
        ctx.lineTo(chartWidth, crosshair.y);
        ctx.stroke();

        ctx.setLineDash([]);
        ctx.fillStyle = '#3B82F6';
        ctx.fillRect(chartWidth + 2, crosshair.y - 10, paddingRight - 4, 20);
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 10px monospace';
        ctx.fillText(`₹${crosshair.price.toFixed(1)}`, chartWidth + 6, crosshair.y + 3);
      }
      ctx.setLineDash([]);
    }
  }, [visibleData, indicators, activeTool, selectedPoint, historicalHits, chartType, drawings, crosshair]);

  // Handle Wheel Zooming & Horizontal Panning (Preventing Webpage Scroll!)
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      e.stopPropagation();

      if (e.ctrlKey || Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
        // Vertical wheel / Pinch Zoom
        const zoomDelta = e.deltaY > 0 ? 5 : -5;
        setVisibleCount((prev) => Math.max(15, Math.min(200, prev + zoomDelta)));
      } else {
        // Horizontal wheel / Pan
        const panShift = e.deltaX > 0 ? 2 : -2;
        setViewEndIndex((prev) => Math.max(visibleCount, Math.min(data.length, prev + panShift)));
      }
    };

    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => container.removeEventListener('wheel', handleWheel);
  }, [data.length, visibleCount]);

  // Pointer Down (Pan Drag start)
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (activeTool === 'select') {
      setIsPanning(true);
      setPanStartX(e.clientX);
      setPanStartEndIndex(viewEndIndex);
    }
  };

  // Pointer Move (Mouse move / Panning / Crosshair updates)
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const container = containerRef.current;
    if (!container || visibleData.length === 0) return;

    const rect = container.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const width = container.clientWidth;
    const height = container.clientHeight;
    const chartWidth = width - paddingRight;
    const mainHeight = height - paddingBottom - rsiHeight - macdHeight - volumeHeight;

    if (isPanning) {
      const dx = e.clientX - panStartX;
      const candleGap = chartWidth / visibleCount;
      const candlesShift = Math.round(-dx / candleGap);
      const newEnd = Math.max(visibleCount, Math.min(data.length, panStartEndIndex + candlesShift));
      setViewEndIndex(newEnd);
      return;
    }

    if (x < 0 || x > chartWidth) {
      setCrosshair(null);
      setHoveredCandle(null);
      return;
    }

    let minPrice = Math.min(...visibleData.map((d) => d.low));
    let maxPrice = Math.max(...visibleData.map((d) => d.high));
    const priceMargin = (maxPrice - minPrice) * 0.06 || 10;
    minPrice -= priceMargin;
    maxPrice += priceMargin;

    const price = maxPrice - (y / mainHeight) * (maxPrice - minPrice);
    const candleIndex = Math.min(
      visibleData.length - 1,
      Math.max(0, Math.floor((x / chartWidth) * visibleData.length))
    );

    const candle = visibleData[candleIndex];
    setHoveredCandle(candle);

    const { dateStr, timeStr } = formatCandleTime(candle);
    setCrosshair({
      x,
      y,
      price: Math.max(0, price),
      date: dateStr,
      timeStr,
    });
  };

  const handleMouseUp = () => {
    setIsPanning(false);
  };

  const handleMouseLeave = () => {
    setIsPanning(false);
    setCrosshair(null);
    setHoveredCandle(null);
  };

  // Canvas Click (Trigger AI Historical Point Analysis)
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!crosshair || !hoveredCandle) return;

    if (activeTool === 'select') {
      onPointClick(hoveredCandle.date, crosshair.price, hoveredCandle);
    } else if (activeTool === 'horizontal') {
      const newLine: DrawingLine = {
        id: `line-${Date.now()}`,
        type: 'horizontal',
        startX: 0,
        startY: crosshair.y,
        priceStart: crosshair.price,
        color: '#F59E0B',
      };
      setDrawings((prev) => [...prev, newLine]);
    } else if (activeTool === 'vertical') {
      const newLine: DrawingLine = {
        id: `line-${Date.now()}`,
        type: 'vertical',
        startX: crosshair.x,
        startY: 0,
        dateStart: crosshair.date,
        color: '#8B5CF6',
      };
      setDrawings((prev) => [...prev, newLine]);
    } else if (activeTool === 'trendline') {
      if (!drawingStart) {
        setDrawingStart({ x: crosshair.x, y: crosshair.y, price: crosshair.price, date: crosshair.date });
      } else {
        const newLine: DrawingLine = {
          id: `line-${Date.now()}`,
          type: 'trendline',
          startX: drawingStart.x,
          startY: drawingStart.y,
          endX: crosshair.x,
          endY: crosshair.y,
          color: '#3B82F6',
        };
        setDrawings((prev) => [...prev, newLine]);
        setDrawingStart(null);
      }
    }
  };

  const candleTimeInfo = hoveredCandle ? formatCandleTime(hoveredCandle) : null;

  return (
    <div
      className="relative w-full h-[520px] bg-[#0B0E14] select-none flex flex-col touch-none overflow-hidden"
      ref={containerRef}
    >
      {/* Top HUD Tooltip Bar — LIVE Crosshair Info (Requirement 4) */}
      <div className="h-10 bg-[#151A23]/95 border-b border-[#2A3447] px-4 flex items-center justify-between text-[11px] font-mono z-10">
        {hoveredCandle && candleTimeInfo ? (
          <div className="flex items-center space-x-4 flex-wrap">
            <span className="text-gray-400">
              Date: <strong className="text-white font-bold">{candleTimeInfo.dateStr}</strong>
            </span>
            <span className="text-gray-400">
              Time: <strong className="text-blue-400 font-bold">{candleTimeInfo.timeStr}</strong>
            </span>
            <span className="text-gray-400">
              Open: <strong className="text-white">₹{hoveredCandle.open.toFixed(2)}</strong>
            </span>
            <span className="text-gray-400">
              High: <strong className="text-emerald-400">₹{hoveredCandle.high.toFixed(2)}</strong>
            </span>
            <span className="text-gray-400">
              Low: <strong className="text-red-400">₹{hoveredCandle.low.toFixed(2)}</strong>
            </span>
            <span className="text-gray-400">
              Close: <strong className="text-blue-400">₹{hoveredCandle.close.toFixed(2)}</strong>
            </span>
            <span className="text-gray-400">
              Vol: <strong className="text-gray-200">{formatVolume(hoveredCandle.volume)}</strong>
            </span>
          </div>
        ) : (
          <span className="text-gray-500 italic">
            Drag/scroll left for older history • Hover for live crosshair • Click candle for AI analysis
          </span>
        )}

        {drawingStart && (
          <span className="text-amber-400 font-bold bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30 animate-pulse">
            Click 2nd point for Trend Line
          </span>
        )}
      </div>

      {/* Main Interactive Canvas */}
      <div className="flex-1 relative overflow-hidden">
        <canvas
          ref={mainCanvasRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseLeave}
          onClick={handleCanvasClick}
          className="w-full h-full cursor-crosshair block"
        />
      </div>
    </div>
  );
};
