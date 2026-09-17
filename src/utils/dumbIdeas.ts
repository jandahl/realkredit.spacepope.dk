import type { BondLoan } from '../calculator/types';
import { parseBondLoan } from './loanParser';

export type AfdragsfriSwitchKind =
  | 'to-io'
  | 'to-amortizing'
  | 'both-io'
  | 'both-amortizing';

export interface AfdragsfriSwitchResult {
  kind: AfdragsfriSwitchKind;
  existingIsIo: boolean;
  newIsIo: boolean;
  /** Mild Danish callout for the report / panel. */
  warningDa: string;
}

/** Detect variable / F-kort / flex products via flag or name heuristics. */
export function isVariableRateLoan(loan: BondLoan): boolean {
  if (loan.flex) return true;
  const lower = loan.name.toLowerCase();
  if (lower.includes('f-kort') || lower.includes('flex')) return true;
  return parseBondLoan(loan).renteKey === 'flex';
}

/**
 * Treat remaining IO years (when provided) as the practical afdragsfri state.
 * Falls back to the bond's `afdragsfri` flag when years are omitted.
 */
export function loanIsEffectivelyIo(
  loan: BondLoan,
  remainingIoYears?: number,
): boolean {
  if (typeof remainingIoYears === 'number') {
    return remainingIoYears > 0;
  }
  return Boolean(loan.afdragsfri);
}

/**
 * Detect afdragsfri ↔ med afdrag switches between existing and new loan.
 * Wording is calm / informational (not alarmist).
 */
export function detectAfdragsfriSwitch(
  existing: BondLoan,
  newLoan: BondLoan,
  existingIoYears?: number,
  newIoYears?: number,
): AfdragsfriSwitchResult {
  const existingIsIo = loanIsEffectivelyIo(existing, existingIoYears);
  const newIsIo = loanIsEffectivelyIo(newLoan, newIoYears);

  if (existingIsIo && !newIsIo) {
    return {
      kind: 'to-amortizing',
      existingIsIo,
      newIsIo,
      warningDa:
        'Du går fra afdragsfrihed til et lån med afdrag. Det sænker restgælden over tid, men månedlig ydelse stiger typisk, fordi afdraget kommer oven i rente og bidrag. Overvej om rådighedsbeløbet stadig er komfortabelt.',
    };
  }

  if (!existingIsIo && newIsIo) {
    return {
      kind: 'to-io',
      existingIsIo,
      newIsIo,
      warningDa:
        'Du går fra et lån med afdrag til afdragsfrihed. Ydelsen falder ofte her-og-nu, men gælden afvikles langsommere (eller slet ikke i IO-perioden). Det kan være fornuftigt midlertidigt — bare vær bevidst om den længere gældsbyrde.',
    };
  }

  if (existingIsIo && newIsIo) {
    return {
      kind: 'both-io',
      existingIsIo,
      newIsIo,
      warningDa:
        'Både det nuværende og det nye lån er (eller forbliver) afdragsfrie i en periode. Afdragsfrihed giver fleksibilitet, men gælden falder ikke — eller falder sent. En mild påmindelse: planlæg hvornår afdraget skal starte, så restgælden ikke “hænger” længere end nødvendigt.',
    };
  }

  return {
    kind: 'both-amortizing',
    existingIsIo,
    newIsIo,
    warningDa:
      'Begge lån afdrager. Det er generelt den mest gældsafviklende vej. Afdragsfrihed kan stadig være relevant i særlige situationer, men er sjældent “gratis” — det koster typisk højere bidrag og længere tid med gæld.',
  };
}

/** Mild general warning against interest-only products (always shown). */
export const AFDRAGSFRI_GENERAL_WARNING_DA =
  'Afdragsfrihed kan give lavere ydelse i en periode, men gælden falder ikke (eller falder sent), og bidragssatsen er ofte højere. Overvej det som et bevidst valg — ikke som standard.';

/** Mild warning for variable / F-kort products. */
export function variableRateWarningDa(loan: BondLoan): string | null {
  if (!isVariableRateLoan(loan)) return null;
  return `Variabel rente / F-kort (${loan.name}) betyder, at ydelsen kan stige ved rentestigninger uden den samme kursbeskyttelse som et fastforrentet lån. Det kan være billigere i perioder — men kræver buffer til rentehop.`;
}
