/**
 * Breakeven series: wealth-adjusted comparison of two loan schedules.
 *
 * balance(t) = Σ(y_new − y_old) + (R_new(t) − R_old(t)) − cashout
 *
 * Cashout (friværdi udbetalt) is a constant formue credit: it is financed into
 * the new hovedstol / schedule, so without subtracting it the curve starts near
 * +cashout+fees and looks wildly positive. Algebraically equivalent to comparing
 * (R_new − cashout) − R_old while documenting cashout as wealth, not as a separate
 * amortization story.
 *
 * Horizon = max of the two schedules’ lengths (and maxYears·4 if larger).
 * When one side has ended, missing rows pad as rest=0, ydelse=0.
 */

export type BreakevenPoint = {
  quarter: number;
  year: number;
  deltaRestgaeld: number;
  cumsumYdelse: number;
  balance: number;
};

export type BreakevenScheduleLike = {
  hovedstol: number;
  schedule: Array<{ endRestgaeld: number; ydelseEfterSkat: number }>;
  totalQuarters?: number;
};

export type BreakevenSeriesResult = {
  dataPoints: BreakevenPoint[];
  /** Fractional quarter index of zero-crossing, or null if none. */
  breakevenCrossing: number | null;
};

/** Combine two schedules quarter-by-quarter (Option B: existing + tillæg). */
export function combinedSchedule(
  a: BreakevenScheduleLike,
  b: BreakevenScheduleLike,
): BreakevenScheduleLike {
  const len = Math.max(
    a.totalQuarters ?? a.schedule.length,
    b.totalQuarters ?? b.schedule.length,
    a.schedule.length,
    b.schedule.length,
  );
  const schedule: Array<{ endRestgaeld: number; ydelseEfterSkat: number }> = [];
  for (let q = 0; q < len; q++) {
    const ar = a.schedule[q];
    const br = b.schedule[q];
    schedule.push({
      endRestgaeld: (ar?.endRestgaeld ?? 0) + (br?.endRestgaeld ?? 0),
      ydelseEfterSkat: (ar?.ydelseEfterSkat ?? 0) + (br?.ydelseEfterSkat ?? 0),
    });
  }
  return {
    hovedstol: a.hovedstol + b.hovedstol,
    schedule,
    totalQuarters: len,
  };
}

export function computeBreakevenSeries(
  existingSchedule: BreakevenScheduleLike,
  newSchedule: BreakevenScheduleLike,
  maxYears: number,
  cashout = 0,
): BreakevenSeriesResult {
  if (
    !Number.isFinite(maxYears) ||
    maxYears <= 0 ||
    !existingSchedule?.schedule?.length ||
    !newSchedule?.schedule?.length ||
    !Number.isFinite(existingSchedule.hovedstol) ||
    !Number.isFinite(newSchedule.hovedstol)
  ) {
    return { dataPoints: [], breakevenCrossing: null };
  }

  const cash = Math.max(0, Number.isFinite(cashout) ? cashout : 0);

  const fromSchedules = Math.max(
    existingSchedule.totalQuarters ?? existingSchedule.schedule.length,
    newSchedule.totalQuarters ?? newSchedule.schedule.length,
    existingSchedule.schedule.length,
    newSchedule.schedule.length,
  );
  const fromYears = Math.round(maxYears * 4);
  const totalQuarters = Math.max(fromSchedules, fromYears);
  if (totalQuarters <= 0) {
    return { dataPoints: [], breakevenCrossing: null };
  }

  let cumsum = 0;
  const points: BreakevenPoint[] = [];

  // Quarter 0: principal delta minus cashout wealth credit
  const initialDeltaRestgaeld = newSchedule.hovedstol - existingSchedule.hovedstol;
  const initialBalance = initialDeltaRestgaeld - cash;
  points.push({
    quarter: 0,
    year: 0,
    deltaRestgaeld: initialDeltaRestgaeld,
    cumsumYdelse: 0,
    balance: initialBalance,
  });

  let crossingQuarter: number | null = null;

  for (let q = 0; q < totalQuarters; q++) {
    const oldRow = existingSchedule.schedule[q] || {
      endRestgaeld: 0,
      ydelseEfterSkat: 0,
    };
    const newRow = newSchedule.schedule[q] || {
      endRestgaeld: 0,
      ydelseEfterSkat: 0,
    };

    const deltaYdelse = newRow.ydelseEfterSkat - oldRow.ydelseEfterSkat;
    cumsum += deltaYdelse;

    const deltaRest = newRow.endRestgaeld - oldRow.endRestgaeld;
    const balance = cumsum + deltaRest - cash;

    const prevBal = points[points.length - 1].balance;
    if (crossingQuarter === null && points.length > 0) {
      if ((prevBal < 0 && balance >= 0) || (prevBal > 0 && balance <= 0)) {
        const denom = Math.abs(balance - prevBal);
        if (denom > 0 && Number.isFinite(denom)) {
          const fraction = Math.abs(prevBal) / denom;
          crossingQuarter = q + fraction;
        }
      }
    }

    points.push({
      quarter: q + 1,
      year: (q + 1) / 4,
      deltaRestgaeld: deltaRest,
      cumsumYdelse: cumsum,
      balance,
    });
  }

  return {
    dataPoints: points,
    breakevenCrossing: crossingQuarter,
  };
}
