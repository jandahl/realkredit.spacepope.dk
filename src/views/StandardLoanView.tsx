import React, { useMemo } from 'react';
import type { BondLoan } from '../calculator/types';
import { calculateLoanAmortization, getDefaultAfdragsfriYears, principalFromCash } from '../calculator/amortization';
import { CurrencyInput } from '../components/CurrencyInput';
import { DependentLoanSelect } from '../components/DependentLoanSelect';
import { MetricCard } from '../components/MetricCard';
import { AmortizationTable } from '../components/AmortizationTable';
import { LoanChart, type ChartSeries } from '../components/LoanChart';
import { ValidationToast } from '../components/ValidationToast';
import { formatKr, formatPercent, formatKurs } from '../utils/formatters';
import { maxLoanAt80Ltv, buildLtvFieldErrors } from '../utils/ltv';
import { Calculator } from 'lucide-react';
import { ReportBar, ShowReportLink } from '../components/ReportBar';
import type { AppMode } from '../utils/appMode';

interface StandardLoanViewProps {
  optagelseLoans: BondLoan[];
  propertyValue: number;
  setPropertyValue: (val: number) => void;
  loanAmount: number;
  setLoanAmount: (val: number) => void;
  selectedStandardLoanName: string | null;
  setSelectedStandardLoanName: (name: string | null) => void;
  mode: AppMode;
  setMode: (mode: AppMode) => void;
}

export const StandardLoanView: React.FC<StandardLoanViewProps> = ({
  optagelseLoans,
  propertyValue,
  setPropertyValue,
  loanAmount,
  setLoanAmount,
  selectedStandardLoanName,
  setSelectedStandardLoanName,
  mode,
  setMode,
}) => {
  const isReport = mode === 'report';
  const activeLoan = useMemo(() => {
    if (selectedStandardLoanName) {
      const found = optagelseLoans.find((l) => l.name === selectedStandardLoanName);
      if (found) return found;
    }
    return optagelseLoans[0];
  }, [optagelseLoans, selectedStandardLoanName]);

  const calculation = useMemo(() => {
    if (!activeLoan) return null;
    if (!(activeLoan.kurs > 0)) return null;

    const maxLtv = Math.min(80, (loanAmount / propertyValue) * 100);
    const ltvRange: [number, number] = [0, Math.max(1, maxLtv)];

    // Convert cash loan amount to nominal bond principal (hovedstol = loanAmount / (kurs / 100))
    const principal = principalFromCash(loanAmount, activeLoan.kurs);
    const totalQuarters = (activeLoan.loebetid || 30) * 4;
    const customAfdragsfriYears = activeLoan.afdragsfri
      ? getDefaultAfdragsfriYears(activeLoan)
      : undefined;

    return calculateLoanAmortization(
      activeLoan,
      totalQuarters,
      principal,
      ltvRange,
      undefined,
      customAfdragsfriYears
    );
  }, [activeLoan, loanAmount, propertyValue]);

  const totalYears = activeLoan?.loebetid || 30;

  // Generate chart data: Restgæld progression
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
    return <div className="p-6 text-center text-slate-500 dark:text-slate-400">Indlæser lån...</div>;
  }

  const ltvPercent = propertyValue > 0 ? Math.round((loanAmount / propertyValue) * 100) : 0;
  const maxLoan = maxLoanAt80Ltv(propertyValue);
  const loanError = loanAmount > maxLoan;
  const fieldErrors = buildLtvFieldErrors({
    propertyValue,
    debtOrLoan: loanAmount,
    debtAnchorId: 'field-laanebelob',
    debtLabel: `Lånebeløb overstiger 80 % LTV (maks. ${formatKr(maxLoan)})`,
  });

  const handlePropertyBlur = (clampedProperty: number) => {
    const max = maxLoanAt80Ltv(clampedProperty);
    if (loanAmount > max) setLoanAmount(max);
  };

  const handleLoanBlur = (clampedLoan: number) => {
    const max = maxLoanAt80Ltv(propertyValue);
    if (clampedLoan > max) setLoanAmount(max);
  };

  return (
    <div className={`flex flex-col gap-5 min-w-0 max-w-full ${fieldErrors.length ? "pb-28" : "pb-8"}`}>
      {isReport ? (
        <ReportBar title="Rapport: Standardlån" onEdit={() => setMode('edit')} />
      ) : (
        <div className="rounded-xl bg-white border border-slate-200 p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900 transition-colors">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-semibold text-sm mb-0.5">
                <Calculator className="h-4 w-4" />
                <span>Standardlån</span>
              </div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Beregn et nyt Standardlån</h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Se månedlig ydelse før og efter skat, afdrag og den komplette annuitetstabel for dit ønskede lån.
              </p>
            </div>
            <ShowReportLink onShow={() => setMode('report')} />
          </div>
        </div>
      )}

      {isReport && (
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-xs transition-colors">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-3">Scenarie (skrivebeskyttet)</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div>
              <div className="text-slate-500 dark:text-slate-400">Ejendomsværdi</div>
              <div className="font-semibold text-slate-900 dark:text-slate-100">{formatKr(propertyValue)}</div>
            </div>
            <div>
              <div className="text-slate-500 dark:text-slate-400">Udbetalt provenu</div>
              <div className="font-semibold text-slate-900 dark:text-slate-100">{formatKr(loanAmount)}</div>
            </div>
            <div className="col-span-2">
              <div className="text-slate-500 dark:text-slate-400">Lån</div>
              <div className="font-semibold text-slate-900 dark:text-slate-100 truncate" title={activeLoan.name}>{activeLoan.name}</div>
            </div>
          </div>
        </div>
      )}

      {/* Input Configuration — hidden in report mode */}
      {!isReport && (
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900 flex flex-col gap-3 transition-colors">
          <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100 border-b border-slate-100 dark:border-slate-800 pb-2">
            Lånebeløb & bolig
          </h3>

          <CurrencyInput
            label="Ejendomsværdi"
            value={propertyValue}
            onChange={setPropertyValue}
            min={500_000}
            max={20_000_000}
            step={100_000}
            showSlider={false}
            fieldId="field-ejendomsvaerdi-std"
            onBlurValue={handlePropertyBlur}
          />

          <CurrencyInput
            label="Ønsket udbetalt provenu (kontant)"
            value={loanAmount}
            onChange={setLoanAmount}
            min={100_000}
            max={Math.min(propertyValue, 15_000_000)}
            step={50_000}
            helpText={`Belåningsgrad (LTV): ${ltvPercent} % (max 80 %)`}
            showSlider={false}
            fieldId="field-laanebelob"
            error={loanError}
            errorMessage={
              loanError
                ? `Maks. ${formatKr(maxLoan)} (80 % af ejendomsværdien). Justeres når du forlader feltet.`
                : undefined
            }
            onBlurValue={handleLoanBlur}
          />
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900 flex flex-col gap-3 transition-colors">
          <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100 border-b border-slate-100 dark:border-slate-800 pb-2">
            Vælg lånetype
          </h3>

          <DependentLoanSelect
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
                {activeLoan.afdragsfri
                  ? `Ja (op til ${getDefaultAfdragsfriYears(activeLoan)} år)`
                  : 'Nej (afdrages fra start)'}
              </span>
            </div>
          </div>
        </div>
      </div>
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
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

      {/* Unfoldable Table */}
      <AmortizationTable
        calculation={calculation}
        title={`Annuitetstabel for ${activeLoan.name}`}
        defaultOpen={false}
      />

      <ValidationToast errors={fieldErrors} />
    </div>
  );
};
