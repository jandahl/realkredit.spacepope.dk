import React, { useState, useMemo, useEffect } from 'react';
import type { BondLoan, LoanAmortizationResult, QuarterlyScheduleRow } from '../calculator/types';
import { calculateRefinancing } from '../calculator/refinancing';
import { getDefaultAfdragsfriYears, estimateRemainingAfdragsfriYears, getOriginalTermYears } from '../calculator/amortization';
import { calculateTillaegslaanComparison } from '../calculator/tillaegslaan';
import { CurrencyInput } from '../components/CurrencyInput';
import { DependentLoanSelect } from '../components/DependentLoanSelect';
import { MetricCard } from '../components/MetricCard';
import { AmortizationTable } from '../components/AmortizationTable';
import { LoanChart, type ChartSeries } from '../components/LoanChart';
import { BreakevenChart } from '../components/BreakevenChart';
import { DumbIdeasModal } from '../components/DumbIdeasModal';
import { DumbIdeasPanel } from '../components/DumbIdeasPanel';
import { ReportBar, ShowReportLink, type ReportStrategy } from '../components/ReportBar';
import type { AppMode } from '../utils/appMode';
import { TillaegslaanComparator } from '../components/TillaegslaanComparator';
import { ValidationToast } from '../components/ValidationToast';
import { formatKr, formatKurs, formatPercent } from '../utils/formatters';
import { computeBreakevenSeries } from '../utils/breakeven';
import { maxLoanAt80Ltv, maxCostAwareFrivaerdi, estimateOptionANyHovedstol, estimateOptionBTotalNominal, buildLtvFieldErrors, mapCashoutAcrossStrategyMax } from '../utils/ltv';
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
  mode: AppMode;
  setMode: (mode: AppMode) => void;
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
  mode,
  setMode,
}) => {
  const [showFees, setShowFees] = useState<boolean>(false);
  const [showDumbIdeas, setShowDumbIdeas] = useState<boolean>(false);
  const [reportStrategy, setReportStrategy] = useState<ReportStrategy>('a');
  const isReport = mode === 'report';

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
    const currentYear = new Date().getFullYear();
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
    const currentYear = new Date().getFullYear();
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

  // Remaining interest-free years for existing loan (0 to max for 10 vs 30 product)
  const [existingAfdragsfriYears, setExistingAfdragsfriYears] = useState<number>(10);
  // Remaining interest-free years for new loan (0 to max allowed by new bond)
  const [newAfdragsfriYears, setNewAfdragsfriYears] = useState<number>(0);

  // Max remaining IO years for existing loan (10 vs 30 product rule)
  const maxExistingAfdragsfriYears = useMemo(() => {
    if (!activeExisting?.afdragsfri) return 0;
    return Math.min(remainingYears, getDefaultAfdragsfriYears(activeExisting));
  }, [activeExisting, remainingYears]);
  // Friværdi strategy selector: Option A (Fuld omlægning) vs Option B (Tillægslån)
  const [frivaerdiStrategy, setFrivaerdiStrategy] = useState<'omlaegning' | 'tillaeg'>('omlaegning');

  // Original product term for the existing bond (loebetid → maxTerminer/4 → name → 30)
  const originalExistingTermYears = useMemo(() => {
    if (!activeExisting) return 30;
    return getOriginalTermYears(activeExisting);
  }, [activeExisting]);

  // Sync existingAfdragsfriYears when activeExisting changes or remainingYears changes
  useEffect(() => {
    if (activeExisting) {
      if (!activeExisting.afdragsfri) {
        setExistingAfdragsfriYears(0);
      } else {
        const maxOriginalAfdragsfri = getDefaultAfdragsfriYears(activeExisting);
        setExistingAfdragsfriYears(
          estimateRemainingAfdragsfriYears(remainingYears, originalExistingTermYears, maxOriginalAfdragsfri)
        );
      }
    }
  }, [activeExisting, remainingYears, originalExistingTermYears]);

  // Sync newAfdragsfriYears when activeNew changes
  useEffect(() => {
    if (activeNew) {
      if (!activeNew.afdragsfri) {
        setNewAfdragsfriYears(0);
      } else {
        const defaultAfdragsfri = getDefaultAfdragsfriYears(activeNew);
        setNewAfdragsfriYears((prev) => (prev === 0 ? defaultAfdragsfri : Math.min(prev, defaultAfdragsfri)));
      }
    }
  }, [activeNew]);

  // Slider / hard max: strategy-specific cost-aware 80% LTV (fees + kurs→hovedstol).
  // Do NOT use strategy "both" — that crushed A@below-pari while B still had room.
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
    [propertyValue, debt, redemptionPrice, newKurs],
  );
  const frivaerdiCapStrategy = frivaerdiStrategy; // 'omlaegning' | 'tillaeg'
  const maxFrivaerdiOmlaegning = useMemo(
    () => maxCostAwareFrivaerdi(cashoutLtvInputs, 'omlaegning'),
    [cashoutLtvInputs],
  );
  const maxFrivaerdiTillaeg = useMemo(
    () => maxCostAwareFrivaerdi(cashoutLtvInputs, 'tillaeg'),
    [cashoutLtvInputs],
  );
  const maxPossibleFrivaerdi =
    frivaerdiCapStrategy === 'tillaeg' ? maxFrivaerdiTillaeg : maxFrivaerdiOmlaegning;
  /** Below-pari fuld omlægning often leaves much less room than tillægslån. */
  const showBelowPariOmlaegningHint =
    maxFrivaerdiOmlaegning > 0 &&
    maxFrivaerdiTillaeg > 0 &&
    maxFrivaerdiOmlaegning * 2 < maxFrivaerdiTillaeg;
  const effectiveFrivaerdi = enableFrivaerdi ? Math.min(frivaerdiUdbetalt, maxPossibleFrivaerdi) : 0;

  // Keep cashout within strategy-specific cost-aware 80% LTV when inputs/kurs/strategy change
  useEffect(() => {
    if (enableFrivaerdi && frivaerdiUdbetalt > maxPossibleFrivaerdi) {
      setFrivaerdiUdbetalt(maxPossibleFrivaerdi);
    }
  }, [enableFrivaerdi, frivaerdiUdbetalt, maxPossibleFrivaerdi, setFrivaerdiUdbetalt, frivaerdiStrategy]);

  const debtError = debt > maxDebtAt80;
  const frivaerdiError = enableFrivaerdi && frivaerdiUdbetalt > maxPossibleFrivaerdi;
  const fieldErrors = buildLtvFieldErrors({
    propertyValue,
    debtOrLoan: debt,
    debtAnchorId: 'field-restgaeld',
    debtLabel: `Nuværende restgæld overstiger 80 % LTV (maks. ${formatKr(maxDebtAt80)})`,
    enableFrivaerdi,
    frivaerdiUdbetalt,
    maxFrivaerdi: maxPossibleFrivaerdi,
    frivaerdiAnchorId: 'field-frivaerdi',
  });

  const computeMaxFri = (pv: number, nextDebt: number, strategy: 'omlaegning' | 'tillaeg' = frivaerdiStrategy) =>
    maxCostAwareFrivaerdi(
      {
        propertyValue: pv,
        existingRestgaeld: nextDebt,
        existingKurs: redemptionPrice,
        newKurs,
      },
      strategy,
    );

  const handlePropertyBlur = (clampedProperty: number) => {
    const maxDebt = maxLoanAt80Ltv(clampedProperty);
    let nextDebt = debt;
    if (debt > maxDebt) {
      nextDebt = maxDebt;
      setDebt(maxDebt);
    }
    if (enableFrivaerdi) {
      const maxFri = computeMaxFri(clampedProperty, nextDebt);
      if (frivaerdiUdbetalt > maxFri) {
        setFrivaerdiUdbetalt(maxFri);
      }
    }
  };

  const handleDebtBlur = (clampedDebt: number) => {
    const maxDebt = maxLoanAt80Ltv(propertyValue);
    let nextDebt = clampedDebt;
    if (clampedDebt > maxDebt) {
      nextDebt = maxDebt;
      setDebt(maxDebt);
    }
    if (enableFrivaerdi) {
      const maxFri = computeMaxFri(propertyValue, nextDebt);
      if (frivaerdiUdbetalt > maxFri) {
        setFrivaerdiUdbetalt(maxFri);
      }
    }
  };

  const handleFrivaerdiStrategyChange = (strategy: 'omlaegning' | 'tillaeg') => {
    const prevMax = frivaerdiStrategy === 'tillaeg' ? maxFrivaerdiTillaeg : maxFrivaerdiOmlaegning;
    const nextMax = strategy === 'tillaeg' ? maxFrivaerdiTillaeg : maxFrivaerdiOmlaegning;
    setFrivaerdiStrategy(strategy);
    if (!enableFrivaerdi) return;
    setFrivaerdiUdbetalt(mapCashoutAcrossStrategyMax(frivaerdiUdbetalt, prevMax, nextMax));
  };

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
  }, [activeExisting, activeNew, debt, propertyValue, remainingYears, newLoanYears, effectiveFrivaerdi, existingAfdragsfriYears, newAfdragsfriYears]);

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
      existingAfdragsfriYears,
      newAfdragsfriYears
    );
  }, [enableFrivaerdi, effectiveFrivaerdi, activeExisting, activeNew, debt, propertyValue, remainingYears, newLoanYears, existingAfdragsfriYears, newAfdragsfriYears]);

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

    const seriesList: ChartSeries[] = [
      {
        id: 'new',
        name: enableFrivaerdi ? `Option A: Fuld omlægning (${activeNew.name} - ${comparison.newYears} år)` : `Nyt lån (${activeNew.name} - ${comparison.newYears} år)`,
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
        name: `Option B: Tillægslån (Behold ${activeExisting.name} + ${activeNew.name})`,
        color: '#10b981', // Emerald green
        strokeDash: '3 3',
        data: tillaegData,
      });
    }

    return seriesList;
  }, [comparison, tillaegslaanComparison, activeExisting, activeNew, enableFrivaerdi]);


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

  // Option B active? (same rule as display metrics; needed for breakeven wiring)
  const optionBAvailableForBe = Boolean(tillaegslaanComparison);
  const isOptionBForBreakeven = isReport
    ? reportStrategy === 'b' && optionBAvailableForBe
    : enableFrivaerdi && frivaerdiStrategy === 'tillaeg' && optionBAvailableForBe;

  // Compute breakeven years — same schedules + cashout as BreakevenChart
  const breakevenYears = useMemo<number | null>(() => {
    if (!comparison) return null;
    const existing = comparison.existingSchedule;
    const neu =
      isOptionBForBreakeven && optionBSchedule
        ? optionBSchedule
        : comparison.newSchedule;
    const cashout = effectiveFrivaerdi;
    const maxYears =
      Math.max(existing.totalQuarters, neu.totalQuarters) / 4 || comparison.maxYears;
    const { breakevenCrossing } = computeBreakevenSeries(existing, neu, maxYears, cashout);
    return breakevenCrossing === null ? null : breakevenCrossing / 4;
  }, [
    comparison,
    isOptionBForBreakeven,
    optionBSchedule,
    effectiveFrivaerdi,
  ]);

  if (!activeExisting || !activeNew || !comparison) {
    return <div className="p-6 text-center text-slate-500 dark:text-slate-400">Indlæser lånedata...</div>;
  }

  // Active Display metrics depending on Option A vs Option B selection
  // Report mode uses reportStrategy (a/b/both); edit mode uses frivaerdiStrategy.
  const optionBAvailable = Boolean(tillaegslaanComparison);
  const isOptionBActive = isReport
    ? reportStrategy === 'b' && optionBAvailable
    : enableFrivaerdi && frivaerdiStrategy === 'tillaeg' && optionBAvailable;
  const showBothStrategies = isReport && reportStrategy === 'both' && optionBAvailable;

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

  // Option B metrics for "Begge" stacked view
  const optionBNyHovedstol = tillaegslaanComparison
    ? comparison.existingRestgaeld + tillaegslaanComparison.optionB_tillaegslaan.tillaegHovedstol
    : 0;
  const optionBMonthly = tillaegslaanComparison
    ? tillaegslaanComparison.optionB_tillaegslaan.combinedMonthlyYdelseEfterSkat
    : 0;
  const optionBDeltaMonthly = tillaegslaanComparison
    ? tillaegslaanComparison.optionB_tillaegslaan.tillaegMonthlyYdelseEfterSkat
    : 0;
  const optionBDeltaRest = tillaegslaanComparison
    ? tillaegslaanComparison.optionB_tillaegslaan.tillaegHovedstol
    : 0;

  return (
    <div className={`flex flex-col gap-5 min-w-0 max-w-full ${fieldErrors.length ? "pb-28" : "pb-8"}`}>
      {isReport ? (
        <ReportBar
          title="Rapport: Låneomlægning"
          onEdit={() => setMode('edit')}
          strategy={reportStrategy}
          onStrategyChange={setReportStrategy}
          optionBAvailable={optionBAvailable}
          optionBDisabledReason="Tillægslån (Option B) kræver friværdiudtag i scenariet. Tryk Rediger for at aktivere."
        />
      ) : (
        <div className="rounded-xl bg-gradient-to-r from-blue-700 via-indigo-700 to-slate-900 p-3.5 sm:p-4 text-white shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="max-w-2xl min-w-0">
              <div className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-0.5 text-[11px] font-medium backdrop-blur-md mb-1.5">
                <Sparkles className="h-3 w-3 text-amber-300" />
                <span>Konverteringsberegner med live kurser</span>
              </div>
              <h2 className="text-lg sm:text-xl font-bold tracking-tight">
                Beregn omlægning af dit realkreditlån
              </h2>
              <p className="mt-1 text-xs sm:text-sm text-blue-100/85 leading-snug">
                Op-/nedkonvertering, tillægslån og friværdi — med live obligationskurser.
              </p>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
              <ShowReportLink onShow={() => setMode('report')} />
              <button
                type="button"
                onClick={() => setShowDumbIdeas(true)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-white/35 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white/95 backdrop-blur-sm hover:bg-white/20 transition-all cursor-pointer"
              >
                <Lightbulb className="h-3.5 w-3.5 text-amber-200" />
                <span>Reality check</span>
              </button>
            </div>
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
              <div className="text-slate-500 dark:text-slate-400">Restgæld</div>
              <div className="font-semibold text-slate-900 dark:text-slate-100">{formatKr(debt)}</div>
            </div>
            <div>
              <div className="text-slate-500 dark:text-slate-400">Nuværende lån</div>
              <div className="font-semibold text-slate-900 dark:text-slate-100 truncate" title={activeExisting.name}>{activeExisting.name}</div>
            </div>
            <div>
              <div className="text-slate-500 dark:text-slate-400">Nyt lån</div>
              <div className="font-semibold text-slate-900 dark:text-slate-100 truncate" title={activeNew.name}>{activeNew.name}</div>
            </div>
            <div>
              <div className="text-slate-500 dark:text-slate-400">Resterende løbetid</div>
              <div className="font-semibold text-slate-900 dark:text-slate-100">{remainingYears} år</div>
            </div>
            <div>
              <div className="text-slate-500 dark:text-slate-400">Nyt lån løbetid</div>
              <div className="font-semibold text-slate-900 dark:text-slate-100">{newLoanYears} år</div>
            </div>
            <div>
              <div className="text-slate-500 dark:text-slate-400">Friværdiudtag</div>
              <div className="font-semibold text-slate-900 dark:text-slate-100">{enableFrivaerdi ? formatKr(effectiveFrivaerdi) : 'Nej'}</div>
            </div>
            <div>
              <div className="text-slate-500 dark:text-slate-400">Rente</div>
              <div className="font-semibold text-slate-900 dark:text-slate-100">{formatPercent(activeExisting.rente)} → {formatPercent(activeNew.rente)}</div>
            </div>
          </div>
        </div>
      )}

      {/* Input Section — hidden in report mode */}
      {!isReport && (
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Left Card: Property & Debt Inputs (no slider on currency fields) */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900 flex flex-col gap-3 transition-colors">
          <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100 border-b border-slate-100 dark:border-slate-800 pb-2">
            1. Din bolig & restgæld
          </h3>

          <CurrencyInput
            label="Ejendomsværdi"
            value={propertyValue}
            onChange={setPropertyValue}
            min={500_000}
            max={25_000_000}
            step={100_000}
            helpText={`Belåning (LTV): ${propertyValue > 0 ? Math.round((debt / propertyValue) * 100) : 0} %`}
            showSlider={false}
            fieldId="field-ejendomsvaerdi"
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
            fieldId="field-restgaeld"
            error={debtError}
            errorMessage={
              debtError
                ? `Maks. ${formatKr(maxDebtAt80)} (80 % af ejendomsværdien). Værdien justeres når du forlader feltet.`
                : undefined
            }
            onBlurValue={handleDebtBlur}
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
                max={maxExistingAfdragsfriYears}
                step={1}
                value={existingAfdragsfriYears}
                onChange={(e) => setExistingAfdragsfriYears(parseInt(e.target.value, 10))}
                className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-slate-200 accent-amber-600 focus:outline-none dark:bg-slate-700 dark:accent-amber-500"
              />
              <div className="flex justify-between text-[10px] text-slate-500 dark:text-slate-400">
                <span>0 år (afdrager fra i dag)</span>
                <span>{maxExistingAfdragsfriYears} år tilbage</span>
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
                  max={maxPossibleFrivaerdi > 0 ? maxPossibleFrivaerdi : 0}
                  step={1}
                  helpText={`Maks. til 80 % LTV inkl. medfinansierede omkostninger (valgt strategi): ${formatKr(maxPossibleFrivaerdi)}`}
                  showSlider={true}
                  fieldId="field-frivaerdi"
                  error={frivaerdiError}
                  errorMessage={
                    frivaerdiError
                      ? `Maks. ${formatKr(maxPossibleFrivaerdi)} til 80 % LTV inkl. medfinansierede omkostninger. Justeres når du forlader feltet.`
                      : undefined
                  }
                  onBlurValue={(clamped) => {
                    if (clamped > maxPossibleFrivaerdi) {
                      setFrivaerdiUdbetalt(maxPossibleFrivaerdi);
                    }
                  }}
                  labelAction={
                    maxPossibleFrivaerdi > 0 ? (
                      <button
                        type="button"
                        onClick={() => setFrivaerdiUdbetalt(maxPossibleFrivaerdi)}
                        className="rounded-md border border-slate-300 bg-white px-2 py-0.5 text-[11px] font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                        title={`Sæt til maks. ${formatKr(maxPossibleFrivaerdi)}`}
                      >
                        Maks
                      </button>
                    ) : null
                  }
                />

                {/* Segmented strategy selector */}
                <div className="flex flex-col gap-1.5 pt-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Vælg strategi for friværdiudtag:
                  </label>
                  <div className="flex items-center rounded-xl bg-slate-200/80 dark:bg-slate-800 p-1 text-xs font-semibold">
                    <button
                      type="button"
                      onClick={() => handleFrivaerdiStrategyChange('omlaegning')}
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
                      onClick={() => handleFrivaerdiStrategyChange('tillaeg')}
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
                    {(() => {
                      const cash = enableFrivaerdi ? frivaerdiUdbetalt : 0;
                      let exposure: number;
                      if (frivaerdiStrategy === 'tillaeg' && tillaegslaanComparison) {
                        exposure = debt + tillaegslaanComparison.optionB_tillaegslaan.tillaegHovedstol;
                      } else if (frivaerdiStrategy === 'tillaeg') {
                        exposure = estimateOptionBTotalNominal(cashoutLtvInputs, cash);
                      } else if (comparison) {
                        exposure = comparison.nyHovedstol;
                      } else {
                        exposure = estimateOptionANyHovedstol(cashoutLtvInputs, cash);
                      }
                      const ltvPct = Math.round((exposure / (propertyValue || 1)) * 100);
                      return `${formatKr(exposure)} (${ltvPct} % LTV)`;
                    })()}
                  </span>
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 leading-normal">
                  {frivaerdiStrategy === 'tillaeg'
                    ? 'Eksisterende lån beholdes intakt. Tillægslån optages separat til dækning af udbetaling og gebyrer.'
                    : 'Hele lånet omlægges til et nyt samlet lån. Udbetaling og gebyrer medfinansieres.'}
                </div>
                {frivaerdiStrategy === 'omlaegning' && showBelowPariOmlaegningHint && (
                  <div className="text-[11px] text-amber-700 dark:text-amber-400/90 leading-normal">
                    Kurs under pari på fuld omlægning reducerer maks. udbetaling ift. tillægslån (eksisterende lån
                    indfries ikke til underkurs).
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Card: Dependent Loan Selection */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900 flex flex-col gap-3 transition-colors">
          <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100 border-b border-slate-100 dark:border-slate-800 pb-2">
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
                max={Math.min(getDefaultAfdragsfriYears(activeNew), newLoanYears)}
                step={1}
                value={newAfdragsfriYears}
                onChange={(e) => setNewAfdragsfriYears(parseInt(e.target.value, 10))}
                className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-slate-200 accent-blue-600 focus:outline-none dark:bg-slate-700 dark:accent-blue-500"
              />
              <div className="flex justify-between text-[10px] text-slate-500 dark:text-slate-400">
                <span>0 år (afdrager fra start)</span>
                <span>{Math.min(getDefaultAfdragsfriYears(activeNew), newLoanYears)} år</span>
              </div>
            </div>
          )}
        </div>
      </div>
      )}

      {/* Key Metric Cards */}
      {showBothStrategies ? (
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Option A: Fuld omlægning</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <MetricCard title="Ny restgæld (Hovedstol)" value={formatKr(comparison.nyHovedstol)} subValue={`Før: ${formatKr(comparison.existingRestgaeld)}`} delta={{ text: comparison.deltaRestgaeld < 0 ? `${formatKr(Math.abs(comparison.deltaRestgaeld))} lavere` : `${formatKr(comparison.deltaRestgaeld)} højere`, type: comparison.deltaRestgaeld < 0 ? 'positive' : 'negative' }} highlight={true} />
              <MetricCard title="Månedlig ydelse efter skat" value={formatKr(comparison.newSchedule.monthlyYdelseEfterSkat)} subValue={`Før: ${formatKr(comparison.existingSchedule.monthlyYdelseEfterSkat)}`} delta={{ text: `${comparison.deltaMonthlyYdelseEfterSkat > 0 ? '+' : ''}${formatKr(comparison.deltaMonthlyYdelseEfterSkat)}/md.`, type: comparison.deltaMonthlyYdelseEfterSkat < 0 ? 'positive' : 'negative' }} />
              <MetricCard title="Månedligt afdrag" value={comparison.newSchedule.monthlyAfdrag === 0 ? '0 kr. (Afdragsfrit)' : formatKr(comparison.newSchedule.monthlyAfdrag)} subValue={comparison.existingSchedule.monthlyAfdrag === 0 ? 'Før: Afdragsfrit (0 kr.)' : `Før: ${formatKr(comparison.existingSchedule.monthlyAfdrag)}`} />
              <MetricCard title="Omkostninger" value={formatKr(comparison.fees.samledeOmkostninger)} subValue="Fuld omlægning" />
            </div>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Option B: Tillægslån</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <MetricCard title="Samlet restgæld" value={formatKr(optionBNyHovedstol)} subValue={`Før: ${formatKr(comparison.existingRestgaeld)}`} delta={{ text: `+${formatKr(optionBDeltaRest)} tillæg`, type: 'neutral' }} highlight={true} />
              <MetricCard title="Kombineret ydelse efter skat" value={formatKr(optionBMonthly)} subValue={`Før: ${formatKr(comparison.existingSchedule.monthlyYdelseEfterSkat)}`} delta={{ text: `+${formatKr(optionBDeltaMonthly)}/md.`, type: 'negative' }} />
              <MetricCard title="Tillægslån hovedstol" value={formatKr(optionBDeltaRest)} subValue="Nuværende lån beholdes" />
              <MetricCard title="Omkostninger" value={formatKr(tillaegslaanComparison!.optionB_tillaegslaan.tillaegOmkostninger)} subValue="Kun tillægslån" />
            </div>
          </div>
        </div>
      ) : (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
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
      )}

      {/* Kursgevinst & Kurstab Breakdown */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900 transition-colors">
        <div className="flex items-center justify-between mb-2">
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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 items-stretch">
          {/* 1. Tillægslån / Udbetaling */}
          <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 dark:border-slate-800 dark:bg-slate-800/40 flex flex-col justify-between">
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
                className={`rounded-2xl border-2 p-5 shadow-md transition-all flex flex-col justify-between relative overflow-hidden ${
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

      {/* Breakeven Graph — Option B uses combined existing+tillæg as "new" */}
      <BreakevenChart
        existingSchedule={comparison.existingSchedule}
        newSchedule={
          isOptionBActive && optionBSchedule
            ? optionBSchedule
            : comparison.newSchedule
        }
        maxYears={
          isOptionBActive && optionBSchedule
            ? Math.max(
                comparison.existingSchedule.totalQuarters,
                optionBSchedule.totalQuarters,
              ) / 4
            : comparison.maxYears
        }
        frivaerdiUdbetalt={effectiveFrivaerdi}
        onOpenDumbIdeas={() => setShowDumbIdeas(true)}
      />

      {/* Graphical Chart of Restgæld Progression (scaled to longest loan duration) */}
      <LoanChart
        title="Restgældsudvikling over tid"
        subtitle={
          `Sammenligning over ${comparison.maxYears} år (Nuværende lån ${comparison.existingYears} år vs. Nyt lån ${comparison.newYears} år).` +
          (redemptionPrice < 100
            ? ` Ved Option A indfries nuværende lån til kurs ${formatKurs(redemptionPrice)}, så restgælden starter på ${formatKr(comparison.nyHovedstol)} inkl. gebyrer/udbetaling.`
            : '')
        }
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

      {/* Inline Reality check in report mode */}
      {isReport && (
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-5 shadow-xs transition-colors">
          <DumbIdeasPanel
            comparison={comparison}
            tillaegslaanComparison={tillaegslaanComparison}
            breakevenYears={breakevenYears}
            existingAfdragsfriYears={existingAfdragsfriYears}
            newAfdragsfriYears={newAfdragsfriYears}
            variant="inline"
            hideStrategyToggle={showBothStrategies}
            activeStrategy={
              reportStrategy === 'b' ? 'tillaeg' : 'full'
            }
          />
          {showBothStrategies && tillaegslaanComparison && (
            <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-800">
              <DumbIdeasPanel
                comparison={comparison}
                tillaegslaanComparison={tillaegslaanComparison}
                breakevenYears={breakevenYears}
                existingAfdragsfriYears={existingAfdragsfriYears}
                newAfdragsfriYears={newAfdragsfriYears}
                variant="inline"
                hideStrategyToggle
                activeStrategy="tillaeg"
              />
            </div>
          )}
        </div>
      )}

      {/* Dumb Ideas / Reality Check Modal (edit mode) */}
      <DumbIdeasModal
        isOpen={showDumbIdeas}
        onClose={() => setShowDumbIdeas(false)}
        comparison={comparison}
        tillaegslaanComparison={tillaegslaanComparison}
        breakevenYears={breakevenYears}
        existingAfdragsfriYears={existingAfdragsfriYears}
        newAfdragsfriYears={newAfdragsfriYears}
      />

      <ValidationToast errors={fieldErrors} />
    </div>
  );
};
