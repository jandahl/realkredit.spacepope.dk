import { describe, it, expect } from 'vitest';
import {
  calculateLoanAmortization,
  getDefaultAfdragsfriYears,
  getOriginalTermYears,
  estimateRemainingAfdragsfriYears,
  principalFromCash,
} from '../amortization';
import { calculateRefinancing } from '../refinancing';
import { calculateTwoLayerLoan } from '../twoLayer';
import { normaliseLiveLoans } from '../../api/rates';
import type { BondLoan } from '../types';

const baseBidrag: [number, number, number] = [0.0055, 0.0115, 0.02];

const loan10yIo: BondLoan = {
  name: '4% 2059 med op til 10 års afdragsfrihed',
  rente: 4.0,
  kurs: 92.56,
  loebetid: 30,
  maxTerminer: 120,
  afdragsfri: true,
  bidragsSats: baseBidrag,
};

const loan30yIo: BondLoan = {
  name: '4% 2059 med op til 30 års afdragsfrihed',
  rente: 4.0,
  kurs: 91.18,
  loebetid: 30,
  maxTerminer: 120,
  afdragsfri: true,
  bidragsSats: baseBidrag,
};

const loanAmortizing: BondLoan = {
  name: '4% 2059 med afdrag',
  rente: 4.0,
  kurs: 94.02,
  loebetid: 30,
  maxTerminer: 120,
  afdragsfri: false,
  bidragsSats: [0.0045, 0.0085, 0.012],
};

const loan20y: BondLoan = {
  name: '3,5% 2049 med afdrag',
  rente: 3.5,
  kurs: 92.83,
  loebetid: 20,
  maxTerminer: 80,
  afdragsfri: false,
  bidragsSats: [0.0045, 0.0085, 0.012],
};

describe('P0/P1 regression: afdragsfri defaults', () => {
  it('defaults 10-år afdragsfri products to 40 quarters', () => {
    expect(getDefaultAfdragsfriYears(loan10yIo)).toBe(10);
    const result = calculateLoanAmortization(loan10yIo, 120, 2_000_000, [0, 80]);
    expect(result.afdragsfriQuarters).toBe(40);
  });

  it('defaults 30-år afdragsfri products to full-term IO (120 quarters), not 40', () => {
    expect(getDefaultAfdragsfriYears(loan30yIo)).toBe(30);
    const result = calculateLoanAmortization(loan30yIo, 120, 2_000_000, [0, 80]);
    expect(result.afdragsfriQuarters).toBe(120);
    for (let q = 0; q < 120; q++) {
      expect(result.schedule[q].afdrag).toBe(0);
    }
  });

  it('honours customAfdragsfriYears override', () => {
    const result = calculateLoanAmortization(loan30yIo, 120, 2_000_000, [0, 80], undefined, 5);
    expect(result.afdragsfriQuarters).toBe(20);
  });
});

describe('P0/P1 regression: newAfdragsfriYears effect on refinancing', () => {
  const oldLoan: BondLoan = {
    name: '1% 2050',
    rente: 1.0,
    kurs: 78.55,
    afdragsfri: false,
    bidragsSats: [0.0045, 0.0085, 0.012],
  };

  it('changes new-loan schedule when newAfdragsfriYears differs', () => {
    const with0 = calculateRefinancing(oldLoan, 2_000_000, loan10yIo, 3_000_000, 25, 30, 0, 0, 0);
    const with10 = calculateRefinancing(oldLoan, 2_000_000, loan10yIo, 3_000_000, 25, 30, 0, 0, 10);
    expect(with0.newSchedule.afdragsfriQuarters).toBe(0);
    expect(with10.newSchedule.afdragsfriQuarters).toBe(40);
    expect(with10.newSchedule.monthlyAfdrag).toBe(0);
    expect(with0.newSchedule.monthlyAfdrag).toBeGreaterThan(0);
    expect(with0.newSchedule.monthlyYdelseEfterSkat).not.toBeCloseTo(
      with10.newSchedule.monthlyYdelseEfterSkat,
      0
    );
  });
});

describe('P0/P1 regression: two-layer honours loebetid', () => {
  it('does not force 120 quarters when bonds have shorter loebetid', () => {
    const result = calculateTwoLayerLoan(
      3_000_000,
      2_000_000,
      40,
      loan20y,
      loan20y
    );
    expect(result.combinedSchedule.length).toBe(80);
    expect(result.layer1Result.totalQuarters).toBe(80);
  });
});

