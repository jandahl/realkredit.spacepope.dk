import type { BondLoan } from '../calculator/types';
import { FALLBACK_OPTAGELSE_LAAN, FALLBACK_INDFRIELSE_LAAN } from './fallbackRates';

export const DIRECT_API_BASE_URL = 'https://72ylpd13k2.execute-api.eu-north-1.amazonaws.com/v1/api';

// In development, route through Vite proxy to bypass CORS; in production use direct API or proxy
export const API_BASE_URL = import.meta.env.DEV ? '/api/proxy' : DIRECT_API_BASE_URL;

export interface RatesResponse {
  loans: BondLoan[];
  source: 'live' | 'fallback';
  timestamp: string;
}

function isValidBondLoan(loan: unknown): loan is BondLoan {
  if (!loan || typeof loan !== 'object') return false;
  const l = loan as Record<string, unknown>;
  if (typeof l.name !== 'string' || l.name.trim().length === 0) return false;
  if (typeof l.rente !== 'number' || !Number.isFinite(l.rente)) return false;
  if (typeof l.kurs !== 'number' || !(l.kurs > 0)) return false;
  if (!Array.isArray(l.bidragsSats) || l.bidragsSats.length !== 3) return false;
  if (!l.bidragsSats.every((x) => typeof x === 'number' && Number.isFinite(x))) return false;
  return true;
}

/** Normalise live API rows: require name, rente, kurs>0, bidragsSats length 3; drop bad rows. */
export function normaliseLiveLoans(raw: unknown[]): BondLoan[] {
  return raw.filter(isValidBondLoan);
}

export async function fetchKurser(
  type: 'optagelse' | 'indfrielse',
  signal?: AbortSignal
): Promise<RatesResponse> {
  const fallback = type === 'optagelse' ? FALLBACK_OPTAGELSE_LAAN : FALLBACK_INDFRIELSE_LAAN;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 6000);

  try {
    const response = await fetch(`${API_BASE_URL}/kurser/${type}`, {
      signal: signal || controller.signal,
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status} when fetching kurser`);
    }

    const data = await response.json();
    if (data && Array.isArray(data.laan) && data.laan.length > 0) {
      const loans = normaliseLiveLoans(data.laan);
      if (loans.length > 0) {
        return {
          loans,
          source: 'live',
          timestamp: new Date().toLocaleTimeString('da-DK'),
        };
      }
    }
    return {
      loans: fallback,
      source: 'fallback',
      timestamp: new Date().toLocaleTimeString('da-DK'),
    };
  } catch (error) {
    console.warn(`Failed to fetch live ${type} rates, using cached snapshot:`, error);
    return {
      loans: fallback,
      source: 'fallback',
      timestamp: new Date().toLocaleTimeString('da-DK'),
    };
  } finally {
    clearTimeout(timeoutId);
  }
}
