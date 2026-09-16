import React, { useState, useMemo } from 'react';
import type { BondLoan } from '../calculator/types';
import { calculateTwoLayerLoan } from '../calculator/twoLayer';
import { CurrencyInput } from '../components/CurrencyInput';
import { LoanSelect } from '../components/LoanSelect';
import { MetricCard } from '../components/MetricCard';
import { AmortizationTable } from '../components/AmortizationTable';
import { formatKr, formatPercent, formatKurs } from '../utils/formatters';
import { Layers } from 'lucide-react';

interface TwoLayerLoanViewProps {
  optagelseLoans: BondLoan[];
}

export const TwoLayerLoanView: React.FC<TwoLayerLoanViewProps> = ({ optagelseLoans }) => {
  const [propertyValue, setPropertyValue] = useState<number>(3_000_000);
  const [totalLoanAmount, setTotalLoanAmount] = useState<number>(2_400_000);
  const [splitPercent, setSplitPercent] = useState<number>(40); // 40% default split

  // Defaults: Layer 1 = F-kort (low interest bottom) or Fixed afdragsfri, Layer 2 = 4% Fixed med afdrag
  const defaultLayer1 = useMemo(() => {
    return (
      optagelseLoans.find((l) => l.flex && l.afdragsfri) ||
      optagelseLoans.find((l) => l.name.includes('F-kort')) ||
      optagelseLoans[0]
    );
  }, [optagelseLoans]);

  const defaultLayer2 = useMemo(() => {
    return (
      optagelseLoans.find((l) => !l.flex && !l.afdragsfri && l.rente === 4.0) ||
      optagelseLoans.find((l) => !l.afdragsfri) ||
      optagelseLoans[1] ||
      optagelseLoans[0]
    );
  }, [optagelseLoans]);

  const [layer1Loan, setLayer1Loan] = useState<BondLoan | null>(null);
  const [layer2Loan, setLayer2Loan] = useState<BondLoan | null>(null);

  const activeLayer1 = layer1Loan || defaultLayer1;
  const activeLayer2 = layer2Loan || defaultLayer2;

  const result = useMemo(() => {
    if (!activeLayer1 || !activeLayer2) return null;
    return calculateTwoLayerLoan(
      propertyValue,
      totalLoanAmount,
      splitPercent,
      activeLayer1,
      activeLayer2,
      120
    );
  }, [propertyValue, totalLoanAmount, splitPercent, activeLayer1, activeLayer2]);

  if (!activeLayer1 || !activeLayer2 || !result) {
    return <div className="p-8 text-center text-slate-500">Indlæser lån...</div>;
  }

  const totalLtv = Math.round((totalLoanAmount / propertyValue) * 100);

  return (
    <div className="flex flex-col gap-8 pb-12">
      {/* Header */}
      <div className="rounded-2xl bg-white border border-slate-200 p-6 shadow-xs">
        <div className="flex items-center gap-2 text-blue-600 font-semibold text-sm mb-1">
          <Layers className="h-4 w-4" />
          <span>To-lags belåning</span>
        </div>
        <h2 className="text-2xl font-bold text-slate-900">Kombinér to realkreditlån</h2>
        <p className="mt-1 text-sm text-slate-500">
          Opdel dit lån i to lag – f.eks. et afdragsfrit variabelt lån i bunden (0–40 %) og et fastforrentet lån med afdrag i toppen (40–80 %) for at minimere bidragssats og optimere gældsafviklingen.
        </p>
      </div>

      {/* Inputs */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left: Global Property / Debt */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs flex flex-col gap-5">
          <h3 className="text-base font-semibold text-slate-900 border-b border-slate-100 pb-3">
            Bolig & Samlet Lån
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
            label="Samlet lånebeløb"
            value={totalLoanAmount}
            onChange={setTotalLoanAmount}
            min={100_000}
            max={Math.min(propertyValue * 0.8, 12_000_000)}
            step={50_000}
            helpText={`Samlet LTV: ${totalLtv} %`}
          />

          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between items-center">
              <label className="text-sm font-medium text-slate-700">Opdelingspunkt (Lag 1 / Lag 2)</label>
              <span className="text-sm font-semibold text-blue-600">{splitPercent} % LTV</span>
            </div>
            <input
              type="range"
              min={20}
              max={60}
              step={5}
              value={splitPercent}
              onChange={(e) => setSplitPercent(parseInt(e.target.value, 10))}
              className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-slate-200 accent-blue-600 focus:outline-none"
            />
            <div className="flex justify-between text-[11px] text-slate-400">
              <span>20 % LTV</span>
              <span>40 % LTV</span>
              <span>60 % LTV</span>
            </div>
          </div>
        </div>

        {/* Middle: Layer 1 Loan */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs flex flex-col gap-5">
          <div className="border-b border-slate-100 pb-3">
            <span className="text-xs font-semibold text-blue-600 uppercase">Lag 1 (0 – {splitPercent} %)</span>
            <h3 className="text-base font-semibold text-slate-900">Bundlån ({formatKr(result.layer1Amount)})</h3>
          </div>

          <LoanSelect
            label="Vælg lån til Lag 1"
            loans={optagelseLoans}
            selectedLoan={activeLayer1}
            onSelectLoan={setLayer1Loan}
            subtext={`Kurs ${formatKurs(activeLayer1.kurs)} • Rente ${formatPercent(activeLayer1.rente)}`}
          />

          <div className="rounded-xl bg-slate-50 p-3.5 text-xs text-slate-600 border border-slate-100 space-y-1.5 mt-auto">
            <div className="flex justify-between">
              <span>Hovedstol:</span>
              <span className="font-semibold text-slate-900">{formatKr(result.layer1Result.hovedstol)}</span>
            </div>
            <div className="flex justify-between">
              <span>Effektiv bidragssats:</span>
              <span className="font-semibold text-slate-900">{formatPercent(result.layer1Result.bidragsSats * 100)}</span>
            </div>
            <div className="flex justify-between">
              <span>Mdl. ydelse efter skat:</span>
              <span className="font-semibold text-slate-900">{formatKr(result.layer1Result.monthlyYdelseEfterSkat)}</span>
            </div>
            <div className="flex justify-between">
              <span>Mdl. afdrag:</span>
              <span className="font-semibold text-slate-900">{formatKr(result.layer1Result.monthlyAfdrag)}</span>
            </div>
          </div>
        </div>

        {/* Right: Layer 2 Loan */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs flex flex-col gap-5">
          <div className="border-b border-slate-100 pb-3">
            <span className="text-xs font-semibold text-indigo-600 uppercase">Lag 2 ({splitPercent} – {totalLtv} %)</span>
            <h3 className="text-base font-semibold text-slate-900">Toplån ({formatKr(result.layer2Amount)})</h3>
          </div>

          <LoanSelect
            label="Vælg lån til Lag 2"
            loans={optagelseLoans}
            selectedLoan={activeLayer2}
            onSelectLoan={setLayer2Loan}
            subtext={`Kurs ${formatKurs(activeLayer2.kurs)} • Rente ${formatPercent(activeLayer2.rente)}`}
          />

          <div className="rounded-xl bg-slate-50 p-3.5 text-xs text-slate-600 border border-slate-100 space-y-1.5 mt-auto">
            <div className="flex justify-between">
              <span>Hovedstol:</span>
              <span className="font-semibold text-slate-900">{formatKr(result.layer2Result.hovedstol)}</span>
            </div>
            <div className="flex justify-between">
              <span>Effektiv bidragssats:</span>
              <span className="font-semibold text-slate-900">{formatPercent(result.layer2Result.bidragsSats * 100)}</span>
            </div>
            <div className="flex justify-between">
              <span>Mdl. ydelse efter skat:</span>
              <span className="font-semibold text-slate-900">{formatKr(result.layer2Result.monthlyYdelseEfterSkat)}</span>
            </div>
            <div className="flex justify-between">
              <span>Mdl. afdrag:</span>
              <span className="font-semibold text-slate-900">{formatKr(result.layer2Result.monthlyAfdrag)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Combined Results */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Samlet ydelse efter skat"
          value={formatKr(result.combinedMonthlyYdelseEfterSkat)}
          subValue="Månedligt (1. år)"
          highlight={true}
        />
        <MetricCard
          title="Samlet ydelse før skat"
          value={formatKr(result.combinedMonthlyYdelse)}
          subValue="Månedligt (1. år)"
        />
        <MetricCard
          title="Samlet månedligt afdrag"
          value={formatKr(result.combinedMonthlyAfdrag)}
          subValue="Afvikling af gæld"
        />
        <MetricCard
          title="Samlet rente & bidrag"
          value={formatKr(result.combinedTotalRenteOgBidrag)}
          subValue="Over lånets samlede løbetid"
        />
      </div>

      {/* Combined Schedule Table */}
      <AmortizationTable
        calculation={{
          hovedstol: result.layer1Result.hovedstol + result.layer2Result.hovedstol,
          kursvaerdi: totalLoanAmount,
          kurs: 100,
          rente: 0,
          afdragsfriQuarters: 0,
          totalQuarters: 120,
          bidragsSats: 0,
          monthlyYdelse: result.combinedMonthlyYdelse,
          monthlyYdelseEfterSkat: result.combinedMonthlyYdelseEfterSkat,
          monthlyAfdrag: result.combinedMonthlyAfdrag,
          monthlyRenteOgBidrag: 0,
          totalRenteOgBidrag: result.combinedTotalRenteOgBidrag,
          totalBetalt: result.combinedTotalBetalt,
          schedule: result.combinedSchedule,
        }}
        title="Kombineret Annuitetstabel (Lag 1 + Lag 2)"
      />
    </div>
  );
};