describe('P0/P1 regression: kurs <= 0 handling', () => {
  it('principalFromCash returns cash amount when kurs is invalid', () => {
    expect(principalFromCash(1_000_000, 0)).toBe(1_000_000);
    expect(principalFromCash(1_000_000, -5)).toBe(1_000_000);
    expect(principalFromCash(940_200, 94.02)).toBeCloseTo(1_000_000, 0);
  });

  it('refinancing with kurs <= 0 stays finite', () => {
    const badNew: BondLoan = { ...loanAmortizing, kurs: 0 };
    const oldLoan: BondLoan = {
      name: '1% 2050',
      rente: 1.0,
      kurs: 78.55,
      afdragsfri: false,
      bidragsSats: [0.0045, 0.0085, 0.012],
    };
    const comparison = calculateRefinancing(oldLoan, 2_000_000, badNew, 3_000_000, 30, 30, 0);
    expect(Number.isFinite(comparison.nyHovedstol)).toBe(true);
    expect(comparison.nyHovedstol).toBeGreaterThan(0);
    expect(Number.isFinite(comparison.newSchedule.monthlyYdelse)).toBe(true);
  });

  it('amortization kursvaerdi stays finite when kurs <= 0', () => {
    const bad: BondLoan = { ...loanAmortizing, kurs: 0 };
    const result = calculateLoanAmortization(bad, 120, 1_000_000, [0, 80]);
    expect(Number.isFinite(result.kursvaerdi)).toBe(true);
  });
});

describe('P0/P1 regression: live BondLoan normalisation', () => {
  it('drops rows missing required fields or with kurs <= 0', () => {
    const raw = [
      { name: 'ok', rente: 4, kurs: 95, bidragsSats: [0.01, 0.02, 0.03], afdragsfri: false },
      { name: '', rente: 4, kurs: 95, bidragsSats: [0.01, 0.02, 0.03] },
      { name: 'bad kurs', rente: 4, kurs: 0, bidragsSats: [0.01, 0.02, 0.03] },
      { name: 'short bidrag', rente: 4, kurs: 95, bidragsSats: [0.01, 0.02] },
      { rente: 4, kurs: 95, bidragsSats: [0.01, 0.02, 0.03] },
    ];
    const loans = normaliseLiveLoans(raw);
    expect(loans).toHaveLength(1);
    expect(loans[0].name).toBe('ok');
  });
});

describe('P0/P1 regression: elapsed years uses original term (not hardcoded 30)', () => {
  it('for a 20-år bond with 15 years left and 10-år IO, elapsed=5 → 5 IO left', () => {
    expect(estimateRemainingAfdragsfriYears(15, 20, 10)).toBe(5);
  });

  it('does not wipe IO on short maturity when remaining ≈ original term proxy', () => {
    // Old bug: elapsed = 30 - 5 = 25 → remaining IO = 0 for a ~5-year left bond
    expect(estimateRemainingAfdragsfriYears(5, 5, 10)).toBe(5);
  });

  it('caps remaining IO at remainingYears', () => {
    expect(estimateRemainingAfdragsfriYears(3, 30, 10)).toBe(0);
    expect(estimateRemainingAfdragsfriYears(8, 30, 10)).toBe(0); // elapsed 22
    expect(estimateRemainingAfdragsfriYears(25, 30, 10)).toBe(5);
  });
});

describe('original term proxy: getOriginalTermYears (not remaining maturity)', () => {
  it('prefers loebetid over maxTerminer', () => {
    const loan: BondLoan = {
      name: '1% 2041',
      rente: 1,
      kurs: 80,
      loebetid: 20,
      maxTerminer: 120,
      afdragsfri: true,
      bidragsSats: baseBidrag,
    };
    expect(getOriginalTermYears(loan)).toBe(20);
  });

  it('uses maxTerminer/4 when loebetid missing: remainingYears=15, maxIO=10 → elapsed=5 → remaining IO=5 (not 10)', () => {
    const loan: BondLoan = {
      name: '1% 2041 med op til 10 års afdragsfrihed',
      rente: 1,
      kurs: 80,
      // no loebetid — old bug fell back to remaining maturity (~15) → elapsed≈0 → IO=10
      maxTerminer: 80,
      afdragsfri: true,
      bidragsSats: baseBidrag,
    };
    expect(getOriginalTermYears(loan)).toBe(20);
    const remainingYears = 15;
    const maxOriginalAfdragsfri = getDefaultAfdragsfriYears(loan);
    expect(maxOriginalAfdragsfri).toBe(10);
    expect(
      estimateRemainingAfdragsfriYears(remainingYears, getOriginalTermYears(loan), maxOriginalAfdragsfri)
    ).toBe(5);
  });

  it('uses name heuristic 20/30 års when neither loebetid nor maxTerminer', () => {
    expect(
      getOriginalTermYears({
        name: 'FlexLån med 20 års løbetid',
        rente: 2,
        kurs: 100,
        afdragsfri: false,
        bidragsSats: baseBidrag,
      })
    ).toBe(20);
    expect(
      getOriginalTermYears({
        name: '30 års afdragsfri produkt',
        rente: 2,
        kurs: 100,
        afdragsfri: true,
        bidragsSats: baseBidrag,
      })
    ).toBe(30);
  });

  it('documented fallback is 30, not remaining years', () => {
    expect(
      getOriginalTermYears({
        name: '1% 2050',
        rente: 1,
        kurs: 80,
        afdragsfri: false,
        bidragsSats: baseBidrag,
      })
    ).toBe(30);
  });
});
