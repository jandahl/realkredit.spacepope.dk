import React, { useState, useMemo } from 'react';
import type { LoanAmortizationResult } from '../calculator/types';
import { formatKr } from '../utils/formatters';
import { computeBreakevenSeries } from '../utils/breakeven';
import { Info, Lightbulb } from 'lucide-react';

interface BreakevenChartProps {
  existingSchedule: LoanAmortizationResult;
  newSchedule: LoanAmortizationResult;
  maxYears: number;
  /** Friværdi udbetalt — credited as constant formue in the balance. */
  frivaerdiUdbetalt?: number;
  onOpenDumbIdeas?: () => void;
}

export const BreakevenChart: React.FC<BreakevenChartProps> = ({
  existingSchedule,
  newSchedule,
  maxYears,
  frivaerdiUdbetalt = 0,
  onOpenDumbIdeas,
}) => {
  const [hoveredQuarter, setHoveredQuarter] = useState<number | null>(null);

  const { dataPoints, breakevenCrossing } = useMemo(
    () =>
      computeBreakevenSeries(
        existingSchedule,
        newSchedule,
        maxYears,
        frivaerdiUdbetalt,
      ),
    [existingSchedule, newSchedule, maxYears, frivaerdiUdbetalt],
  );

  // Horizon matches computeBreakevenSeries (max of schedules + maxYears·4)
  const totalQuarters = Math.max(0, dataPoints.length - 1);
  const axisYears = totalQuarters > 0 ? totalQuarters / 4 : maxYears;

  const hasValidSeries =
    dataPoints.length > 1 &&
    totalQuarters > 0 &&
    Number.isFinite(maxYears) &&
    maxYears > 0;

  const width = 800;
  const height = 300;
  const padding = { top: 20, right: 30, bottom: 40, left: 80 };

  const plotWidth = width - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;

  const { minY, maxY } = useMemo(() => {
    let min = 0;
    let max = 0;
    for (const p of dataPoints) {
      if (p.balance < min) min = p.balance;
      if (p.balance > max) max = p.balance;
    }
    const absMax = Math.max(Math.abs(min), Math.abs(max), 50_000);
    return {
      minY: min < 0 ? -absMax * 1.15 : -50_000,
      maxY: max > 0 ? absMax * 1.15 : 50_000,
    };
  }, [dataPoints]);

  const getYPos = (val: number) => {
    return padding.top + plotHeight - ((val - minY) / (maxY - minY)) * plotHeight;
  };

  const getXPos = (quarter: number) => {
    if (totalQuarters <= 0) return padding.left;
    return padding.left + (quarter / totalQuarters) * plotWidth;
  };

  const zeroY = getYPos(0);

  const polylinePoints = hasValidSeries
    ? dataPoints.map((p) => `${getXPos(p.quarter)},${getYPos(p.balance)}`).join(' ')
    : '';

  let areaPath = '';
  if (hasValidSeries && dataPoints.length > 0) {
    const coords = dataPoints
      .map((p) => `${getXPos(p.quarter)} ${getYPos(p.balance)}`)
      .join(' L ');
    areaPath = `M ${getXPos(0)} ${zeroY} L ${coords} L ${getXPos(totalQuarters)} ${zeroY} Z`;
  }

  const xTicks = useMemo(() => {
    if (!hasValidSeries || axisYears <= 0) return [];
    const ticks: { year: number; x: number }[] = [];
    const step = axisYears <= 10 ? 2 : 5;
    for (let y = 0; y <= axisYears + 1e-9; y += step) {
      ticks.push({
        year: Math.round(y * 10) / 10,
        x: padding.left + (y / axisYears) * plotWidth,
      });
    }
    return ticks;
  }, [axisYears, plotWidth, padding.left, hasValidSeries]);

  const yTicks = useMemo(() => {
    if (!hasValidSeries) return [];
    const step = (maxY - minY) / 4;
    return Array.from({ length: 5 }, (_, i) => {
      const val = minY + step * i;
      return {
        val,
        y: padding.top + plotHeight - ((val - minY) / (maxY - minY)) * plotHeight,
        label:
          Math.abs(val) >= 1_000_000
            ? `${(val / 1_000_000).toFixed(1).replace('.', ',')} mio.`
            : `${Math.round(val / 1_000)} t.`,
      };
    });
  }, [minY, maxY, hasValidSeries, plotHeight, padding.top]);

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!hasValidSeries) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const relativeX = (e.clientX - rect.left) / rect.width;
    const svgX = relativeX * width;
    const plotX = svgX - padding.left;

    if (plotX >= 0 && plotX <= plotWidth) {
      const q = Math.round((plotX / plotWidth) * totalQuarters);
      setHoveredQuarter(Math.max(0, Math.min(totalQuarters, q)));
    } else {
      setHoveredQuarter(null);
    }
  };

  const activePoint =
    hoveredQuarter !== null ? dataPoints[hoveredQuarter] || null : null;

  // Explicit fills — Tailwind fill-* on SVG <text> is flaky in dark mode
  const tickFill = '#94a3b8';
  const labelFill = '#f43f5e';

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900 transition-colors">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Breakeven</h3>
            {hasValidSeries && breakevenCrossing !== null ? (
              <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400">
                Breakeven efter {Math.floor(breakevenCrossing / 4)} år og{' '}
                {Math.round((breakevenCrossing % 4) * 3)} mdr.
              </span>
            ) : hasValidSeries && dataPoints[0]?.balance < 0 ? (
              <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400">
                Nyt lån er fordelagtigt i hele løbetiden
              </span>
            ) : hasValidSeries ? (
              <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-800 dark:bg-amber-950/60 dark:text-amber-400">
                Nuværende lån har lavere samlede omkostninger
              </span>
            ) : null}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Formuejusteret balance: Σ(Δydelse) + (R_nyt − R_gammel)
            {frivaerdiUdbetalt > 0 ? ` − udbetaling (${formatKr(frivaerdiUdbetalt)})` : ''}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-4 text-xs font-medium">
          <div className="flex items-center gap-1.5">
            <span className="h-0.5 w-4 bg-slate-400 border-dashed border-t border-slate-400" />
            <span className="text-slate-500 dark:text-slate-400">0 kr. (Skæringslinje)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-full bg-blue-600 dark:bg-blue-500" />
            <span className="text-slate-700 dark:text-slate-300">Breakeven balance</span>
          </div>

          {onOpenDumbIdeas && (
            <button
              type="button"
              onClick={onOpenDumbIdeas}
              className="inline-flex items-center gap-1.5 rounded-lg border border-amber-300 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-800 hover:bg-amber-100 dark:border-amber-800/80 dark:bg-amber-950/40 dark:text-amber-300 dark:hover:bg-amber-900/50 transition-colors shadow-xs cursor-pointer"
            >
              <Lightbulb className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
              <span>DUMB IDEAS (Reality Check)</span>
            </button>
          )}
        </div>
      </div>

      {!hasValidSeries ? (
        <div className="flex h-[200px] flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-slate-200 bg-slate-50 px-4 text-center text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-800/40 dark:text-slate-400">
          <span className="font-medium text-slate-600 dark:text-slate-300">
            Ingen gyldig breakeven-serie
          </span>
          <span className="text-xs max-w-md">
            Mangler amortiseringsdata, eller begge lån har ugyldig hovedstol / løbetid. Vælg
            eksisterende og nyt lån, og sørg for at beregningen er fuldført.
          </span>
        </div>
      ) : (
      <div className="relative w-full overflow-hidden">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto cursor-crosshair select-none text-slate-800 dark:text-slate-200"
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setHoveredQuarter(null)}
        >
          {yTicks.map((tick) => (
            <g key={tick.val}>
              <line
                x1={padding.left}
                y1={tick.y}
                x2={width - padding.right}
                y2={tick.y}
                stroke="#e2e8f0"
                className="dark:opacity-40"
                strokeDasharray="4 4"
              />
              <text
                x={padding.left - 10}
                y={tick.y + 4}
                textAnchor="end"
                fill={tickFill}
                style={{ fontSize: 11, fontFamily: 'ui-monospace, monospace' }}
              >
                {tick.label}
              </text>
            </g>
          ))}

          {xTicks.map((tick) => (
            <g key={tick.year}>
              <line
                x1={tick.x}
                y1={padding.top}
                x2={tick.x}
                y2={height - padding.bottom}
                stroke="#e2e8f0"
                className="dark:opacity-40"
                strokeDasharray="4 4"
              />
              <text
                x={tick.x}
                y={height - padding.bottom + 20}
                textAnchor="middle"
                fill={tickFill}
                style={{ fontSize: 11, fontFamily: 'ui-monospace, monospace' }}
              >
                År {tick.year}
              </text>
            </g>
          ))}

          <line
            x1={padding.left}
            y1={zeroY}
            x2={width - padding.right}
            y2={zeroY}
            stroke="#64748b"
            strokeWidth="1.5"
            strokeDasharray="5 5"
          />

          {areaPath && <path d={areaPath} fill="#3b82f6" fillOpacity="0.08" />}

          {polylinePoints && (
            <polyline
              fill="none"
              stroke="#2563eb"
              strokeWidth="2.5"
              points={polylinePoints}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {breakevenCrossing !== null && (
            <g>
              <circle
                cx={getXPos(breakevenCrossing)}
                cy={zeroY}
                r="6"
                fill="#ef4444"
                stroke="white"
                strokeWidth="2"
              />
              <text
                x={getXPos(breakevenCrossing)}
                y={zeroY - 12}
                textAnchor="middle"
                fill={labelFill}
                style={{ fontSize: 11, fontWeight: 700 }}
              >
                Breakeven
              </text>
            </g>
          )}

          {activePoint && (
            <g>
              <line
                x1={getXPos(activePoint.quarter)}
                y1={padding.top}
                x2={getXPos(activePoint.quarter)}
                y2={height - padding.bottom}
                stroke="#94a3b8"
                strokeWidth="1.5"
                strokeDasharray="3 3"
              />
              <circle
                cx={getXPos(activePoint.quarter)}
                cy={getYPos(activePoint.balance)}
                r="5"
                fill="#2563eb"
                stroke="white"
                strokeWidth="2"
              />
            </g>
          )}
        </svg>

        {activePoint && (
          <div
            className="pointer-events-none absolute top-2 rounded-xl border border-slate-200 bg-white/95 px-3 py-2 shadow-lg backdrop-blur-md dark:border-slate-700 dark:bg-slate-800/95 transition-all text-xs"
            style={{
              left: `${Math.min(75, Math.max(20, (activePoint.quarter / totalQuarters) * 100))}%`,
              transform: 'translateX(-50%)',
            }}
          >
            <div className="font-bold text-slate-800 dark:text-slate-100 border-b border-slate-100 dark:border-slate-700 pb-1 mb-1.5">
              Efter {activePoint.year.toFixed(1)} år (Termin {activePoint.quarter})
            </div>
            <div className="space-y-1 font-mono">
              <div className="flex justify-between gap-4">
                <span className="text-slate-600 dark:text-slate-400">Balance:</span>
                <span
                  className={`font-semibold ${
                    activePoint.balance <= 0
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-rose-600 dark:text-rose-400'
                  }`}
                >
                  {formatKr(activePoint.balance)}
                </span>
              </div>
              <div className="flex justify-between gap-4 text-slate-500 dark:text-slate-400">
                <span>Akk. mer-ydelse:</span>
                <span>{formatKr(activePoint.cumsumYdelse)}</span>
              </div>
              <div className="flex justify-between gap-4 text-slate-500 dark:text-slate-400">
                <span>Restgældsforskel:</span>
                <span>{formatKr(activePoint.deltaRestgaeld)}</span>
              </div>
              {frivaerdiUdbetalt > 0 && (
                <div className="flex justify-between gap-4 text-slate-500 dark:text-slate-400">
                  <span>Udbetaling (formue):</span>
                  <span>−{formatKr(frivaerdiUdbetalt)}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      )}

      <div className="mt-4 flex items-start gap-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 p-3.5 text-xs text-slate-600 dark:text-slate-400 border border-slate-100 dark:border-slate-800">
        <Info className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          <strong className="text-slate-800 dark:text-slate-200">Negativ balance</strong> betyder, at
          det nye lån (inkl. evt. friværdiudbetaling som formue) er foran — du er bedre stillet end
          med det nuværende lån alene. Positiv balance betyder det omvendte. Breakeven er hvor
          linjen krydser 0. Udbetalingen trækkes som konstant formuekredit (ikke som separat
          amortisering af restgælden).
        </p>
      </div>
    </div>
  );
};
