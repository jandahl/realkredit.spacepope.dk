import type { BondLoan, TwoLayerLoanResult, QuarterlyScheduleRow } from './types';
import { calculateLoanAmortization, STANDARD_TAX_DEDUCTION_RATE } from './amortization';

/**
 * Calculates a two-layer mortgage loan (to-lags belåning) splitting into two LTV tiers.
 */
export function calculateTwoLayerLoan(
  propertyValue: number,
  totalLoanAmount: number,
  splitLtvPercent: number, // e.g. 40 or 60%
  layer1Loan: BondLoan,
  layer2Loan: BondLoan,
  totalQuarters: number = 120,
  taxDeductionRate: number = STANDARD_TAX_DEDUCTION_RATE
): TwoLayerLoanResult {
  const maxLtv = Math.min(80, (totalLoanAmount / propertyValue) * 100);
  const actualSplitLtv = Math.min(splitLtvPercent, maxLtv);

  // Layer 1 amount: 0 to actualSplitLtv
  const layer1Amount = (propertyValue * actualSplitLtv) / 100;
  // Layer 2 amount: remaining amount up to maxLtv
  const layer2Amount = Math.max(0, totalLoanAmount - layer1Amount);

  const layer1LtvRange: [number, number] = [0, actualSplitLtv];
  const layer2LtvRange: [number, number] = [actualSplitLtv, maxLtv];

  // Convert cash needed to nominal principal if bond price is below 100
  const layer1Principal = (layer1Amount / layer1Loan.kurs) * 100;
  const layer2Principal = layer2Amount > 0 ? (layer2Amount / layer2Loan.kurs) * 100 : 0;

  const layer1Result = calculateLoanAmortization(
    layer1Loan,
    totalQuarters,
    layer1Principal,
    layer1LtvRange,
    taxDeductionRate
  );

  const layer2Result = calculateLoanAmortization(
    layer2Loan,
    totalQuarters,
    layer2Principal,
    layer2LtvRange,
    taxDeductionRate
  );

  // Merge schedules quarter by quarter
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
