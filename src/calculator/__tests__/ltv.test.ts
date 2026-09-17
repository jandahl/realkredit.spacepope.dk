import { describe, it, expect } from 'vitest';
import {
  maxLoanAt80Ltv,
  maxPossibleFrivaerdi,
  maxCostAwareFrivaerdi,
  estimateOptionANyHovedstol,
  estimateOptionBTotalNominal,
  buildLtvFieldErrors,
} from '../../utils/ltv';
import { calculateTillaegslaanComparison } from '../tillaegslaan';
import { calculateRefinancing } from '../refinancing';
import type { BondLoan } from '../types';

const baseBidrag: [number, number, number] = [0.0045, 0.0085, 0.012];

describe('maxLoanAt80Ltv', () => {
  it('floors 80% of property value', () => {
    expect(maxLoanAt80Ltv(3_000_000)).toBe(2_400_000);
    expect(maxLoanAt80Ltv(1_000_001)).toBe(800_000);
    expect(maxLoanAt80Ltv(2_475_000)).toBe(1_980_000);
  });

  it('returns 0 for invalid property', () => {
    expect(maxLoanAt80Ltv(0)).toBe(0);
    expect(maxLoanAt80Ltv(-100)).toBe(0);
  });
});

describe('maxPossibleFrivaerdi (legacy, fee-naive)', () => {
  it('subtracts redemption cash from 80% LTV room', () => {
    expect(maxPossibleFrivaerdi(3_000_000, 2_000_000, 100)).toBe(400_000);
  });

  it('uses capped redemption price ≤ 100', () => {
    expect(maxPossibleFrivaerdi(3_000_000, 2_000_000, 95)).toBe(
      Math.floor(3_000_000 * 0.8 - (2_000_000 * 95) / 100),
    );
  });

  it('never goes negative', () => {
    expect(maxPossibleFrivaerdi(1_000_000, 1_000_000, 100)).toBe(0);
  });
});

describe('cost-aware friværdi (fees + kurs)', () => {
  // Example from bug report:
  // pv=2475000, debt=1780000, cash=200000,
  // old 5% 2053 med afdrag (kurs 100), new F-kort med afdrag (kurs 100.3)
  const exampleInputs = {
    propertyValue: 2_475_000,
    existingRestgaeld: 1_780_000,
    existingKurs: 100.0,
    newKurs: 100.3,
  };

  const existingLoan: BondLoan = {
    name: '5% 2053 med afdrag',
    rente: 5.0,
    kurs: 100.0,
    udloebsAar: 2053,
    afdragsfri: false,
    bidragsSats: baseBidrag,
  };

  const newLoan: BondLoan = {
    name: 'F-kort med afdrag',
    rente: 2.557,
    kurs: 100.3,
    loebetid: 30,
    flex: true,
    afdragsfri: false,
    bidragsSats: [0.005, 0.0105, 0.0175],
  };

  it('naive max is 200k but cost-aware max is strictly lower', () => {
    const naive = maxPossibleFrivaerdi(2_475_000, 1_780_000, 100);
    expect(naive).toBe(200_000);

    const costAware = maxCostAwareFrivaerdi(exampleInputs, 'both');
    expect(costAware).toBeLessThan(naive);
    expect(costAware).toBeGreaterThan(0);
  });

  it('Option B total nominal at naive 200k cashout exceeds 80% LTV', () => {
    const max80 = maxLoanAt80Ltv(2_475_000);
    const exposureB = estimateOptionBTotalNominal(exampleInputs, 200_000);
    expect(exposureB).toBeGreaterThan(max80);

    const cmp = calculateTillaegslaanComparison(
      existingLoan,
      1_780_000,
      newLoan,
      2_475_000,
      27,
      30,
      200_000,
    );
    const realExposure =
      1_780_000 + cmp.optionB_tillaegslaan.tillaegHovedstol;
    expect(realExposure).toBeGreaterThan(max80);
    // Estimator should track calculator within a small rounding band
    expect(Math.abs(exposureB - realExposure)).toBeLessThan(2);
  });

  it('Option A nyHovedstol at cost-aware max stays ≤ max80', () => {
    const max80 = maxLoanAt80Ltv(2_475_000);
    const maxCash = maxCostAwareFrivaerdi(exampleInputs, 'omlaegning');
    const ny = estimateOptionANyHovedstol(exampleInputs, maxCash);
    expect(ny).toBeLessThanOrEqual(max80);

    const refi = calculateRefinancing(
      existingLoan,
      1_780_000,
      newLoan,
      2_475_000,
      27,
      30,
      maxCash,
    );
    expect(refi.nyHovedstol).toBeLessThanOrEqual(max80 + 1);
  });

  it('Option B exposure at cost-aware max stays ≤ max80', () => {
    const max80 = maxLoanAt80Ltv(2_475_000);
    const maxCash = maxCostAwareFrivaerdi(exampleInputs, 'tillaeg');
    const exposure = estimateOptionBTotalNominal(exampleInputs, maxCash);
    expect(exposure).toBeLessThanOrEqual(max80);

    const cmp = calculateTillaegslaanComparison(
      existingLoan,
      1_780_000,
      newLoan,
      2_475_000,
      27,
      30,
      maxCash,
    );
    expect(1_780_000 + cmp.optionB_tillaegslaan.tillaegHovedstol).toBeLessThanOrEqual(
      max80 + 1,
    );
  });

  it('strategy=both is the min of A and B caps', () => {
    const a = maxCostAwareFrivaerdi(exampleInputs, 'omlaegning');
    const b = maxCostAwareFrivaerdi(exampleInputs, 'tillaeg');
    const both = maxCostAwareFrivaerdi(exampleInputs, 'both');
    expect(both).toBe(Math.min(a, b));
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
    expect(errors.find((e) => e.id === 'ltv-frivaerdi')!.message).toMatch(
      /stiftelsesomkostninger/i,
    );
  });

  it('returns empty when compliant', () => {
    expect(
      buildLtvFieldErrors({
        propertyValue: 3_000_000,
        debtOrLoan: 2_000_000,
        debtAnchorId: 'field-debt',
      }),
    ).toEqual([]);
  });
});
