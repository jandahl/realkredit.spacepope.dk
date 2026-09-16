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

  // 4. Closing costs & fees (Omkostninger & Gebyrer)
  // Tinglysningsafgiftsloven § 5a: Fast afgift 1.825 kr + 1,45% af hovedstolsforhøjelse (afrundet op til nærmeste 100 kr)
  const tinglysningFast = 1_825;
  const hovedstolForhoejelse = Math.max(0, nyHovedstol - existingRestgaeld);
  const tinglysningVariabel = Math.ceil((hovedstolForhoejelse * 0.0145) / 100) * 100;
  const tinglysningTotal = tinglysningFast + tinglysningVariabel;

  // Kurtage: 0,15% af kursværdi på nye obligationer
  const kurtage = Math.round(samletKontantbehov * 0.0015);

  // Institut- og bankgebyrer (lånesagsgebyr, stiftelse, ekspedition, indfrielse)
  const gebyrerInstitutOgBank = 8_500;

  const samledeOmkostninger = tinglysningTotal + kurtage + gebyrerInstitutOgBank;
  const nettoUdbetalt = Math.max(0, frivaerdiUdbetalt - samledeOmkostninger);

  const fees = {
    tinglysningFast,
    tinglysningVariabel,
    tinglysningTotal,
    kurtage,
    gebyrerInstitutOgBank,
    samledeOmkostninger,
    nettoUdbetalt,
  };

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
