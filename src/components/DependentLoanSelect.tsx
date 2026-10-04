import React, { useMemo, useState } from 'react';
import type { BondLoan } from '../calculator/types';
import { parseBondLoan } from '../utils/loanParser';
import { formatKurs } from '../utils/formatters';
import { ExternalLink, SlidersHorizontal, ArrowLeft } from 'lucide-react';

interface DependentLoanSelectProps {
  label: string;
  loans: BondLoan[];
  selectedLoan: BondLoan | null;
  onSelectLoan: (loan: BondLoan) => void;
  subtext?: string;
  allowCustom?: boolean;
}

export const DependentLoanSelect: React.FC<DependentLoanSelectProps> = ({
  label,
  loans,
  selectedLoan,
  onSelectLoan,
  subtext,
  allowCustom,
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

  const [isCustomMode, setIsCustomMode] = useState<boolean>(() => {
    return selectedLoan?.name.startsWith('Brugerdefineret') ?? false;
  });

  const [customRente, setCustomRente] = useState<string>(
    selectedLoan?.rente?.toString() || '3.5',
  );
  const [customKurs, setCustomKurs] = useState<string>(
    selectedLoan?.kurs?.toString() || '98.5',
  );
  const [customAfdragsfri, setCustomAfdragsfri] = useState<boolean>(
    selectedLoan?.afdragsfri || false,
  );

  const applyCustomLoan = (
    renteStr = customRente,
    kursStr = customKurs,
    afdrag = customAfdragsfri,
  ) => {
    const rente = parseFloat(renteStr) || 3.5;
    const kurs = parseFloat(kursStr) || 98.5;
    const customBond: BondLoan = {
      name: `Brugerdefineret ${rente}% ${afdrag ? 'afdragsfri' : 'med afdrag'}`,
      rente,
      kurs,
      loebetid: selectedLoan?.loebetid || 30,
      udloebsAar: selectedLoan?.udloebsAar || new Date().getFullYear() + 30,
      afdragsfri: afdrag,
      bidragsSats: afdrag ? [0.0055, 0.0115, 0.02] : [0.0045, 0.0085, 0.012],
    };
    onSelectLoan(customBond);
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex justify-between items-center">
        <label className="text-sm font-semibold text-slate-800 dark:text-slate-200">{label}</label>
        <div className="flex items-center gap-2">
          {allowCustom && (
            <button
              type="button"
              onClick={() => {
                const nextMode = !isCustomMode;
                setIsCustomMode(nextMode);
                if (nextMode) {
                  applyCustomLoan();
                } else if (parsedLoans[0]) {
                  onSelectLoan(parsedLoans[0].loan);
                }
              }}
              className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-md border transition-colors cursor-pointer ${
                isCustomMode
                  ? 'border-blue-300 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950/50 dark:text-blue-300'
                  : 'border-slate-200 bg-white text-slate-600 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'
              }`}
            >
              {isCustomMode ? (
                <>
                  <ArrowLeft className="h-3 w-3" />
                  <span>Vælg fra liste</span>
                </>
              ) : (
                <>
                  <SlidersHorizontal className="h-3 w-3" />
                  <span>Egen rente/kurs</span>
                </>
              )}
            </button>
          )}

          {!isCustomMode && selectedLoan?.nasdaqUrl && (
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
      </div>

      {isCustomMode ? (
        <div className="rounded-xl border border-blue-200/80 dark:border-blue-900/50 bg-blue-50/40 dark:bg-blue-950/20 p-3 space-y-2.5">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <div>
              <label className="text-[11px] font-medium text-slate-600 dark:text-slate-400 block mb-1">
                Kuponrente (%)
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="15"
                value={customRente}
                onChange={(e) => {
                  setCustomRente(e.target.value);
                  applyCustomLoan(e.target.value, customKurs, customAfdragsfri);
                }}
                className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-900 focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              />
            </div>
            <div>
              <label className="text-[11px] font-medium text-slate-600 dark:text-slate-400 block mb-1">
                Aktuel kurs
              </label>
              <input
                type="number"
                step="0.05"
                min="10"
                max="105"
                value={customKurs}
                onChange={(e) => {
                  setCustomKurs(e.target.value);
                  applyCustomLoan(customRente, e.target.value, customAfdragsfri);
                }}
                className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-900 focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              />
            </div>
            <div>
              <label className="text-[11px] font-medium text-slate-600 dark:text-slate-400 block mb-1">
                Afdragsform
              </label>
              <select
                value={customAfdragsfri ? 'io' : 'rep'}
                onChange={(e) => {
                  const isIo = e.target.value === 'io';
                  setCustomAfdragsfri(isIo);
                  applyCustomLoan(customRente, customKurs, isIo);
                }}
                className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-900 focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              >
                <option value="rep">Med afdrag</option>
                <option value="io">Afdragsfri (10 år)</option>
              </select>
            </div>
          </div>
          <p className="text-[11px] text-blue-800/80 dark:text-blue-300/80">
            Angiv vilkår for et lån fra Realkredit Danmark, Nordea Kredit eller en ældre obligationsserie.
          </p>
        </div>
      ) : (
        /* 3 Dependent Selects: Rente, Løbetid, Afdragsfrihed */
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
      )}

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
