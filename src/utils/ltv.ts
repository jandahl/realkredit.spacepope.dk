/** Max nominal loan / restgæld at 80 % LTV (Danish realkredit cap for owner-occupied). */
export function maxLoanAt80Ltv(propertyValue: number): number {
  if (!Number.isFinite(propertyValue) || propertyValue <= 0) return 0;
  return Math.floor(propertyValue * 0.8);
}

function principalFromCash(cashAmount: number, kurs: number): number {
  if (!(kurs > 0) || !Number.isFinite(kurs)) return cashAmount;
  return (cashAmount / kurs) * 100;
}

const TINGLYSNING_FAST = 1_825;
const GEBYRER_BANK = 8_500;

export interface CashoutLtvInputs {
  propertyValue: number;
  existingRestgaeld: number;
  /** Existing bond redemption kurs (capped at 100 by caller or here). */
  existingKurs: number;
  /** New bond optagelseskurs. */
  newKurs: number;
}

/**
 * Option A (fuld omlægning): nominal nyHovedstol after financing cashout + fees.
 * Mirrors the fee iteration in calculateRefinancing / calculateTillaegslaanComparison.
 */
export function estimateOptionANyHovedstol(
  inputs: CashoutLtvInputs,
  desiredCashout: number,
): number {
  const redemptionKurs =
    Number.isFinite(inputs.existingKurs) && inputs.existingKurs > 0
      ? Math.min(100, inputs.existingKurs)
      : 100;
  const indfrielsesBeloeb = (inputs.existingRestgaeld * redemptionKurs) / 100;
  const cashout = Math.max(0, desiredCashout);
  const newKurs = inputs.newKurs > 0 ? inputs.newKurs : 100;

  let samletKontantbehov = indfrielsesBeloeb + cashout + TINGLYSNING_FAST + GEBYRER_BANK;
  let nyHovedstol = principalFromCash(samletKontantbehov, newKurs);
  let tinglysningVariabel =
    Math.ceil((Math.max(0, nyHovedstol - inputs.existingRestgaeld) * 0.0145) / 100) * 100;
  let kurtage = Math.round(samletKontantbehov * 0.0015);
  let samledeOmkostninger = TINGLYSNING_FAST + tinglysningVariabel + kurtage + GEBYRER_BANK;

  samletKontantbehov = indfrielsesBeloeb + cashout + samledeOmkostninger;
  nyHovedstol = principalFromCash(samletKontantbehov, newKurs);
  tinglysningVariabel =
    Math.ceil((Math.max(0, nyHovedstol - inputs.existingRestgaeld) * 0.0145) / 100) * 100;
  kurtage = Math.round(samletKontantbehov * 0.0015);
  samledeOmkostninger = TINGLYSNING_FAST + tinglysningVariabel + kurtage + GEBYRER_BANK;
  samletKontantbehov = indfrielsesBeloeb + cashout + samledeOmkostninger;
  nyHovedstol = principalFromCash(samletKontantbehov, newKurs);

  return nyHovedstol;
}

/**
 * Option B (tillægslån): existingRestgaeld + tillaegHovedstol after financing cashout + fees.
 */
export function estimateOptionBTotalNominal(
  inputs: CashoutLtvInputs,
  desiredCashout: number,
): number {
  const cashout = Math.max(0, desiredCashout);
  const newKurs = inputs.newKurs > 0 ? inputs.newKurs : 100;

  // Mirror calculateTillaegslaanComparison Option B (two-pass fee solve)
  let kontantbehov = cashout + TINGLYSNING_FAST + GEBYRER_BANK;
  let tillaegHovedstol = principalFromCash(kontantbehov, newKurs);
  let tinglysningVariabel = Math.ceil((tillaegHovedstol * 0.0145) / 100) * 100;
  let kurtage = Math.round(kontantbehov * 0.0015);
  let totalOmkostninger = TINGLYSNING_FAST + tinglysningVariabel + kurtage + GEBYRER_BANK;
  kontantbehov = cashout + totalOmkostninger;
  tillaegHovedstol = principalFromCash(kontantbehov, newKurs);

  return inputs.existingRestgaeld + tillaegHovedstol;
}

