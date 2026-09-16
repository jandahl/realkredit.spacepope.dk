import React, { useState, useMemo } from 'react';
import type { BondLoan } from '../calculator/types';
import { calculateRefinancing } from '../calculator/refinancing';
import { CurrencyInput } from '../components/CurrencyInput';
import { LoanSelect } from '../components/LoanSelect';
import { MetricCard } from '../components/MetricCard';
import { AmortizationTable } from '../components/AmortizationTable';
import { formatKr, formatPercent, formatKurs } from '../utils/formatters';
import { Sparkles } from 'lucide-react';

interface RefinancingViewProps {
  indfrielseLoans: BondLoan[];
  optagelseLoans: BondLoan[];
}

export const RefinancingView: React.FC<RefinancingViewProps> = ({
  indfrielseLoans,
  optagelseLoans,
}) => {
  const [propertyValue, setPropertyValue] = useState<number>(3_000_000);
  const [existingRestgaeld, setExistingRestgaeld] = useState<number>(2_000_000);
  const [remainingYears, setRemainingYears] = useState<number>(30);

  // Selected existing and new loans (find realistic defaults like 1% 2050 and 4% 2059)
  const defaultExisting = useMemo(() => {
    return (
      indfrielseLoans.find((l) => l.name.includes('1% 2050') || l.name.includes('0,5% 2050')) ||
      indfrielseLoans[0]
    );
  }, [indfrielseLoans]);

  const defaultNew = useMemo(() => {
    return (
      optagelseLoans.find((l) => l.name.includes('4% 2059 med afdrag')) ||
      optagelseLoans[0]
    );
  }, [optagelseLoans]);

  const [selectedExisting, setSelectedExisting] = useState<BondLoan | null>(null);
  const [selectedNew, setSelectedNew] = useState<BondLoan | null>(null);

  const activeExisting = selectedExisting || defaultExisting;
  const activeNew = selectedNew || defaultNew;

  const comparison = useMemo(() => {
    if (!activeExisting || !activeNew) return null;
    return calculateRefinancing(
      activeExisting,
      existingRestgaeld,
      activeNew,
      propertyValue,
      remainingYears
    );
  }, [activeExisting, activeNew, existingRestgaeld, propertyValue, remainingYears]);

  if (!activeExisting || !activeNew || !comparison) {
    return <div className="p-8 text-center text-slate-500">Indlæser lånedata...</div>;
  }

  const isDebtReduced = comparison.kursgevinstEllerTab > 0;
  const isPaymentLower = comparison.deltaMonthlyYdelseEfterSkat < 0;

  return (
    <div className="flex flex-col gap-8 pb-12">
      {/* Intro Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-blue-700 via-indigo-700 to-slate-900 p-6 sm:p-8 text-white shadow-md">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-medium backdrop-blur-md mb-3">
            <Sparkles className="h-3.5 w-3.5 text-amber-300" />
            <span>Konverteringsberegner med live kurser</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Beregn omlægning af dit realkreditlån
          </h2>
          <p className="mt-2 text-sm sm:text-base text-blue-100/90 leading-relaxed">
            Se hvad du kan skære af din restgæld ved at opkonvertere til en højere rente,
            eller hvad du sparer i månedlig ydelse ved en nedkonvertering.
          </p>
        </div>
      </div>

      {/* Input Section */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Left Card: Property & Debt Inputs */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs flex flex-col gap-5">
          <h3 className="text-base font-semibold text-slate-900 border-b border-slate-100 pb-3">
            1. Din bolig & restgæld
          </h3>

          <CurrencyInput
            label="Ejendomsværdi"
            value={propertyValue}
            onChange={setPropertyValue}
            min={500_000}
            max={15_000_000}
            step={100_000}
            helpText={`LTV: ${Math.round((existingRestgaeld / propertyValue) * 100)} %`}
          />

          <CurrencyInput
            label="Nuværende restgæld"
            value={existingRestgaeld}
            onChange={setExistingRestgaeld}
            min={100_000}
            max={Math.min(propertyValue, 12_000_000)}
            step={50_000}
          />

          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between items-center">
              <label className="text-sm font-medium text-slate-700">Resterende løbetid</label>
              <span className="text-sm font-semibold text-blue-600">{remainingYears} år</span>
            </div>
            <input
              type="range"
              min={5}
              max={30}
              step={1}
              value={remainingYears}
              onChange={(e) => setRemainingYears(parseInt(e.target.value, 10))}
              className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-slate-200 accent-blue-600 focus:outline-none"
            />
            <div className="flex justify-between text-[11px] text-slate-400">
              <span>5 år</span>
              <span>15 år</span>
              <span>30 år</span>
            </div>
          </div>
        </div>

        {/* Right Card: Loan Selection */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs flex flex-col gap-5">
          <h3 className="text-base font-semibold text-slate-900 border-b border-slate-100 pb-3">
            2. Vælg lån til sammenligning
          </h3>

          <LoanSelect
            label="Nuværende lån (indfrielse)"
            loans={indfrielseLoans}
            selectedLoan={activeExisting}
            onSelectLoan={setSelectedExisting}
            subtext={`Obligationskurs: ${formatKurs(activeExisting.kurs)} (Indfrielseskurs: ${formatKurs(Math.min(100, activeExisting.kurs))})`}
          />

          <LoanSelect
            label="Nyt lån (optagelse)"
            loans={optagelseLoans}
            selectedLoan={activeNew}
            onSelectLoan={setSelectedNew}
            subtext={`Aktuel optagelseskurs: ${formatKurs(activeNew.kurs)}`}
          />

          <div className="mt-2 rounded-xl bg-slate-50 p-4 text-xs text-slate-600 border border-slate-100">
            <div className="font-semibold text-slate-800 mb-1">Sådan fungerer indfrielsen:</div>
            Dine nuværende obligationer indfries til kurs{' '}
            <span className="font-semibold text-slate-900">{formatKurs(Math.min(100, activeExisting.kurs))}</span>. Det kræver{' '}
            <span className="font-semibold text-slate-900">{formatKr(comparison.indfrielsesBeloeb)}</span> i kontanter. For at rejse dette beløb til kurs{' '}
            <span className="font-semibold text-slate-900">{formatKurs(activeNew.kurs)}</span> udstedes nye obligationer med en hovedstol på{' '}
            <span className="font-semibold text-slate-900">{formatKr(comparison.nyHovedstol)}</span>.
          </div>
        </div>
      </div>

      {/* Key Conversion Results Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Ændring i restgæld"
          value={formatKr(Math.abs(comparison.kursgevinstEllerTab))}
          subValue={isDebtReduced ? 'Restgæld reduceres' : 'Restgæld forøges'}
          delta={{
            text: isDebtReduced ? 'Kursgevinst' : 'Kurstab',
            type: isDebtReduced ? 'positive' : 'negative',
          }}
          highlight={true}
        />

        <MetricCard
          title="Ny månedlig ydelse efter skat"
          value={formatKr(comparison.newSchedule.monthlyYdelseEfterSkat)}
          subValue={`Før: ${formatKr(comparison.existingSchedule.monthlyYdelseEfterSkat)}`}
          delta={{
            text: `${comparison.deltaMonthlyYdelseEfterSkat > 0 ? '+' : ''}${formatKr(comparison.deltaMonthlyYdelseEfterSkat)}/md.`,
            type: isPaymentLower ? 'positive' : 'negative',
          }}
        />

        <MetricCard
          title="Månedligt afdrag"
          value={formatKr(comparison.newSchedule.monthlyAfdrag)}
          subValue={`Før: ${formatKr(comparison.existingSchedule.monthlyAfdrag)}`}
          delta={{
            text: `${comparison.deltaMonthlyAfdrag > 0 ? '+' : ''}${formatKr(comparison.deltaMonthlyAfdrag)}/md.`,
            type: comparison.deltaMonthlyAfdrag >= 0 ? 'positive' : 'negative',
          }}
        />

        <MetricCard
          title="Ny hovedstol"
          value={formatKr(comparison.nyHovedstol)}
          subValue={`Gl. restgæld: ${formatKr(comparison.existingRestgaeld)}`}
          delta={{
            text: `Belåningsgrad: ${Math.round((comparison.nyHovedstol / propertyValue) * 100)} %`,
            type: 'neutral',
          }}
        />
      </div>

      {/* Comparison Detail Box */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
        <h3 className="text-base font-semibold text-slate-900 mb-4">
          Sammenligning: Nuværende lån vs. Nyt lån
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-slate-100 pt-4">
          {/* Old Loan */}
          <div className="flex flex-col gap-2 rounded-xl bg-slate-50 p-4 border border-slate-100">
            <div className="text-xs font-semibold text-slate-500 uppercase">Nuværende lån</div>
            <div className="text-base font-bold text-slate-900">{activeExisting.name}</div>
            <div className="mt-2 space-y-1.5 text-xs text-slate-600">
              <div className="flex justify-between">
                <span>Rente:</span>
                <span className="font-semibold text-slate-800">{formatPercent(activeExisting.rente)}</span>
              </div>
              <div className="flex justify-between">
                <span>Kurs:</span>
                <span className="font-semibold text-slate-800">{formatKurs(activeExisting.kurs)}</span>
              </div>
              <div className="flex justify-between">
                <span>Mdl. ydelse før skat:</span>
                <span className="font-semibold text-slate-800">{formatKr(comparison.existingSchedule.monthlyYdelse)}</span>
              </div>
              <div className="flex justify-between">
                <span>Mdl. ydelse efter skat:</span>
                <span className="font-semibold text-slate-800">{formatKr(comparison.existingSchedule.monthlyYdelseEfterSkat)}</span>
              </div>
              <div className="flex justify-between">
                <span>Mdl. afdrag:</span>
                <span className="font-semibold text-slate-800">{formatKr(comparison.existingSchedule.monthlyAfdrag)}</span>
              </div>
            </div>
          </div>

          {/* New Loan */}
          <div className="flex flex-col gap-2 rounded-xl bg-blue-50/60 p-4 border border-blue-100">
            <div className="text-xs font-semibold text-blue-700 uppercase">Nyt lån</div>
            <div className="text-base font-bold text-slate-900">{activeNew.name}</div>
            <div className="mt-2 space-y-1.5 text-xs text-slate-600">
              <div className="flex justify-between">
                <span>Rente:</span>
                <span className="font-semibold text-slate-800">{formatPercent(activeNew.rente)}</span>
              </div>
              <div className="flex justify-between">
                <span>Optagelseskurs:</span>
                <span className="font-semibold text-slate-800">{formatKurs(activeNew.kurs)}</span>
              </div>
              <div className="flex justify-between">
                <span>Mdl. ydelse før skat:</span>
                <span className="font-semibold text-slate-800">{formatKr(comparison.newSchedule.monthlyYdelse)}</span>
              </div>
              <div className="flex justify-between">
                <span>Mdl. ydelse efter skat:</span>
                <span className="font-semibold text-slate-800">{formatKr(comparison.newSchedule.monthlyYdelseEfterSkat)}</span>
              </div>
              <div className="flex justify-between">
                <span>Mdl. afdrag:</span>
                <span className="font-semibold text-slate-800">{formatKr(comparison.newSchedule.monthlyAfdrag)}</span>
              </div>
            </div>
          </div>

          {/* Difference */}
          <div className="flex flex-col gap-2 rounded-xl bg-slate-50 p-4 border border-slate-100">
            <div className="text-xs font-semibold text-slate-500 uppercase">Forskel (Nyt minus Gammelt)</div>
            <div className="text-base font-bold text-slate-900">
              {isDebtReduced ? 'Opkonvertering' : 'Nedkonvertering'}
            </div>
            <div className="mt-2 space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-600">Restgæld:</span>
                <span className={`font-semibold ${isDebtReduced ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {comparison.deltaRestgaeld > 0 ? '+' : ''}{formatKr(comparison.deltaRestgaeld)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Mdl. ydelse før skat:</span>
                <span className={`font-semibold ${comparison.deltaMonthlyYdelseFoerSkat <= 0 ? 'text-emerald-600' : 'text-slate-900'}`}>
                  {comparison.deltaMonthlyYdelseFoerSkat > 0 ? '+' : ''}{formatKr(comparison.deltaMonthlyYdelseFoerSkat)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Mdl. ydelse efter skat:</span>
                <span className={`font-semibold ${comparison.deltaMonthlyYdelseEfterSkat <= 0 ? 'text-emerald-600' : 'text-slate-900'}`}>
                  {comparison.deltaMonthlyYdelseEfterSkat > 0 ? '+' : ''}{formatKr(comparison.deltaMonthlyYdelseEfterSkat)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Mdl. afdrag:</span>
                <span className={`font-semibold ${comparison.deltaMonthlyAfdrag >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {comparison.deltaMonthlyAfdrag > 0 ? '+' : ''}{formatKr(comparison.deltaMonthlyAfdrag)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Amortization Tables */}
      <div className="space-y-6">
        <AmortizationTable
          calculation={comparison.newSchedule}
          title={`Annuitetstabel for Nyt Lån (${activeNew.name})`}
        />
        <AmortizationTable
          calculation={comparison.existingSchedule}
          title={`Annuitetstabel for Nuværende Lån (${activeExisting.name})`}
        />
      </div>
    </div>
  );
};
