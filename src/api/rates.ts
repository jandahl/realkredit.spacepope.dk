import type { BondLoan } from '../calculator/types';
import { FALLBACK_OPTAGELSE_LAAN, FALLBACK_INDFRIELSE_LAAN, FALLBACK_RATES_AS_OF_LABEL } from './fallbackRates';

/** Totalkredit public bondinformation API (CORS: Access-Control-Allow-Origin: *). */
export const TOTALKREDIT_API_BASE = 'https://www.totalkredit.dk/api/bondinformation/table';

export const TOTALKREDIT_TABLE_IDS = {
  optagelseFast: 'privat-udbetaling-af-laan-aktuelle-kurser-kunder',
  optagelseVariabel: 'privat-udbetaling-af-variabel-laan-aktuelle-kurser-kunder',
  indfrielse: 'indfrielse-af-laan-aktuelle-kurser-og-terminstillaeg-kunder',
} as const;

/** Public Totalkredit kurs overview (udbetaling / indfrielse tables). */
export const TOTALKREDIT_KURSER_URL =
  'https://www.totalkredit.dk/boliglan/kurser-og-priser/';

/** Nasdaq Nordic mortgage-bond market overview (individual bonds use loan.nasdaqUrl). */
export const NASDAQ_MORTGAGE_BONDS_URL =
  'https://www.nasdaq.com/da/european-market-activity/mortgage-bonds';

/** Static bidrag bands from Totalkredit prisblad (not present in bondinformation JSON). */
export const BIDRAG_FIXED_AFDRAG: [number, number, number] = [0.0045, 0.0085, 0.012];
export const BIDRAG_FIXED_AFDRAGSFRI: [number, number, number] = [0.0055, 0.0115, 0.02];
export const BIDRAG_FLEX_AFDRAG: [number, number, number] = [0.005, 0.0105, 0.0155];
export const BIDRAG_FLEX_AFDRAGSFRI: [number, number, number] = [0.006, 0.0135, 0.0235];

export interface RatesResponse {
  loans: BondLoan[];
  source: 'live' | 'fallback';
  timestamp: string;
}

/** Raw Totalkredit table entry (subset of fields we use). */
export interface TotalkreditEntry {
  name?: string;
  fondCode?: string;
  lifetime?: string;
  priceRate?: string;
  spotPriceRatePayment?: string;
  spotPriceRateRedemption?: string;
  redemptionRate?: string;
  expectedRate?: string;
  effectiveRate?: string;
  isOpenForOffer?: boolean;
  nasdaqUrl?: string;
}

export interface TotalkreditGroup {
  name?: string;
  entries?: TotalkreditEntry[];
}

export interface TotalkreditTableResponse {
  groups?: TotalkreditGroup[];
  lastUpdatedTimestamp?: string;
  nextUpdateTimestamp?: string;
  disclaimer?: string;
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

/** Parse Danish decimal strings like "99,32", "2,9548 %", "100". */
export function parseDanishDecimal(value: string | number | null | undefined): number | null {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null;
  }
  if (typeof value !== 'string') return null;
  const cleaned = value.replace(/\s/g, '').replace('%', '').replace(',', '.');
  if (!cleaned) return null;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}

/**
 * Coupon / rate from product name.
 * - "5% 2059…" / "3,5% 2049…" → coupon
 * - "Aktuel rente 2,5570%, …" → current flex rate
 */
export function parseCouponFromName(name: string): number | null {
  const leading = name.match(/^\s*(\d+(?:[.,]\d+)?)\s*%/);
  if (leading) return parseDanishDecimal(leading[1]);
  const aktuel = name.match(/Aktuel\s+rente\s+(\d+(?:[.,]\d+)?)\s*%/i);
  if (aktuel) return parseDanishDecimal(aktuel[1]);
  return null;
}

/** Parse lifetime strings like "30 år" → 30. */
export function parseLifetimeYears(lifetime: string | undefined): number | undefined {
  if (!lifetime) return undefined;
  const m = lifetime.match(/(\d+)/);
  if (!m) return undefined;
  const years = parseInt(m[1], 10);
  return Number.isFinite(years) && years > 0 ? years : undefined;
}

/**
 * Maturity year from classic "X% YYYY …" or "udløb DD-MM-YYYY".
 * Ignores refinansiering dates so flex products do not get a false udloebsAar.
 */