/**
 * Legacy helper: max cash-out ignoring fees/kurs on the new loan
 * (only redemption cash vs 80% room). Prefer maxCostAwareFrivaerdi.
 */
export function maxPossibleFrivaerdi(
  propertyValue: number,
  debt: number,
  redemptionPrice: number,
): number {
  const max80 = propertyValue * 0.8;
  const price =
    Number.isFinite(redemptionPrice) && redemptionPrice > 0
      ? Math.min(100, redemptionPrice)
      : 100;
  const existingRedemptionCash = (debt * price) / 100;
  return Math.max(0, Math.floor(max80 - existingRedemptionCash));
}

export type FrivaerdiStrategyCap = 'omlaegning' | 'tillaeg' | 'both';

/**
 * Max net cashout such that after stiftelsesomkostninger + kurs→hovedstol,
 * nominal exposure stays ≤ floor(0.8 * propertyValue).
 *
 * - omlaegning: Option A nyHovedstol ≤ max80
 * - tillaeg: Option B existing + tillaegHovedstol ≤ max80
 * - both: min of the two (safe for strategy switcher)
 */
export function maxCostAwareFrivaerdi(
  inputs: CashoutLtvInputs,
  strategy: FrivaerdiStrategyCap = 'both',
): number {
  const max80 = maxLoanAt80Ltv(inputs.propertyValue);
  if (max80 <= 0) return 0;

  // Cheap upper bound: room ignoring fees (never need more than this)
  const naive = maxPossibleFrivaerdi(
    inputs.propertyValue,
    inputs.existingRestgaeld,
    inputs.existingKurs,
  );
  if (naive <= 0) return 0;

  const fits = (cashout: number): boolean => {
    if (strategy === 'omlaegning' || strategy === 'both') {
      if (estimateOptionANyHovedstol(inputs, cashout) > max80) return false;
    }
    if (strategy === 'tillaeg' || strategy === 'both') {
      if (estimateOptionBTotalNominal(inputs, cashout) > max80) return false;
    }
    return true;
  };

  if (!fits(0)) return 0;
  if (fits(naive)) return naive;

  // Binary search largest integer cashout that still fits
  let lo = 0;
  let hi = naive;
  while (lo < hi) {
    const mid = Math.ceil((lo + hi + 1) / 2);
    if (fits(mid)) lo = mid;
    else hi = mid - 1;
  }
  return lo;
}

export type FieldError = {
  id: string;
  message: string;
  /** DOM id of the field wrapper to scroll/focus */
  anchorId: string;
};

export function buildLtvFieldErrors(opts: {
  propertyValue: number;
  debtOrLoan: number;
  debtAnchorId: string;
  debtLabel?: string;
  enableFrivaerdi?: boolean;
  frivaerdiUdbetalt?: number;
  maxFrivaerdi?: number;
  frivaerdiAnchorId?: string;
}): FieldError[] {
  const errors: FieldError[] = [];
  const maxDebt = maxLoanAt80Ltv(opts.propertyValue);
  if (opts.debtOrLoan > maxDebt) {
    errors.push({
      id: 'ltv-debt',
      anchorId: opts.debtAnchorId,
      message:
        opts.debtLabel ??
        `Restgæld overstiger 80 % LTV (maks. ${maxDebt.toLocaleString('da-DK')} kr)`,
    });
  }

  if (
    opts.enableFrivaerdi &&
    typeof opts.frivaerdiUdbetalt === 'number' &&
    typeof opts.maxFrivaerdi === 'number' &&
    opts.frivaerdiAnchorId &&
    opts.frivaerdiUdbetalt > opts.maxFrivaerdi
  ) {
    errors.push({
      id: 'ltv-frivaerdi',
      anchorId: opts.frivaerdiAnchorId,
      message: `Ønsket udbetaling overstiger maks. til 80 % LTV inkl. stiftelsesomkostninger (${opts.maxFrivaerdi.toLocaleString('da-DK')} kr)`,
    });
  }

  return errors;
}
