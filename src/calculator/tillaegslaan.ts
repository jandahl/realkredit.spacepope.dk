import type { BondLoan, TillaegslaanComparison } from './types';
import { calculateLoanAmortization, STANDARD_TAX_DEDUCTION_RATE, principalFromCash } from './amortization';

/**
 * Calculates a comparison between:
 * Option A: Full Remortgaging (Omlægning af hele lånet inkl. friværdi/tillægslån).
 * Option B: Keeping existing 1st mortgage intact + issuing a secondary mortgage (Tillægslån) for the extra cash/amount.
 */
export function calculateTillaegslaanComparison(
  existingLoan: BondLoan,
  existingRestgaeld: number,
  newLoan: BondLoan,
  propertyValue: number,
  existingYears: number = 30,
  newYears: number = 30,
  desiredCashout: number = 200_000,
  existingAfdragsfriYears?: number,
  newAfdragsfriYears?: number,
  taxDeductionRate: number = STANDARD_TAX_DEDUCTION_RATE
): TillaegslaanComparison {
  const existingQuarters = Math.max(1, Math.round(existingYears * 4));
  const newQuarters = Math.max(1, Math.round(newYears * 4));

  // LTV of existing loan
  const existingLtvPercent = propertyValue > 0 ? (existingRestgaeld / propertyValue) * 100 : 60;
  const existingLtvRange: [number, number] = [0, Math.min(80, existingLtvPercent)];

  // 1. Existing loan amortization schedule (Option B base)
  const existingSchedule = calculateLoanAmortization(
    existingLoan,
    existingQuarters,
    existingRestgaeld,
    existingLtvRange,
    taxDeductionRate,
    existingAfdragsfriYears
  );

  // 2. Option A: Full Remortgage (Fuldt omlægningslån)
  // Redemption of existing bond
  const redemptionKurs = Math.min(100, existingLoan.kurs);
  const indfrielsesBeloeb = (existingRestgaeld * redemptionKurs) / 100;
  
  const tinglysningFast = 1_825;
  const gebyrerInstitutOgBankFull = 8_500;
  
  let samletKontantbehovA = indfrielsesBeloeb + Math.max(0, desiredCashout) + tinglysningFast + gebyrerInstitutOgBankFull;
  let nyHovedstolA = principalFromCash(samletKontantbehovA, newLoan.kurs);
  let tinglysningVariabelA = Math.ceil((Math.max(0, nyHovedstolA - existingRestgaeld) * 0.0145) / 100) * 100;
  let kurtageA = Math.round(samletKontantbehovA * 0.0015);
  let totalOmkostningerA = tinglysningFast + tinglysningVariabelA + kurtageA + gebyrerInstitutOgBankFull;
  samletKontantbehovA = indfrielsesBeloeb + Math.max(0, desiredCashout) + totalOmkostningerA;
  nyHovedstolA = principalFromCash(samletKontantbehovA, newLoan.kurs);

  const newLtvPercentA = propertyValue > 0 ? (nyHovedstolA / propertyValue) * 100 : 80;
  const newLtvRangeA: [number, number] = [0, Math.min(80, newLtvPercentA)];

  const optionASchedule = calculateLoanAmortization(
    newLoan,
    newQuarters,
    nyHovedstolA,
    newLtvRangeA,
    taxDeductionRate,
    newAfdragsfriYears
  );

  // 3. Option B: Keep 1st Mortgage + Issue Tillægslån for desired cashout
  // Tillægslån closing costs:
  const gebyrerBankTillaeg = 8_500; // Bank/inst. creation fee
  
  let kontantbehovB = Math.max(0, desiredCashout) + tinglysningFast + gebyrerBankTillaeg;
  let tillaegHovedstol = principalFromCash(kontantbehovB, newLoan.kurs);
  let tinglysningVariabelB = Math.ceil((tillaegHovedstol * 0.0145) / 100) * 100;
  let kurtageB = Math.round(kontantbehovB * 0.0015);
  let totalOmkostningerB = tinglysningFast + tinglysningVariabelB + kurtageB + gebyrerBankTillaeg;
  kontantbehovB = Math.max(0, desiredCashout) + totalOmkostningerB;
  tillaegHovedstol = principalFromCash(kontantbehovB, newLoan.kurs);

  // LTV bracket for Tillægslån: sits above existing LTV bracket (e.g. [40%, 60%] or [60%, 80%])
  const tillaegLtvStart = Math.min(80, existingLtvPercent);
  const tillaegLtvEnd = Math.min(80, existingLtvPercent + (propertyValue > 0 ? (tillaegHovedstol / propertyValue) * 100 : 20));
  const tillaegLtvRange: [number, number] = [tillaegLtvStart, Math.max(tillaegLtvStart + 0.1, tillaegLtvEnd)];

  const tillaegSchedule = calculateLoanAmortization(
    newLoan,
    newQuarters,
    tillaegHovedstol,
    tillaegLtvRange,
    taxDeductionRate,
    newAfdragsfriYears
  );

  const combinedMonthlyYdelseEfterSkatB = existingSchedule.monthlyYdelseEfterSkat + tillaegSchedule.monthlyYdelseEfterSkat;
  const combinedMonthlyYdelseFoerSkatB = existingSchedule.monthlyYdelse + tillaegSchedule.monthlyYdelse;

  // 4. Savings & Recommendation Logic
  const monthlySavingsOptionB = optionASchedule.monthlyYdelseEfterSkat - combinedMonthlyYdelseEfterSkatB;
  const yearlySavingsOptionB = monthlySavingsOptionB * 12;

  // Total paid over full loan term
  const totalPaidA = optionASchedule.totalBetalt;
  const totalPaidB = existingSchedule.totalBetalt + tillaegSchedule.totalBetalt;
  const totalCostDiffOptionB = totalPaidA - totalPaidB;

  let recommendedStrategy: 'tillaegslaan' | 'full_omlaegning' | 'neutral' = 'neutral';
  let recommendationReason = '';

  if (monthlySavingsOptionB > 100) {
    recommendedStrategy = 'tillaegslaan';
    recommendationReason = `Ved at bevare dit eksisterende ${existingLoan.name} og kun optage tillægslån på ${desiredCashout.toLocaleString('da-DK')} kr. sparer du ${Math.round(monthlySavingsOptionB).toLocaleString('da-DK')} kr./md. efter skat sammenlignet med at omlægge hele lånet.`;
  } else if (monthlySavingsOptionB < -100) {
    recommendedStrategy = 'full_omlaegning';
    recommendationReason = `En fuld omlægning til ${newLoan.name} er billigere med ${Math.round(Math.abs(monthlySavingsOptionB)).toLocaleString('da-DK')} kr./md., da det giver mulighed for at samle lånet på bedre vilkår.`;
  } else {
    recommendedStrategy = 'neutral';
    recommendationReason = `Begge løsninger har stort set samme månedlige ydelse efter skat (forskel på under 100 kr./md.).`;
  }

  return {
    optionA_fullOmlaegning: {
      nyHovedstol: nyHovedstolA,
      monthlyYdelseEfterSkat: optionASchedule.monthlyYdelseEfterSkat,
      monthlyYdelseFoerSkat: optionASchedule.monthlyYdelse,
      totalOmkostninger: totalOmkostningerA,
      schedule: optionASchedule,
    },
    optionB_tillaegslaan: {
      existingMonthlyYdelseEfterSkat: existingSchedule.monthlyYdelseEfterSkat,
      tillaegHovedstol,
      tillaegMonthlyYdelseEfterSkat: tillaegSchedule.monthlyYdelseEfterSkat,
      tillaegMonthlyYdelseFoerSkat: tillaegSchedule.monthlyYdelse,
      tillaegOmkostninger: totalOmkostningerB,
      tillaegLtvRange,
      combinedMonthlyYdelseEfterSkat: combinedMonthlyYdelseEfterSkatB,
      combinedMonthlyYdelseFoerSkat: combinedMonthlyYdelseFoerSkatB,
      tillaegSchedule,
    },
    monthlySavingsOptionB,
    yearlySavingsOptionB,
    totalCostDiffOptionB,
    recommendedStrategy,
    recommendationReason,
  };
}
