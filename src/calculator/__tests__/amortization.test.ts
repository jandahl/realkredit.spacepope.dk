import { describe, it, expect } from 'vitest';
import {
  calculateWeightedBidragssats,
  calculateQuarterlyAnnuityPayment,
  calculateLoanAmortization,
} from '../amortization';
import { calculateRefinancing } from '../refinancing';
import type { BondLoan } from '../types';

describe('amortization math engine', () => {
  it('calculates weighted bidragssats for [0, 80] LTV tier', () => {
    const brackets: [number, number, number] = [0.0045, 0.0085, 0.012];
    // [0-40]: 40 span @ 0.0045 = 0.18
    // [40-60]: 20 span @ 0.0085 = 0.17
    // [60-80]: 20 span @ 0.012 = 0.24
    // Sum = 0.59 / 80 = 0.007375 (0.7375%)
    const weighted = calculateWeightedBidragssats(brackets, [0, 80]);
    expect(weighted).toBeCloseTo(0.007375, 6);
  });

  it('calculates weighted bidragssats for [0, 40] tier', () => {
    const brackets: [number, number, number] = [0.0045, 0.0085, 0.012];
    const weighted = calculateWeightedBidragssats(brackets, [0, 40]);
    expect(weighted).toBeCloseTo(0.0045, 6);
  });

  it('calculates weighted bidragssats for [40, 60] tier', () => {
    const brackets: [number, number, number] = [0.0045, 0.0085, 0.012];
    const weighted = calculateWeightedBidragssats(brackets, [40, 60]);
    expect(weighted).toBeCloseTo(0.0085, 6);
  });

  it('computes standard quarterly annuity payments correctly', () => {
    // 1,000,000 kr, 1% per quarter, 120 quarters
    const payment = calculateQuarterlyAnnuityPayment(1_000_000, 0.01, 120);
    // Standard formula: 1,000,000 * 0.01 * (1.01^120) / ((1.01^120) - 1)
    const factor = Math.pow(1.01, 120);
    const expected = (1_000_000 * 0.01 * factor) / (factor - 1);
    expect(payment).toBeCloseTo(expected, 2);
    expect(payment).toBeGreaterThan(14_000);
    expect(payment).toBeLessThan(15_000);
  });

  it('simulates 30y amortizing loan ending with zero debt', () => {
    const loan: BondLoan = {
      name: '4% 2059 med afdrag',
      rente: 4.0,
      kurs: 94.02,
      afdragsfri: false,
      bidragsSats: [0.0045, 0.0085, 0.012],
    };

    const result = calculateLoanAmortization(loan, 120, 2_000_000, [0, 80]);
    expect(result.schedule.length).toBe(120);
    expect(result.schedule[119].endRestgaeld).toBe(0);
    expect(result.monthlyYdelse).toBeGreaterThan(0);
    expect(result.monthlyYdelseEfterSkat).toBeLessThan(result.monthlyYdelse);
    expect(result.monthlyAfdrag).toBeGreaterThan(0);
  });

  it('correctly models 10-year interest-only period', () => {
    const loan: BondLoan = {
      name: '4% 2059 med op til 10 års afdragsfrihed',
      rente: 4.0,
      kurs: 92.56,
      afdragsfri: true,
      bidragsSats: [0.0055, 0.0115, 0.02],
    };

    const result = calculateLoanAmortization(loan, 120, 2_000_000, [0, 80]);
    // For the first 40 quarters (10 years), debt should not decrease
    for (let q = 0; q < 40; q++) {
      expect(result.schedule[q].afdrag).toBe(0);
      expect(result.schedule[q].endRestgaeld).toBe(2_000_000);
    }
    // Starting quarter 41 (index 40), debt starts amortizing
    expect(result.schedule[40].afdrag).toBeGreaterThan(0);
    expect(result.schedule[119].endRestgaeld).toBe(0);
  });

  it('correctly models refinancing kursgevinst', () => {
    const oldLoan: BondLoan = {
      name: '1% 2050',
      rente: 1.0,
      kurs: 78.55,
      afdragsfri: false,
      bidragsSats: [0.0045, 0.0085, 0.012],
    };

    const newLoan: BondLoan = {
      name: '4% 2059',
      rente: 4.0,
      kurs: 94.02,
      afdragsfri: false,
      bidragsSats: [0.0045, 0.0085, 0.012],
    };

    const comparison = calculateRefinancing(oldLoan, 2_000_000, newLoan, 3_000_000, 30);
    // Cost to redeem = 2,000,000 * 0.7855 = 1,571,000
    expect(comparison.indfrielsesBeloeb).toBeCloseTo(1_571_000, 1);
    // New principal = 1,571,000 / 0.9402 = 1,670,921.08
    expect(comparison.nyHovedstol).toBeCloseTo(1_670_921.08, 1);
    // Debt reduction = 2,000,000 - 1,670,921.08 = 329,078.92 kr
    expect(comparison.kursgevinstEllerTab).toBeCloseTo(329_078.92, 1);
  });
});
