/**
 * Helpers for HTML <input type="range"> when (max - min) is not divisible by step.
 * Browsers may land on the last aligned tick below max; we still allow exact max.
 */

/** Whether target is an allowed tick, treating exact min/max as always allowed. */
export function rangeCanSelectValue(
  min: number,
  max: number,
  step: number,
  target: number,
): boolean {
  if (!(Number.isFinite(min) && Number.isFinite(max) && Number.isFinite(target))) {
    return false;
  }
  if (target < min || target > max) return false;
  if (target === min || target === max) return true;
  if (!(step > 0) || !Number.isFinite(step)) return true;
  const stepsFromMin = (target - min) / step;
  return Math.abs(stepsFromMin - Math.round(stepsFromMin)) < 1e-9;
}

/**
 * Clamp raw slider value into [min, max].
 * Values strictly above the last step-aligned tick snap up to max so a
 * non-aligned cost-aware cap remains selectable at the right end.
 */
export function snapRangeValue(raw: number, min: number, max: number, step: number): number {
  if (!Number.isFinite(raw)) return min;
  if (raw >= max) return max;
  if (raw <= min) return min;

  if (!(step > 0) || !Number.isFinite(step)) {
    return Math.min(max, Math.max(min, raw));
  }

  const lastAligned = min + Math.floor((max - min) / step) * step;
  if (raw > lastAligned) return max;

  const steps = Math.round((raw - min) / step);
  let v = min + steps * step;
  if (v > max) return max;
  if (v < min) return min;
  return v;
}
