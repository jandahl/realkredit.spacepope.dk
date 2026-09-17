import React, { useState, useMemo } from 'react';
import { formatKr } from '../utils/formatters';

export interface ChartSeries {
  id: string;
  name: string;
  color: string;
  strokeDash?: string;
  data: number[]; // Index corresponds to year (e.g. 0 to 30)
  uncertaintyUpper?: number[]; // Upper bound for variable rate uncertainty (e.g. F-kort)
  uncertaintyLower?: number[]; // Lower bound for variable rate uncertainty
}

interface LoanChartProps {
  title: string;
  subtitle?: string;
  years: number; // e.g. 30
  series: ChartSeries[];
  valueFormatter?: (val: number) => string;
}

export const LoanChart: React.FC<LoanChartProps> = ({
  title,
  subtitle,
  years,
  series,
  valueFormatter = formatKr,
}) => {
  const [hoveredYear, setHoveredYear] = useState<number | null>(null);
  const [isZoomed, setIsZoomed] = useState<boolean>(false);

  // SVG dimensions
  const width = 800;
  const height = 300;
  const padding = { top: 20, right: 30, bottom: 40, left: 75 };

  const plotWidth = width - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;

  // Find min & max value across all series to scale Y axis
  const { minValue, maxValue } = useMemo(() => {
    let max = 0;
    let minPositive = Infinity;
    for (const s of series) {
      for (const val of s.data) {
        if (val > max) max = val;
        if (val > 0 && val < minPositive) minPositive = val;
      }
    }
    const maxVal = max > 0 ? Math.ceil(max * 1.05) : 100_000;
    let minVal = 0;
    if (isZoomed && minPositive < max) {
      const floorMin = Math.floor((minPositive * 0.7) / 100_000) * 100_000;
      minVal = Math.max(0, floorMin);
    }
    return { minValue: minVal, maxValue: maxVal };
  }, [series, isZoomed]);

  const getY = (val: number) => {
    const range = maxValue - minValue || 1;
    const clamped = Math.max(minValue, Math.min(maxValue, val));
    return padding.top + plotHeight - ((clamped - minValue) / range) * plotHeight;
  };

  // Generate 5 nice Y-axis ticks
  const yTicks = useMemo(() => {
    const count = 5;
    const range = maxValue - minValue;
    return Array.from({ length: count + 1 }, (_, i) => {
      const val = minValue + (range / count) * i;
      const y = padding.top + plotHeight - ((val - minValue) / (range || 1)) * plotHeight;
      return {
        value: val,
        y,
        label:
          val >= 1_000_000
            ? `${(val / 1_000_000).toFixed(2).replace('.', ',')} mio.`
            : `${Math.round(val / 1_000)} t.`,
      };
    });
  }, [minValue, maxValue, plotHeight, padding.top]);

  // Generate X-axis ticks every 5 years
  const xTicks = useMemo(() => {
    const ticks: { year: number; x: number }[] = [];
    const step = years <= 10 ? 2 : 5;
    for (let y = 0; y <= years; y += step) {
      ticks.push({
        year: y,
        x: padding.left + (y / years) * plotWidth,
      });
    }
    return ticks;
  }, [years, plotWidth, padding.left]);

  // Calculate SVG polyline points and uncertainty bands for each series
  const seriesPaths = useMemo(() => {
    return series.map((s) => {
      const points = s.data.map((val, year) => {
        const x = padding.left + (year / years) * plotWidth;
        const y = getY(val);
        return `${x},${y}`;
      });

      // Also area path closing to bottom
      const firstX = padding.left;
      const lastX = padding.left + plotWidth;
      const bottomY = padding.top + plotHeight;
      const areaPath = `M ${points.join(' L ')} L ${lastX},${bottomY} L ${firstX},${bottomY} Z`;

      let uncertaintyPath: string | null = null;
      if (s.uncertaintyUpper && s.uncertaintyLower) {
        const upperPts = s.uncertaintyUpper.map((val, year) => {
          const x = padding.left + (year / years) * plotWidth;
          const y = getY(val);
          return `${x},${y}`;
        });

        const lowerPts = s.uncertaintyLower.map((val, year) => {
          const x = padding.left + (year / years) * plotWidth;
          const y = getY(val);
          return `${x},${y}`;
        }).reverse();

        uncertaintyPath = `M ${upperPts.join(' L ')} L ${lowerPts.join(' L ')} Z`;
      }

      return {
        ...s,
        points: points.join(' '),
        areaPath,
        uncertaintyPath,
      };
    });
  }, [series, years, plotWidth, plotHeight, padding.left, padding.top, minValue, maxValue]);

  // Handle mouse move for interactive tooltip vertical line
  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;

    // Convert SVG mouseX to year
    const relativeX = mouseX - (padding.left / width) * rect.width;
    const chartWidth = ((width - padding.left - padding.right) / width) * rect.width;

    if (relativeX < 0 || relativeX > chartWidth) {
      setHoveredYear(null);
      return;
    }

    const yearFraction = relativeX / chartWidth;
    const year = Math.round(yearFraction * years);
    setHoveredYear(Math.max(0, Math.min(years, year)));
  };

  const handleMouseLeave = () => {
    setHoveredYear(null);
  };

  const activeHoverData = hoveredYear !== null ? {
    year: hoveredYear,
    x: padding.left + (hoveredYear / years) * plotWidth,
    values: series.map((s) => ({
      name: s.name,
      color: s.color,
      value: s.data[hoveredYear] ?? 0,
    })),
  } : null;

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900 transition-colors">
      <div className="flex flex-col gap-2.5 mb-3 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm sm:text-base">{title}</h3>
          {subtitle && <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{subtitle}</p>}
        </div>

        {/* Legend & Zoom Button — wrap/stack on narrow widths */}
        <div className="flex flex-col gap-2 text-xs font-medium sm:items-end">
          <button
            type="button"
            onClick={() => setIsZoomed(!isZoomed)}
            className={`self-start sm:self-end px-2 py-1 text-xs font-semibold rounded-md border transition-all cursor-pointer ${
              isZoomed
                ? 'border-blue-600 bg-blue-50 text-blue-700 dark:border-blue-500 dark:bg-blue-950/40 dark:text-blue-300'
                : 'border-slate-300 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'
            }`}
          >
            {isZoomed ? '🔍 Zoomet (Nulstil)' : '🔍 Zoom Y-akse'}
          </button>

          <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
            {series.map((s) => (
              <div key={s.id} className="flex items-center gap-1.5 max-w-full">
                <span
                  className="h-2.5 w-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: s.color }}
                />
                <span className="text-slate-700 dark:text-slate-300 truncate">{s.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="relative w-full overflow-hidden">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto cursor-crosshair select-none"
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >
          {/* Horizontal Grid lines */}
          {yTicks.map((tick) => (
            <g key={tick.value}>
              <line
                x1={padding.left}
                y1={tick.y}
                x2={width - padding.right}
                y2={tick.y}
                stroke="currentColor"
                className="text-slate-100 dark:text-slate-800"
                strokeDasharray="4 4"
              />
              <text
                x={padding.left - 10}
                y={tick.y + 4}
                textAnchor="end"
                className="fill-slate-400 dark:fill-slate-500 text-[11px] font-mono"
              >
                {tick.label}
              </text>
            </g>
          ))}

          {/* X Axis ticks */}
          {xTicks.map((tick) => (
            <g key={tick.year}>
              <line
                x1={tick.x}
                y1={padding.top}
                x2={tick.x}
                y2={height - padding.bottom}
                stroke="currentColor"
                className="text-slate-100 dark:text-slate-800"
                strokeDasharray="4 4"
              />
              <text
                x={tick.x}
                y={height - padding.bottom + 20}
                textAnchor="middle"
                className="fill-slate-400 dark:fill-slate-500 text-[11px] font-mono"
              >
                År {tick.year}
              </text>
            </g>
          ))}

          {/* Bottom baseline */}
          <line
            x1={padding.left}
            y1={height - padding.bottom}
            x2={width - padding.right}
            y2={height - padding.bottom}
            stroke="currentColor"
            className="text-slate-300 dark:text-slate-700"
            strokeWidth="1.5"
          />

          {/* Series Areas and Lines */}
          {seriesPaths.map((s) => (
            <g key={s.id}>
              {s.uncertaintyPath && (
                <path
                  d={s.uncertaintyPath}
                  fill={s.color}
                  fillOpacity="0.18"
                  stroke={s.color}
                  strokeWidth="1"
                  strokeDasharray="2 2"
                  className="transition-opacity"
                />
              )}
              <path
                d={s.areaPath}
                fill={s.color}
                fillOpacity="0.08"
                className="transition-opacity"
              />
              <polyline
                fill="none"
                stroke={s.color}
                strokeWidth="2.5"
                strokeDasharray={s.strokeDash}
                points={s.points}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </g>
          ))}

          {/* Hover indicator line and points */}
          {activeHoverData && (
            <g>
              <line
                x1={activeHoverData.x}
                y1={padding.top}
                x2={activeHoverData.x}
                y2={height - padding.bottom}
                stroke="currentColor"
                className="text-slate-400 dark:text-slate-500"
                strokeWidth="1.5"
                strokeDasharray="3 3"
              />
              {series.map((s) => {
                const val = s.data[activeHoverData.year] ?? 0;
                const pointY =
                  padding.top + plotHeight - (Math.max(0, val) / maxValue) * plotHeight;
                return (
                  <circle
                    key={s.id}
                    cx={activeHoverData.x}
                    cy={pointY}
                    r="5"
                    fill={s.color}
                    stroke="white"
                    strokeWidth="2"
                    className="shadow-sm"
                  />
                );
              })}
            </g>
          )}
        </svg>

        {/* Hover Tooltip Overlay - Anchored in bottom-left of graph area */}
        {activeHoverData && (
          <div className="pointer-events-none absolute bottom-12 left-20 sm:left-24 rounded-xl border border-slate-200 bg-white/95 px-3 py-2 shadow-lg backdrop-blur-md dark:border-slate-700 dark:bg-slate-800/95 transition-all text-xs z-10">
            <div className="font-bold text-slate-800 dark:text-slate-100 border-b border-slate-100 dark:border-slate-700 pb-1 mb-1.5">
              Efter {activeHoverData.year} år
            </div>
            <div className="space-y-1 font-mono">
              {activeHoverData.values.map((v) => (
                <div key={v.name} className="flex items-center justify-between gap-3">
                  <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: v.color }} />
                    {v.name}:
                  </span>
                  <span className="font-semibold text-slate-900 dark:text-slate-100">
                    {valueFormatter(v.value)}
                  </span>
                </div>
              ))}
              {activeHoverData.values.length === 2 && (
                <div className="border-t border-slate-100 dark:border-slate-700 pt-1 mt-1 flex justify-between gap-3 text-slate-500 dark:text-slate-400">
                  <span>Forskel:</span>
                  <span className="font-semibold text-slate-900 dark:text-slate-100">
                    {valueFormatter(Math.abs(activeHoverData.values[0].value - activeHoverData.values[1].value))}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
