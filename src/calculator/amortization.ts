import type { BondLoan, LoanAmortizationResult, QuarterlyScheduleRow } from './types';

export const STANDARD_TAX_DEDUCTION_RATE = 0.256; // 25.6% Danish rentefradrag


/**
 * Default interest-only years for a bond product.
 * 30-år afdragsfri products are not hard-capped at 10 years.
 */
export function getDefaultAfdragsfriYears(loan: BondLoan): number {
  if (!loan.afdragsfri) return 0;
  if (/30\s*års?\s*afdragsfri/i.test(loan.name)) return 30;
  return 10;
}


/**
 * Original product term in years for a bond loan.
 * Preference order:
 * 1. loebetid (years) if present and > 0
 * 2. maxTerminer / 4 (product term in quarters → years) if present and > 0
 * 3. cheap name heuristics (/20 års/, /30 års/)
 * 4. documented fallback: 30 (standard DK mortgage term)
 *
 * Never uses remaining years-to-maturity — that makes elapsed ≈ 0 and overstates
 * remaining afdragsfri until the user moves the slider.
 */
export function getOriginalTermYears(loan: BondLoan): number {
  if (loan.loebetid != null && loan.loebetid > 0) {
    return Math.max(1, Math.min(30, loan.loebetid));
  }
  if (loan.maxTerminer != null && loan.maxTerminer > 0) {
    return Math.max(1, Math.min(30, loan.maxTerminer / 4));
  }
  const name = loan.name ?? '';
  if (/30\s*års?/i.test(name)) return 30;
  if (/20\s*års?/i.test(name)) return 20;
  // Last resort: standard Danish mortgage term — not remaining maturity
  return 30;
}

/**
 * Remaining interest-only years given original bond term and years left on the loan.
 * Pair with getOriginalTermYears — never pass remaining maturity as originalTermYears.
 */
export function estimateRemainingAfdragsfriYears(
  remainingYears: number,
  originalTermYears: number,
  maxOriginalAfdragsfri: number
): number {
  const elapsedYears = Math.max(0, originalTermYears - remainingYears);
  return Math.max(0, Math.min(remainingYears, maxOriginalAfdragsfri - elapsedYears));
}

/**
 * Safe conversion from cash amount to nominal principal.
 * Guards against kurs <= 0 (would otherwise yield Infinity/NaN).
 */
export function principalFromCash(cashAmount: number, kurs: number): number {
  if (!(kurs > 0) || !Number.isFinite(kurs)) {
    return cashAmount;
  }
  return (cashAmount / kurs) * 100;
}


/**
 * Calculates weighted contribution rate (bidragssats) across LTV intervals [0, 40], [40, 60], [60, 80].
 */
export function calculateWeightedBidragssats(
  bidragBrackets: [number, number, number],
  ltvRange: [number, number] = [0, 80]
): number {
  const [minLtv, maxLtv] = ltvRange;
  const rangeSpan = maxLtv - minLtv;
  if (rangeSpan <= 0) {
    return bidragBrackets[0];
  }

  const getOverlap = (tierMin: number, tierMax: number): number => {
    const overlap = Math.min(tierMax, maxLtv) - Math.max(tierMin, minLtv);
    return Math.max(0, overlap);
  };

  const o0 = getOverlap(0, 40);
  const o1 = getOverlap(40, 60);
  const o2 = getOverlap(60, 80);

  return (
    (bidragBrackets[0] * o0 + bidragBrackets[1] * o1 + bidragBrackets[2] * o2) / rangeSpan
  );
}

/**
 * Standard quarterly annuity payment formula: P * (r * (1 + r)^n) / ((1 + r)^n - 1)
 */
export function calculateQuarterlyAnnuityPayment(
  principal: number,
  quarterlyRate: number,
  quarters: number
): number {
  if (quarters <= 0) return 0;
  if (quarterlyRate === 0) return principal / quarters;

  const factor = Math.pow(1 + quarterlyRate, quarters);
  return (principal * (quarterlyRate * factor)) / (factor - 1);
}

/**
 * Simulates complete quarterly amortization schedule and produces monthly metrics.
 */