export function parseUdloebsAar(name: string): number | undefined {
  const udloeb = name.match(/udløb\s+\d{1,2}-\d{1,2}-(20\d{2})/i);
  if (udloeb) return parseInt(udloeb[1], 10);
  const classic = name.match(/^\s*\d+(?:[.,]\d+)?\s*%\s+(20\d{2})\b/);
  if (classic) return parseInt(classic[1], 10);
  return undefined;
}

export function pickBidragsSats(flex: boolean, afdragsfri: boolean): [number, number, number] {
  if (flex) {
    return afdragsfri ? [...BIDRAG_FLEX_AFDRAGSFRI] : [...BIDRAG_FLEX_AFDRAG];
  }
  return afdragsfri ? [...BIDRAG_FIXED_AFDRAGSFRI] : [...BIDRAG_FIXED_AFDRAG];
}

function isFlexGroupName(groupName: string | undefined): boolean {
  if (!groupName) return false;
  const n = groupName.trim().toLowerCase();
  if (!n || n === 'fast rente') return false;
  return true;
}

/**
 * Indfrielse kurs: cheaper of opsigelse (redemptionRate) and marked (spot),
 * matching calculator use of Math.min(100, kurs) and fallback snapshot behaviour.
 */
export function resolveIndfrielseKurs(entry: TotalkreditEntry): number | null {
  const spot = parseDanishDecimal(entry.spotPriceRateRedemption);
  const redemption = parseDanishDecimal(entry.redemptionRate);
  if (spot != null && redemption != null) return Math.min(spot, redemption);
  if (spot != null) return spot;
  if (redemption != null) return redemption;
  return null;
}

export function resolveRente(entry: TotalkreditEntry, flex: boolean): number | null {
  const fromName = parseCouponFromName(entry.name ?? '');
  if (fromName != null) return fromName;
  if (flex) {
    const expected = parseDanishDecimal(entry.expectedRate);
    if (expected != null) return expected;
  }
  const effective = parseDanishDecimal(entry.effectiveRate);
  if (effective != null) return effective;
  return null;
}

export function mapTotalkreditEntryToBondLoan(
  entry: TotalkreditEntry,
  options: { flex: boolean; kind: 'optagelse' | 'indfrielse' }
): BondLoan | null {
  const name = typeof entry.name === 'string' ? entry.name.trim() : '';
  if (!name) return null;

  const flex = options.flex;
  const afdragsfri = /afdragsfri/i.test(name);
  const rente = resolveRente(entry, flex);
  if (rente == null) return null;

  let kurs: number | null = null;
  if (options.kind === 'optagelse') {
    kurs = parseDanishDecimal(entry.priceRate);
  } else {
    kurs = resolveIndfrielseKurs(entry);
  }
  if (kurs == null || !(kurs > 0)) return null;

  const loebetid = parseLifetimeYears(entry.lifetime);
  const udloebsAar = parseUdloebsAar(name);
  const bidragsSats = pickBidragsSats(flex, afdragsfri);

  const loan: BondLoan = {
    name,
    rente,
    kurs,
    flex,
    afdragsfri,
    bidragsSats,
    bidrag: [...bidragsSats],
  };

  if (loebetid != null) {
    loan.loebetid = loebetid;
    loan.maxTerminer = loebetid * 4;
  }
  if (udloebsAar != null) {
    loan.udloebsAar = udloebsAar;
  }
  if (typeof entry.isOpenForOffer === 'boolean') {
    loan.isOpenForOffer = entry.isOpenForOffer;
  }
  if (typeof entry.fondCode === 'string' && entry.fondCode.trim()) {
    loan.fondCode = entry.fondCode.trim();
  }
  if (typeof entry.nasdaqUrl === 'string' && entry.nasdaqUrl.trim()) {
    loan.nasdaqUrl = entry.nasdaqUrl.trim();
  }

  return isValidBondLoan(loan) ? loan : null;
}

