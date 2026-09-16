import React, { useState, useMemo, useEffect } from 'react';
import type { BondLoan } from '../calculator/types';
import { calculateRefinancing } from '../calculator/refinancing';
import { CurrencyInput } from '../components/CurrencyInput';
import { DependentLoanSelect } from '../components/DependentLoanSelect';
import { MetricCard } from '../components/MetricCard';
import { AmortizationTable } from '../components/AmortizationTable';
import { LoanChart, type ChartSeries } from '../components/LoanChart';
import { BreakevenChart } from '../components/BreakevenChart';
import { DumbIdeasModal } from '../components/DumbIdeasModal';
import { formatKr, formatKurs } from '../utils/formatters';
import { Sparkles, Banknote, HelpCircle, ChevronDown, ChevronUp, Receipt, Lightbulb } from 'lucide-react';

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
  // Tillægslån / Friværdiudtag state
  const [enableFrivaerdi, setEnableFrivaerdi] = useState<boolean>(false);
  const [frivaerdiUdbetalt, setFrivaerdiUdbetalt] = useState<number>(0);
  const [showFees, setShowFees] = useState<boolean>(false);
  const [showDumbIdeas, setShowDumbIdeas] = useState<boolean>(false);

  // New loan duration state (defaults to new bond maturity or 30)
  const [newLoanYears, setNewLoanYears] = useState<number>(30);

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

  // Dynamically calculate max remaining years based on existing loan udløbsår
  const maxExistingYears = useMemo(() => {
    if (!activeExisting) return 30;
    const currentYear = 2026;
    let maturityYear: number | undefined = activeExisting.udloebsAar;

    if (!maturityYear) {
      const match = activeExisting.name.match(/\b(20\d\d)\b/);
      if (match) maturityYear = parseInt(match[1], 10);
    }

    if (maturityYear) {
      return Math.max(1, Math.min(30, maturityYear - currentYear));
    }
    if (activeExisting.loebetid) {
      return Math.max(1, Math.min(30, activeExisting.loebetid));
    }
    return 30;
  }, [activeExisting]);

  // Adjust remainingYears if it exceeds the new maxExistingYears
  useEffect(() => {
    if (remainingYears > maxExistingYears) {
      setRemainingYears(maxExistingYears);
    }
  }, [maxExistingYears, remainingYears, setRemainingYears]);

  // Update newLoanYears when new loan changes
  useEffect(() => {
    if (activeNew?.loebetid) {
      setNewLoanYears(activeNew.loebetid);
    }
  }, [activeNew]);

  // Maximum equity payout at 80% LTV
  const max80LtvCash = propertyValue * 0.80;
  const redemptionPrice = activeExisting ? Math.min(100, activeExisting.kurs) : 100;
  const existingRedemptionCash = (debt * redemptionPrice) / 100;
  const maxPossibleFrivaerdi = Math.max(0, Math.floor(max80LtvCash - existingRedemptionCash));

  const effectiveFrivaerdi = enableFrivaerdi ? Math.min(frivaerdiUdbetalt, maxPossibleFrivaerdi) : 0;

  const comparison = useMemo(() => {
    if (!activeExisting || !activeNew) return null;
    return calculateRefinancing(
      activeExisting,
      debt,
      activeNew,
      propertyValue,
      remainingYears,
      newLoanYears,
      effectiveFrivaerdi
    );
  }, [activeExisting, activeNew, debt, propertyValue, remainingYears, newLoanYears, effectiveFrivaerdi]);

  // Generate chart data: Restgæld pr. år up to the longest loan duration (maxYears)
  const chartSeries = useMemo<ChartSeries[]>(() => {
    if (!comparison) return [];
    const maxYears = comparison.maxYears;

    const existingData: number[] = [comparison.existingRestgaeld];
    for (let y = 1; y <= maxYears; y++) {
      if (y <= comparison.existingYears) {
        const qIndex = Math.min(y * 4 - 1, comparison.existingSchedule.schedule.length - 1);
        existingData.push(comparison.existingSchedule.schedule[qIndex]?.endRestgaeld ?? 0);
      } else {
        // Loan fully amortized / repaid
        existingData.push(0);
      }
    }

    const newData: number[] = [comparison.nyHovedstol];
    for (let y = 1; y <= maxYears; y++) {
      if (y <= comparison.newYears) {
        const qIndex = Math.min(y * 4 - 1, comparison.newSchedule.schedule.length - 1);
        newData.push(comparison.newSchedule.schedule[qIndex]?.endRestgaeld ?? 0);
      } else {
        // Loan fully amortized / repaid
        newData.push(0);
      }
    }

    return [
      {
        id: 'new',
        name: `Nyt lån (${activeNew.name} - ${comparison.newYears} år)`,
        color: '#2563eb', // Blue
        data: newData,
      },
      {
        id: 'existing',
        name: `Nuværende lån (${activeExisting.name} - ${comparison.existingYears} år)`,
        color: '#f59e0b', // Amber
        strokeDash: '5 5',
        data: existingData,
      },
    ];
  }, [comparison, activeExisting, activeNew]);

  // Compute breakeven years for analysis
  const breakevenYears = useMemo<number | null>(() => {
    if (!comparison) return null;
    const totalQuarters = Math.round(comparison.maxYears * 4);
    let cumsum = 0;
    const initialDelta = comparison.newSchedule.hovedstol - comparison.existingSchedule.hovedstol;
    let prevBalance = initialDelta;

    for (let q = 0; q < totalQuarters; q++) {
      const oldRow = comparison.existingSchedule.schedule[q] || { endRestgaeld: 0, ydelseEfterSkat: 0 };
      const newRow = comparison.newSchedule.schedule[q] || { endRestgaeld: 0, ydelseEfterSkat: 0 };
      cumsum += (newRow.ydelseEfterSkat - oldRow.ydelseEfterSkat);
      const deltaRest = newRow.endRestgaeld - oldRow.endRestgaeld;
      const balance = cumsum + deltaRest;

      if (prevBalance < 0 && balance >= 0) {
        const fraction = -prevBalance / (balance - prevBalance);
        return (q + fraction) / 4;
      }
      prevBalance = balance;
    }
    return null;
  }, [comparison]);

  if (!activeExisting || !activeNew || !comparison) {
    return <div className="p-8 text-center text-slate-500 dark:text-slate-400">Indlæser lånedata...</div>;
  }

  const isDebtReduced = comparison.deltaRestgaeld < 0;
  const isPaymentLower = comparison.deltaMonthlyYdelseEfterSkat < 0;

  return (
    <div className="flex flex-col gap-8 pb-12">
      {/* Intro Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-blue-700 via-indigo-700 to-slate-900 p-6 sm:p-8 text-white shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-medium backdrop-blur-md mb-3">
              <Sparkles className="h-3.5 w-3.5 text-amber-300" />
              <span>Konverteringsberegner med live kurser</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Beregn omlægning af dit realkreditlån
            </h2>
            <p className="mt-2 text-sm sm:text-base text-blue-100/90 leading-relaxed">
              Se hvad du kan skære af din restgæld ved en opkonvertering, hvad du sparer ved en nedkonvertering,
              eller beregn et tillægslån med friværdi udbetalt.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowDumbIdeas(true)}
            className="self-start sm:self-center inline-flex items-center gap-2 rounded-xl bg-amber-400 px-4 py-2.5 text-xs sm:text-sm font-bold text-slate-900 shadow-md hover:bg-amber-300 transition-all cursor-pointer shrink-0"
          >
            <Lightbulb className="h-4 w-4 text-slate-900" />
            <span>DUMB IDEAS (Reality Check)</span>
          </button>
        </div>
      </div>

      {/* Input Section */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Left Card: Property & Debt Inputs (no slider on currency fields) */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900 flex flex-col gap-5 transition-colors">
          <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100 border-b border-slate-100 dark:border-slate-800 pb-3">
            1. Din bolig & restgæld
          </h3>

          <CurrencyInput
            label="Ejendomsværdi"
            value={propertyValue}
            onChange={setPropertyValue}
            min={500_000}
            max={25_000_000}
            step={100_000}
            helpText={`Belåning (LTV): ${Math.round((debt / propertyValue) * 100)} %`}
            showSlider={false}
          />

          <CurrencyInput
            label="Nuværende restgæld"
            value={debt}
            onChange={setDebt}
            min={100_000}
            max={Math.min(propertyValue, 20_000_000)}
            step={50_000}
            showSlider={false}
          />

          {/* Resterende løbetid (kun for Nuværende lån, maks styret af udløbsår) */}
          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between items-center">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Resterende løbetid (Nuværende lån)
              </label>
              <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                {remainingYears} år (maks {maxExistingYears} år)
              </span>
            </div>
            <input
              type="range"
              min={1}
              max={maxExistingYears}
              step={1}
              value={remainingYears}
              onChange={(e) => setRemainingYears(parseInt(e.target.value, 10))}
              className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-slate-200 accent-blue-600 focus:outline-none dark:bg-slate-700 dark:accent-blue-500"
            />
            <div className="flex justify-between text-[11px] text-slate-400">
              <span>1 år</span>
              <span>{Math.round(maxExistingYears / 2)} år</span>
              <span>{maxExistingYears} år ({activeExisting.udloebsAar || 'udløb'})</span>
            </div>
          </div>

          {/* Tillægslån / Friværdiudtag Section */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/75 dark:bg-slate-800/40 p-4 transition-colors">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm font-semibold text-slate-800 dark:text-slate-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={enableFrivaerdi}
                  onChange={(e) => {
                    setEnableFrivaerdi(e.target.checked);
                    if (e.target.checked && frivaerdiUdbetalt === 0) {
                      setFrivaerdiUdbetalt(Math.min(200_000, maxPossibleFrivaerdi));
                    }
                  }}
                  className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-700"
                />
                <span className="flex items-center gap-1.5">
                  <Banknote className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  Udtag friværdi (Tillægslån)
                </span>
              </label>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                Friværdi: {formatKr(propertyValue - debt)}
              </span>
            </div>

            {enableFrivaerdi && (
              <div className="mt-3 pt-3 border-t border-slate-200/80 dark:border-slate-700/80 flex flex-col gap-2.5">
                <CurrencyInput
                  label="Ønsket udbetalt til din konto"
                  value={frivaerdiUdbetalt}
                  onChange={setFrivaerdiUdbetalt}
                  min={0}
                  max={maxPossibleFrivaerdi}
                  step={25_000}
                  helpText={`Maksimalt til 80 % LTV: ${formatKr(maxPossibleFrivaerdi)}`}
                  showSlider={true}
                />
                <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                  <span>Samlet belåning inkl. udtag:</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-200">
                    {formatKr(debt + frivaerdiUdbetalt)} ({Math.round(((debt + frivaerdiUdbetalt) / (propertyValue || 1)) * 100)} % LTV)
                  </span>
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 leading-normal">
                  Dette beløb overføres til din konto. Låneomkostninger og gebyrer medfinansieres i det nye lån.
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Card: Dependent Loan Selection */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900 flex flex-col gap-5 transition-colors">
          <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100 border-b border-slate-100 dark:border-slate-800 pb-3">
            2. Vælg lån til sammenligning
          </h3>

          <DependentLoanSelect
            label="Nuværende lån (indfrielse)"
            loans={indfrielseLoans}
            selectedLoan={activeExisting}
            onSelectLoan={(l) => setSelectedExistingLoanName(l.name)}
            subtext={`Obligationskurs: ${formatKurs(activeExisting.kurs)} • Indfrielseskurs: ${formatKurs(Math.min(100, activeExisting.kurs))}`}
          />

          <div className="border-t border-slate-100 dark:border-slate-800 pt-3">
            <DependentLoanSelect
              label="Nyt lån (optagelse)"
              loans={optagelseLoans}
              selectedLoan={activeNew}
              onSelectLoan={(l) => setSelectedNewLoanName(l.name)}
              subtext={`Aktuel optagelseskurs: ${formatKurs(activeNew.kurs)} • Løbetid ${newLoanYears} år`}
            />
          </div>

          {/* New loan duration slider if flexible */}
          <div className="flex flex-col gap-1.5 border-t border-slate-100 dark:border-slate-800 pt-3">
            <div className="flex justify-between items-center">
              <label className="text-xs font-medium text-slate-600 dark:text-slate-400">
                Løbetid på det nye lån
              </label>
              <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">
                {newLoanYears} år
              </span>
            </div>
            <input
              type="range"
              min={10}
              max={30}
              step={5}
              value={newLoanYears}
              onChange={(e) => setNewLoanYears(parseInt(e.target.value, 10))}
              className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-slate-200 accent-blue-600 focus:outline-none dark:bg-slate-700 dark:accent-blue-500"
            />
            <div className="flex justify-between text-[10px] text-slate-400">
              <span>10 år</span>
              <span>20 år</span>
              <span>30 år</span>
            </div>
          </div>
        </div>
      </div>

      {/* Kursgevinst & Kurstab Breakdown */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900 transition-colors">
        <div className="flex items-center gap-2 mb-3">
          <HelpCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
            Hvad betyder kursen for din restgæld og udbetaling?
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-2">
          {/* 1. Indfrielse Kursgevinst */}
          <div className="rounded-xl border border-emerald-200/80 bg-emerald-50/40 p-4 dark:border-emerald-900/50 dark:bg-emerald-950/20">
            <div className="text-xs font-semibold uppercase text-emerald-800 dark:text-emerald-300">
              Kursgevinst ved indfrielse
            </div>
            <div className="mt-1 text-2xl font-bold text-emerald-700 dark:text-emerald-400">
              {formatKr(comparison.kursgevinstIndfrielse)}
            </div>
            <div className="mt-2 text-xs text-emerald-900/80 dark:text-emerald-400/80 leading-relaxed">
              Dine gamle obligationer indfries til kurs {formatKurs(redemptionPrice)}. For hver 100 kr. pålydende gæld betaler du kun {formatKurs(redemptionPrice)} kr.
            </div>
          </div>

          {/* 2. Tillægslån udbetaling */}
          <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 dark:border-slate-800 dark:bg-slate-800/40">
            <div className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">
              Udbetalt til din konto
            </div>
            <div className="mt-1 text-2xl font-bold text-slate-900 dark:text-slate-100">
              {formatKr(comparison.frivaerdiUdbetalt)}
            </div>
            <div className="mt-2 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              {enableFrivaerdi ? (
                <>
                  Gebyrer ({formatKr(comparison.fees.samledeOmkostninger)}) er medfinansieret i det nye lån.
                </>
              ) : (
                `Samlet kontantbehov: ${formatKr(comparison.samletKontantbehov)} til indfrielse og omk.`
              )}
            </div>
          </div>

          {/* 3. Optagelse Kurstab */}
          <div className="rounded-xl border border-amber-200/80 bg-amber-50/40 p-4 dark:border-amber-900/50 dark:bg-amber-950/20">
            <div className="text-xs font-semibold uppercase text-amber-800 dark:text-amber-300">
              Kurstab ved optagelse
            </div>
            <div className="mt-1 text-2xl font-bold text-amber-700 dark:text-amber-400">
              {formatKr(comparison.kurstabOptagelse)}
            </div>
            <div className="mt-2 text-xs text-amber-900/80 dark:text-amber-400/80 leading-relaxed">
              Nyt lån udstedes til kurs {formatKurs(comparison.newKurs)}. For hver 100 kr. pålydende gæld får du kun {formatKurs(comparison.newKurs)} kr. udbetalt.
            </div>
          </div>

          {/* 4. Netto ændring i obligationsgæld */}
          <div className="rounded-xl border border-blue-200/80 bg-blue-50/40 p-4 dark:border-blue-900/50 dark:bg-blue-950/20">
            <div className="text-xs font-semibold uppercase text-blue-800 dark:text-blue-300">
              Netto ændring i restgæld
            </div>
            <div className={`mt-1 text-2xl font-bold ${isDebtReduced ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-900 dark:text-slate-100'}`}>
              {comparison.deltaRestgaeld > 0 ? '+' : ''}{formatKr(comparison.deltaRestgaeld)}
            </div>
            <div className="mt-2 text-xs text-blue-900/80 dark:text-blue-400/80 leading-relaxed">
              Ny hovedstol: {formatKr(comparison.nyHovedstol)} (mod tidligere {formatKr(comparison.existingRestgaeld)}).
            </div>
          </div>
        </div>

        {/* Omkostninger & Gebyrer Accordion */}
        <div className="mt-5 border-t border-slate-200/80 dark:border-slate-800 pt-4">
          <button
            type="button"
            onClick={() => setShowFees(!showFees)}
            className="flex w-full items-center justify-between text-left text-sm font-medium text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Receipt className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <span>Estimat over låneomkostninger og gebyrer: <strong className="text-slate-900 dark:text-slate-100">{formatKr(comparison.fees.samledeOmkostninger)}</strong> (medfinansieret i lånet)</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400 font-medium">
              <span>{showFees ? 'Skjul specifikation' : 'Vis specifikation'}</span>
              {showFees ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </div>
          </button>

          {showFees && (
            <div className="mt-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
              <div className="flex flex-col gap-1">
                <span className="text-slate-500 dark:text-slate-400">Tinglysningsafgift (§ 5a)</span>
                <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">{formatKr(comparison.fees.tinglysningTotal)}</span>
                <span className="text-[11px] text-slate-400">
                  Fast {formatKr(comparison.fees.tinglysningFast)} + 1,45 % af gældsforhøjelse ({formatKr(comparison.fees.tinglysningVariabel)})
                </span>
              </div>

              <div className="flex flex-col gap-1">
                <span className="text-slate-500 dark:text-slate-400">Kurtage (0,15 %)</span>
                <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">{formatKr(comparison.fees.kurtage)}</span>
                <span className="text-[11px] text-slate-400">0,15 % af nye obligationers kursværdi</span>
              </div>

              <div className="flex flex-col gap-1">
                <span className="text-slate-500 dark:text-slate-400">Bank & institutgebyrer</span>
                <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">{formatKr(comparison.fees.gebyrerInstitutOgBank)}</span>
                <span className="text-[11px] text-slate-400">Stiftelse, ekspedition & indfrielse</span>
              </div>

              <div className="flex flex-col gap-1 bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-slate-200 dark:border-slate-700">
                <span className="text-slate-500 dark:text-slate-400 font-medium">Udbetalt til NemKonto</span>
                <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                  {enableFrivaerdi ? formatKr(comparison.frivaerdiUdbetalt) : '0 kr.'}
                </span>
                <span className="text-[11px] text-slate-400">
                  {enableFrivaerdi ? 'Direkte overførsel uden fradrag for omkostninger' : 'Ingen friværdi hævet'}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Key Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Ny restgæld (Hovedstol)"
          value={formatKr(comparison.nyHovedstol)}
          subValue={`Før: ${formatKr(comparison.existingRestgaeld)}`}
          delta={{
            text: isDebtReduced ? `${formatKr(Math.abs(comparison.deltaRestgaeld))} lavere` : `${formatKr(comparison.deltaRestgaeld)} højere`,
            type: isDebtReduced ? 'positive' : 'negative',
          }}
          highlight={true}
        />

        <MetricCard
          title="Månedlig ydelse efter skat"
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
          title="Udbetalt til din konto"
          value={enableFrivaerdi ? formatKr(comparison.frivaerdiUdbetalt) : '0 kr.'}
          subValue={enableFrivaerdi ? `Omk. ${formatKr(comparison.fees.samledeOmkostninger)} medfinansieret` : 'Ren omlægning'}
          delta={{
            text: `Ny LTV: ${Math.round((comparison.nyHovedstol / propertyValue) * 100)} %`,
            type: 'neutral',
          }}
        />
      </div>

      {/* Breakeven Graph (scaled to longest loan duration) */}
      <BreakevenChart
        existingSchedule={comparison.existingSchedule}
        newSchedule={comparison.newSchedule}
        maxYears={comparison.maxYears}
        onOpenDumbIdeas={() => setShowDumbIdeas(true)}
      />

      {/* Graphical Chart of Restgæld Progression (scaled to longest loan duration) */}
      <LoanChart
        title="Restgældsudvikling over tid"
        subtitle={`Sammenligning over ${comparison.maxYears} år (Nuværende lån ${comparison.existingYears} år vs. Nyt lån ${comparison.newYears} år)`}
        years={comparison.maxYears}
        series={chartSeries}
      />

      {/* Unfoldable Amortization Tables */}
      <div className="space-y-4">
        <AmortizationTable
          calculation={comparison.newSchedule}
          title={`Annuitetstabel for Nyt Lån (${activeNew.name} - ${comparison.newYears} år)`}
          defaultOpen={false}
        />
        <AmortizationTable
          calculation={comparison.existingSchedule}
          title={`Annuitetstabel for Nuværende Lån (${activeExisting.name} - ${comparison.existingYears} år)`}
          defaultOpen={false}
        />
      </div>

      {/* Dumb Ideas / Reality Check Modal */}
      <DumbIdeasModal
        isOpen={showDumbIdeas}
        onClose={() => setShowDumbIdeas(false)}
        comparison={comparison}
        breakevenYears={breakevenYears}
      />
    </div>
  );
};
