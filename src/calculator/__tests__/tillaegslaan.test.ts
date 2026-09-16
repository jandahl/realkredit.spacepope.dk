import { describe, it, expect } from 'vitest';
import { calculateTillaegslaanComparison } from '../tillaegslaan';
import type { BondLoan } from '../types';

describe('Tillægslån vs. Full Remortgaging comparator', () => {
  const oldLowRateLoan: BondLoan = {
    name: '1% 2050',
    rente: 1.0,
    kurs: 78.55,
    afdragsfri: false,
    bidragsSats: [0.0045, 0.0085, 0.012],
  };

  const newHighRateLoan: BondLoan = {
    name: '4% 2059',
    rente: 4.0,
    kurs: 94.02,
    afdragsfri: false,
    bidragsSats: [0.0045, 0.0085, 0.012],
  };

  it('compares Tillægslån vs. Full Remortgaging when borrower wants 200,000 kr cashout', () => {
    const comparison = calculateTillaegslaanComparison(
      oldLowRateLoan,
      1_800_000,
      newHighRateLoan,
      3_000_000,
      27,
      30,
      200_000
    );

    expect(comparison.optionB_tillaegslaan.tillaegHovedstol).toBeGreaterThan(200_000);
    expect(comparison.optionA_fullOmlaegning.nyHovedstol).toBeGreaterThan(0);
    expect(comparison.recommendedStrategy).toBeDefined();
  });

  it('calculates closing costs for secondary mortgage correctly', () => {
    const comparison = calculateTillaegslaanComparison(
      oldLowRateLoan,
      1_800_000,
      newHighRateLoan,
      3_000_000,
      27,
      30,
      200_000
    );

    expect(comparison.optionB_tillaegslaan.tillaegOmkostninger).toBeGreaterThan(5_000);
    expect(comparison.optionA_fullOmlaegning.totalOmkostninger).toBeGreaterThan(5_000);
  });
});
