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

  // 2. Initial estimate of fees and cash requirement
  // Statutory and institutional costs:
  const tinglysningFast = 1_825;
  const gebyrerInstitutOgBank = 8_500;
  
  // Calculate exact total cash need and new nominal principal including financed fees
  // We solve:
  // samletKontantbehov = indfrielsesBeloeb + frivaerdiUdbetalt + samledeOmkostninger
  // nyHovedstol = samletKontantbehov / (newLoan.kurs / 100)
  // kurtage = samletKontantbehov * 0.0015
  // tinglysningVariabel = Math.max(0, nyHovedstol - existingRestgaeld) * 0.0145 (rounded up to nearest 100)
  
  let samletKontantbehov = indfrielsesBeloeb + Math.max(0, frivaerdiUdbetalt) + tinglysningFast + gebyrerInstitutOgBank;
  let nyHovedstol = (samletKontantbehov / newLoan.kurs) * 100;
  let tinglysningVariabel = Math.ceil((Math.max(0, nyHovedstol - existingRestgaeld) * 0.0145) / 100) * 100;
  let kurtage = Math.round(samletKontantbehov * 0.0015);
  let samledeOmkostninger = tinglysningFast + tinglysningVariabel + kurtage + gebyrerInstitutOgBank;

  // Refine once with exact variable registration fee and brokerage included
  samletKontantbehov = indfrielsesBeloeb + Math.max(0, frivaerdiUdbetalt) + samledeOmkostninger;
  nyHovedstol = (samletKontantbehov / newLoan.kurs) * 100;
  tinglysningVariabel = Math.ceil((Math.max(0, nyHovedstol - existingRestgaeld) * 0.0145) / 100) * 100;
  kurtage = Math.round(samletKontantbehov * 0.0015);
  samledeOmkostninger = tinglysningFast + tinglysningVariabel + kurtage + gebyrerInstitutOgBank;
  samletKontantbehov = indfrielsesBeloeb + Math.max(0, frivaerdiUdbetalt) + samledeOmkostninger;
  nyHovedstol = (samletKontantbehov / newLoan.kurs) * 100;

  const tinglysningTotal = tinglysningFast + tinglysningVariabel;
  const kurstabOptagelse = Math.max(0, nyHovedstol - samletKontantbehov);

  // In Option 1, the requested friværdi is what is paid out in net cash to the borrower's account:
  const nettoUdbetalt = Math.max(0, frivaerdiUdbetalt);

  const fees = {
    tinglysningFast,
    tinglysningVariabel,
    tinglysningTotal,
    kurtage,
    gebyrerInstitutOgBank,
    samledeOmkostninger,
    nettoUdbetalt,
  };

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
  // Effective net capital gain/loss (excluding cash withdrawn and financed fees):
  const kursgevinstEllerTab = existingRestgaeld - (nyHovedstol - frivaerdiUdbetalt);

  return {
    existingLoan,
    existingRestgaeld,
    existingKurs: existingLoan.kurs,
    indfrielsesBeloeb,
    kursgevinstIndfrielse,
    frivaerdiUdbetalt,
    samletKontantbehov,
    fees,
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
