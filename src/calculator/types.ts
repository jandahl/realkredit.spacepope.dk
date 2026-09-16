export interface BondLoan {
  name: string;
  rente: number; // e.g. 4.0 for 4%
  kurs: number; // e.g. 94.02
  loebetid?: number; // e.g. 30 (years)
  maxTerminer?: number; // e.g. 120 (quarters)
  udloebsAar?: number; // e.g. 2059
  flex?: boolean;
  afdragsfri: boolean;
  bidragsSats: [number, number, number]; // [0-40%, 40-60%, 60-80%]
  bidrag?: [number, number, number];
  bidragsSatsAfdragsFriTillaeg?: [number, number, number];
  isOpenForOffer?: boolean;
  fondCode?: string;
  nasdaqUrl?: string;
}

export interface LoanAmortizationResult {
  hovedstol: number; // Total nominal bond principal
  kursvaerdi: number; // Cash loan amount (hovedstol * kurs / 100)
  kurs: number;
  rente: number;
  afdragsfriQuarters: number;
  totalQuarters: number;
  bidragsSats: number;
  
  // Aggregate monthly amounts (first 12 months)
  monthlyYdelse: number;
  monthlyYdelseEfterSkat: number;
  monthlyAfdrag: number;
  monthlyRenteOgBidrag: number;
  
  // Totals over entire loan term
  totalRenteOgBidrag: number;
  totalBetalt: number; // Sum of all payments
  
  // Quarterly breakdown series (length = totalQuarters)
  schedule: QuarterlyScheduleRow[];
}

export interface QuarterlyScheduleRow {
  quarter: number; // 1 to totalQuarters
  year: number; // 1 to (totalQuarters/4)
  quarterOfYear: number; // 1 to 4
  startRestgaeld: number;
  rente: number;
  bidrag: number;
  afdrag: number;
  ydelseFoerSkat: number;
  skatFradrag: number;
  ydelseEfterSkat: number;
  endRestgaeld: number;
}

export interface RefinancingComparison {
  // Existing loan details
  existingLoan: BondLoan;
  existingRestgaeld: number; // Market nominal debt
  existingKurs: number;
  indfrielsesBeloeb: number; // Cash needed to redeem: restgaeld * min(100, kurs) / 100
  kursgevinstIndfrielse: number; // existingRestgaeld - indfrielsesBeloeb
  
  // Equity payout & cash required
  frivaerdiUdbetalt: number; // Extra cash extracted
  samletKontantbehov: number; // indfrielsesBeloeb + frivaerdiUdbetalt
  
  // New loan details
  newLoan: BondLoan;
  newKurs: number;
  nyHovedstol: number; // Nominal debt of new loan: samletKontantbehov / (newKurs / 100)
  kurstabOptagelse: number; // nyHovedstol - samletKontantbehov
  
  // Loan terms
  existingYears: number;
  newYears: number;
  maxYears: number;

  // Deltas
  kursgevinstEllerTab: number; // existingRestgaeld - (nyHovedstol - frivaerdiUdbetalt)
  deltaRestgaeld: number; // nyHovedstol - existingRestgaeld
  deltaMonthlyYdelseEfterSkat: number; // new - old
  deltaMonthlyYdelseFoerSkat: number; // new - old
  deltaMonthlyAfdrag: number; // new - old
  
  // Full schedules
  existingSchedule: LoanAmortizationResult;
  newSchedule: LoanAmortizationResult;
}

export interface TwoLayerLoanResult {
  propertyValue: number;
  layer1LtvRange: [number, number]; // e.g. [0, 40]
  layer2LtvRange: [number, number]; // e.g. [40, 80]
  layer1Amount: number;
  layer2Amount: number;
  layer1Result: LoanAmortizationResult;
  layer2Result: LoanAmortizationResult;
  combinedMonthlyYdelse: number;
  combinedMonthlyYdelseEfterSkat: number;
  combinedMonthlyAfdrag: number;
  combinedTotalRenteOgBidrag: number;
  combinedTotalBetalt: number;
  combinedSchedule: QuarterlyScheduleRow[];
}