/** Map a full Totalkredit table response into BondLoan[]. */
export function mapTotalkreditTableToBondLoans(
  table: TotalkreditTableResponse | null | undefined,
  options: { flex?: boolean; kind: 'optagelse' | 'indfrielse' }
): BondLoan[] {
  if (!table || !Array.isArray(table.groups)) return [];
  const loans: BondLoan[] = [];
  for (const group of table.groups) {
    const groupFlex =
      options.flex === true || (options.flex !== false && isFlexGroupName(group.name));
    const entries = Array.isArray(group.entries) ? group.entries : [];
    for (const entry of entries) {
      const loan = mapTotalkreditEntryToBondLoan(entry, {
        flex: groupFlex,
        kind: options.kind,
      });
      if (loan) loans.push(loan);
    }
  }
  return loans;
}

export function formatTotalkreditTimestamp(iso: string | undefined): string {
  if (!iso) return new Date().toLocaleTimeString('da-DK');
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return new Date().toLocaleTimeString('da-DK');
  return d.toLocaleTimeString('da-DK');
}

function pickNewestTimestamp(...values: Array<string | undefined>): string | undefined {
  let best: string | undefined;
  let bestMs = -Infinity;
  for (const v of values) {
    if (!v) continue;
    const ms = Date.parse(v);
    if (!Number.isNaN(ms) && ms >= bestMs) {
      bestMs = ms;
      best = v;
    }
  }
  return best;
}

async function fetchTotalkreditTable(
  tableId: string,
  signal?: AbortSignal
): Promise<TotalkreditTableResponse> {
  const url = `${TOTALKREDIT_API_BASE}?tableId=${encodeURIComponent(tableId)}`;
  const response = await fetch(url, {
    signal,
    headers: { Accept: 'application/json' },
  });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status} from Totalkredit (${tableId})`);
  }
  return (await response.json()) as TotalkreditTableResponse;
}

export async function fetchKurser(
  type: 'optagelse' | 'indfrielse',
  signal?: AbortSignal
): Promise<RatesResponse> {
  const fallback = type === 'optagelse' ? FALLBACK_OPTAGELSE_LAAN : FALLBACK_INDFRIELSE_LAAN;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 6000);
  const onAbort = () => controller.abort();
  if (signal) {
    if (signal.aborted) controller.abort();
    else signal.addEventListener('abort', onAbort, { once: true });
  }

  try {
    let loans: BondLoan[] = [];
    let lastUpdated: string | undefined;

    if (type === 'optagelse') {
      const results = await Promise.allSettled([
        fetchTotalkreditTable(TOTALKREDIT_TABLE_IDS.optagelseFast, controller.signal),
        fetchTotalkreditTable(TOTALKREDIT_TABLE_IDS.optagelseVariabel, controller.signal),
      ]);

      const fast = results[0].status === 'fulfilled' ? results[0].value : null;
      const variabel = results[1].status === 'fulfilled' ? results[1].value : null;

      if (results[0].status === 'rejected') {
        console.warn('Totalkredit optagelse (fast) failed:', results[0].reason);
      }
      if (results[1].status === 'rejected') {
        console.warn('Totalkredit optagelse (variabel) failed:', results[1].reason);
      }

      loans = [
        ...mapTotalkreditTableToBondLoans(fast, { flex: false, kind: 'optagelse' }),
        ...mapTotalkreditTableToBondLoans(variabel, { flex: true, kind: 'optagelse' }),
      ];
      lastUpdated = pickNewestTimestamp(fast?.lastUpdatedTimestamp, variabel?.lastUpdatedTimestamp);
    } else {
      const table = await fetchTotalkreditTable(TOTALKREDIT_TABLE_IDS.indfrielse, controller.signal);
      loans = mapTotalkreditTableToBondLoans(table, { kind: 'indfrielse' });
      lastUpdated = table.lastUpdatedTimestamp;
    }

    loans = normaliseLiveLoans(loans);
    if (loans.length > 0) {
      return {
        loans,
        source: 'live',
        timestamp: formatTotalkreditTimestamp(lastUpdated),
      };
    }

    return {
      loans: fallback,
      source: 'fallback',
      timestamp: FALLBACK_RATES_AS_OF_LABEL,
    };
  } catch (error) {
    console.warn(`Failed to fetch live ${type} rates from Totalkredit, using cached snapshot:`, error);
    return {
      loans: fallback,
      source: 'fallback',
      timestamp: FALLBACK_RATES_AS_OF_LABEL,
    };
  } finally {
    clearTimeout(timeoutId);
    if (signal) signal.removeEventListener('abort', onAbort);
  }
}
