import type { BondLoan, RefinancingComparison } from './types';
import { calculateLoanAmortization, STANDARD_TAX_DEDUCTION_RATE } from './amortization';

/**
 * Calculates a mortgage refinancing (omlægning / konvertering) comparison,
 * optionally with equity payout (udbetaling af friværdi / tillægslån).
 */
export function calculateRefinancing(
  existingLoan: BondLoan,
  existingRestgaeld: number,
  newLoan: BondLoan,
  propertyValue: number,
  existingYears: number = 30,
  newYears: number = 30,
  frivaerdiUdbetalt: number = 0,
  taxDeductionRate: number = STANDARD_TAX_DEDUCTION_RATE
): RefinancingComparison {
  const existingQuarters = Math.max(1, Math.round(existingYears * 4));
  const newQuarters = Math.max(1, Math.round(newYears * 4));
  const maxYears = Math.max(existingYears, newYears);

  // 1. Redemption of existing bond
  // In Denmark, borrower buys back bonds at spot price (capped at 100 for callable bonds)
  const redemptionKurs = Math.min(100, existingLoan.kurs);
  const indfrielsesBeloeb = (existingRestgaeld * redemptionKurs) / 100;
  const kursgevinstIndfrielse = Math.max(0, existingRestgaeld - indfrielsesBeloeb);

  // 2. Cash requirement
  const samletKontantbehov = indfrielsesBeloeb + Math.max(0, frivaerdiUdbetalt);

  // 3. New bond issuance
  // New nominal debt needed to raise samletKontantbehov at the new bond's market price
  const nyHovedstol = (samletKontantbehov / newLoan.kurs) * 100;
  const kurstabOptagelse = Math.max(0, nyHovedstol - samletKontantbehov);

  // LTV calculation
  const calculateLtvRange = (loanAmount: number): [number, number] => {
    if (propertyValue <= 0) return [0, 80];
    const maxLtv = Math.min(80, (loanAmount / propertyValue) * 100);
    return [0, Math.max(1, maxLtv)];
  };

  const existingLtv = calculateLtvRange(existingRestgaeld);
  const newLtv = calculateLtvRange(nyHovedstol);

  const existingSchedule = calculateLoanAmortization(
    existingLoan,
    existingQuarters,
    existingRestgaeld,
    existingLtv,
    taxDeductionRate
  );

  const newSchedule = calculateLoanAmortization(
    newLoan,
    newQuarters,
    nyHovedstol,
    newLtv,
    taxDeductionRate
  );

  const deltaRestgaeld = nyHovedstol - existingRestgaeld;
  // Effective net capital gain/loss (excluding cash withdrawn):
  const kursgevinstEllerTab = existingRestgaeld - (nyHovedstol - frivaerdiUdbetalt);

  return {
    existingLoan,
    existingRestgaeld,
    existingKurs: existingLoan.kurs,
    indfrielsesBeloeb,
    kursgevinstIndfrielse,
    frivaerdiUdbetalt,
    samletKontantbehov,
    newLoan,
    newKurs: newLoan.kurs,
    nyHovedstol,
    kurstabOptagelse,
    existingYears,
    newYears,
    maxYears,
    kursgevinstEllerTab,
    deltaRestgaeld,
    deltaMonthlyYdelseEfterSkat: newSchedule.monthlyYdelseEfterSkat - existingSchedule.monthlyYdelseEfterSkat,
    deltaMonthlyYdelseFoerSkat: newSchedule.monthlyYdelse - existingSchedule.monthlyYdelse,
    deltaMonthlyAfdrag: newSchedule.monthlyAfdrag - existingSchedule.monthlyAfdrag,
    existingSchedule,
    newSchedule,
  };
}
