import { describe, it, expect } from 'vitest';
import { computeBreakevenSeries, type BreakevenScheduleLike } from '../breakeven';

function makeSchedule(
  hovedstol: number,
  rows: Array<{ endRestgaeld: number; ydelseEfterSkat: number }>,
): BreakevenScheduleLike {
  return { hovedstol, schedule: rows };
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

  it('initial delta is newHovedstol - oldHovedstol (no cashout subtract)', () => {
    // Simulate cashout already in new principal: old 1.78M, new 2.0M (= debt+cashout+fees)
    const cashout = 200_000;
    const oldH = 1_780_000;
    const newH = oldH + cashout + 20_000; // fees financed in
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

    const { dataPoints } = computeBreakevenSeries(old, neu, 2);
    expect(dataPoints[0].deltaRestgaeld).toBe(newH - oldH);
    expect(dataPoints[0].balance).toBe(newH - oldH);

    // Regression: must NOT end near −cashout from re-subtracting every quarter
    const last = dataPoints[dataPoints.length - 1];
    expect(Math.abs(last.deltaRestgaeld + cashout)).toBeGreaterThan(50_000);
    // Restgældsforskel should track schedule ends, not (newEnd − cashout) − oldEnd
    const q = 4;
    const expectedDelta =
      neu.schedule[q - 1].endRestgaeld - old.schedule[q - 1].endRestgaeld;
    expect(dataPoints[q].deltaRestgaeld).toBe(expectedDelta);
  });

  it('detects a zero crossing when balance flips sign', () => {
    // Start positive (new higher principal), ydelse lower so cumsum pulls balance down
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
        ydelseEfterSkat: 15_000, // cheaper payments → cumsum negative
      })),
    );
    const { breakevenCrossing, dataPoints } = computeBreakevenSeries(old, neu, 5);
    expect(dataPoints[0].balance).toBe(50_000);
    expect(breakevenCrossing).not.toBeNull();
    expect(breakevenCrossing!).toBeGreaterThan(0);
  });
});
