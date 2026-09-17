import { describe, it, expect } from 'vitest';
import { rangeCanSelectValue, snapRangeValue } from '../rangeSlider';

describe('rangeCanSelectValue', () => {
  it('always allows exact min and max even when max is not step-aligned', () => {
    // Bug case: B cost-aware max 174_538 with legacy step 5_000
    expect(rangeCanSelectValue(0, 174_538, 5_000, 174_538)).toBe(true);
    expect(rangeCanSelectValue(0, 174_538, 5_000, 0)).toBe(true);
    expect(rangeCanSelectValue(0, 174_538, 5_000, 170_000)).toBe(true);
    expect(rangeCanSelectValue(0, 174_538, 5_000, 175_000)).toBe(false);
    expect(rangeCanSelectValue(0, 174_538, 5_000, 172_500)).toBe(false);
  });

  it('with step=1 every integer in range including max is allowed', () => {
    expect(rangeCanSelectValue(0, 174_538, 1, 174_538)).toBe(true);
    expect(rangeCanSelectValue(0, 174_538, 1, 65_579)).toBe(true);
    expect(rangeCanSelectValue(0, 65_579, 1, 65_579)).toBe(true);
  });
});

describe('snapRangeValue', () => {
  it('keeps last aligned tick; snaps values above it up to max', () => {
    expect(snapRangeValue(170_000, 0, 174_538, 5_000)).toBe(170_000);
    expect(snapRangeValue(174_000, 0, 174_538, 5_000)).toBe(174_538);
    expect(snapRangeValue(174_538, 0, 174_538, 5_000)).toBe(174_538);
    expect(snapRangeValue(175_000, 0, 174_538, 5_000)).toBe(174_538);
  });

  it('with step=1 returns exact integers including max', () => {
    expect(snapRangeValue(174_538, 0, 174_538, 1)).toBe(174_538);
    expect(snapRangeValue(65_579, 0, 65_579, 1)).toBe(65_579);
    expect(snapRangeValue(65_579, 0, 174_538, 1)).toBe(65_579);
  });
});
