import React, { useState, useMemo } from 'react';
import type { BondLoan } from '../calculator/types';
import { calculateLoanAmortization } from '../calculator/amortization';
import { CurrencyInput } from '../components/CurrencyInput';
import { LoanSelect } from '../components/LoanSelect';
import { MetricCard } from '../components/MetricCard';
import { AmortizationTable } from '../components/AmortizationTable';
import { formatKr, formatPercent, formatKurs } from '../utils/formatters';
import { Calculator } from 'lucide-react';

interface StandardLoanViewProps {
  optagelseLoans: BondLoan[];
}

export const StandardLoanView: React.FC<StandardLoanViewProps> = ({ optagelseLoans }) => {
  const [propertyValue, setPropertyValue] = useState<number>(3_000_000);
  const [loanAmount, setLoanAmount] = useState<number>(2_400_000);
  const [selectedLoan, setSelectedLoan] = useState<BondLoan | null>(null);

  const activeLoan = selectedLoan || optagelseLoans[0];

  const calculation = useMemo(() => {
    if (!activeLoan) return null;

    const maxLtv = Math.min(80, (loanAmount / propertyValue) * 100);
    const ltvRange: [number, number] = [0, Math.max(1, maxLtv)];

    // Convert cash loan amount to nominal bond principal (hovedstol = loanAmount / (kurs / 100))
    const principal = (loanAmount / activeLoan.kurs) * 100;
    const totalQuarters = (activeLoan.loebetid || 30) * 4;

    return calculateLoanAmortization(activeLoan, totalQuarters, principal, ltvRange);
  }, [activeLoan, loanAmount, propertyValue]);

  if (!activeLoan || !calculation) {
    return <div className="p-8 text-center text-slate-500">Indlæser lån...</div>;
  }

  const ltvPercent = Math.round((loanAmount / propertyValue) * 100);

  return (
    <div className="flex flex-col gap-8 pb-12">
      {/* Header */}
      <div className="rounded-2xl bg-white border border-slate-200 p-6 shadow-xs">
        <div className="flex items-center gap-2 text-blue-600 font-semibold text-sm mb-1">
          <Calculator className="h-4 w-4" />
          <span>Standard realkreditlån</span>
        </div>
        <h2 className="text-2xl font-bold text-slate-900">Beregn et nyt realkreditlån</h2>
        <p className="mt-1 text-sm text-slate-500">
          Se månedlig ydelse før og efter skat, afdrag og den komplette annuitetstabel for dit ønskede lån.
        </p>
      </div>

      {/* Input Configuration */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs flex flex-col gap-5">
          <h3 className="text-base font-semibold text-slate-900 border-b border-slate-100 pb-3">
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

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs flex flex-col gap-5">
          <h3 className="text-base font-semibold text-slate-900 border-b border-slate-100 pb-3">
            Vælg lånetype
          </h3>

          <LoanSelect
            label="Obligationslån"
            loans={optagelseLoans}
            selectedLoan={activeLoan}
            onSelectLoan={setSelectedLoan}
            subtext={`Kurs ${formatKurs(activeLoan.kurs)} • Rente ${formatPercent(activeLoan.rente)} • Løbetid ${activeLoan.loebetid || 30} år`}
          />

          <div className="rounded-xl bg-slate-50 p-4 text-xs text-slate-600 border border-slate-100 space-y-2">
            <div className="flex justify-between">
              <span>Hovedstol (obligationsgæld):</span>
              <span className="font-semibold text-slate-900">{formatKr(calculation.hovedstol)}</span>
            </div>
            <div className="flex justify-between">
              <span>Kurstab ved udbetaling:</span>
              <span className="font-semibold text-slate-900">{formatKr(calculation.hovedstol - loanAmount)}</span>
            </div>
            <div className="flex justify-between">
              <span>Effektiv bidragssats:</span>
              <span className="font-semibold text-slate-900">{formatPercent(calculation.bidragsSats * 100)}</span>
            </div>
            <div className="flex justify-between">
              <span>Afdragsfrihed:</span>
              <span className="font-semibold text-slate-900">
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

      {/* Table */}
      <AmortizationTable
        calculation={calculation}
        title={`Annuitetstabel for ${activeLoan.name}`}
      />
    </div>
  );
};