export function calculateLoanAmortization(
  loan: BondLoan,
  totalQuarters: number,
  principal: number,
  ltvRange: [number, number] = [0, 80],
  taxDeductionRate: number = STANDARD_TAX_DEDUCTION_RATE,
  customAfdragsfriYears?: number
): LoanAmortizationResult {
  // Annual interest rate as decimal (e.g. 0.04)
  const annualRate = loan.rente / 100;
  const quarterlyRate = annualRate / 4;

  // Afdragsfri quarters: derived from product (name / maxTerminer), not hard-capped at 40
  const defaultYears = getDefaultAfdragsfriYears(loan);
  const defaultAfdragsfriQuarters = loan.afdragsfri
    ? Math.min(
        totalQuarters,
        defaultYears * 4,
        loan.maxTerminer ?? defaultYears * 4
      )
    : 0;

  const afdragsfriQuarters = customAfdragsfriYears !== undefined
    ? Math.min(totalQuarters, Math.max(0, Math.round(customAfdragsfriYears * 4)))
    : defaultAfdragsfriQuarters;

  const amortizingQuarters = Math.max(1, totalQuarters - afdragsfriQuarters);

  // Bidragssatser
  const amortizingBidrag = loan.bidrag || loan.bidragsSats;
  const regularWeightedBidrag = calculateWeightedBidragssats(amortizingBidrag, ltvRange);

  let interestOnlyWeightedBidrag = regularWeightedBidrag;
  if (loan.bidragsSatsAfdragsFriTillaeg) {
    const combinedAfdragsfriTiers: [number, number, number] = [
      amortizingBidrag[0] + loan.bidragsSatsAfdragsFriTillaeg[0],
      amortizingBidrag[1] + loan.bidragsSatsAfdragsFriTillaeg[1],
      amortizingBidrag[2] + loan.bidragsSatsAfdragsFriTillaeg[2],
    ];
    interestOnlyWeightedBidrag = calculateWeightedBidragssats(combinedAfdragsfriTiers, ltvRange);
  }

  // Quarterly annuity payment during amortizing phase
  const fixedAnnuityPayment = calculateQuarterlyAnnuityPayment(
    principal,
    quarterlyRate,
    amortizingQuarters
  );

  const interestOnlyPayment = quarterlyRate * principal;

  let remainingPrincipal = principal;
  const schedule: QuarterlyScheduleRow[] = [];

  for (let q = 0; q < totalQuarters; q++) {
    const startDebt = remainingPrincipal;
    const isInterestOnly = q < afdragsfriQuarters;

    const interest = quarterlyRate * startDebt;
    const bidragRate = isInterestOnly ? interestOnlyWeightedBidrag : regularWeightedBidrag;
    const bidrag = (bidragRate / 4) * startDebt;

    let afdrag = 0;
    let paymentWithoutBidrag = 0;

    if (isInterestOnly) {
      paymentWithoutBidrag = interestOnlyPayment;
      afdrag = 0;
      remainingPrincipal = startDebt;
    } else {
      paymentWithoutBidrag = fixedAnnuityPayment;
      afdrag = fixedAnnuityPayment - interest;
      remainingPrincipal = startDebt * (1 + quarterlyRate) - fixedAnnuityPayment;
    }

    if (remainingPrincipal < 0 || q === totalQuarters - 1) {
      remainingPrincipal = 0;
    }

    const ydelseFoerSkat = paymentWithoutBidrag + bidrag;
    const skatFradrag = (interest + bidrag) * taxDeductionRate;
    const ydelseEfterSkat = ydelseFoerSkat - skatFradrag;

    schedule.push({
      quarter: q + 1,
      year: Math.floor(q / 4) + 1,
      quarterOfYear: (q % 4) + 1,
      startRestgaeld: startDebt,
      rente: interest,
      bidrag: bidrag,
      afdrag: Math.max(0, afdrag),
      ydelseFoerSkat: ydelseFoerSkat,
      skatFradrag: skatFradrag,
      ydelseEfterSkat: ydelseEfterSkat,
      endRestgaeld: Math.max(0, remainingPrincipal),
    });
  }

  // First year metrics (quarters 0 to 3, converted to monthly)
  const firstYearQuarters = schedule.slice(0, Math.min(4, schedule.length));
  const sumFirstYearYdelse = firstYearQuarters.reduce((acc, row) => acc + row.ydelseFoerSkat, 0);
  const sumFirstYearYdelseEfterSkat = firstYearQuarters.reduce((acc, row) => acc + row.ydelseEfterSkat, 0);
  const sumFirstYearAfdrag = firstYearQuarters.reduce((acc, row) => acc + row.afdrag, 0);
  const sumFirstYearRenteBidrag = firstYearQuarters.reduce((acc, row) => acc + row.rente + row.bidrag, 0);

  const monthlyYdelseNormalized = sumFirstYearYdelse / 12;
  const monthlyYdelseEfterSkatNormalized = sumFirstYearYdelseEfterSkat / 12;
  const monthlyAfdragNormalized = sumFirstYearAfdrag / 12;
  const monthlyRenteOgBidragNormalized = sumFirstYearRenteBidrag / 12;

  // Total over entire loan term
  const totalRenteOgBidrag = schedule.reduce((acc, row) => acc + row.rente + row.bidrag, 0);
  const totalBetalt = schedule.reduce((acc, row) => acc + row.ydelseFoerSkat, 0);

  const effectiveBidrag = afdragsfriQuarters > 0 ? interestOnlyWeightedBidrag : regularWeightedBidrag;
  const safeKurs = loan.kurs > 0 ? loan.kurs : 100;
  const kursvaerdi = (principal * safeKurs) / 100;

  return {
    hovedstol: principal,
    kursvaerdi,
    kurs: loan.kurs,
    rente: loan.rente,
    afdragsfriQuarters,
    totalQuarters,
    bidragsSats: effectiveBidrag,
    monthlyYdelse: monthlyYdelseNormalized,
    monthlyYdelseEfterSkat: monthlyYdelseEfterSkatNormalized,
    monthlyAfdrag: monthlyAfdragNormalized,
    monthlyRenteOgBidrag: monthlyRenteOgBidragNormalized,
    totalRenteOgBidrag,
    totalBetalt,
    schedule,
  };
}
