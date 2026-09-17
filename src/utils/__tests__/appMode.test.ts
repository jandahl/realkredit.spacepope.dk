import { describe, it, expect } from 'vitest';
import { resolveAppMode, hasShareParams, buildShareUrl } from '../appMode';

describe('resolveAppMode / URL defaults', () => {
  it('defaults fresh visits (no share params) to edit', () => {
    expect(resolveAppMode('')).toBe('edit');
    expect(resolveAppMode('?')).toBe('edit');
    expect(resolveAppMode('foo=1')).toBe('edit');
  });

  it('defaults shared links (tab/pv/debt) to report when mode omitted', () => {
    expect(resolveAppMode('tab=refinancing&pv=3000000&debt=2000000')).toBe('report');
    expect(resolveAppMode('?pv=3000000')).toBe('report');
    expect(resolveAppMode('debt=1500000')).toBe('report');
    expect(resolveAppMode('tab=standard')).toBe('report');
  });

  it('honours explicit mode=edit on shared links', () => {
    expect(resolveAppMode('tab=refinancing&pv=3&debt=2&mode=edit')).toBe('edit');
  });

  it('honours explicit mode=report', () => {
    expect(resolveAppMode('mode=report')).toBe('report');
    expect(resolveAppMode('tab=standard&mode=report')).toBe('report');
  });

  it('ignores unknown mode values and falls back to share/fresh rules', () => {
    expect(resolveAppMode('mode=banana')).toBe('edit');
    expect(resolveAppMode('mode=banana&pv=1')).toBe('report');
  });
});

describe('hasShareParams', () => {
  it('detects tab, pv, or debt', () => {
    expect(hasShareParams('tab=x')).toBe(true);
    expect(hasShareParams('pv=1')).toBe(true);
    expect(hasShareParams('debt=1')).toBe(true);
    expect(hasShareParams('mode=edit')).toBe(false);
  });
});

describe('buildShareUrl', () => {
  it('forces mode=report on the copied link', () => {
    const url = buildShareUrl('https://realkredit.spacepope.dk/?tab=refinancing&pv=1&debt=2&mode=edit');
    expect(url).toContain('mode=report');
    expect(url).not.toMatch(/mode=edit/);
  });
});
