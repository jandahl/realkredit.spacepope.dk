import { describe, it, expect } from 'vitest';
import type { BondLoan } from '../../calculator/types';
import {
  detectAfdragsfriSwitch,
  isVariableRateLoan,
  loanIsEffectivelyIo,
  variableRateWarningDa,
} from '../dumbIdeas';

const baseBidrag: [number, number, number] = [0.0055, 0.0115, 0.02];

const fixedIo: BondLoan = {
  name: '1% 2050 med op til 10 års afdragsfrihed',
  rente: 1.0,
  kurs: 78,
  loebetid: 30,
  afdragsfri: true,
  bidragsSats: baseBidrag,
};

const fixedAmort: BondLoan = {
  name: '4% 2059 med afdrag',
  rente: 4.0,
  kurs: 94,
  loebetid: 30,
  afdragsfri: false,
  bidragsSats: baseBidrag,
};

const flexLoan: BondLoan = {
  name: 'F-kort med afdrag',
  rente: 2.5,
  kurs: 100,
  loebetid: 30,
  flex: true,
  afdragsfri: false,
  bidragsSats: baseBidrag,
};

const fKortByName: BondLoan = {
  name: 'Totalkredit F-kort 30 år',
  rente: 2.1,
  kurs: 100.1,
  loebetid: 30,
  afdragsfri: false,
  bidragsSats: baseBidrag,
};

describe('detectAfdragsfriSwitch', () => {
  it('detects switch from interest-only to amortizing', () => {
    const r = detectAfdragsfriSwitch(fixedIo, fixedAmort);
    expect(r.kind).toBe('to-amortizing');
    expect(r.warningDa.toLowerCase()).toMatch(/afdrag/);
  });

  it('detects switch from amortizing to interest-only', () => {
    const r = detectAfdragsfriSwitch(fixedAmort, fixedIo);
    expect(r.kind).toBe('to-io');
    expect(r.warningDa.toLowerCase()).toMatch(/afdragsfri/);
  });

  it('uses remaining IO years when product flags disagree', () => {
    const r = detectAfdragsfriSwitch(fixedIo, fixedAmort, 0, 0);
    expect(r.kind).toBe('both-amortizing');
    expect(loanIsEffectivelyIo(fixedIo, 0)).toBe(false);
  });

  it('flags both-io when remaining IO years imply continued IO', () => {
    const r = detectAfdragsfriSwitch(fixedAmort, fixedAmort, 5, 8);
    expect(r.kind).toBe('both-io');
  });
});

describe('isVariableRateLoan / flex detection', () => {
  it('detects flex flag', () => {
    expect(isVariableRateLoan(flexLoan)).toBe(true);
    expect(variableRateWarningDa(flexLoan)).toMatch(/Variabel|F-kort/i);
  });

  it('detects F-kort via name heuristic', () => {
    expect(isVariableRateLoan(fKortByName)).toBe(true);
  });

  it('returns false for fixed-rate loans', () => {
    expect(isVariableRateLoan(fixedAmort)).toBe(false);
    expect(variableRateWarningDa(fixedAmort)).toBeNull();
  });
});
