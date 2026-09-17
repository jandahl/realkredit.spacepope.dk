/**
 * Breakeven series: compare two loan schedules only.
 * Cashout (friværdi) must NOT be re-subtracted from restgæld — it is already
 * financed into newSchedule.hovedstol / amortization.
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
};

export type BreakevenSeriesResult = {
  dataPoints: BreakevenPoint[];
  /** Fractional quarter index of zero-crossing, or null if none. */
  breakevenCrossing: number | null;
};

export function computeBreakevenSeries(
  existingSchedule: BreakevenScheduleLike,
  newSchedule: BreakevenScheduleLike,
  maxYears: number,
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

  const totalQuarters = Math.round(maxYears * 4);
  if (totalQuarters <= 0) {
    return { dataPoints: [], breakevenCrossing: null };
  }

  let cumsum = 0;
  const points: BreakevenPoint[] = [];

  // Quarter 0: principal delta only (cashout already in new hovedstol)
  const initialDeltaRestgaeld = newSchedule.hovedstol - existingSchedule.hovedstol;
  points.push({
    quarter: 0,
    year: 0,
    deltaRestgaeld: initialDeltaRestgaeld,
    cumsumYdelse: 0,
    balance: initialDeltaRestgaeld,
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

    // Do not subtract cashout — already in new principal / schedule
    const deltaRest = newRow.endRestgaeld - oldRow.endRestgaeld;
    const balance = cumsum + deltaRest;

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
