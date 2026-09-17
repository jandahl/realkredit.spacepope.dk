import type { BondLoan, TwoLayerLoanResult, QuarterlyScheduleRow } from './types';
import {
  calculateLoanAmortization,
  STANDARD_TAX_DEDUCTION_RATE,
  principalFromCash,
  getDefaultAfdragsfriYears,
} from './amortization';

/**
 * Calculates a two-layer mortgage loan (to-lags belåning) splitting into two LTV tiers.
 * Honour each bond's loebetid when totalQuarters is omitted (do not always force 120).
 */
export function calculateTwoLayerLoan(
  propertyValue: number,
  totalLoanAmount: number,
  splitLtvPercent: number, // e.g. 40 or 60%
  layer1Loan: BondLoan,
  layer2Loan: BondLoan,
  totalQuarters?: number,
  taxDeductionRate: number = STANDARD_TAX_DEDUCTION_RATE,
  layer1AfdragsfriYears?: number,
  layer2AfdragsfriYears?: number
): TwoLayerLoanResult {
  const layer1DefaultQuarters = (layer1Loan.loebetid ?? 30) * 4;
  const layer2DefaultQuarters = (layer2Loan.loebetid ?? 30) * 4;
  const resolvedQuarters = totalQuarters ?? Math.max(layer1DefaultQuarters, layer2DefaultQuarters);

  const maxLtv = Math.min(80, (totalLoanAmount / propertyValue) * 100);
  const actualSplitLtv = Math.min(splitLtvPercent, maxLtv);

  const layer1Amount = (propertyValue * actualSplitLtv) / 100;
  const layer2Amount = Math.max(0, totalLoanAmount - layer1Amount);

  const layer1LtvRange: [number, number] = [0, actualSplitLtv];
  const layer2LtvRange: [number, number] = [actualSplitLtv, maxLtv];

  const layer1Principal = principalFromCash(layer1Amount, layer1Loan.kurs);
  const layer2Principal = layer2Amount > 0 ? principalFromCash(layer2Amount, layer2Loan.kurs) : 0;

  const layer1Io =
    layer1AfdragsfriYears !== undefined
      ? layer1AfdragsfriYears
      : getDefaultAfdragsfriYears(layer1Loan) || undefined;
  const layer2Io =
    layer2AfdragsfriYears !== undefined
      ? layer2AfdragsfriYears
      : getDefaultAfdragsfriYears(layer2Loan) || undefined;

  const layer1Result = calculateLoanAmortization(
    layer1Loan,
    resolvedQuarters,
    layer1Principal,
    layer1LtvRange,
    taxDeductionRate,
    layer1Io
  );

  const layer2Result = calculateLoanAmortization(
    layer2Loan,
    resolvedQuarters,
    layer2Principal,
    layer2LtvRange,
    taxDeductionRate,
    layer2Io
  );

  const combinedSchedule: QuarterlyScheduleRow[] = [];
  const maxQuarters = Math.max(layer1Result.schedule.length, layer2Result.schedule.length);

  for (let i = 0; i < maxQuarters; i++) {
    const r1 = layer1Result.schedule[i] || {
      quarter: i + 1,
      year: Math.floor(i / 4) + 1,
      quarterOfYear: (i % 4) + 1,
      startRestgaeld: 0,
      rente: 0,
      bidrag: 0,
      afdrag: 0,
      ydelseFoerSkat: 0,
      skatFradrag: 0,
      ydelseEfterSkat: 0,
      endRestgaeld: 0,
    };
    const r2 = layer2Result.schedule[i] || {
      quarter: i + 1,
      year: Math.floor(i / 4) + 1,
      quarterOfYear: (i % 4) + 1,
      startRestgaeld: 0,
      rente: 0,
      bidrag: 0,
      afdrag: 0,
      ydelseFoerSkat: 0,
      skatFradrag: 0,
      ydelseEfterSkat: 0,
      endRestgaeld: 0,
    };

    combinedSchedule.push({
      quarter: i + 1,
      year: Math.floor(i / 4) + 1,
      quarterOfYear: (i % 4) + 1,
      startRestgaeld: r1.startRestgaeld + r2.startRestgaeld,
      rente: r1.rente + r2.rente,
      bidrag: r1.bidrag + r2.bidrag,
      afdrag: r1.afdrag + r2.afdrag,
      ydelseFoerSkat: r1.ydelseFoerSkat + r2.ydelseFoerSkat,
      skatFradrag: r1.skatFradrag + r2.skatFradrag,
      ydelseEfterSkat: r1.ydelseEfterSkat + r2.ydelseEfterSkat,
      endRestgaeld: r1.endRestgaeld + r2.endRestgaeld,
    });
  }

  return {
    propertyValue,
    layer1LtvRange,
    layer2LtvRange,
    layer1Amount,
    layer2Amount,
    layer1Result,
    layer2Result,
    combinedMonthlyYdelse: layer1Result.monthlyYdelse + layer2Result.monthlyYdelse,
    combinedMonthlyYdelseEfterSkat: layer1Result.monthlyYdelseEfterSkat + layer2Result.monthlyYdelseEfterSkat,
    combinedMonthlyAfdrag: layer1Result.monthlyAfdrag + layer2Result.monthlyAfdrag,
    combinedTotalRenteOgBidrag: layer1Result.totalRenteOgBidrag + layer2Result.totalRenteOgBidrag,
    combinedTotalBetalt: layer1Result.totalBetalt + layer2Result.totalBetalt,
    combinedSchedule,
  };
}
