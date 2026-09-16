import React, { useMemo } from 'react';
import type { BondLoan } from '../calculator/types';
import { parseBondLoan } from '../utils/loanParser';
import { formatKurs } from '../utils/formatters';
import { ExternalLink } from 'lucide-react';

interface DependentLoanSelectProps {
  label: string;
  loans: BondLoan[];
  selectedLoan: BondLoan | null;
  onSelectLoan: (loan: BondLoan) => void;
  subtext?: string;
}

export const DependentLoanSelect: React.FC<DependentLoanSelectProps> = ({
  label,
  loans,
  selectedLoan,
  onSelectLoan,
  subtext,
}) => {
  // Parse all loans
  const parsedLoans = useMemo(() => {
    return loans.map((loan) => ({
      loan,
      parsed: parseBondLoan(loan),
    }));
  }, [loans]);

  // Current parsed selection
  const currentParsed = useMemo(() => {
    if (!selectedLoan) return parsedLoans[0]?.parsed;
    return parseBondLoan(selectedLoan);
  }, [selectedLoan, parsedLoans]);

  // 1. Available Rente options (unique)
  const renteOptions = useMemo(() => {
    const map = new Map<string, string>();
    for (const item of parsedLoans) {
      if (!map.has(item.parsed.renteKey)) {
        map.set(item.parsed.renteKey, item.parsed.renteDisplay);
      }
    }
    // Sort rentes numerically, flex at end or start
    return Array.from(map.entries()).sort((a, b) => {
      if (a[0] === 'flex') return 1;
      if (b[0] === 'flex') return -1;
      return parseFloat(a[0]) - parseFloat(b[0]);
    });
  }, [parsedLoans]);

  const activeRenteKey = currentParsed?.renteKey || renteOptions[0]?.[0];

  // 2. Available Year options for the active rente
  const yearOptions = useMemo(() => {
    const map = new Map<string, string>();
    for (const item of parsedLoans) {
      if (item.parsed.renteKey === activeRenteKey) {
        if (!map.has(item.parsed.yearKey)) {
          map.set(item.parsed.yearKey, item.parsed.yearDisplay);
        }
      }
    }
    return Array.from(map.entries()).sort((a, b) => parseInt(a[0], 10) - parseInt(b[0], 10));
  }, [parsedLoans, activeRenteKey]);

  const activeYearKey =
    yearOptions.some(([k]) => k === currentParsed?.yearKey)
      ? currentParsed?.yearKey
      : yearOptions[yearOptions.length - 1]?.[0] || '';

  // 3. Available Afdragsfrihed options for the active rente + year
  const afdragOptions = useMemo(() => {
    const map = new Map<string, string>();
    for (const item of parsedLoans) {
      if (
        item.parsed.renteKey === activeRenteKey &&
        (item.parsed.yearKey === activeYearKey || yearOptions.length <= 1)
      ) {
        if (!map.has(item.parsed.afdragKey)) {
          map.set(item.parsed.afdragKey, item.parsed.afdragDisplay);
        }
      }
    }
    return Array.from(map.entries());
  }, [parsedLoans, activeRenteKey, activeYearKey, yearOptions.length]);

  const activeAfdragKey =
    afdragOptions.some(([k]) => k === currentParsed?.afdragKey)
      ? currentParsed?.afdragKey
      : afdragOptions[0]?.[0] || 'med-afdrag';

  // Handler when user changes rente
  const handleRenteChange = (newRenteKey: string) => {
    const matchingLoans = parsedLoans.filter((p) => p.parsed.renteKey === newRenteKey);
    // Try to keep year and afdrag if available
    let best = matchingLoans.find(
      (p) => p.parsed.yearKey === activeYearKey && p.parsed.afdragKey === activeAfdragKey
    );
    if (!best) {
      best = matchingLoans.find((p) => p.parsed.yearKey === activeYearKey);
    }
    if (!best) {
      best = matchingLoans[matchingLoans.length - 1] || matchingLoans[0];
    }
    if (best) onSelectLoan(best.loan);
  };

  // Handler when user changes year
  const handleYearChange = (newYearKey: string) => {
    const matchingLoans = parsedLoans.filter(
      (p) => p.parsed.renteKey === activeRenteKey && p.parsed.yearKey === newYearKey
    );
    let best = matchingLoans.find((p) => p.parsed.afdragKey === activeAfdragKey);
    if (!best) {
      best = matchingLoans[0];
    }
    if (best) onSelectLoan(best.loan);
  };

  // Handler when user changes afdragsfrihed
  const handleAfdragChange = (newAfdragKey: string) => {
    const matchingLoans = parsedLoans.filter(
      (p) =>
        p.parsed.renteKey === activeRenteKey &&
        (p.parsed.yearKey === activeYearKey || yearOptions.length <= 1) &&
        p.parsed.afdragKey === newAfdragKey
    );
    if (matchingLoans[0]) {
      onSelectLoan(matchingLoans[0].loan);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex justify-between items-center">
        <label className="text-sm font-semibold text-slate-800 dark:text-slate-200">{label}</label>
        {selectedLoan?.nasdaqUrl && (
          <a
            href={selectedLoan.nasdaqUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
            title="Se obligationskurs på Nasdaq Nordic"
          >
            <span>Nasdaq</span>
            <ExternalLink className="h-3 w-3" />
          </a>
        )}
      </div>

      {/* 3 Dependent Selects: Rente, Løbetid, Afdragsfrihed */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        {/* 1. Rente */}
        <div className="flex flex-col gap-1">
          <label className="text-[11px] font-medium uppercase text-slate-500 dark:text-slate-400">
            1. Rente
          </label>
          <select
            value={activeRenteKey}
            onChange={(e) => handleRenteChange(e.target.value)}
            className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 transition-colors"
          >
            {renteOptions.map(([key, display]) => (
              <option key={key} value={key}>
                {display}
              </option>
            ))}
          </select>
        </div>

        {/* 2. Løbetid / Udløb */}
        <div className="flex flex-col gap-1">
          <label className="text-[11px] font-medium uppercase text-slate-500 dark:text-slate-400">
            2. Udløb
          </label>
          <select
            value={activeYearKey}
            onChange={(e) => handleYearChange(e.target.value)}
            disabled={yearOptions.length === 0}
            className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 disabled:opacity-50 transition-colors"
          >
            {yearOptions.map(([key, display]) => (
              <option key={key} value={key}>
                {display}
              </option>
            ))}
          </select>
        </div>

        {/* 3. Afdragsfrihed */}
        <div className="flex flex-col gap-1">
          <label className="text-[11px] font-medium uppercase text-slate-500 dark:text-slate-400">
            3. Afdrag
          </label>
          <select
            value={activeAfdragKey}
            onChange={(e) => handleAfdragChange(e.target.value)}
            disabled={afdragOptions.length === 0}
            className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 disabled:opacity-50 transition-colors"
          >
            {afdragOptions.map(([key, display]) => (
              <option key={key} value={key}>
                {display}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Selected Loan Badge / Kurs info */}
      {selectedLoan && (
        <div className="flex items-center justify-between rounded-lg bg-slate-50 dark:bg-slate-800/80 px-3 py-1.5 text-xs border border-slate-200/70 dark:border-slate-700">
          <span className="font-medium text-slate-700 dark:text-slate-300 truncate max-w-[220px]">
            {selectedLoan.name}
          </span>
          <span className="font-bold text-blue-600 dark:text-blue-400">
            Kurs {formatKurs(selectedLoan.kurs)}
          </span>
        </div>
      )}

      {subtext && <span className="text-[11px] text-slate-500 dark:text-slate-400">{subtext}</span>}
    </div>
  );
};
