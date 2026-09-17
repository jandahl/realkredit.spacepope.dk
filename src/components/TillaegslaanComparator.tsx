import React from 'react';
import type { BondLoan, TillaegslaanComparison } from '../calculator/types';
import { formatKr } from '../utils/formatters';
import { Layers, ArrowRightLeft, CheckCircle2, Scale } from 'lucide-react';

interface TillaegslaanComparatorProps {
  comparison: TillaegslaanComparison;
  existingLoan: BondLoan;
  newLoan: BondLoan;
  desiredCashout: number;
}

export const TillaegslaanComparator: React.FC<TillaegslaanComparatorProps> = ({
  comparison,
  existingLoan,
  newLoan,
  desiredCashout,
}) => {
  const {
    optionA_fullOmlaegning,
    optionB_tillaegslaan,
    monthlySavingsOptionB,
    yearlySavingsOptionB,
    recommendedStrategy,
    recommendationReason,
  } = comparison;

  const isTillaegslaanBetter = recommendedStrategy === 'tillaegslaan';
  const isFullOmlaegningBetter = recommendedStrategy === 'full_omlaegning';

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden transition-colors my-4">
      {/* Header */}
      <div className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/75 dark:bg-slate-800/40 p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600/10 text-blue-600 dark:text-blue-400">
              <Scale className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Tillægslån vs. Fuld Omlægning
                </h3>
                <span className="rounded-md bg-blue-100 dark:bg-blue-900/50 px-2 py-0.5 text-[11px] font-semibold text-blue-700 dark:text-blue-300">
                  Friværdiudtag ({formatKr(desiredCashout)})
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Skal du lade det gamle lave lån stå og kun optage et tillægslån, eller omlægge alt?
              </p>
            </div>
          </div>

          {/* Recommendation badge */}
          <div className="shrink-0">
            {isTillaegslaanBetter && (
              <div className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/80 px-3 py-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-300">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                Vælg Tillægslån (Spar {formatKr(Math.abs(monthlySavingsOptionB))}/md.)
              </div>
            )}
            {isFullOmlaegningBetter && (
              <div className="inline-flex items-center gap-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800/80 px-3 py-1.5 text-xs font-bold text-amber-700 dark:text-amber-300">
                <ArrowRightLeft className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                Vælg Fuld Omlægning (Spar {formatKr(Math.abs(monthlySavingsOptionB))}/md.)
              </div>
            )}
            {!isTillaegslaanBetter && !isFullOmlaegningBetter && (
              <div className="inline-flex items-center gap-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
                Lige gode månedlige ydelser
              </div>
            )}
          </div>
        </div>

        {/* Recommendation reason banner */}
        <div className="mt-4 rounded-xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200/60 dark:border-blue-900/50 p-3 text-xs text-blue-900 dark:text-blue-200 leading-relaxed">
          {recommendationReason}
        </div>
      </div>

      {/* Comparison Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-100 dark:divide-slate-800 p-4 sm:p-5 gap-4 md:gap-0">
        
        {/* Option A: Full Remortgage */}
        <div className={`md:pr-6 flex flex-col justify-between rounded-xl p-4 transition-all ${
          isFullOmlaegningBetter 
            ? 'bg-amber-50/40 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-800/50' 
            : 'bg-slate-50/50 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-800'
        }`}>
          <div>
            <div className="flex items-center justify-between pb-2 border-b border-slate-200/60 dark:border-slate-700/60">
              <div className="flex items-center gap-2">
                <ArrowRightLeft className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-slate-100">
                  Option A: Fuld Omlægning
                </span>
              </div>
              <span className="text-[11px] font-semibold text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-900/60 px-2 py-0.5 rounded">
                1 Samlet Lån
              </span>
            </div>

            <div className="mt-4 space-y-3 text-xs">
              <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                <span>Nyt samlet lån ({newLoan.name}):</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {formatKr(optionA_fullOmlaegning.monthlyYdelseEfterSkat)}/md.
                </span>
              </div>

              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                <span>Ny samlet hovedstol:</span>
                <span className="font-medium text-slate-700 dark:text-slate-300">
                  {formatKr(optionA_fullOmlaegning.nyHovedstol)}
                </span>
              </div>

              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                <span>Stiftelses- og indfrielsesomkostninger:</span>
                <span className="font-medium text-slate-700 dark:text-slate-300">
                  {formatKr(optionA_fullOmlaegning.totalOmkostninger)}
                </span>
              </div>

              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 pt-1">
                <span>Renteudvikling:</span>
                <span className={`font-medium ${newLoan.rente > existingLoan.rente ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                  {newLoan.rente > existingLoan.rente
                    ? `100% af gælden stiger til ${newLoan.rente}%`
                    : newLoan.rente < existingLoan.rente
                    ? `100% af gælden falder til ${newLoan.rente}%`
                    : `Gælden fortsætter på ${newLoan.rente}%`}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-200/80 dark:border-slate-700">
            <div className="text-xs font-medium text-slate-500 dark:text-slate-400">Samlet ydelse efter skat:</div>
            <div className="text-xl font-extrabold text-slate-900 dark:text-white mt-0.5">
              {formatKr(optionA_fullOmlaegning.monthlyYdelseEfterSkat)} <span className="text-xs font-normal text-slate-500">/md.</span>
            </div>
            {isFullOmlaegningBetter && (
              <div className="mt-1 text-xs font-bold text-amber-600 dark:text-amber-400">
                Sparer {formatKr(Math.abs(yearlySavingsOptionB))} om året i forhold til Tillægslån
              </div>
            )}
          </div>
        </div>

        {/* Option B: Keep 1st + Tillægslån */}
        <div className={`md:pl-6 flex flex-col justify-between rounded-xl p-4 transition-all ${
          isTillaegslaanBetter 
            ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border border-emerald-200/80 dark:border-emerald-800/50' 
            : 'bg-slate-50/50 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-800'
        }`}>
          <div>
            <div className="flex items-center justify-between pb-2 border-b border-slate-200/60 dark:border-slate-700/60">
              <div className="flex items-center gap-2">
                <Layers className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-slate-100">
                  Option B: Behold 1. prioritet + Tillægslån
                </span>
              </div>
              <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-900/60 px-2 py-0.5 rounded">
                2 Lån
              </span>
            </div>

            <div className="mt-4 space-y-3 text-xs">
              <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                <span>1. Eksisterende lån ({existingLoan.name}):</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {formatKr(optionB_tillaegslaan.existingMonthlyYdelseEfterSkat)}/md.
                </span>
              </div>

              <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                <span>2. Nyt Tillægslån ({newLoan.name}):</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  +{formatKr(optionB_tillaegslaan.tillaegMonthlyYdelseEfterSkat)}/md.
                </span>
              </div>

              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 pt-1">
                <span>Tillægslån hovedstol:</span>
                <span className="font-medium text-slate-700 dark:text-slate-300">
                  {formatKr(optionB_tillaegslaan.tillaegHovedstol)}
                </span>
              </div>

              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                <span>Stiftelsesomkostninger tillægslån:</span>
                <span className="font-medium text-slate-700 dark:text-slate-300">
                  {formatKr(optionB_tillaegslaan.tillaegOmkostninger)}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-200/80 dark:border-slate-700">
            <div className="text-xs font-medium text-slate-500 dark:text-slate-400">Samlet ydelse efter skat:</div>
            <div className="text-xl font-extrabold text-slate-900 dark:text-white mt-0.5">
              {formatKr(optionB_tillaegslaan.combinedMonthlyYdelseEfterSkat)} <span className="text-xs font-normal text-slate-500">/md.</span>
            </div>
            {isTillaegslaanBetter && (
              <div className="mt-1 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                Sparer {formatKr(yearlySavingsOptionB)} om året i forhold til fuld omlægning
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
