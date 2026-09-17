/** Max nominal loan / restgæld at 80 % LTV (Danish realkredit cap for owner-occupied). */
export function maxLoanAt80Ltv(propertyValue: number): number {
  if (!Number.isFinite(propertyValue) || propertyValue <= 0) return 0;
  return Math.floor(propertyValue * 0.8);
}

/**
 * Max cash-out (friværdi) that keeps total financing at/under 80 % LTV,
 * given existing debt redeemed at `redemptionPrice` (kurs, typically ≤ 100).
 */
export function maxPossibleFrivaerdi(
  propertyValue: number,
  debt: number,
  redemptionPrice: number
): number {
  const max80 = propertyValue * 0.8;
  const price = Number.isFinite(redemptionPrice) && redemptionPrice > 0
    ? Math.min(100, redemptionPrice)
    : 100;
  const existingRedemptionCash = (debt * price) / 100;
  return Math.max(0, Math.floor(max80 - existingRedemptionCash));
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
      message: `Ønsket udbetaling overstiger maks. til 80 % LTV (${opts.maxFrivaerdi.toLocaleString('da-DK')} kr)`,
    });
  }

  return errors;
}
