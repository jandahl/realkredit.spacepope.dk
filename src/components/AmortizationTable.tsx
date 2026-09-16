import React, { useState } from 'react';
import type { LoanAmortizationResult } from '../calculator/types';
import { formatKr } from '../utils/formatters';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface AmortizationTableProps {
  calculation: LoanAmortizationResult;
  title?: string;
}

export const AmortizationTable: React.FC<AmortizationTableProps> = ({
  calculation,
  title = 'Annuitetstabel',
}) => {
  const [viewMode, setViewMode] = useState<'yearly' | 'quarterly'>('yearly');
  const [isExpanded, setIsExpanded] = useState(false);

  // Group by year for the yearly overview
  const totalYears = Math.ceil(calculation.schedule.length / 4);
  const yearlyData = Array.from({ length: totalYears }, (_, yearIdx) => {
    const year = yearIdx + 1;
    const quartersInYear = calculation.schedule.filter((q) => q.year === year);
    const startRestgaeld = quartersInYear[0]?.startRestgaeld || 0;
    const endRestgaeld = quartersInYear[quartersInYear.length - 1]?.endRestgaeld || 0;
    const afdrag = quartersInYear.reduce((sum, q) => sum + q.afdrag, 0);
    const rente = quartersInYear.reduce((sum, q) => sum + q.rente, 0);
    const bidrag = quartersInYear.reduce((sum, q) => sum + q.bidrag, 0);
    const ydelseFoerSkat = quartersInYear.reduce((sum, q) => sum + q.ydelseFoerSkat, 0);
    const skatFradrag = quartersInYear.reduce((sum, q) => sum + q.skatFradrag, 0);
    const ydelseEfterSkat = quartersInYear.reduce((sum, q) => sum + q.ydelseEfterSkat, 0);

    return {
      year,
      startRestgaeld,
      afdrag,
      rente,
      bidrag,
      ydelseFoerSkat,
      skatFradrag,
      ydelseEfterSkat,
      endRestgaeld,
    };
  });

  const displayedRows = isExpanded
    ? viewMode === 'yearly'
      ? yearlyData
      : calculation.schedule
    : (viewMode === 'yearly' ? yearlyData : calculation.schedule).slice(0, 10);

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-xs overflow-hidden">
      <div className="flex flex-wrap items-center justify-between border-b border-slate-200 bg-slate-50/75 px-4 py-3 gap-2">
        <h3 className="font-semibold text-slate-800">{title}</h3>

        <div className="flex items-center gap-2">
          <div className="inline-flex rounded-lg bg-slate-200/70 p-0.5 text-xs font-medium">
            <button
              onClick={() => setViewMode('yearly')}
              className={`rounded-md px-2.5 py-1 transition-all ${
                viewMode === 'yearly'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Årsoversigt
            </button>
            <button
              onClick={() => setViewMode('quarterly')}
              className={`rounded-md px-2.5 py-1 transition-all ${
                viewMode === 'quarterly'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Terminer (kvartal)
            </button>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="border-b border-slate-200 bg-slate-100/50 text-slate-600">
            <tr>
              <th className="px-3 py-2.5 font-medium">{viewMode === 'yearly' ? 'År' : 'Termin'}</th>
              <th className="px-3 py-2.5 text-right font-medium">Restgæld primo</th>
              <th className="px-3 py-2.5 text-right font-medium">Afdrag</th>
              <th className="px-3 py-2.5 text-right font-medium">Rente</th>
              <th className="px-3 py-2.5 text-right font-medium">Bidrag</th>
              <th className="px-3 py-2.5 text-right font-medium">Ydelse før skat</th>
              <th className="px-3 py-2.5 text-right font-medium">Fradrag</th>
              <th className="px-3 py-2.5 text-right font-medium">Ydelse efter skat</th>
              <th className="px-3 py-2.5 text-right font-medium">Restgæld ultimo</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {displayedRows.map((row) => {
              const label =
                'year' in row && !('quarter' in row)
                  ? `År ${row.year}`
                  : `T ${(row as any).quarter} (År ${(row as any).year})`;

              return (
                <tr key={label} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-3 py-2 font-semibold text-slate-700">{label}</td>
                  <td className="px-3 py-2 text-right text-slate-600 font-mono">
                    {formatKr(row.startRestgaeld)}
                  </td>
                  <td className="px-3 py-2 text-right text-emerald-700 font-mono font-medium">
                    {formatKr(row.afdrag)}
                  </td>
                  <td className="px-3 py-2 text-right text-slate-600 font-mono">
                    {formatKr(row.rente)}
                  </td>
                  <td className="px-3 py-2 text-right text-slate-600 font-mono">
                    {formatKr(row.bidrag)}
                  </td>
                  <td className="px-3 py-2 text-right text-slate-900 font-mono font-medium">
                    {formatKr(row.ydelseFoerSkat)}
                  </td>
                  <td className="px-3 py-2 text-right text-blue-700 font-mono">
                    {formatKr(row.skatFradrag)}
                  </td>
                  <td className="px-3 py-2 text-right text-slate-900 font-mono font-semibold">
                    {formatKr(row.ydelseEfterSkat)}
                  </td>
                  <td className="px-3 py-2 text-right text-slate-600 font-mono">
                    {formatKr(row.endRestgaeld)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="border-t border-slate-100 bg-slate-50/50 p-2 text-center">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-800"
        >
          {isExpanded ? (
            <>
              <span>Vis færre rækker</span>
              <ChevronUp className="h-4 w-4" />
            </>
          ) : (
            <>
              <span>Vis alle {viewMode === 'yearly' ? `${totalYears} år` : `${calculation.schedule.length} terminer`}</span>
              <ChevronDown className="h-4 w-4" />
            </>
          )}
        </button>
      </div>
    </div>
  );
};
