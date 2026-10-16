import React, { useState, useMemo, useEffect } from 'react';
import type { BondLoan, LoanAmortizationResult, QuarterlyScheduleRow } from '../../calculator/types';
import { calculateRefinancing } from '../../calculator/refinancing';
import { getDefaultAfdragsfriYears } from '../../calculator/amortization';
import { parseUdloebsAar } from '../../api/rates';
import { calculateTillaegslaanComparison } from '../../calculator/tillaegslaan';
import { CurrencyInput } from '../../components/CurrencyInput';
import { DependentLoanSelect } from '../../components/DependentLoanSelect';
import { AmortizationTable } from '../../components/AmortizationTable';
import { LoanChart, type ChartSeries } from '../../components/LoanChart';
import { BreakevenChart } from '../../components/BreakevenChart';
import { DumbIdeasModal } from '../../components/DumbIdeasModal';
import { ScenarioComparisonModal } from '../../components/ScenarioComparisonModal';
import { TillaegslaanComparator } from '../../components/TillaegslaanComparator';
import { ValidationToast } from '../../components/ValidationToast';
import { formatKr, formatKurs, formatPercent } from '../../utils/formatters';
import { computeBreakevenSeries } from '../../utils/breakeven';
import { maxLoanAt80Ltv, maxCostAwareFrivaerdi, buildLtvFieldErrors, mapCashoutAcrossStrategyMax } from '../../utils/ltv';
import type { SharedLoanState, AppMode } from '../../state/useLoanState';
import {
  Banknote,
  TrendingDown,
  Receipt,
  Scale,
  Lightbulb,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  BarChart3,
  Calendar,
  Layers,
  ArrowRightLeft,
} from 'lucide-react';

interface RefinancingV2ViewProps {
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
  frivaerdiStrategy: 'omlaegning' | 'tillaeg';
  setFrivaerdiStrategy: (strategy: 'omlaegning' | 'tillaeg') => void;
  newLoanYearsState?: number | null;
  setNewLoanYears: (val: number | null) => void;
  existingAfdragsfriYearsState?: number | null;
  setExistingAfdragsfriYears: (val: number | null) => void;
  newAfdragsfriYearsState?: number | null;
  setNewAfdragsfriYears: (val: number | null) => void;
  reportStrategyState?: 'a' | 'b' | 'both' | null;
  setReportStrategy: (val: 'a' | 'b' | 'both') => void;
  mode: AppMode;
  setMode: (mode: AppMode) => void;
  getShareableUrl?: () => string;
  currentState?: SharedLoanState;
  onRestoreScenario?: (state: SharedLoanState) => void;
}

