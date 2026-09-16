import React, { useMemo } from 'react';
import type { BondLoan } from '../calculator/types';
import { calculateRefinancing } from '../calculator/refinancing';
import { CurrencyInput } from '../components/CurrencyInput';
import { LoanSelect } from '../components/LoanSelect';
import { MetricCard } from '../components/MetricCard';
import { AmortizationTable } from '../components/AmortizationTable';
import { LoanChart, type ChartSeries } from '../components/LoanChart';
import { formatKr, formatPercent, formatKurs } from '../utils/formatters';
import { Sparkles } from 'lucide-react';

interface RefinancingViewProps {
  indfrielseLoans: BondLoan[];
  optagelseLoans: BondLoan[];
  propertyValue: number;
  setPropertyValue: (val: number) => void;
  debt: number;
  setDebt: (val: number) => void;
  remainingYears: number;
  setRemainingYears: (val: number) => void;
  selectedExistingLoanName: string | null;
  setSelectedExistingLoanName: (name: string | null) => void;
  selectedNewLoanName: string | null;
  setSelectedNewLoanName: (name: string | null) => void;
}

export const RefinancingView: React.FC<RefinancingViewProps> = ({
  indfrielseLoans,
  optagelseLoans,
  propertyValue,
  setPropertyValue,
  debt,
  setDebt,
  remainingYears,
  setRemainingYears,
  selectedExistingLoanName,
  setSelectedExistingLoanName,
  selectedNewLoanName,
  setSelectedNewLoanName,
}) => {
  // Find matching or default loans
  const activeExisting = useMemo(() => {
    if (selectedExistingLoanName) {
      const found = indfrielseLoans.find((l) => l.name === selectedExistingLoanName);
      if (found) return found;
    }
    return (
      indfrielseLoans.find((l) => l.name.includes('1% 2050') || l.name.includes('0,5% 2050')) ||
      indfrielseLoans[0]
    );
  }, [indfrielseLoans, selectedExistingLoanName]);

  const activeNew = useMemo(() => {
    if (selectedNewLoanName) {
      const found = optagelseLoans.find((l) => l.name === selectedNewLoanName);
      if (found) return found;
    }
    return (
      optagelseLoans.find((l) => l.name.includes('4% 2059 med afdrag')) ||
      optagelseLoans[0]
    );
  }, [optagelseLoans, selectedNewLoanName]);

  const comparison = useMemo(() => {
    if (!activeExisting || !activeNew) return null;
    return calculateRefinancing(
      activeExisting,
      debt,
      activeNew,
      propertyValue,
      remainingYears
    );
  }, [activeExisting, activeNew, debt, propertyValue, remainingYears]);

  // Generate chart data: Restgæld pr. år for both loans
  const chartSeries = useMemo<ChartSeries[]>(() => {
    if (!comparison) return [];

    const existingData: number[] = [comparison.existingRestgaeld];
    for (let y = 1; y <= remainingYears; y++) {
      const qIndex = Math.min(y * 4 - 1, comparison.existingSchedule.schedule.length - 1);
      existingData.push(comparison.existingSchedule.schedule[qIndex]?.endRestgaeld ?? 0);
    }

    const newData: number[] = [comparison.nyHovedstol];
    for (let y = 1; y <= remainingYears; y++) {
      const qIndex = Math.min(y * 4 - 1, comparison.newSchedule.schedule.length - 1);
      newData.push(comparison.newSchedule.schedule[qIndex]?.endRestgaeld ?? 0);
    }

    return [
      {
        id: 'new',
        name: `Nyt lån (${activeNew.name})`,
        color: '#2563eb', // Blue
        data: newData,
      },
      {
        id: 'existing',
        name: `Nuværende lån (${activeExisting.name})`,
        color: '#f59e0b', // Amber/Orange
        strokeDash: '5 5',
        data: existingData,
      },
    ];
  }, [comparison, remainingYears, activeExisting, activeNew]);

  if (!activeExisting || !activeNew || !comparison) {
    return <div className="p-8 text-center text-slate-500 dark:text-slate-400">Indlæser lånedata...</div>;
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
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900 flex flex-col gap-5 transition-colors">
          <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100 border-b border-slate-100 dark:border-slate-800 pb-3">
            1. Din bolig & restgæld
          </h3>

          <CurrencyInput
            label="Ejendomsværdi"
            value={propertyValue}
            onChange={setPropertyValue}
            min={500_000}
            max={15_000_000}
            step={100_000}
            helpText={`LTV: ${Math.round((debt / propertyValue) * 100)} %`}
          />

          <CurrencyInput
            label="Nuværende restgæld"
            value={debt}
            onChange={setDebt}
            min={100_000}
            max={Math.min(propertyValue, 12_000_000)}
            step={50_000}
          />

          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between items-center">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Resterende løbetid</label>
              <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">{remainingYears} år</span>
            </div>
            <input
              type="range"
              min={5}
              max={30}
              step={1}
              value={remainingYears}
              onChange={(e) => setRemainingYears(parseInt(e.target.value, 10))}
              className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-slate-200 accent-blue-600 focus:outline-none dark:bg-slate-700 dark:accent-blue-500"
            />
            <div className="flex justify-between text-[11px] text-slate-400">
              <span>5 år</span>
              <span>15 år</span>
              <span>30 år</span>
            </div>
          </div>
        </div>

        {/* Right Card: Loan Selection */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900 flex flex-col gap-5 transition-colors">
          <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100 border-b border-slate-100 dark:border-slate-800 pb-3">
            2. Vælg lån til sammenligning
          </h3>

          <LoanSelect
            label="Nuværende lån (indfrielse)"
            loans={indfrielseLoans}
            selectedLoan={activeExisting}
            onSelectLoan={(l) => setSelectedExistingLoanName(l.name)}
            subtext={`Obligationskurs: ${formatKurs(activeExisting.kurs)} (Indfrielseskurs: ${formatKurs(Math.min(100, activeExisting.kurs))})`}
          />

          <LoanSelect
            label="Nyt lån (optagelse)"
            loans={optagelseLoans}
            selectedLoan={activeNew}
            onSelectLoan={(l) => setSelectedNewLoanName(l.name)}
            subtext={`Aktuel optagelseskurs: ${formatKurs(activeNew.kurs)}`}
          />

          <div className="mt-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 p-4 text-xs text-slate-600 dark:text-slate-400 border border-slate-100 dark:border-slate-800">
            <div className="font-semibold text-slate-800 dark:text-slate-200 mb-1">Sådan fungerer indfrielsen:</div>
            Dine nuværende obligationer indfries til kurs{' '}
            <span className="font-semibold text-slate-900 dark:text-slate-100">{formatKurs(Math.min(100, activeExisting.kurs))}</span>. Det kræver{' '}
            <span className="font-semibold text-slate-900 dark:text-slate-100">{formatKr(comparison.indfrielsesBeloeb)}</span> i kontanter. For at rejse dette beløb til kurs{' '}
            <span className="font-semibold text-slate-900 dark:text-slate-100">{formatKurs(activeNew.kurs)}</span> udstedes nye obligationer med en hovedstol på{' '}
            <span className="font-semibold text-slate-900 dark:text-slate-100">{formatKr(comparison.nyHovedstol)}</span>.
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
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900 transition-colors">
        <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100 mb-4">
          Sammenligning: Nuværende lån vs. Nyt lån
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-slate-100 dark:border-slate-800 pt-4">
          {/* Old Loan */}
          <div className="flex flex-col gap-2 rounded-xl bg-slate-50 dark:bg-slate-800/50 p-4 border border-slate-100 dark:border-slate-800">
            <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Nuværende lån</div>
            <div className="text-base font-bold text-slate-900 dark:text-slate-100">{activeExisting.name}</div>
            <div className="mt-2 space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
              <div className="flex justify-between">
                <span>Rente:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{formatPercent(activeExisting.rente)}</span>
              </div>
              <div className="flex justify-between">
                <span>Kurs:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{formatKurs(activeExisting.kurs)}</span>
              </div>
              <div className="flex justify-between">
                <span>Mdl. ydelse før skat:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{formatKr(comparison.existingSchedule.monthlyYdelse)}</span>
              </div>
              <div className="flex justify-between">
                <span>Mdl. ydelse efter skat:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{formatKr(comparison.existingSchedule.monthlyYdelseEfterSkat)}</span>
              </div>
              <div className="flex justify-between">
                <span>Mdl. afdrag:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{formatKr(comparison.existingSchedule.monthlyAfdrag)}</span>
              </div>
            </div>
          </div>

          {/* New Loan */}
          <div className="flex flex-col gap-2 rounded-xl bg-blue-50/60 dark:bg-blue-950/30 p-4 border border-blue-100 dark:border-blue-900/50">
            <div className="text-xs font-semibold text-blue-700 dark:text-blue-400 uppercase">Nyt lån</div>
            <div className="text-base font-bold text-slate-900 dark:text-slate-100">{activeNew.name}</div>
            <div className="mt-2 space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
              <div className="flex justify-between">
                <span>Rente:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{formatPercent(activeNew.rente)}</span>
              </div>
              <div className="flex justify-between">
                <span>Optagelseskurs:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{formatKurs(activeNew.kurs)}</span>
              </div>
              <div className="flex justify-between">
                <span>Mdl. ydelse før skat:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{formatKr(comparison.newSchedule.monthlyYdelse)}</span>
              </div>
              <div className="flex justify-between">
                <span>Mdl. ydelse efter skat:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{formatKr(comparison.newSchedule.monthlyYdelseEfterSkat)}</span>
              </div>
              <div className="flex justify-between">
                <span>Mdl. afdrag:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{formatKr(comparison.newSchedule.monthlyAfdrag)}</span>
              </div>
            </div>
          </div>

          {/* Difference */}
          <div className="flex flex-col gap-2 rounded-xl bg-slate-50 dark:bg-slate-800/50 p-4 border border-slate-100 dark:border-slate-800">
            <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Forskel (Nyt minus Gammelt)</div>
            <div className="text-base font-bold text-slate-900 dark:text-slate-100">
              {isDebtReduced ? 'Opkonvertering' : 'Nedkonvertering'}
            </div>
            <div className="mt-2 space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-600 dark:text-slate-400">Restgæld:</span>
                <span className={`font-semibold ${isDebtReduced ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                  {comparison.deltaRestgaeld > 0 ? '+' : ''}{formatKr(comparison.deltaRestgaeld)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600 dark:text-slate-400">Mdl. ydelse før skat:</span>
                <span className={`font-semibold ${comparison.deltaMonthlyYdelseFoerSkat <= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-900 dark:text-slate-100'}`}>
                  {comparison.deltaMonthlyYdelseFoerSkat > 0 ? '+' : ''}{formatKr(comparison.deltaMonthlyYdelseFoerSkat)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600 dark:text-slate-400">Mdl. ydelse efter skat:</span>
                <span className={`font-semibold ${comparison.deltaMonthlyYdelseEfterSkat <= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-900 dark:text-slate-100'}`}>
                  {comparison.deltaMonthlyYdelseEfterSkat > 0 ? '+' : ''}{formatKr(comparison.deltaMonthlyYdelseEfterSkat)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600 dark:text-slate-400">Mdl. afdrag:</span>
                <span className={`font-semibold ${comparison.deltaMonthlyAfdrag >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                  {comparison.deltaMonthlyAfdrag > 0 ? '+' : ''}{formatKr(comparison.deltaMonthlyAfdrag)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Graphical Chart of Restgæld Progression */}
      <LoanChart
        title="Restgældsudvikling over tid"
        subtitle="Sammenligning af restgældsafvikling mellem dit nuværende lån og det nye lån"
        years={remainingYears}
        series={chartSeries}
      />

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
