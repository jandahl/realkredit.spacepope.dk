import React, { useMemo } from 'react';
import type { BondLoan } from '../calculator/types';
import { calculateTwoLayerLoan } from '../calculator/twoLayer';
import { getDefaultAfdragsfriYears } from '../calculator/amortization';
import { CurrencyInput } from '../components/CurrencyInput';
import { DependentLoanSelect } from '../components/DependentLoanSelect';
import { MetricCard } from '../components/MetricCard';
import { AmortizationTable } from '../components/AmortizationTable';
import { LoanChart, type ChartSeries } from '../components/LoanChart';
import { formatKr, formatPercent, formatKurs } from '../utils/formatters';
import { Layers } from 'lucide-react';

interface TwoLayerLoanViewProps {
  optagelseLoans: BondLoan[];
  propertyValue: number;
  setPropertyValue: (val: number) => void;
  totalLoanAmount: number;
  setTotalLoanAmount: (val: number) => void;
  splitPercent: number;
  setSplitPercent: (val: number) => void;
  selectedLayer1LoanName: string | null;
  setSelectedLayer1LoanName: (name: string | null) => void;
  selectedLayer2LoanName: string | null;
  setSelectedLayer2LoanName: (name: string | null) => void;
}

export const TwoLayerLoanView: React.FC<TwoLayerLoanViewProps> = ({
  optagelseLoans,
  propertyValue,
  setPropertyValue,
  totalLoanAmount,
  setTotalLoanAmount,
  splitPercent,
  setSplitPercent,
  selectedLayer1LoanName,
  setSelectedLayer1LoanName,
  selectedLayer2LoanName,
  setSelectedLayer2LoanName,
}) => {
  // Defaults: Layer 1 = F-kort, Layer 2 = 4% Fixed med afdrag
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

  const activeLayer1 = useMemo(() => {
    if (selectedLayer1LoanName) {
      const found = optagelseLoans.find((l) => l.name === selectedLayer1LoanName);
      if (found) return found;
    }
    return defaultLayer1;
  }, [optagelseLoans, selectedLayer1LoanName, defaultLayer1]);

  const activeLayer2 = useMemo(() => {
    if (selectedLayer2LoanName) {
      const found = optagelseLoans.find((l) => l.name === selectedLayer2LoanName);
      if (found) return found;
    }
    return defaultLayer2;
  }, [optagelseLoans, selectedLayer2LoanName, defaultLayer2]);

  const totalYears = useMemo(() => {
    const y1 = activeLayer1?.loebetid ?? 30;
    const y2 = activeLayer2?.loebetid ?? 30;
    return Math.max(y1, y2);
  }, [activeLayer1, activeLayer2]);

  const result = useMemo(() => {
    if (!activeLayer1 || !activeLayer2) return null;
    if (!(activeLayer1.kurs > 0) || !(activeLayer2.kurs > 0)) return null;
    return calculateTwoLayerLoan(
      propertyValue,
      totalLoanAmount,
      splitPercent,
      activeLayer1,
      activeLayer2,
      totalYears * 4,
      undefined,
      activeLayer1.afdragsfri ? getDefaultAfdragsfriYears(activeLayer1) : undefined,
      activeLayer2.afdragsfri ? getDefaultAfdragsfriYears(activeLayer2) : undefined
    );
  }, [propertyValue, totalLoanAmount, splitPercent, activeLayer1, activeLayer2, totalYears]);

  // Generate chart data: Restgæld for Lag 1, Lag 2 and Samlet
  const chartSeries = useMemo<ChartSeries[]>(() => {
    if (!result) return [];

    const combinedData: number[] = [result.layer1Result.hovedstol + result.layer2Result.hovedstol];
    const layer1Data: number[] = [result.layer1Result.hovedstol];
    const layer2Data: number[] = [result.layer2Result.hovedstol];

    for (let y = 1; y <= totalYears; y++) {
      const qIndex = Math.min(y * 4 - 1, result.combinedSchedule.length - 1);
      combinedData.push(result.combinedSchedule[qIndex]?.endRestgaeld ?? 0);
      layer1Data.push(result.layer1Result.schedule[qIndex]?.endRestgaeld ?? 0);
      layer2Data.push(result.layer2Result.schedule[qIndex]?.endRestgaeld ?? 0);
    }

    return [
      {
        id: 'combined',
        name: 'Samlet restgæld',
        color: '#2563eb', // Blue
        data: combinedData,
      },
      {
        id: 'layer2',
        name: `Lag 2 Top (${activeLayer2.name})`,
        color: '#8b5cf6', // Purple
        strokeDash: '4 4',
        data: layer2Data,
      },
      {
        id: 'layer1',
        name: `Lag 1 Bund (${activeLayer1.name})`,
        color: '#10b981', // Emerald
        strokeDash: '2 2',
        data: layer1Data,
      },
    ];
  }, [result, activeLayer1, activeLayer2, totalYears]);

  if (!activeLayer1 || !activeLayer2 || !result) {
    return <div className="p-6 text-center text-slate-500 dark:text-slate-400">Indlæser lån...</div>;
  }

  const totalLtv = Math.round((totalLoanAmount / propertyValue) * 100);

  return (
    <div className="flex flex-col gap-5 pb-8">
      {/* Header */}
      <div className="rounded-xl bg-white border border-slate-200 p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900 transition-colors">
        <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-semibold text-sm mb-0.5">
          <Layers className="h-4 w-4" />
          <span>To-lags belåning</span>
        </div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Kombinér to realkreditlån</h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Opdel dit lån i to lag – f.eks. et afdragsfrit variabelt lån i bunden (0–40 %) og et fastforrentet lån med afdrag i toppen (40–80 %) for at minimere bidragssats og optimere gældsafviklingen.
        </p>
      </div>

      {/* Inputs */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Left: Global Property / Debt (no sliders on currency) */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900 flex flex-col gap-3 transition-colors">
          <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100 border-b border-slate-100 dark:border-slate-800 pb-2">
            Bolig & Samlet Lån
          </h3>

          <CurrencyInput
            label="Ejendomsværdi"
            value={propertyValue}
            onChange={setPropertyValue}
            min={500_000}
            max={20_000_000}
            step={100_000}
            showSlider={false}
          />

          <CurrencyInput
            label="Samlet lånebeløb"
            value={totalLoanAmount}
            onChange={setTotalLoanAmount}
            min={100_000}
            max={Math.min(propertyValue * 0.8, 15_000_000)}
            step={50_000}
            helpText={`Samlet LTV: ${totalLtv} %`}
            showSlider={false}
          />

          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between items-center">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Opdelingspunkt (Lag 1 / Lag 2)</label>
              <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">{splitPercent} % LTV</span>
            </div>
            <input
              type="range"
              min={20}
              max={60}
              step={5}
              value={splitPercent}
              onChange={(e) => setSplitPercent(parseInt(e.target.value, 10))}
              className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-slate-200 accent-blue-600 focus:outline-none dark:bg-slate-700 dark:accent-blue-500"
            />
            <div className="flex justify-between text-[11px] text-slate-400">
              <span>20 % LTV</span>
              <span>40 % LTV</span>
              <span>60 % LTV</span>
            </div>
          </div>
        </div>

        {/* Middle: Layer 1 Loan */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900 flex flex-col gap-3 transition-colors">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-2">
            <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase">Lag 1 (0 – {splitPercent} %)</span>
            <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">Bundlån ({formatKr(result.layer1Amount)})</h3>
          </div>

          <DependentLoanSelect
            label="Vælg lån til Lag 1"
            loans={optagelseLoans}
            selectedLoan={activeLayer1}
            onSelectLoan={(l) => setSelectedLayer1LoanName(l.name)}
            subtext={`Kurs ${formatKurs(activeLayer1.kurs)} • Rente ${formatPercent(activeLayer1.rente)}`}
          />

          <div className="rounded-xl bg-slate-50 dark:bg-slate-800/60 p-3.5 text-xs text-slate-600 dark:text-slate-400 border border-slate-100 dark:border-slate-800 space-y-1.5 mt-auto">
            <div className="flex justify-between">
              <span>Hovedstol:</span>
              <span className="font-semibold text-slate-900 dark:text-slate-100">{formatKr(result.layer1Result.hovedstol)}</span>
            </div>
            <div className="flex justify-between">
              <span>Effektiv bidragssats:</span>
              <span className="font-semibold text-slate-900 dark:text-slate-100">{formatPercent(result.layer1Result.bidragsSats * 100)}</span>
            </div>
            <div className="flex justify-between">
              <span>Mdl. ydelse efter skat:</span>
              <span className="font-semibold text-slate-900 dark:text-slate-100">{formatKr(result.layer1Result.monthlyYdelseEfterSkat)}</span>
            </div>
            <div className="flex justify-between">
              <span>Mdl. afdrag:</span>
              <span className="font-semibold text-slate-900 dark:text-slate-100">{formatKr(result.layer1Result.monthlyAfdrag)}</span>
            </div>
          </div>
        </div>

        {/* Right: Layer 2 Loan */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900 flex flex-col gap-3 transition-colors">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-2">
            <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 uppercase">Lag 2 ({splitPercent} – {totalLtv} %)</span>
            <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">Toplån ({formatKr(result.layer2Amount)})</h3>
          </div>

          <DependentLoanSelect
            label="Vælg lån til Lag 2"
            loans={optagelseLoans}
            selectedLoan={activeLayer2}
            onSelectLoan={(l) => setSelectedLayer2LoanName(l.name)}
            subtext={`Kurs ${formatKurs(activeLayer2.kurs)} • Rente ${formatPercent(activeLayer2.rente)}`}
          />

          <div className="rounded-xl bg-slate-50 dark:bg-slate-800/60 p-3.5 text-xs text-slate-600 dark:text-slate-400 border border-slate-100 dark:border-slate-800 space-y-1.5 mt-auto">
            <div className="flex justify-between">
              <span>Hovedstol:</span>
              <span className="font-semibold text-slate-900 dark:text-slate-100">{formatKr(result.layer2Result.hovedstol)}</span>
            </div>
            <div className="flex justify-between">
              <span>Effektiv bidragssats:</span>
              <span className="font-semibold text-slate-900 dark:text-slate-100">{formatPercent(result.layer2Result.bidragsSats * 100)}</span>
            </div>
            <div className="flex justify-between">
              <span>Mdl. ydelse efter skat:</span>
              <span className="font-semibold text-slate-900 dark:text-slate-100">{formatKr(result.layer2Result.monthlyYdelseEfterSkat)}</span>
            </div>
            <div className="flex justify-between">
              <span>Mdl. afdrag:</span>
              <span className="font-semibold text-slate-900 dark:text-slate-100">{formatKr(result.layer2Result.monthlyAfdrag)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Combined Results */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
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

      {/* Graphical Chart of Restgæld Progression */}
      <LoanChart
        title="Restgældsudvikling for To-lags belåning"
        subtitle="Samlet gældsafvikling opdelt på Lag 1 og Lag 2"
        years={totalYears}
        series={chartSeries}
      />

      {/* Unfoldable Combined Schedule Table */}
      <AmortizationTable
        calculation={{
          hovedstol: result.layer1Result.hovedstol + result.layer2Result.hovedstol,
          kursvaerdi: totalLoanAmount,
          kurs: 100,
          rente: 0,
          afdragsfriQuarters: 0,
          totalQuarters: totalYears * 4,
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
        defaultOpen={false}
      />
    </div>
  );
};