export const RefinancingV2View: React.FC<RefinancingV2ViewProps> = ({
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
  frivaerdiStrategy,
  setFrivaerdiStrategy,
  newLoanYearsState,
  setNewLoanYears,
  existingAfdragsfriYearsState,
  setExistingAfdragsfriYears,
  newAfdragsfriYearsState,
  setNewAfdragsfriYears,
  currentState,
  onRestoreScenario,
}) => {
  // Mobile stage selection (1 = Bundlinje/Overview, 2 = Indstillinger/Controls, 3 = Dybde/Analytics)
  const [mobileTab, setMobileTab] = useState<'overview' | 'inputs' | 'deepdive'>('overview');
  // Desktop tabbed analysis deck
  const [desktopTab, setDesktopTab] = useState<'flow' | 'charts' | 'comparator' | 'amortization'>('flow');
  // Secondary sub-tabs
  const [chartSubTab, setChartSubTab] = useState<'breakeven' | 'debt'>('breakeven');
  const [showFees, setShowFees] = useState(false);
  const [showDumbIdeasModal, setShowDumbIdeasModal] = useState(false);
  const [showScenariosModal, setShowScenariosModal] = useState(false);

  // Active loan selection
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

  // Max years calculations
  const maxExistingYears = useMemo(() => {
    if (!activeExisting) return 30;
    const currentYear = new Date().getFullYear();
    let maturityYear: number | undefined = activeExisting.udloebsAar;
    if (!maturityYear) maturityYear = parseUdloebsAar(activeExisting.name);
    if (maturityYear) return Math.max(1, Math.min(30, maturityYear - currentYear));
    if (activeExisting.loebetid) return Math.max(1, Math.min(30, activeExisting.loebetid));
    return 30;
  }, [activeExisting]);

  useEffect(() => {
    if (remainingYears > maxExistingYears) {
      setRemainingYears(maxExistingYears);
    }
  }, [maxExistingYears, remainingYears, setRemainingYears]);

  const maxNewLoanYears = useMemo(() => {
    if (!activeNew) return 30;
    const currentYear = new Date().getFullYear();
    let maturityYear: number | undefined = activeNew.udloebsAar;
    if (!maturityYear) maturityYear = parseUdloebsAar(activeNew.name);
    if (maturityYear) return Math.max(1, Math.min(30, maturityYear - currentYear));
    if (activeNew.loebetid) return Math.max(1, Math.min(30, activeNew.loebetid));
    return 30;
  }, [activeNew]);

  const newLoanYears = useMemo(() => {
    const raw = newLoanYearsState ?? maxNewLoanYears;
    return Math.max(1, Math.min(maxNewLoanYears, raw));
  }, [newLoanYearsState, maxNewLoanYears]);

  useEffect(() => {
    if (newLoanYearsState !== null && newLoanYearsState !== undefined && newLoanYearsState > maxNewLoanYears) {
      setNewLoanYears(maxNewLoanYears);
    }
  }, [maxNewLoanYears, newLoanYearsState, setNewLoanYears]);

  const maxExistingAfdragsfriYears = useMemo(() => {
    if (!activeExisting || !activeExisting.afdragsfri) return 0;
    return Math.min(getDefaultAfdragsfriYears(activeExisting), remainingYears);
  }, [activeExisting, remainingYears]);

  const existingAfdragsfriYears = useMemo(() => {
    if (!activeExisting?.afdragsfri) return 0;
    if (existingAfdragsfriYearsState != null) {
      return Math.min(existingAfdragsfriYearsState, maxExistingAfdragsfriYears);
    }
    return Math.min(10, remainingYears);
  }, [activeExisting, existingAfdragsfriYearsState, maxExistingAfdragsfriYears, remainingYears]);

  const maxNewAfdragsfriYears = useMemo(() => {
    if (!activeNew || !activeNew.afdragsfri) return 0;
    return Math.min(getDefaultAfdragsfriYears(activeNew), newLoanYears);
  }, [activeNew, newLoanYears]);

  const newAfdragsfriYears = useMemo(() => {
    if (!activeNew?.afdragsfri) return 0;
    if (newAfdragsfriYearsState != null) {
      return Math.min(newAfdragsfriYearsState, maxNewAfdragsfriYears);
    }
    return 0;
  }, [activeNew, newAfdragsfriYearsState, maxNewAfdragsfriYears]);

  // LTV & Cashout calculations
  const redemptionPrice = activeExisting ? Math.min(100, activeExisting.kurs > 0 ? activeExisting.kurs : 100) : 100;
  const newKurs = activeNew && activeNew.kurs > 0 ? activeNew.kurs : 100;
  const maxDebtAt80 = maxLoanAt80Ltv(propertyValue);

  const cashoutLtvInputs = useMemo(
    () => ({
      propertyValue,
      existingRestgaeld: debt,
      existingKurs: redemptionPrice,
      newKurs,
    }),
    [propertyValue, debt, redemptionPrice, newKurs]
  );

  const maxFrivaerdiOmlaegning = useMemo(
    () => maxCostAwareFrivaerdi(cashoutLtvInputs, 'omlaegning'),
    [cashoutLtvInputs]
  );
  const maxFrivaerdiTillaeg = useMemo(
    () => maxCostAwareFrivaerdi(cashoutLtvInputs, 'tillaeg'),
    [cashoutLtvInputs]
  );

  const maxPossibleFrivaerdi =
    frivaerdiStrategy === 'tillaeg' ? maxFrivaerdiTillaeg : maxFrivaerdiOmlaegning;

  const effectiveFrivaerdi = enableFrivaerdi ? Math.min(frivaerdiUdbetalt, maxPossibleFrivaerdi) : 0;

  useEffect(() => {
    if (enableFrivaerdi && frivaerdiUdbetalt > maxPossibleFrivaerdi) {
      setFrivaerdiUdbetalt(maxPossibleFrivaerdi);
    }
  }, [enableFrivaerdi, frivaerdiUdbetalt, maxPossibleFrivaerdi, setFrivaerdiUdbetalt]);

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
      existingAfdragsfriYears,
      newAfdragsfriYears
    );
  }, [
    activeExisting,
    activeNew,
    debt,
    propertyValue,
    remainingYears,
    newLoanYears,
    effectiveFrivaerdi,
    existingAfdragsfriYears,
    newAfdragsfriYears,
  ]);

  const tillaegslaanComparison = useMemo(() => {
    if (!enableFrivaerdi || effectiveFrivaerdi <= 0 || !activeExisting || !activeNew) {
      return null;
    }
    return calculateTillaegslaanComparison(
      activeExisting,
      debt,
      activeNew,
      propertyValue,
      remainingYears,
      newLoanYears,
      effectiveFrivaerdi,
      existingAfdragsfriYears,
      newAfdragsfriYears
    );
  }, [
    enableFrivaerdi,
    effectiveFrivaerdi,
    activeExisting,
    activeNew,
    debt,
    propertyValue,
    remainingYears,
    newLoanYears,
    existingAfdragsfriYears,
    newAfdragsfriYears,
  ]);

  // Combined Option B schedule for tables and breakeven
  const optionBSchedule = useMemo<LoanAmortizationResult | null>(() => {
    if (!tillaegslaanComparison || !comparison) return null;
    const existing = comparison.existingSchedule;
    const tillaeg = tillaegslaanComparison.optionB_tillaegslaan.tillaegSchedule;
    const totalQuarters = Math.max(existing.totalQuarters, tillaeg.totalQuarters);
    const schedule: QuarterlyScheduleRow[] = [];

    for (let q = 0; q < totalQuarters; q++) {
      const eRow = existing.schedule[q];
      const tRow = tillaeg.schedule[q];
      schedule.push({
        quarter: q + 1,
        year: Math.floor(q / 4) + 1,
        quarterOfYear: (q % 4) + 1,
        startRestgaeld: (eRow?.startRestgaeld ?? 0) + (tRow?.startRestgaeld ?? 0),
        rente: (eRow?.rente ?? 0) + (tRow?.rente ?? 0),
        bidrag: (eRow?.bidrag ?? 0) + (tRow?.bidrag ?? 0),
        afdrag: (eRow?.afdrag ?? 0) + (tRow?.afdrag ?? 0),
        ydelseFoerSkat: (eRow?.ydelseFoerSkat ?? 0) + (tRow?.ydelseFoerSkat ?? 0),
        skatFradrag: (eRow?.skatFradrag ?? 0) + (tRow?.skatFradrag ?? 0),
        ydelseEfterSkat: (eRow?.ydelseEfterSkat ?? 0) + (tRow?.ydelseEfterSkat ?? 0),
        endRestgaeld: (eRow?.endRestgaeld ?? 0) + (tRow?.endRestgaeld ?? 0),
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

  // Active strategy metrics
  const isOptionBActive = enableFrivaerdi && frivaerdiStrategy === 'tillaeg' && Boolean(tillaegslaanComparison);

  const displayNyHovedstol = isOptionBActive && tillaegslaanComparison
    ? comparison!.existingRestgaeld + tillaegslaanComparison.optionB_tillaegslaan.tillaegHovedstol
    : comparison ? comparison.nyHovedstol : 0;

  const displayNyMonthlyYdelse = isOptionBActive && tillaegslaanComparison
    ? tillaegslaanComparison.optionB_tillaegslaan.combinedMonthlyYdelseEfterSkat
    : comparison ? comparison.newSchedule.monthlyYdelseEfterSkat : 0;

  const displayDeltaMonthlyYdelse = isOptionBActive && tillaegslaanComparison
    ? tillaegslaanComparison.optionB_tillaegslaan.tillaegMonthlyYdelseEfterSkat
    : comparison ? comparison.deltaMonthlyYdelseEfterSkat : 0;

  const displayMonthlyAfdrag = isOptionBActive && tillaegslaanComparison
    ? comparison!.existingSchedule.monthlyAfdrag + tillaegslaanComparison.optionB_tillaegslaan.tillaegSchedule.monthlyAfdrag
    : comparison ? comparison.newSchedule.monthlyAfdrag : 0;

  const displayDeltaRestgaeld = isOptionBActive && tillaegslaanComparison
    ? tillaegslaanComparison.optionB_tillaegslaan.tillaegHovedstol
    : comparison ? comparison.deltaRestgaeld : 0;

  const displayFees = isOptionBActive && tillaegslaanComparison
    ? tillaegslaanComparison.optionB_tillaegslaan.tillaegOmkostninger
    : comparison ? comparison.fees.samledeOmkostninger : 0;

  const displayKurstabOptagelse = isOptionBActive && tillaegslaanComparison
    ? Math.max(0, tillaegslaanComparison.optionB_tillaegslaan.tillaegHovedstol - (tillaegslaanComparison.optionB_tillaegslaan.tillaegHovedstol * activeNew.kurs / 100))
    : comparison ? comparison.kurstabOptagelse : 0;

  const displayKursgevinstIndfrielse = isOptionBActive ? 0 : comparison ? comparison.kursgevinstIndfrielse : 0;

  // Breakeven crossing
  const breakevenYears = useMemo<number | null>(() => {
    if (!comparison) return null;
    const isTillaegVsOmlaegning = isOptionBActive && Boolean(optionBSchedule);
    const existing = isTillaegVsOmlaegning ? comparison.newSchedule : comparison.existingSchedule;
    const neu = isTillaegVsOmlaegning ? optionBSchedule! : comparison.newSchedule;
    const cashout = isTillaegVsOmlaegning ? 0 : effectiveFrivaerdi;
    const maxYears = Math.max(existing.totalQuarters, neu.totalQuarters) / 4 || comparison.maxYears;
    const { breakevenCrossing } = computeBreakevenSeries(existing, neu, maxYears, cashout);
    return breakevenCrossing === null ? null : breakevenCrossing / 4;
  }, [comparison, isOptionBActive, optionBSchedule, effectiveFrivaerdi]);

  // Chart series
  const chartSeries = useMemo<ChartSeries[]>(() => {
    if (!comparison || !activeExisting || !activeNew) return [];
    const maxYears = comparison.maxYears;
    const existingData: number[] = [comparison.existingRestgaeld];
    const newData: number[] = [comparison.nyHovedstol];

    for (let y = 1; y <= maxYears; y++) {
      if (y <= comparison.existingYears) {
        const qIndex = Math.min(y * 4 - 1, comparison.existingSchedule.schedule.length - 1);
        existingData.push(comparison.existingSchedule.schedule[qIndex]?.endRestgaeld ?? 0);
      } else {
        existingData.push(0);
      }

      if (y <= comparison.newYears) {
        const qIndex = Math.min(y * 4 - 1, comparison.newSchedule.schedule.length - 1);
        newData.push(comparison.newSchedule.schedule[qIndex]?.endRestgaeld ?? 0);
      } else {
        newData.push(0);
      }
    }

    const seriesList: ChartSeries[] = [
      {
        id: 'new',
        name: `Nyt lån (${activeNew.name})`,
        color: '#2563eb',
        data: newData,
      },
      {
        id: 'existing',
        name: `Nuværende (${activeExisting.name})`,
        color: '#f59e0b',
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
      seriesList.push({
        id: 'tillaegslaan',
        name: `Option B: Bevar nuværende + tillæg`,
        color: '#10b981',
        strokeDash: '3 3',
        data: tillaegData,
      });
    }

    return seriesList;
  }, [comparison, tillaegslaanComparison, activeExisting, activeNew]);

  const debtError = debt > maxDebtAt80;
  const frivaerdiError = enableFrivaerdi && frivaerdiUdbetalt > maxPossibleFrivaerdi;
  const fieldErrors = buildLtvFieldErrors({
    propertyValue,
    debtOrLoan: debt,
    debtAnchorId: 'v2-restgaeld',
    debtLabel: `Nuværende restgæld overstiger 80 % LTV (maks. ${formatKr(maxDebtAt80)})`,
    enableFrivaerdi,
    frivaerdiUdbetalt,
    maxFrivaerdi: maxPossibleFrivaerdi,
    frivaerdiAnchorId: 'v2-frivaerdi',
  });

  const handlePropertyBlur = (clampedProperty: number) => {
    const maxDebt = maxLoanAt80Ltv(clampedProperty);
    if (debt > maxDebt) {
      setDebt(maxDebt);
    }
  };

  const handleDebtBlur = (clampedDebt: number) => {
    if (clampedDebt > maxDebtAt80) {
      setDebt(maxDebtAt80);
    }
  };

  const handleFrivaerdiStrategyChange = (strategy: 'omlaegning' | 'tillaeg') => {
    const prevMax = frivaerdiStrategy === 'tillaeg' ? maxFrivaerdiTillaeg : maxFrivaerdiOmlaegning;
    const nextMax = strategy === 'tillaeg' ? maxFrivaerdiTillaeg : maxFrivaerdiOmlaegning;
    setFrivaerdiStrategy(strategy);
    if (!enableFrivaerdi) return;
    setFrivaerdiUdbetalt(mapCashoutAcrossStrategyMax(frivaerdiUdbetalt, prevMax, nextMax));
  };

  if (!activeExisting || !activeNew || !comparison) {
    return <div className="p-8 text-center text-slate-500">Indlæser lånedata...</div>;
  }

  const isDebtReduced = displayDeltaRestgaeld < 0;
  const isPaymentLower = displayDeltaMonthlyYdelse < 0;
  const currentLtv = Math.round((debt / (propertyValue || 1)) * 100);
  const newLtv = Math.round((displayNyHovedstol / (propertyValue || 1)) * 100);

  // Verdict evaluation
  const isUpconversion = activeNew.rente > activeExisting.rente;
  const netKurseffekt = displayKursgevinstIndfrielse - displayKurstabOptagelse;

  return (
    <div className="flex flex-col gap-4 min-w-0 max-w-full pb-10">
      {/* Top Banner / Mode Switcher bar */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <span className="inline-flex items-center gap-1 rounded-md bg-blue-600 px-2 py-0.5 text-xs font-bold text-white uppercase tracking-wider">
            v2 SPOG
          </span>
          <span className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">
            {activeExisting.name} &rarr; {activeNew.name}
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {currentState && onRestoreScenario && (
            <button
              type="button"
              onClick={() => setShowScenariosModal(true)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-2.5 py-1 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            >
              <Scale className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
              <span>Scenarier</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setShowDumbIdeasModal(true)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-amber-200 dark:border-amber-900/60 bg-amber-50 dark:bg-amber-950/30 px-2.5 py-1 text-xs font-medium text-amber-800 dark:text-amber-300 hover:bg-amber-100 transition-colors"
          >
            <Lightbulb className="h-3.5 w-3.5 text-amber-500" />
            <span>Reality check</span>
          </button>
        </div>
      </div>

      {/* MOBILE SEGMENTED CONTROL (Only on small screens) */}
      <div className="lg:hidden flex rounded-xl bg-slate-200 dark:bg-slate-800 p-1 text-xs font-semibold">
        <button
          type="button"
          onClick={() => setMobileTab('overview')}
          className={`flex-1 py-1.5 rounded-lg text-center transition-all ${
            mobileTab === 'overview'
              ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs'
              : 'text-slate-600 dark:text-slate-400'
          }`}
        >
          1. Bundlinje
        </button>
        <button
          type="button"
          onClick={() => setMobileTab('inputs')}
          className={`flex-1 py-1.5 rounded-lg text-center transition-all ${
            mobileTab === 'inputs'
              ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs'
              : 'text-slate-600 dark:text-slate-400'
          }`}
        >
          2. Justér lån
        </button>
        <button
          type="button"
          onClick={() => setMobileTab('deepdive')}
          className={`flex-1 py-1.5 rounded-lg text-center transition-all ${
            mobileTab === 'deepdive'
              ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs'
              : 'text-slate-600 dark:text-slate-400'
          }`}
        >
          3. Dybde & grafer
        </button>
      </div>

      {/* MAIN SPOG TWO-COLUMN LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* LEFT COLUMN: CONTROL DECK (Desktop always visible, mobile controlled by mobileTab === 'inputs') */}
        <aside
          className={`lg:col-span-4 flex flex-col gap-3.5 ${
            mobileTab !== 'inputs' ? 'hidden lg:flex' : 'flex'
          }`}
        >
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-2xs transition-colors flex flex-col gap-3.5">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
              <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                <SlidersHorizontal className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                <span>Bolig & Lånevalg</span>
              </div>
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                LTV: {currentLtv} %
              </span>
            </div>

            {/* Property value & debt */}
            <CurrencyInput
              label="Ejendomsværdi"
              value={propertyValue}
              onChange={setPropertyValue}
              min={500_000}
              max={25_000_000}
              step={100_000}
              showSlider={false}
              fieldId="v2-ejendomsvaerdi"
              onBlurValue={handlePropertyBlur}
            />

            <CurrencyInput
              label="Nuværende restgæld"
              value={debt}
              onChange={setDebt}
              min={100_000}
              max={Math.min(propertyValue, 20_000_000)}
              step={50_000}
              showSlider={false}
              fieldId="v2-restgaeld"
              error={debtError}
              errorMessage={debtError ? `Maks. 80 % (${formatKr(maxDebtAt80)})` : undefined}
              onBlurValue={handleDebtBlur}
            />

            {/* Loan Pickers */}
            <div className="border-t border-slate-100 dark:border-slate-800 pt-3">
              <DependentLoanSelect
                label="Nuværende lån (indfrielse)"
                loans={indfrielseLoans}
                selectedLoan={activeExisting}
                onSelectLoan={(l) => setSelectedExistingLoanName(l.name)}
                subtext={`Kurs ${formatKurs(activeExisting.kurs)} • Indfrielse: ${formatKurs(Math.min(100, activeExisting.kurs))}`}
                allowCustom={true}
              />
            </div>

            <div className="flex flex-col gap-1">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-600 dark:text-slate-400">Resterende løbetid</span>
                <span className="font-bold text-blue-600 dark:text-blue-400">{remainingYears} år</span>
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

            {activeExisting.afdragsfri && (
              <div className="flex flex-col gap-1 rounded-lg bg-amber-50 dark:bg-amber-950/20 p-2.5 border border-amber-200/60 dark:border-amber-900/30">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-amber-800 dark:text-amber-300 font-medium">Afdragsfrihed tilbage</span>
                  <span className="font-bold text-amber-600 dark:text-amber-400">{existingAfdragsfriYears} år</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={maxExistingAfdragsfriYears}
                  step={1}
                  value={existingAfdragsfriYears}
                  onChange={(e) => setExistingAfdragsfriYears(parseInt(e.target.value, 10))}
                  className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-slate-200 accent-amber-600 focus:outline-none dark:bg-slate-700"
                />
              </div>
            )}

            <div className="border-t border-slate-100 dark:border-slate-800 pt-3">
              <DependentLoanSelect
                label="Nyt lån (optagelse)"
                loans={optagelseLoans}
                selectedLoan={activeNew}
                onSelectLoan={(l) => setSelectedNewLoanName(l.name)}
                subtext={`Optagelseskurs: ${formatKurs(activeNew.kurs)}`}
                allowCustom={true}
              />
            </div>

            <div className="flex flex-col gap-1">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-600 dark:text-slate-400">Nyt lån løbetid</span>
                <span className="font-bold text-blue-600 dark:text-blue-400">{newLoanYears} år</span>
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
            </div>

            {activeNew.afdragsfri && (
              <div className="flex flex-col gap-1 rounded-lg bg-blue-50 dark:bg-blue-950/20 p-2.5 border border-blue-200/60 dark:border-blue-900/30">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-blue-900 dark:text-blue-300 font-medium">Nye afdragsfrie år</span>
                  <span className="font-bold text-blue-600 dark:text-blue-400">{newAfdragsfriYears} år</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={maxNewAfdragsfriYears}
                  step={1}
                  value={newAfdragsfriYears}
                  onChange={(e) => setNewAfdragsfriYears(parseInt(e.target.value, 10))}
                  className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-slate-200 accent-blue-600 focus:outline-none dark:bg-slate-700"
                />
              </div>
            )}

            {/* Friværdiudtag (Cashout) Drawer in sidebar */}
            <div className="border-t border-slate-100 dark:border-slate-800 pt-3 flex flex-col gap-2">
              <label className="flex items-center justify-between text-xs font-semibold text-slate-800 dark:text-slate-200 cursor-pointer">
                <span className="flex items-center gap-1.5">
                  <Banknote className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  Udtag friværdi
                </span>
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
              </label>

              {enableFrivaerdi && (
                <div className="flex flex-col gap-2 pt-1">
                  <CurrencyInput
                    label="Udbetaling til konto"
                    value={frivaerdiUdbetalt}
                    onChange={setFrivaerdiUdbetalt}
                    min={0}
                    max={maxPossibleFrivaerdi > 0 ? maxPossibleFrivaerdi : 0}
                    step={25_000}
                    showSlider={true}
                    fieldId="v2-frivaerdi"
                    error={frivaerdiError}
                    labelAction={
                      maxPossibleFrivaerdi > 0 ? (
                        <button
                          type="button"
                          onClick={() => setFrivaerdiUdbetalt(maxPossibleFrivaerdi)}
                          className="rounded border border-slate-300 bg-white px-1.5 py-0.5 text-[10px] font-semibold text-slate-700 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200"
                        >
                          Maks ({formatKr(maxPossibleFrivaerdi)})
                        </button>
                      ) : null
                    }
                  />

                  {/* Strategy toggle */}
                  <div className="flex items-center rounded-lg bg-slate-100 dark:bg-slate-800 p-0.5 text-[11px] font-semibold">
                    <button
                      type="button"
                      onClick={() => handleFrivaerdiStrategyChange('omlaegning')}
                      className={`flex-1 py-1 rounded-md text-center transition-all ${
                        frivaerdiStrategy === 'omlaegning'
                          ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs'
                          : 'text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      Option A: Fuld
                    </button>
                    <button
                      type="button"
                      onClick={() => handleFrivaerdiStrategyChange('tillaeg')}
                      className={`flex-1 py-1 rounded-md text-center transition-all ${
                        frivaerdiStrategy === 'tillaeg'
                          ? 'bg-emerald-600 text-white shadow-2xs'
                          : 'text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      Option B: Tillæg
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Mobile "Se Bundlinje" shortcut */}
            <button
              type="button"
              onClick={() => setMobileTab('overview')}
              className="lg:hidden mt-2 w-full rounded-xl bg-blue-600 py-2.5 text-xs font-bold text-white shadow-sm text-center"
            >
              Se resultat &rarr;
            </button>
          </div>
        </aside>

        {/* RIGHT COLUMN: EXECUTIVE COCKPIT & PROGRESSIVE DISCLOSURE (SPOG MAIN STAGE) */}
        <main
          className={`lg:col-span-8 flex flex-col gap-4 ${
            mobileTab === 'inputs' ? 'hidden lg:flex' : 'flex'
          }`}
        >
          {/* 1. EXECUTIVE BOTTOM-LINE ROW (Always in viewport on desktop) */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-2xs transition-colors">
            {/* Top verdict bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                {isDebtReduced ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 dark:bg-emerald-950/80 px-2.5 py-0.5 text-xs font-bold text-emerald-800 dark:text-emerald-300">
                    <TrendingDown className="h-3.5 w-3.5" />
                    Gæld skæres med {formatKr(Math.abs(displayDeltaRestgaeld))}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 text-xs font-bold text-slate-700 dark:text-slate-300">
                    Restgæld ændring: +{formatKr(displayDeltaRestgaeld)}
                  </span>
                )}
                {isUpconversion && (
                  <span className="hidden sm:inline-block text-xs text-slate-500 dark:text-slate-400">
                    (Opkonvertering: {formatPercent(activeExisting.rente)} &rarr; {formatPercent(activeNew.rente)})
                  </span>
                )}
              </div>

              <div className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                Breakeven:{' '}
                {breakevenYears !== null ? (
                  <span className="text-blue-600 dark:text-blue-400 font-bold">{breakevenYears.toFixed(1)} år</span>
                ) : isPaymentLower ? (
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold">Gevinst fra dag 1</span>
                ) : (
                  <span className="text-amber-600 dark:text-amber-400 font-bold">Ingen kortsigtet breakeven</span>
                )}
              </div>
            </div>

            {/* 4 Hero KPI Columns */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3">
              {/* Metric 1: Monthly cashflow */}
              <div className="rounded-lg bg-slate-50 dark:bg-slate-800/50 p-3 flex flex-col justify-between">
                <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                  Månedlig ydelse
                </span>
                <div className="my-1 text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight">
                  {formatKr(displayNyMonthlyYdelse)}
                </div>
                <div className={`text-xs font-semibold ${isPaymentLower ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
                  {displayDeltaMonthlyYdelse > 0 ? '+' : ''}{formatKr(displayDeltaMonthlyYdelse)}/md.
                </div>
              </div>

              {/* Metric 2: Net Debt */}
              <div className="rounded-lg bg-slate-50 dark:bg-slate-800/50 p-3 flex flex-col justify-between">
                <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                  Ny restgæld
                </span>
                <div className="my-1 text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight">
                  {formatKr(displayNyHovedstol)}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  LTV: {currentLtv} % &rarr; {newLtv} %
                </div>
              </div>

              {/* Metric 3: Monthly Principal Payment (Afdrag) */}
              <div className="rounded-lg bg-slate-50 dark:bg-slate-800/50 p-3 flex flex-col justify-between">
                <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                  Månedligt afdrag
                </span>
                <div className="my-1 text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight">
                  {displayMonthlyAfdrag === 0 ? '0 kr.' : formatKr(displayMonthlyAfdrag)}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  {displayMonthlyAfdrag === 0 ? 'Afdragsfrit' : `Opsparing i bolig`}
                </div>
              </div>

              {/* Metric 4: Direct Cashout */}
              <div className="rounded-lg bg-slate-50 dark:bg-slate-800/50 p-3 flex flex-col justify-between">
                <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                  Udbetalt på NemKonto
                </span>
                <div className="my-1 text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight">
                  {enableFrivaerdi ? formatKr(effectiveFrivaerdi) : '0 kr.'}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400 truncate">
                  Gebyrer: {formatKr(displayFees)}
                </div>
              </div>
            </div>
          </div>

          {/* 2. PROGRESSIVE DISCLOSURE TABS (SPOG Deck) */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs overflow-hidden transition-colors">
            {/* Tab header */}
            <div className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/75 dark:bg-slate-800/40 p-2 sm:px-4 flex items-center justify-between gap-2 overflow-x-auto">
              <nav className="flex items-center gap-1 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => {
                    setDesktopTab('flow');
                    setMobileTab('overview');
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                    desktopTab === 'flow'
                      ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-2xs font-bold'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <ArrowRightLeft className="h-3.5 w-3.5" />
                  <span>Kurseffekt & gebyrer</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setDesktopTab('charts');
                    setMobileTab('deepdive');
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                    desktopTab === 'charts'
                      ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-2xs font-bold'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <BarChart3 className="h-3.5 w-3.5" />
                  <span>Grafer</span>
                </button>

                {enableFrivaerdi && tillaegslaanComparison && (
                  <button
                    type="button"
                    onClick={() => {
                      setDesktopTab('comparator');
                      setMobileTab('deepdive');
                    }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                      desktopTab === 'comparator'
                        ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-2xs font-bold'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <Layers className="h-3.5 w-3.5" />
                    <span>Option A vs B</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => {
                    setDesktopTab('amortization');
                    setMobileTab('deepdive');
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                    desktopTab === 'amortization'
                      ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-2xs font-bold'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <Calendar className="h-3.5 w-3.5" />
                  <span>Amortisering</span>
                </button>
              </nav>

              {desktopTab === 'charts' && (
                <div className="flex items-center rounded-lg bg-slate-200/80 dark:bg-slate-800 p-0.5 text-[11px] font-semibold shrink-0">
                  <button
                    type="button"
                    onClick={() => setChartSubTab('breakeven')}
                    className={`px-2 py-0.5 rounded-md ${
                      chartSubTab === 'breakeven' ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-2xs' : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    Breakeven
                  </button>
                  <button
                    type="button"
                    onClick={() => setChartSubTab('debt')}
                    className={`px-2 py-0.5 rounded-md ${
                      chartSubTab === 'debt' ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-2xs' : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    Restgæld
                  </button>
                </div>
              )}
            </div>

            {/* TAB CONTENT 1: KURSEFFEKT & GEBYRER */}
            {desktopTab === 'flow' && (
              <div className="p-4 sm:p-5 flex flex-col gap-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Kursgevinst ved indfrielse */}
                  <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 p-3.5 flex flex-col justify-between">
                    <div>
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        Indfrielse af gammel gæld
                      </span>
                      <div className="mt-1 text-xl font-bold text-emerald-600 dark:text-emerald-400">
                        {isOptionBActive ? '0 kr. (beholdes)' : formatKr(displayKursgevinstIndfrielse)}
                      </div>
                    </div>
                    <div className="mt-2 text-xs text-slate-600 dark:text-slate-400 border-t border-slate-200/60 dark:border-slate-700/60 pt-2">
                      {isOptionBActive
                        ? 'Nuværende lån forbliver uændret.'
                        : `Kurs ${formatKurs(Math.min(100, activeExisting.kurs))}. Gæld på ${formatKr(debt)} indfries.`}
                    </div>
                  </div>

                  {/* Kurstab ved optagelse */}
                  <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 p-3.5 flex flex-col justify-between">
                    <div>
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        Kurstab ved nyt lån
                      </span>
                      <div className="mt-1 text-xl font-bold text-amber-600 dark:text-amber-400">
                        {formatKr(displayKurstabOptagelse)}
                      </div>
                    </div>
                    <div className="mt-2 text-xs text-slate-600 dark:text-slate-400 border-t border-slate-200/60 dark:border-slate-700/60 pt-2">
                      {isOptionBActive
                        ? `Kun kurstab på tillægslånet (${formatKurs(activeNew.kurs)}).`
                        : `Nye obligationer udstedes til kurs ${formatKurs(activeNew.kurs)}.`}
                    </div>
                  </div>

                  {/* Netto Kurseffekt */}
                  <div className={`rounded-xl border p-3.5 flex flex-col justify-between ${
                    netKurseffekt >= 0
                      ? 'border-emerald-300 bg-emerald-50/50 dark:border-emerald-900/60 dark:bg-emerald-950/20'
                      : 'border-amber-300 bg-amber-50/50 dark:border-amber-900/60 dark:bg-amber-950/20'
                  }`}>
                    <div>
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                        Netto kurseffekt
                      </span>
                      <div className={`mt-1 text-xl font-black ${
                        netKurseffekt >= 0 ? 'text-emerald-700 dark:text-emerald-400' : 'text-amber-700 dark:text-amber-400'
                      }`}>
                        {netKurseffekt > 0 ? '+' : ''}{formatKr(netKurseffekt)}
                      </div>
                    </div>
                    <div className="mt-2 text-xs text-slate-600 dark:text-slate-300 border-t border-slate-200/60 dark:border-slate-700/60 pt-2">
                      {netKurseffekt >= 0 ? 'Kursgevinst overstiger kurstabet' : 'Kurstab overstiger gevinst'}
                    </div>
                  </div>
                </div>

                {/* Inline Reality Check advice */}
                <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-800/30 p-3.5 text-xs text-slate-700 dark:text-slate-300 flex items-start gap-3">
                  <Lightbulb className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <span className="font-bold text-slate-900 dark:text-slate-100">
                      {isUpconversion ? 'Opkonvertering med gældsskær: ' : 'Omlægning: '}
                    </span>
                    {isUpconversion ? (
                      <span>
                        Du skærer <strong>{formatKr(Math.abs(displayDeltaRestgaeld))}</strong> af din nominelle restgæld, men din månedlige ydelse stiger med <strong>{formatKr(displayDeltaMonthlyYdelse)}</strong>/md. Det er en gevinst, hvis renten falder igen inden for {breakevenYears ? `${breakevenYears.toFixed(1)} år` : 'få år'}, så du kan nedkonvertere.
                      </span>
                    ) : (
                      <span>
                        Din ydelse ændres med <strong>{formatKr(displayDeltaMonthlyYdelse)}</strong>/md. Samlede etableringsomkostninger er <strong>{formatKr(displayFees)}</strong>.
                      </span>
                    )}
                  </div>
                </div>

                {/* Gebyrer breakdown accordion */}
                <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setShowFees(!showFees)}
                    className="w-full flex items-center justify-between p-3 text-xs font-semibold text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors"
                  >
                    <span className="flex items-center gap-1.5">
                      <Receipt className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      Medfinansierede låneomkostninger: {formatKr(displayFees)}
                    </span>
                    <span className="text-[11px] text-blue-600 dark:text-blue-400 flex items-center gap-1">
                      {showFees ? 'Skjul' : 'Vis specifikation'}
                      {showFees ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                    </span>
                  </button>

                  {showFees && (
                    <div className="p-3 bg-slate-50/70 dark:bg-slate-800/40 border-t border-slate-200 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                      <div>
                        <span className="text-slate-500 dark:text-slate-400">Tinglysning (§ 5a):</span>
                        <div className="font-bold text-slate-900 dark:text-slate-100">{formatKr(comparison.fees.tinglysningTotal)}</div>
                        <span className="text-[10px] text-slate-400">Fast gebyr + 1,45 % af forhøjelse</span>
                      </div>
                      <div>
                        <span className="text-slate-500 dark:text-slate-400">Kurtage (0,15 %):</span>
                        <div className="font-bold text-slate-900 dark:text-slate-100">{formatKr(comparison.fees.kurtage)}</div>
                        <span className="text-[10px] text-slate-400">Handelsprovision på obligationer</span>
                      </div>
                      <div>
                        <span className="text-slate-500 dark:text-slate-400">Bank & institut:</span>
                        <div className="font-bold text-slate-900 dark:text-slate-100">{formatKr(comparison.fees.gebyrerInstitutOgBank)}</div>
                        <span className="text-[10px] text-slate-400">Stiftelse, ekspedition og indfrielse</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB CONTENT 2: CHARTS */}
            {desktopTab === 'charts' && (
              <div className="p-4 sm:p-5">
                {chartSubTab === 'breakeven' ? (
                  <BreakevenChart
                    existingSchedule={
                      isOptionBActive && optionBSchedule
                        ? comparison.newSchedule
                        : comparison.existingSchedule
                    }
                    newSchedule={
                      isOptionBActive && optionBSchedule
                        ? optionBSchedule
                        : comparison.newSchedule
                    }
                    maxYears={
                      isOptionBActive && optionBSchedule
                        ? Math.max(comparison.newSchedule.totalQuarters, optionBSchedule.totalQuarters) / 4
                        : comparison.maxYears
                    }
                    frivaerdiUdbetalt={isOptionBActive && optionBSchedule ? 0 : effectiveFrivaerdi}
                    title={
                      isOptionBActive
                        ? 'Breakeven: Option B (Tillæg) vs. Option A (Fuld)'
                        : 'Breakeven: Nyt lån vs. Nuværende'
                    }
                    baselineLabel={isOptionBActive ? 'Option A' : undefined}
                    comparisonLabel={isOptionBActive ? 'Option B' : undefined}
                    mode={isOptionBActive ? 'tillaeg_vs_omlaegning' : 'refinancing'}
                    onOpenDumbIdeas={() => setShowDumbIdeasModal(true)}
                  />
                ) : (
                  <LoanChart
                    title="Restgældsudvikling over tid"
                    years={comparison.maxYears}
                    series={chartSeries}
                  />
                )}
              </div>
            )}

            {/* TAB CONTENT 3: OPTION A VS B COMPARATOR */}
            {desktopTab === 'comparator' && tillaegslaanComparison && (
              <div className="p-4 sm:p-5">
                <TillaegslaanComparator
                  comparison={tillaegslaanComparison}
                  existingLoan={activeExisting}
                  newLoan={activeNew}
                  desiredCashout={effectiveFrivaerdi > 0 ? effectiveFrivaerdi : 200_000}
                />
              </div>
            )}

            {/* TAB CONTENT 4: AMORTIZATION SCHEDULE */}
            {desktopTab === 'amortization' && (
              <div className="p-4 sm:p-5 flex flex-col gap-3">
                <AmortizationTable
                  calculation={comparison.newSchedule}
                  title={`Annuitet: Nyt lån (${activeNew.name} - ${comparison.newYears} år)`}
                  defaultOpen={true}
                />
                <AmortizationTable
                  calculation={comparison.existingSchedule}
                  title={`Annuitet: Nuværende lån (${activeExisting.name} - ${comparison.existingYears} år)`}
                  defaultOpen={false}
                />
                {optionBSchedule && (
                  <AmortizationTable
                    calculation={optionBSchedule}
                    title={`Annuitet: Option B (Nuværende + Tillæg)`}
                    defaultOpen={false}
                  />
                )}
              </div>
            )}
          </div>
        </main>
      </div>

      {/* MODALS */}
      <DumbIdeasModal
        isOpen={showDumbIdeasModal}
        onClose={() => setShowDumbIdeasModal(false)}
        comparison={comparison}
        tillaegslaanComparison={tillaegslaanComparison}
        breakevenYears={breakevenYears}
        existingAfdragsfriYears={existingAfdragsfriYears}
        newAfdragsfriYears={newAfdragsfriYears}
      />

      {currentState && onRestoreScenario && (
        <ScenarioComparisonModal
          isOpen={showScenariosModal}
          onClose={() => setShowScenariosModal(false)}
          currentState={currentState}
          currentMetrics={{
            monthlyPaymentAfterTax: displayNyMonthlyYdelse,
            monthlyAfdrag: displayMonthlyAfdrag,
            deltaRestgaeld: displayDeltaRestgaeld,
            breakevenYears,
            loanTitle: `${activeNew.name} (${newLoanYears} år)`,
          }}
          onRestoreScenario={onRestoreScenario}
        />
      )}

      <ValidationToast errors={fieldErrors} />
    </div>
  );
};
