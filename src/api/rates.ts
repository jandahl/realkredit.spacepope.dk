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

export async function fetchKurser(
  type: 'optagelse' | 'indfrielse',
  signal?: AbortSignal
): Promise<RatesResponse> {
  const fallback = type === 'optagelse' ? FALLBACK_OPTAGELSE_LAAN : FALLBACK_INDFRIELSE_LAAN;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const response = await fetch(`${API_BASE_URL}/kurser/${type}`, {
      signal: signal || controller.signal,
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status} when fetching kurser`);
    }

    const data = await response.json();
    if (data && Array.isArray(data.laan) && data.laan.length > 0) {
      return {
        loans: data.laan,
        source: 'live',
        timestamp: new Date().toLocaleTimeString('da-DK'),
      };
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
  }
}
