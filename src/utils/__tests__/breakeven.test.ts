import { describe, it, expect } from 'vitest';
import {
  computeBreakevenSeries,
  combinedSchedule,
  type BreakevenScheduleLike,
} from '../breakeven';

function makeSchedule(
  hovedstol: number,
  rows: Array<{ endRestgaeld: number; ydelseEfterSkat: number }>,
): BreakevenScheduleLike {
  return { hovedstol, schedule: rows, totalQuarters: rows.length };
}

describe('computeBreakevenSeries', () => {
  it('returns empty for maxYears 0 / empty schedules', () => {
    const s = makeSchedule(1_000_000, [{ endRestgaeld: 900_000, ydelseEfterSkat: 10_000 }]);
    expect(computeBreakevenSeries(s, s, 0).dataPoints).toEqual([]);
    expect(
      computeBreakevenSeries(makeSchedule(1, []), makeSchedule(1, [{ endRestgaeld: 0, ydelseEfterSkat: 0 }]), 10)
        .dataPoints,
    ).toEqual([]);
  });

  it('credits cashout as wealth: q0 balance ≈ fees, not ≈ cashout+fees', () => {
    const cashout = 200_000;
    const fees = 20_000;
    const oldH = 1_780_000;
    const newH = oldH + cashout + fees;
    const old = makeSchedule(
      oldH,
      Array.from({ length: 8 }, (_, i) => ({
        endRestgaeld: oldH - (i + 1) * 5_000,
        ydelseEfterSkat: 12_000,
      })),
    );
    const neu = makeSchedule(
      newH,
      Array.from({ length: 8 }, (_, i) => ({
        endRestgaeld: newH - (i + 1) * 4_000,
        ydelseEfterSkat: 14_000,
      })),
    );

    const withCredit = computeBreakevenSeries(old, neu, 2, cashout);
    expect(withCredit.dataPoints[0].deltaRestgaeld).toBe(newH - oldH);
    // Wealth-adjusted: (newH − oldH) − cashout = fees
    expect(withCredit.dataPoints[0].balance).toBe(fees);
    expect(Math.abs(withCredit.dataPoints[0].balance - fees)).toBeLessThan(1);

    // Regression: without cashout credit, q0 would be ~220k
    const withoutCredit = computeBreakevenSeries(old, neu, 2, 0);
    expect(withoutCredit.dataPoints[0].balance).toBe(newH - oldH);
    expect(withoutCredit.dataPoints[0].balance).toBeGreaterThan(200_000);
    expect(withCredit.dataPoints[0].balance).toBeLessThan(50_000);

    // deltaRestgaeld still tracks schedule ends (cashout is only on balance)
    const q = 4;
    const expectedDelta =
      neu.schedule[q - 1].endRestgaeld - old.schedule[q - 1].endRestgaeld;
    expect(withCredit.dataPoints[q].deltaRestgaeld).toBe(expectedDelta);
    expect(withCredit.dataPoints[q].balance).toBe(
      withCredit.dataPoints[q].cumsumYdelse + expectedDelta - cashout,
    );
  });

  it('detects a zero crossing when balance flips sign', () => {
    const old = makeSchedule(
      1_000_000,
      Array.from({ length: 20 }, (_, i) => ({
        endRestgaeld: 1_000_000 - (i + 1) * 10_000,
        ydelseEfterSkat: 20_000,
      })),
    );
    const neu = makeSchedule(
      1_050_000,
      Array.from({ length: 20 }, (_, i) => ({
        endRestgaeld: 1_050_000 - (i + 1) * 12_000,
        ydelseEfterSkat: 15_000,
      })),
    );
    const { breakevenCrossing, dataPoints } = computeBreakevenSeries(old, neu, 5);
    expect(dataPoints[0].balance).toBe(50_000);
    expect(breakevenCrossing).not.toBeNull();
    expect(breakevenCrossing!).toBeGreaterThan(0);
  });

  it('pads ended loan as rest=0,ydelse=0 and uses max schedule horizon', () => {
    const old = makeSchedule(
      100_000,
      Array.from({ length: 4 }, (_, i) => ({
        endRestgaeld: 100_000 - (i + 1) * 25_000,
        ydelseEfterSkat: 5_000,
      })),
    );
    const neu = makeSchedule(
      120_000,
      Array.from({ length: 8 }, (_, i) => ({
        endRestgaeld: 120_000 - (i + 1) * 15_000,
        ydelseEfterSkat: 6_000,
      })),
    );
    // maxYears=1 → 4 quarters requested, but schedules force horizon to 8
    const { dataPoints } = computeBreakevenSeries(old, neu, 1);
    expect(dataPoints.length).toBe(9); // q0 + 8
    // After old ends (q>=4): old pads 0, so Δydelse = full new ydelse
    const afterOldEnds = dataPoints[5]; // quarter 5
    expect(afterOldEnds.cumsumYdelse).toBeGreaterThan(dataPoints[4].cumsumYdelse);
  });
});

describe('combinedSchedule', () => {
  it('sums hovedstol and per-quarter rest/ydelse', () => {
    const a = makeSchedule(100, [
      { endRestgaeld: 90, ydelseEfterSkat: 10 },
      { endRestgaeld: 80, ydelseEfterSkat: 10 },
    ]);
    const b = makeSchedule(50, [{ endRestgaeld: 40, ydelseEfterSkat: 5 }]);
    const c = combinedSchedule(a, b);
    expect(c.hovedstol).toBe(150);
    expect(c.schedule).toHaveLength(2);
    expect(c.schedule[0]).toEqual({ endRestgaeld: 130, ydelseEfterSkat: 15 });
    expect(c.schedule[1]).toEqual({ endRestgaeld: 80, ydelseEfterSkat: 10 });
  });
});
