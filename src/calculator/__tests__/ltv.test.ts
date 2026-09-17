import { describe, it, expect } from 'vitest';
import { maxLoanAt80Ltv, maxPossibleFrivaerdi, buildLtvFieldErrors } from '../../utils/ltv';

describe('maxLoanAt80Ltv', () => {
  it('floors 80% of property value', () => {
    expect(maxLoanAt80Ltv(3_000_000)).toBe(2_400_000);
    expect(maxLoanAt80Ltv(1_000_001)).toBe(800_000);
  });

  it('returns 0 for invalid property', () => {
    expect(maxLoanAt80Ltv(0)).toBe(0);
    expect(maxLoanAt80Ltv(-100)).toBe(0);
  });
});

describe('maxPossibleFrivaerdi', () => {
  it('subtracts redemption cash from 80% LTV room', () => {
    // property 3M → 2.4M max; debt 2M at kurs 100 → room 400k
    expect(maxPossibleFrivaerdi(3_000_000, 2_000_000, 100)).toBe(400_000);
  });

  it('uses capped redemption price ≤ 100', () => {
    expect(maxPossibleFrivaerdi(3_000_000, 2_000_000, 95)).toBe(
      Math.floor(3_000_000 * 0.8 - (2_000_000 * 95) / 100)
    );
  });

  it('never goes negative', () => {
    expect(maxPossibleFrivaerdi(1_000_000, 1_000_000, 100)).toBe(0);
  });
});

describe('buildLtvFieldErrors', () => {
  it('flags debt over 80% LTV', () => {
    const errors = buildLtvFieldErrors({
      propertyValue: 3_000_000,
      debtOrLoan: 2_500_000,
      debtAnchorId: 'field-debt',
    });
    expect(errors).toHaveLength(1);
    expect(errors[0].id).toBe('ltv-debt');
    expect(errors[0].anchorId).toBe('field-debt');
  });

  it('flags friværdi over max when enabled', () => {
    const errors = buildLtvFieldErrors({
      propertyValue: 3_000_000,
      debtOrLoan: 2_000_000,
      debtAnchorId: 'field-debt',
      enableFrivaerdi: true,
      frivaerdiUdbetalt: 500_000,
      maxFrivaerdi: 400_000,
      frivaerdiAnchorId: 'field-frivaerdi',
    });
    expect(errors.some((e) => e.id === 'ltv-frivaerdi')).toBe(true);
  });

  it('returns empty when compliant', () => {
    expect(
      buildLtvFieldErrors({
        propertyValue: 3_000_000,
        debtOrLoan: 2_000_000,
        debtAnchorId: 'field-debt',
      })
    ).toEqual([]);
  });
});
