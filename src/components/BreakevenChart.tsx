import React, { useState, useMemo } from 'react';
import type { LoanAmortizationResult } from '../calculator/types';
import { formatKr } from '../utils/formatters';
import { Info, Lightbulb } from 'lucide-react';

interface BreakevenChartProps {
  existingSchedule: LoanAmortizationResult;
  newSchedule: LoanAmortizationResult;
  maxYears: number;
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

  const totalQuarters = Math.round(maxYears * 4);

  // Compute quarter-by-quarter breakeven data:
  // deltaRestgaeld = (newRestgaeld - frivaerdiUdbetalt) - oldRestgaeld
  // deltaYdelse = newYdelseEfterSkat - oldYdelseEfterSkat
  // cumsumDeltaYdelse = sum of deltaYdelse up to quarter q
  // breakevenBalance = cumsumDeltaYdelse + deltaRestgaeld
  const { dataPoints, breakevenCrossing } = useMemo(() => {
    let cumsum = 0;
    const points: {
      quarter: number;
      year: number;
      deltaRestgaeld: number;
      cumsumYdelse: number;
      balance: number;
    }[] = [];

    const effectiveCashout = frivaerdiUdbetalt || 0;

    // Quarter 0 (instant conversion result before first payment)
    const initialDeltaRestgaeld = (newSchedule.hovedstol - effectiveCashout) - existingSchedule.hovedstol;
    points.push({
      quarter: 0,
      year: 0,
      deltaRestgaeld: initialDeltaRestgaeld,
      cumsumYdelse: 0,
      balance: initialDeltaRestgaeld,
    });

    let crossingQuarter: number | null = null;

    for (let q = 0; q < totalQuarters; q++) {
      const oldRow = existingSchedule.schedule[q] || {
        endRestgaeld: 0,
        ydelseEfterSkat: 0,
      };
      const newRow = newSchedule.schedule[q] || {
        endRestgaeld: 0,
        ydelseEfterSkat: 0,
      };

      const deltaYdelse = newRow.ydelseEfterSkat - oldRow.ydelseEfterSkat;
      cumsum += deltaYdelse;

      const deltaRest = (newRow.endRestgaeld - effectiveCashout) - oldRow.endRestgaeld;
      const balance = cumsum + deltaRest;

      const prevBal = points[points.length - 1].balance;
      if (crossingQuarter === null && points.length > 0) {
        if ((prevBal < 0 && balance >= 0) || (prevBal > 0 && balance <= 0)) {
          const fraction = Math.abs(prevBal) / Math.abs(balance - prevBal);
          crossingQuarter = q + fraction;
        }
      }

      points.push({
        quarter: q + 1,
        year: (q + 1) / 4,
        deltaRestgaeld: deltaRest,
        cumsumYdelse: cumsum,
        balance,
      });
    }

    return {
      dataPoints: points,
      breakevenCrossing: crossingQuarter,
    };
  }, [existingSchedule, newSchedule, totalQuarters, frivaerdiUdbetalt]);

  // Dimensions
  const width = 800;
  const height = 300;
  const padding = { top: 20, right: 30, bottom: 40, left: 80 };

  const plotWidth = width - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;

