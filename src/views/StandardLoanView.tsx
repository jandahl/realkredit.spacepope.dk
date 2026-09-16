import React, { useMemo } from 'react';
import type { BondLoan } from '../calculator/types';
import { calculateLoanAmortization } from '../calculator/amortization';
import { CurrencyInput } from '../components/CurrencyInput';
import { LoanSelect } from '../components/LoanSelect';
import { MetricCard } from '../components/MetricCard';
import { AmortizationTable } from '../components/AmortizationTable';
import { LoanChart, type ChartSeries } from '../components/LoanChart';
import { formatKr, formatPercent, formatKurs } from '../utils/formatters';
import { Calculator } from 'lucide-react';

interface StandardLoanViewProps {
  optagelseLoans: BondLoan[];
  propertyValue: number;
  setPropertyValue: (val: number) => void;
  loanAmount: number;
  setLoanAmount: (val: number) => void;
  selectedStandardLoanName: string | null;
  setSelectedStandardLoanName: (name: string | null) => void;
}

export const StandardLoanView: React.FC<StandardLoanViewProps> = ({
  optagelseLoans,
  propertyValue,
  setPropertyValue,
  loanAmount,
  setLoanAmount,
  selectedStandardLoanName,
  setSelectedStandardLoanName,
}) => {
  const activeLoan = useMemo(() => {
    if (selectedStandardLoanName) {
      const found = optagelseLoans.find((l) => l.name === selectedStandardLoanName);
      if (found) return found;
    }
    return optagelseLoans[0];
  }, [optagelseLoans, selectedStandardLoanName]);

  const calculation = useMemo(() => {
    if (!activeLoan) return null;

    const maxLtv = Math.min(80, (loanAmount / propertyValue) * 100);
    const ltvRange: [number, number] = [0, Math.max(1, maxLtv)];

    // Convert cash loan amount to nominal bond principal (hovedstol = loanAmount / (kurs / 100))
    const principal = (loanAmount / activeLoan.kurs) * 100;
    const totalQuarters = (activeLoan.loebetid || 30) * 4;

    return calculateLoanAmortization(activeLoan, totalQuarters, principal, ltvRange);
  }, [activeLoan, loanAmount, propertyValue]);

  const totalYears = (activeLoan?.loebetid || 30);

  // Generate chart data: Restgæld progression and remaining debt curve
  const chartSeries = useMemo<ChartSeries[]>(() => {
    if (!calculation) return [];

    const debtData: number[] = [calculation.hovedstol];
    for (let y = 1; y <= totalYears; y++) {
      const qIndex = Math.min(y * 4 - 1, calculation.schedule.length - 1);
      debtData.push(calculation.schedule[qIndex]?.endRestgaeld ?? 0);
    }

    return [
      {
        id: 'restgaeld',
        name: `Restgæld (${activeLoan.name})`,
        color: '#2563eb', // Blue
        data: debtData,
      },
    ];
  }, [calculation, totalYears, activeLoan]);

  if (!activeLoan || !calculation) {
    return <div className="p-8 text-center text-slate-500 dark:text-slate-400">Indlæser lån...</div>;
  }

  const ltvPercent = Math.round((loanAmount / propertyValue) * 100);

  return (
    <div className="flex flex-col gap-8 pb-12">
      {/* Header */}
      <div className="rounded-2xl bg-white border border-slate-200 p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900 transition-colors">
        <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-semibold text-sm mb-1">
          <Calculator className="h-4 w-4" />
          <span>Standardlån</span>
        </div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Beregn et nyt Standardlån</h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Se månedlig ydelse før og efter skat, afdrag og den komplette annuitetstabel for dit ønskede lån.
        </p>
      </div>

      {/* Input Configuration */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900 flex flex-col gap-5 transition-colors">
          <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100 border-b border-slate-100 dark:border-slate-800 pb-3">
            Lånebeløb & bolig
          </h3>

          <CurrencyInput
            label="Ejendomsværdi"
            value={propertyValue}
            onChange={setPropertyValue}
            min={500_000}
            max={15_000_000}
            step={100_000}
          />

          <CurrencyInput
            label="Ønsket udbetalt provenu (kontant)"
            value={loanAmount}
            onChange={setLoanAmount}
            min={100_000}
            max={Math.min(propertyValue * 0.8, 12_000_000)}
            step={50_000}
            helpText={`Belåningsgrad (LTV): ${ltvPercent} % (max 80 %)`}
          />
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900 flex flex-col gap-5 transition-colors">
          <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100 border-b border-slate-100 dark:border-slate-800 pb-3">
            Vælg lånetype
          </h3>

          <LoanSelect
            label="Obligationslån"
            loans={optagelseLoans}
            selectedLoan={activeLoan}
            onSelectLoan={(l) => setSelectedStandardLoanName(l.name)}
            subtext={`Kurs ${formatKurs(activeLoan.kurs)} • Rente ${formatPercent(activeLoan.rente)} • Løbetid ${activeLoan.loebetid || 30} år`}
          />

          <div className="rounded-xl bg-slate-50 dark:bg-slate-800/60 p-4 text-xs text-slate-600 dark:text-slate-400 border border-slate-100 dark:border-slate-800 space-y-2">
            <div className="flex justify-between">
              <span>Hovedstol (obligationsgæld):</span>
              <span className="font-semibold text-slate-900 dark:text-slate-100">{formatKr(calculation.hovedstol)}</span>
            </div>
            <div className="flex justify-between">
              <span>Kurstab ved udbetaling:</span>
              <span className="font-semibold text-slate-900 dark:text-slate-100">{formatKr(calculation.hovedstol - loanAmount)}</span>
            </div>
            <div className="flex justify-between">
              <span>Effektiv bidragssats:</span>
              <span className="font-semibold text-slate-900 dark:text-slate-100">{formatPercent(calculation.bidragsSats * 100)}</span>
            </div>
            <div className="flex justify-between">
              <span>Afdragsfrihed:</span>
              <span className="font-semibold text-slate-900 dark:text-slate-100">
                {activeLoan.afdragsfri ? 'Ja (op til 10 år)' : 'Nej (afdrages fra start)'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Månedlig ydelse efter skat"
          value={formatKr(calculation.monthlyYdelseEfterSkat)}
          subValue="1. år gennemsnit"
          highlight={true}
        />
        <MetricCard
          title="Månedlig ydelse før skat"
          value={formatKr(calculation.monthlyYdelse)}
          subValue="1. år gennemsnit"
        />
        <MetricCard
          title="Første års månedlige afdrag"
          value={formatKr(calculation.monthlyAfdrag)}
          subValue={activeLoan.afdragsfri ? '0 kr. (afdragsfrit)' : 'Opsparing i boligen'}
        />
        <MetricCard
          title="Samlet tilbagebetaling"
          value={formatKr(calculation.totalBetalt)}
          subValue={`Heraf renter & bidrag: ${formatKr(calculation.totalRenteOgBidrag)}`}
        />
      </div>

      {/* Graphical Chart of Restgæld Progression */}
      <LoanChart
        title="Restgældsudvikling over lånets løbetid"
        subtitle={`Afvikling af ${formatKr(calculation.hovedstol)} over ${totalYears} år`}
        years={totalYears}
        series={chartSeries}
      />

      {/* Table */}
      <AmortizationTable
        calculation={calculation}
        title={`Annuitetstabel for ${activeLoan.name}`}
      />
    </div>
  );
};
