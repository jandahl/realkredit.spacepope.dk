import type { BondLoan, RefinancingComparison } from './types';
import { calculateLoanAmortization, STANDARD_TAX_DEDUCTION_RATE } from './amortization';

/**
 * Calculates a mortgage refinancing (omlægning / konvertering) comparison.
 */
export function calculateRefinancing(
  existingLoan: BondLoan,
  existingRestgaeld: number,
  newLoan: BondLoan,
  propertyValue: number,
  remainingYears: number = 30,
  taxDeductionRate: number = STANDARD_TAX_DEDUCTION_RATE
): RefinancingComparison {
  const totalQuarters = Math.round(remainingYears * 4);

  // Par redemption rule: A Danish mortgage bond can be redeemed at spot market price
  // or at par (100) if market price is above 100.
  const redemptionKurs = Math.min(100, existingLoan.kurs);
  const indfrielsesBeloeb = (existingRestgaeld * redemptionKurs) / 100;

  // New loan principal needed to cover redemption amount at the new bond's price
  const nyHovedstol = (indfrielsesBeloeb / newLoan.kurs) * 100;

  // LTV intervals based on property value
  const calculateLtvRange = (loanAmount: number): [number, number] => {
    if (propertyValue <= 0) return [0, 80];
    const maxLtv = Math.min(80, (loanAmount / propertyValue) * 100);
    return [0, Math.max(1, maxLtv)];
  };

  const existingLtv = calculateLtvRange(existingRestgaeld);
  const newLtv = calculateLtvRange(nyHovedstol);

  const existingSchedule = calculateLoanAmortization(
    existingLoan,
    totalQuarters,
    existingRestgaeld,
    existingLtv,
    taxDeductionRate
  );

  const newSchedule = calculateLoanAmortization(
    newLoan,
    totalQuarters,
    nyHovedstol,
    newLtv,
    taxDeductionRate
  );

  const deltaRestgaeld = nyHovedstol - existingRestgaeld;
  const kursgevinstEllerTab = existingRestgaeld - nyHovedstol;

  return {
    existingLoan,
    existingRestgaeld,
    existingKurs: existingLoan.kurs,
    indfrielsesBeloeb,
    newLoan,
    newKurs: newLoan.kurs,
    nyHovedstol,
    kursgevinstEllerTab,
    deltaRestgaeld,
    deltaMonthlyYdelseEfterSkat: newSchedule.monthlyYdelseEfterSkat - existingSchedule.monthlyYdelseEfterSkat,
    deltaMonthlyYdelseFoerSkat: newSchedule.monthlyYdelse - existingSchedule.monthlyYdelse,
    deltaMonthlyAfdrag: newSchedule.monthlyAfdrag - existingSchedule.monthlyAfdrag,
    existingSchedule,
    newSchedule,
  };
}