  // Find min and max balance for Y scale
  const { minY, maxY } = useMemo(() => {
    let min = 0;
    let max = 0;
    for (const p of dataPoints) {
      if (p.balance < min) min = p.balance;
      if (p.balance > max) max = p.balance;
    }
    // Make sure 0 is comfortably centered or visible
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
    return padding.left + (quarter / totalQuarters) * plotWidth;
  };

  const zeroY = getYPos(0);

  // SVG points for line
  const polylinePoints = dataPoints
    .map((p) => `${getXPos(p.quarter)},${getYPos(p.balance)}`)
    .join(' ');

  // Area above / below zero
  const areaPath = `M ${getXPos(0)},${zeroY} L ${polylinePoints} L ${getXPos(totalQuarters)},${zeroY} Z`;

  // X-Ticks every 5 years
  const xTicks = useMemo(() => {
    const ticks: { year: number; x: number }[] = [];
    const step = maxYears <= 10 ? 2 : 5;
    for (let y = 0; y <= maxYears; y += step) {
      ticks.push({
        year: y,
        x: padding.left + (y / maxYears) * plotWidth,
      });
    }
    return ticks;
  }, [maxYears, plotWidth, padding.left]);

  // Y-Ticks
  const yTicks = useMemo(() => {
    const step = (maxY - minY) / 4;
    return Array.from({ length: 5 }, (_, i) => {
      const val = minY + step * i;
      return {
        val,
        y: getYPos(val),
        label:
          Math.abs(val) >= 1_000_000
            ? `${(val / 1_000_000).toFixed(1).replace('.', ',')} mio.`
            : `${Math.round(val / 1_000)} t.`,
      };
    });
  }, [minY, maxY, getYPos]);

  // Mouse hover
  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
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

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900 transition-colors">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Breakeven</h3>
            {breakevenCrossing !== null ? (
              <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400">
                Breakeven efter {Math.floor(breakevenCrossing / 4)} år og{' '}
                {Math.round((breakevenCrossing % 4) * 3)} mdr.
              </span>
            ) : dataPoints[0]?.balance < 0 ? (
              <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400">
                Nyt lån er fordelagtigt i hele løbetiden
              </span>
            ) : (
              <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-800 dark:bg-amber-950/60 dark:text-amber-400">
                Nuværende lån har lavere samlede omkostninger
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Samlet økonomisk balance (restgældsforskel + akkumulerede ydelser efter skat)
          </p>
        </div>

        {/* Legend & Action */}
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

      <div className="relative w-full overflow-hidden">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto cursor-crosshair select-none"
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setHoveredQuarter(null)}
        >
          {/* Grid lines */}
          {yTicks.map((tick) => (
            <g key={tick.val}>
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

          {/* Zero Line (Key Reference) */}
          <line
            x1={padding.left}
            y1={zeroY}
            x2={width - padding.right}
            y2={zeroY}
            stroke="#64748b"
            strokeWidth="1.5"
            strokeDasharray="5 5"
          />

          {/* Area fill */}
          <path d={areaPath} fill="#3b82f6" fillOpacity="0.08" />

          {/* Breakeven line */}
          <polyline
            fill="none"
            stroke="#2563eb"
            strokeWidth="2.5"
            points={polylinePoints}
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Crossing point dot if exists */}
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
                className="fill-rose-600 dark:fill-rose-400 text-[11px] font-bold"
              >
                Breakeven
              </text>
            </g>
          )}

          {/* Hover point and vertical guide */}
          {activePoint && (
            <g>
              <line
                x1={getXPos(activePoint.quarter)}
                y1={padding.top}
                x2={getXPos(activePoint.quarter)}
                y2={height - padding.bottom}
                stroke="currentColor"
                className="text-slate-400 dark:text-slate-500"
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

        {/* Hover Tooltip */}
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
            </div>
          </div>
        )}
      </div>

      {/* Explanatory text from realkred.it */}
      <div className="mt-4 flex items-start gap-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 p-3.5 text-xs text-slate-600 dark:text-slate-400 border border-slate-100 dark:border-slate-800">
        <Info className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          <strong className="text-slate-800 dark:text-slate-200">Breakeven-punktet</strong> er det
          tidspunkt, hvor linjen krydser 0 på y-aksen. Dette er det tidspunkt, hvor de akkumulerede
          ydelser (det samlede beløb, du har betalt indtil videre) og restgælden (det beløb, du stadig
          skylder) er de samme for begge lån. Når balancen er <em>negativ</em>, er du bedre stillet
          med det nye lån; når den er <em>positiv</em>, ville du have været bedre stillet med det
          nuværende lån.
        </p>
      </div>
    </div>
  );
};
