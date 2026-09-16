import React, { useState, useMemo, useEffect } from 'react';
import type { BondLoan, LoanAmortizationResult, QuarterlyScheduleRow } from '../calculator/types';
import { calculateRefinancing } from '../calculator/refinancing';
import { calculateTillaegslaanComparison } from '../calculator/tillaegslaan';
import { CurrencyInput } from '../components/CurrencyInput';
import { DependentLoanSelect } from '../components/DependentLoanSelect';
import { MetricCard } from '../components/MetricCard';
import { AmortizationTable } from '../components/AmortizationTable';
import { LoanChart, type ChartSeries } from '../components/LoanChart';
import { BreakevenChart } from '../components/BreakevenChart';
import { DumbIdeasModal } from '../components/DumbIdeasModal';
import { TillaegslaanComparator } from '../components/TillaegslaanComparator';
import { formatKr, formatKurs } from '../utils/formatters';
import { Sparkles, Banknote, HelpCircle, ChevronDown, ChevronUp, Receipt, Lightbulb, TrendingUp, TrendingDown } from 'lucide-react';

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
  enableFrivaerdi: boolean;
  setEnableFrivaerdi: (val: boolean) => void;
  frivaerdiUdbetalt: number;
  setFrivaerdiUdbetalt: (val: number) => void;
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
  enableFrivaerdi,
  setEnableFrivaerdi,
  frivaerdiUdbetalt,
  setFrivaerdiUdbetalt,
}) => {
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

  // Maximum years possible for the selected new bond based on actual maturity year (2049 = 23 years in 2026)
  const maxNewLoanYears = useMemo(() => {
    if (!activeNew) return 30;
    const currentYear = 2026;
    let maturityYear: number | undefined = activeNew.udloebsAar;
    if (!maturityYear) {
      const match = activeNew.name.match(/\b(20\d\d)\b/);
      if (match) maturityYear = parseInt(match[1], 10);
    }

    if (maturityYear) {
      return Math.max(1, Math.min(30, maturityYear - currentYear));
    }
    if (activeNew.loebetid) {
      return Math.max(1, Math.min(30, activeNew.loebetid));
    }
    return 30;
  }, [activeNew]);

  // Update newLoanYears when new loan changes or if it exceeds maxNewLoanYears
  useEffect(() => {
    setNewLoanYears((prev) => Math.min(prev, maxNewLoanYears));
  }, [activeNew, maxNewLoanYears]);

  // Remaining interest-free years for existing loan (0 to Math.min(10, remainingYears))
  const [existingAfdragsfriYears, setExistingAfdragsfriYears] = useState<number>(10);
  // Remaining interest-free years for new loan (0 to max allowed by new bond)
  const [newAfdragsfriYears, setNewAfdragsfriYears] = useState<number>(0);
  // Friværdi strategy selector: Option A (Fuld omlægning) vs Option B (Tillægslån)
  const [frivaerdiStrategy, setFrivaerdiStrategy] = useState<'omlaegning' | 'tillaeg'>('omlaegning');

  // Sync existingAfdragsfriYears when activeExisting changes or remainingYears changes
  useEffect(() => {
    if (activeExisting) {
      if (!activeExisting.afdragsfri) {
        setExistingAfdragsfriYears(0);
      } else {
        const maxOriginalAfdragsfri = activeExisting.name.includes('30 års afdragsfri') ? 30 : 10;
        const elapsedYears = Math.max(0, 30 - remainingYears);
        const remainingAfdragsfri = Math.max(0, Math.min(remainingYears, maxOriginalAfdragsfri - elapsedYears));
        setExistingAfdragsfriYears(remainingAfdragsfri);
      }
    }
  }, [activeExisting, remainingYears]);

  // Sync newAfdragsfriYears when activeNew changes
  useEffect(() => {
    if (activeNew) {
      if (!activeNew.afdragsfri) {
        setNewAfdragsfriYears(0);
      } else {
        const defaultAfdragsfri = activeNew.name.includes('30 års afdragsfri') ? 30 : 10;
        setNewAfdragsfriYears((prev) => (prev === 0 ? defaultAfdragsfri : Math.min(prev, defaultAfdragsfri)));
      }
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
      effectiveFrivaerdi,
      existingAfdragsfriYears
    );
  }, [activeExisting, activeNew, debt, propertyValue, remainingYears, newLoanYears, effectiveFrivaerdi, existingAfdragsfriYears]);

  const tillaegslaanComparison = useMemo(() => {
    if (!enableFrivaerdi || effectiveFrivaerdi <= 0 || !activeExisting || !activeNew) return null;
    return calculateTillaegslaanComparison(
      activeExisting,
      debt,
      activeNew,
      propertyValue,
      remainingYears,
      newLoanYears,
      effectiveFrivaerdi,
      existingAfdragsfriYears
    );
  }, [enableFrivaerdi, effectiveFrivaerdi, activeExisting, activeNew, debt, propertyValue, remainingYears, newLoanYears, existingAfdragsfriYears]);

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

    const isNewFlex = Boolean(activeNew.flex) || activeNew.name.toLowerCase().includes('f-kort');

    // Uncertainty band for variable rate (F-kort / Flex): rate volatility assumption (+/- 2% widening over time)
    let newUpper: number[] | undefined;
    let newLower: number[] | undefined;

    if (isNewFlex) {
      newUpper = newData.map((val, y) => val > 0 ? Math.min(val * (1 + 0.015 * y), val * 1.35) : 0);
      newLower = newData.map((val, y) => val > 0 ? Math.max(0, val * (1 - 0.015 * y)) : 0);
    }

    const seriesList: ChartSeries[] = [
      {
        id: 'new',
        name: `Nyt lån (${activeNew.name} - ${comparison.newYears} år)`,
        color: '#2563eb', // Blue
        data: newData,
        uncertaintyUpper: newUpper,
        uncertaintyLower: newLower,
      },
      {
        id: 'existing',
        name: `Nuværende lån (${activeExisting.name} - ${comparison.existingYears} år)`,
        color: '#f59e0b', // Amber
        strokeDash: '5 5',
        data: existingData,
      },
    ];

    if (tillaegslaanComparison) {
      const tillaegData: number[] = [comparison.existingRestgaeld + tillaegslaanComparison.optionB_tillaegslaan.tillaegHovedstol];
      for (let y = 1; y <= maxYears; y++) {
        let existingRest = 0;
        let tillaegRest = 0;

        if (y <= comparison.existingYears) {
          const qIndex = Math.min(y * 4 - 1, comparison.existingSchedule.schedule.length - 1);
          existingRest = comparison.existingSchedule.schedule[qIndex]?.endRestgaeld ?? 0;
        }
        if (y <= comparison.newYears) {
          const qIndex = Math.min(y * 4 - 1, tillaegslaanComparison.optionB_tillaegslaan.tillaegSchedule.schedule.length - 1);
          tillaegRest = tillaegslaanComparison.optionB_tillaegslaan.tillaegSchedule.schedule[qIndex]?.endRestgaeld ?? 0;
        }
        tillaegData.push(existingRest + tillaegRest);
      }

      let tillaegUpper: number[] | undefined;
      let tillaegLower: number[] | undefined;

      if (isNewFlex) {
        tillaegUpper = tillaegData.map((val, y) => val > 0 ? val + (val - existingData[Math.min(y, existingData.length - 1)]) * 0.015 * y : 0);
        tillaegLower = tillaegData.map((val, y) => val > 0 ? Math.max(0, val - (val - existingData[Math.min(y, existingData.length - 1)]) * 0.015 * y) : 0);
      }

      seriesList.push({
        id: 'tillaegslaan',
        name: `Option B: Behold ${activeExisting.name} + Tillægslån (${activeNew.name})`,
        color: '#10b981', // Emerald green
        strokeDash: '3 3',
        data: tillaegData,
        uncertaintyUpper: tillaegUpper,
        uncertaintyLower: tillaegLower,
      });
    }

    return seriesList;
  }, [comparison, tillaegslaanComparison, activeExisting, activeNew]);

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

  // Option B combined schedule for amortization table
  const optionBSchedule = useMemo<LoanAmortizationResult | null>(() => {
    if (!tillaegslaanComparison || !comparison) return null;
    const existing = comparison.existingSchedule;
    const tillaeg = tillaegslaanComparison.optionB_tillaegslaan.tillaegSchedule;

    const totalQuarters = Math.max(existing.totalQuarters, tillaeg.totalQuarters);
    const schedule: QuarterlyScheduleRow[] = [];

    for (let q = 0; q < totalQuarters; q++) {
      const eRow = existing.schedule[q];
      const tRow = tillaeg.schedule[q];

      const quarter = q + 1;
      const year = Math.floor(q / 4) + 1;
      const quarterOfYear = (q % 4) + 1;

      const startRestgaeld = (eRow?.startRestgaeld ?? 0) + (tRow?.startRestgaeld ?? 0);
      const rente = (eRow?.rente ?? 0) + (tRow?.rente ?? 0);
      const bidrag = (eRow?.bidrag ?? 0) + (tRow?.bidrag ?? 0);
      const afdrag = (eRow?.afdrag ?? 0) + (tRow?.afdrag ?? 0);
      const ydelseFoerSkat = (eRow?.ydelseFoerSkat ?? 0) + (tRow?.ydelseFoerSkat ?? 0);
      const skatFradrag = (eRow?.skatFradrag ?? 0) + (tRow?.skatFradrag ?? 0);
      const ydelseEfterSkat = (eRow?.ydelseEfterSkat ?? 0) + (tRow?.ydelseEfterSkat ?? 0);
      const endRestgaeld = (eRow?.endRestgaeld ?? 0) + (tRow?.endRestgaeld ?? 0);

      schedule.push({
        quarter,
        year,
        quarterOfYear,
        startRestgaeld,
        rente,
        bidrag,
        afdrag,
        ydelseFoerSkat,
        skatFradrag,
        ydelseEfterSkat,
        endRestgaeld,
      });
    }

    return {
      hovedstol: existing.hovedstol + tillaeg.hovedstol,
      kursvaerdi: existing.kursvaerdi + tillaeg.kursvaerdi,
      kurs: existing.kurs,
      rente: existing.rente,
      afdragsfriQuarters: Math.max(existing.afdragsfriQuarters, tillaeg.afdragsfriQuarters),
      totalQuarters,
      bidragsSats: existing.bidragsSats,
      monthlyYdelse: existing.monthlyYdelse + tillaeg.monthlyYdelse,
      monthlyYdelseEfterSkat: existing.monthlyYdelseEfterSkat + tillaeg.monthlyYdelseEfterSkat,
      monthlyAfdrag: existing.monthlyAfdrag + tillaeg.monthlyAfdrag,
      monthlyRenteOgBidrag: existing.monthlyRenteOgBidrag + tillaeg.monthlyRenteOgBidrag,
      totalRenteOgBidrag: existing.totalRenteOgBidrag + tillaeg.totalRenteOgBidrag,
      totalBetalt: existing.totalBetalt + tillaeg.totalBetalt,
      schedule,
    };
  }, [tillaegslaanComparison, comparison]);

  if (!activeExisting || !activeNew || !comparison) {
    return <div className="p-8 text-center text-slate-500 dark:text-slate-400">Indlæser lånedata...</div>;
  }

  // Active Display metrics depending on Option A vs Option B selection
  const isOptionBActive = enableFrivaerdi && frivaerdiStrategy === 'tillaeg' && Boolean(tillaegslaanComparison);

  const displayNyHovedstol = isOptionBActive && tillaegslaanComparison
    ? comparison.existingRestgaeld + tillaegslaanComparison.optionB_tillaegslaan.tillaegHovedstol
    : comparison.nyHovedstol;

  const displayNyMonthlyYdelse = isOptionBActive && tillaegslaanComparison
    ? tillaegslaanComparison.optionB_tillaegslaan.combinedMonthlyYdelseEfterSkat
    : comparison.newSchedule.monthlyYdelseEfterSkat;

  const displayDeltaMonthlyYdelse = isOptionBActive && tillaegslaanComparison
    ? tillaegslaanComparison.optionB_tillaegslaan.tillaegMonthlyYdelseEfterSkat
    : comparison.deltaMonthlyYdelseEfterSkat;

  const displayMonthlyAfdrag = isOptionBActive && tillaegslaanComparison
    ? comparison.existingSchedule.monthlyAfdrag + tillaegslaanComparison.optionB_tillaegslaan.tillaegSchedule.monthlyAfdrag
    : comparison.newSchedule.monthlyAfdrag;

  const displayDeltaAfdrag = isOptionBActive && tillaegslaanComparison
    ? tillaegslaanComparison.optionB_tillaegslaan.tillaegSchedule.monthlyAfdrag
    : comparison.deltaMonthlyAfdrag;

  const displayDeltaRestgaeld = isOptionBActive && tillaegslaanComparison
    ? tillaegslaanComparison.optionB_tillaegslaan.tillaegHovedstol
    : comparison.deltaRestgaeld;

  const displayFees = isOptionBActive && tillaegslaanComparison
    ? tillaegslaanComparison.optionB_tillaegslaan.tillaegOmkostninger
    : comparison.fees.samledeOmkostninger;

  const displayKurstabOptagelse = isOptionBActive && tillaegslaanComparison
    ? Math.max(0, tillaegslaanComparison.optionB_tillaegslaan.tillaegHovedstol - (tillaegslaanComparison.optionB_tillaegslaan.tillaegHovedstol * activeNew.kurs / 100))
    : comparison.kurstabOptagelse;

  const displayKursgevinstIndfrielse = isOptionBActive ? 0 : comparison.kursgevinstIndfrielse;

  const isDebtReduced = displayDeltaRestgaeld < 0;
  const isPaymentLower = displayDeltaMonthlyYdelse < 0;

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
          </div>

          {/* År tilbage med afdragsfrihed (hvis nuværende lån er afdragsfrit) */}
          {activeExisting.afdragsfri && (
            <div className="flex flex-col gap-1.5 rounded-xl border border-amber-200/80 dark:border-amber-900/40 bg-amber-50/40 dark:bg-amber-950/20 p-3.5">
              <div className="flex justify-between items-center">
                <label className="text-xs font-semibold text-amber-900 dark:text-amber-200">
                  År tilbage med afdragsfrihed (Nuværende lån)
                </label>
                <span className="text-xs font-bold text-amber-600 dark:text-amber-400">
                  {existingAfdragsfriYears} {existingAfdragsfriYears === 1 ? 'år' : 'år'}
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={Math.min(10, remainingYears)}
                step={1}
                value={existingAfdragsfriYears}
                onChange={(e) => setExistingAfdragsfriYears(parseInt(e.target.value, 10))}
                className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-slate-200 accent-amber-600 focus:outline-none dark:bg-slate-700 dark:accent-amber-500"
              />
              <div className="flex justify-between text-[10px] text-slate-500 dark:text-slate-400">
                <span>0 år (afdrager fra i dag)</span>
                <span>{Math.min(10, remainingYears)} år tilbage</span>
              </div>
            </div>
          )}

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

                {/* Segmented strategy selector */}
                <div className="flex flex-col gap-1.5 pt-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Vælg strategi for friværdiudtag:
                  </label>
                  <div className="flex items-center rounded-xl bg-slate-200/80 dark:bg-slate-800 p-1 text-xs font-semibold">
                    <button
                      type="button"
                      onClick={() => setFrivaerdiStrategy('omlaegning')}
                      className={`flex-1 py-2 px-3 rounded-lg text-center transition-all cursor-pointer ${
                        frivaerdiStrategy === 'omlaegning'
                          ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs font-bold'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      Option A: Fuld Omlægning
                    </button>
                    <button
                      type="button"
                      onClick={() => setFrivaerdiStrategy('tillaeg')}
                      className={`flex-1 py-2 px-3 rounded-lg text-center transition-all cursor-pointer ${
                        frivaerdiStrategy === 'tillaeg'
                          ? 'bg-emerald-600 text-white shadow-xs font-bold'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      Option B: Tillægslån
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-1">
                  <span>Samlet belåning inkl. udtag:</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-200">
                    {formatKr(debt + frivaerdiUdbetalt)} ({Math.round(((debt + frivaerdiUdbetalt) / (propertyValue || 1)) * 100)} % LTV)
                  </span>
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 leading-normal">
                  {frivaerdiStrategy === 'tillaeg'
                    ? 'Eksisterende lån beholdes intakt. Tillægslån optages separat til dækning af udbetaling og gebyrer.'
                    : 'Hele lånet omlægges til et nyt samlet lån. Udbetaling og gebyrer medfinansieres.'}
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

          {/* New loan duration slider with step 1 and dynamic legend */}
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
              min={Math.min(10, maxNewLoanYears)}
              max={maxNewLoanYears}
              step={1}
              value={newLoanYears}
              onChange={(e) => setNewLoanYears(parseInt(e.target.value, 10))}
              className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-slate-200 accent-blue-600 focus:outline-none dark:bg-slate-700 dark:accent-blue-500"
            />
            <div className="flex justify-between text-[10px] text-slate-400">
              <span>{Math.min(10, maxNewLoanYears)} år</span>
              <span>{Math.round((Math.min(10, maxNewLoanYears) + maxNewLoanYears) / 2)} år</span>
              <span>{maxNewLoanYears} år</span>
            </div>
          </div>

          {/* New loan afdragsfrie år slider (hvis nyt lån har/kan have afdragsfrihed) */}
          {activeNew.afdragsfri && (
            <div className="flex flex-col gap-1.5 rounded-xl border border-blue-200/80 dark:border-blue-900/40 bg-blue-50/40 dark:bg-blue-950/20 p-3.5">
              <div className="flex justify-between items-center">
                <label className="text-xs font-semibold text-blue-900 dark:text-blue-200">
                  År med afdragsfrihed på det nye lån
                </label>
                <span className="text-xs font-bold text-blue-600 dark:text-blue-400">
                  {newAfdragsfriYears} {newAfdragsfriYears === 1 ? 'år' : 'år'}
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={activeNew.name.includes('30 års afdragsfri') ? 30 : Math.min(10, newLoanYears)}
                step={1}
                value={newAfdragsfriYears}
                onChange={(e) => setNewAfdragsfriYears(parseInt(e.target.value, 10))}
                className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-slate-200 accent-blue-600 focus:outline-none dark:bg-slate-700 dark:accent-blue-500"
              />
              <div className="flex justify-between text-[10px] text-slate-500 dark:text-slate-400">
                <span>0 år (afdrager fra start)</span>
                <span>{activeNew.name.includes('30 års afdragsfri') ? '30 år' : `${Math.min(10, newLoanYears)} år`}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Key Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Ny restgæld (Hovedstol)"
          value={formatKr(displayNyHovedstol)}
          subValue={`Før: ${formatKr(comparison.existingRestgaeld)}`}
          delta={{
            text: isDebtReduced ? `${formatKr(Math.abs(displayDeltaRestgaeld))} lavere` : `${formatKr(displayDeltaRestgaeld)} højere`,
            type: isDebtReduced ? 'positive' : 'negative',
          }}
          highlight={true}
        />

        <MetricCard
          title="Månedlig ydelse efter skat"
          value={formatKr(displayNyMonthlyYdelse)}
          subValue={`Før: ${formatKr(comparison.existingSchedule.monthlyYdelseEfterSkat)}`}
          delta={{
            text: `${displayDeltaMonthlyYdelse > 0 ? '+' : ''}${formatKr(displayDeltaMonthlyYdelse)}/md.`,
            type: isPaymentLower ? 'positive' : 'negative',
          }}
        />

        <MetricCard
          title="Månedligt afdrag"
          value={displayMonthlyAfdrag === 0 ? '0 kr. (Afdragsfrit)' : formatKr(displayMonthlyAfdrag)}
          subValue={
            comparison.existingSchedule.monthlyAfdrag === 0
              ? 'Før: Afdragsfrit (0 kr.)'
              : `Før: ${formatKr(comparison.existingSchedule.monthlyAfdrag)}`
          }
          delta={{
            text: `${displayDeltaAfdrag > 0 ? '+' : ''}${formatKr(displayDeltaAfdrag)}/md.`,
            type: displayDeltaAfdrag >= 0 ? 'positive' : 'negative',
          }}
        />

        <MetricCard
          title="Udbetalt til din konto"
          value={enableFrivaerdi ? formatKr(comparison.frivaerdiUdbetalt) : '0 kr.'}
          subValue={enableFrivaerdi ? `Omk. ${formatKr(displayFees)} medfinansieret` : 'Ren omlægning'}
          delta={{
            text: `Ny LTV: ${Math.round((displayNyHovedstol / propertyValue) * 100)} %`,
            type: 'neutral',
          }}
        />
      </div>

      {/* Kursgevinst & Kurstab Breakdown */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900 transition-colors">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <HelpCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Hvad betyder kursen for din restgæld og udbetaling?
            </h3>
          </div>
          {isOptionBActive && (
            <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/80 px-2.5 py-1 rounded-full border border-emerald-300 dark:border-emerald-800">
              Option B: Tillægslån aktiv
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-2 items-stretch">
          {/* 1. Tillægslån / Udbetaling */}
          <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-5 dark:border-slate-800 dark:bg-slate-800/40 flex flex-col justify-between">
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Udbetalt til din konto
              </div>
              <div className="mt-2 text-2xl font-bold text-slate-900 dark:text-slate-100">
                {formatKr(comparison.frivaerdiUdbetalt)}
              </div>
            </div>
            <div className="mt-3 text-xs text-slate-600 dark:text-slate-400 leading-relaxed border-t border-slate-200/60 dark:border-slate-700/60 pt-2.5">
              {enableFrivaerdi ? (
                <>
                  Gebyrer ({formatKr(displayFees)}) er medfinansieret i lånet.
                </>
              ) : (
                `Samlet kontantbehov: ${formatKr(comparison.samletKontantbehov)} til indfrielse og omk.`
              )}
            </div>
          </div>

          {/* 2. CENTERPIECE: Kursgevinst vs. Kurstab (Mutex Box - Larger & Colored by Good/Bad) */}
          {(() => {
            const hasGevinst = displayKursgevinstIndfrielse > 0;
            const hasTab = displayKurstabOptagelse > 0;
            const isFlex = Boolean(activeNew.flex) || activeNew.name.toLowerCase().includes('f-kort');
            // Net kurs-effekt: indfrielsesgevinst minus optagelsestab
            const netKursEffekt = displayKursgevinstIndfrielse - displayKurstabOptagelse;
            const isNetPositive = netKursEffekt >= 0;

            let badgeTitle = 'Netto Kurseffekt';
            if (isOptionBActive) badgeTitle = 'Kurstab på Tillægslån';
            else if (hasGevinst && hasTab) badgeTitle = 'Netto Kurseffekt';
            else if (hasGevinst) badgeTitle = 'Kursgevinst ved Indfrielse';
            else if (hasTab) badgeTitle = 'Kurstab ved Optagelse';
            else badgeTitle = isFlex ? 'F-kort Optages til Kurs 100' : 'Optaget til Kurs 100';

            return (
              <div
                className={`rounded-2xl border-2 p-6 shadow-md transition-all flex flex-col justify-between relative overflow-hidden ${
                  isNetPositive
                    ? 'border-emerald-500/80 bg-emerald-50/70 dark:border-emerald-500/60 dark:bg-emerald-950/30'
                    : 'border-amber-500/80 bg-amber-50/70 dark:border-amber-500/60 dark:bg-amber-950/30'
                }`}
              >
                {/* Header Badge */}
                <div className="flex items-center justify-between">
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                      isNetPositive
                        ? 'bg-emerald-200/80 text-emerald-900 dark:bg-emerald-900/60 dark:text-emerald-200'
                        : 'bg-amber-200/80 text-amber-900 dark:bg-amber-900/60 dark:text-amber-200'
                    }`}
                  >
                    {isNetPositive ? (
                      <TrendingDown className="h-3.5 w-3.5" />
                    ) : (
                      <TrendingUp className="h-3.5 w-3.5" />
                    )}
                    {badgeTitle}
                  </span>
                  <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                    Obligationskurs
                  </span>
                </div>

                {/* Amount Display */}
                <div className="my-3">
                  <div
                    className={`text-3xl sm:text-4xl font-black tracking-tight ${
                      isNetPositive
                        ? 'text-emerald-700 dark:text-emerald-400'
                        : 'text-amber-700 dark:text-amber-400'
                    }`}
                  >
                    {isOptionBActive
                      ? formatKr(displayKurstabOptagelse)
                      : hasGevinst && !hasTab
                      ? formatKr(displayKursgevinstIndfrielse)
                      : !hasGevinst && hasTab
                      ? formatKr(displayKurstabOptagelse)
                      : hasGevinst && hasTab
                      ? `${isNetPositive ? '+' : ''}${formatKr(netKursEffekt)}`
                      : '0 kr. (Kurs 100)'}
                  </div>
                  <div className="mt-1 text-xs font-medium text-slate-600 dark:text-slate-300">
                    {isOptionBActive ? (
                      <span>
                        Eksisterende gæld ({formatKr(debt)}) berøres ikke. Kurstab beregnes kun på tillægslånet ({formatKr(tillaegslaanComparison?.optionB_tillaegslaan.tillaegHovedstol || 0)} til kurs {formatKurs(activeNew.kurs)}).
                      </span>
                    ) : hasGevinst && hasTab ? (
                      <span>
                        Gevinst: <strong className="text-emerald-700 dark:text-emerald-400">{formatKr(comparison.kursgevinstIndfrielse)}</strong> (kurs {formatKurs(redemptionPrice)}) &bull; Tab: <strong className="text-amber-700 dark:text-amber-400">{formatKr(comparison.kurstabOptagelse)}</strong> (kurs {formatKurs(comparison.newKurs)})
                      </span>
                    ) : hasGevinst && !hasTab ? (
                      <span>
                        Gammel gæld indfries til under kurs 100 (kurs {formatKurs(redemptionPrice)}).
                        {isFlex ? ' Nyt F-kort lån optages til kurs 100 uden kurstab.' : ''}
                      </span>
                    ) : !hasGevinst && hasTab ? (
                      <span>Nye obligationer udstedes under kurs 100 (kurs {formatKurs(comparison.newKurs)})</span>
                    ) : (
                      <span>
                        {isFlex
                          ? 'F-kort / variabelt lån optages til parikurs (kurs 100) uden tab af provenu.'
                          : 'Begge lån handles/indfries til parikurs (kurs 100).'}
                      </span>
                    )}
                  </div>
                </div>

                {/* Explanatory footer */}
                <div className="text-xs leading-relaxed border-t border-slate-200/80 dark:border-slate-700/80 pt-2.5 text-slate-700 dark:text-slate-300">
                  {isOptionBActive ? (
                    <>
                      <strong className="text-emerald-800 dark:text-emerald-300">Lille kurstab:</strong> Du undgår kurstab og tinglysningsafgift på dit hovedlån på {formatKr(debt)}. Kurstabet er begrænset til {formatKr(displayKurstabOptagelse)} på tillægslånet.
                    </>
                  ) : hasGevinst && hasTab ? (
                    isNetPositive ? (
                      <>
                        <strong className="text-emerald-800 dark:text-emerald-300">Fordelagtig skæring:</strong> Gevinsten ved at opkøbe dit gamle lån til kurs {formatKurs(redemptionPrice)} overstiger kurstabet ved at udstede det nye lån til kurs {formatKurs(comparison.newKurs)}.
                      </>
                    ) : (
                      <>
                        <strong className="text-amber-800 dark:text-amber-300">Netto kurstab:</strong> Kurstabet på {formatKr(comparison.kurstabOptagelse)} ved nyt lån overstiger gevinsten på {formatKr(comparison.kursgevinstIndfrielse)} ved indfrielse.
                      </>
                    )
                  ) : hasGevinst ? (
                    <>
                      <strong className="text-emerald-800 dark:text-emerald-300">Gældsskær:</strong> Du sparer {formatKr(comparison.kursgevinstIndfrielse)} direkte da dine gamle obligationer handles under pari.
                      {isFlex && ' Nyt F-kort lån udstedes til kurs 100 (pari) med 0 kr. i kurstab.'}
                    </>
                  ) : (
                    <>
                      <strong className="text-emerald-800 dark:text-emerald-300">Ingen kurstab ved optagelse:</strong> {isFlex ? 'F-kort / variabelt lån udstedes til parikurs (kurs 100). Intet provenu mistes ved optagelsen.' : 'Lånet optages og indfries til kurs 100.'}
                    </>
                  )}
                </div>
              </div>
            );
          })()}

          {/* 3. Nettoændring i obligationsgæld */}
          <div className="rounded-xl border border-blue-200/80 bg-blue-50/40 p-5 dark:border-blue-900/50 dark:bg-blue-950/20 flex flex-col justify-between">
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-blue-800 dark:text-blue-300">
                Nettoændring i restgæld
              </div>
              <div className={`mt-2 text-2xl font-bold ${isDebtReduced ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-900 dark:text-slate-100'}`}>
                {comparison.deltaRestgaeld > 0 ? '+' : ''}{formatKr(comparison.deltaRestgaeld)}
              </div>
            </div>
            <div className="mt-3 text-xs text-blue-900/80 dark:text-blue-400/80 leading-relaxed border-t border-blue-200/60 dark:border-blue-900/40 pt-2.5">
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

      {/* Tillægslån vs Fuld Omlægning Comparator */}
      {tillaegslaanComparison && (
        <TillaegslaanComparator
          comparison={tillaegslaanComparison}
          existingLoan={activeExisting}
          newLoan={activeNew}
          desiredCashout={effectiveFrivaerdi > 0 ? effectiveFrivaerdi : 200_000}
        />
      )}

      {/* Breakeven Graph (scaled to longest loan duration) */}
      <BreakevenChart
        existingSchedule={comparison.existingSchedule}
        newSchedule={comparison.newSchedule}
        maxYears={comparison.maxYears}
        frivaerdiUdbetalt={comparison.frivaerdiUdbetalt}
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
          title={`Annuitetstabel for Option A: Nyt Lån (${activeNew.name} - ${comparison.newYears} år)`}
          defaultOpen={false}
        />
        {optionBSchedule && (
          <AmortizationTable
            calculation={optionBSchedule}
            title={`Annuitetstabel for Option B: Nuværende Lån + Tillægslån (${activeExisting.name} + ${activeNew.name})`}
            defaultOpen={false}
          />
        )}
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
        tillaegslaanComparison={tillaegslaanComparison}
        breakevenYears={breakevenYears}
      />
    </div>
  );
};
