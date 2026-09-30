import { describe, expect, it, vi, afterEach } from 'vitest';
import {
  parseDanishDecimal,
  parseCouponFromName,
  parseLifetimeYears,
  parseUdloebsAar,
  pickBidragsSats,
  resolveIndfrielseKurs,
  mapTotalkreditEntryToBondLoan,
  mapTotalkreditTableToBondLoans,
  fetchKurser,
  TOTALKREDIT_TABLE_IDS,
  BIDRAG_FIXED_AFDRAG,
  BIDRAG_FIXED_AFDRAGSFRI,
  BIDRAG_FLEX_AFDRAG,
  BIDRAG_FLEX_AFDRAGSFRI,
} from '../rates';
import type { TotalkreditTableResponse } from '../rates';
import { FALLBACK_OPTAGELSE_LAAN, FALLBACK_RATES_AS_OF_LABEL } from '../fallbackRates';

describe('parseDanishDecimal', () => {
  it('parses Danish comma decimals and percentages', () => {
    expect(parseDanishDecimal('99,32')).toBeCloseTo(99.32);
    expect(parseDanishDecimal('2,9548 %')).toBeCloseTo(2.9548);
    expect(parseDanishDecimal('100')).toBe(100);
    expect(parseDanishDecimal(' 91,85 ')).toBeCloseTo(91.85);
  });

  it('returns null for empty or malformed', () => {
    expect(parseDanishDecimal('')).toBeNull();
    expect(parseDanishDecimal('   ')).toBeNull();
    expect(parseDanishDecimal(undefined)).toBeNull();
    expect(parseDanishDecimal('abc')).toBeNull();
  });
});

describe('parseCouponFromName', () => {
  it('parses leading coupon including Danish decimal', () => {
    expect(parseCouponFromName('5% 2059 med afdrag')).toBe(5);
    expect(parseCouponFromName('3,5% 2049 med afdrag')).toBeCloseTo(3.5);
    expect(parseCouponFromName('4% 2059 med op til 10 års afdragsfrihed')).toBe(4);
  });

  it('parses Aktuel rente for flex names', () => {
    expect(parseCouponFromName('Aktuel rente 2,5570%, refinansiering 01-07-2029')).toBeCloseTo(2.557);
  });

  it('returns null when no rate in name', () => {
    expect(parseCouponFromName('Ukendt produkt')).toBeNull();
  });
});

describe('parseLifetimeYears / parseUdloebsAar', () => {
  it('parses lifetime years', () => {
    expect(parseLifetimeYears('30 år')).toBe(30);
    expect(parseLifetimeYears('20 år')).toBe(20);
    expect(parseLifetimeYears(undefined)).toBeUndefined();
  });

  it('parses classic maturity year and udløb, ignores refinansiering', () => {
    expect(parseUdloebsAar('5% 2059 med afdrag')).toBe(2059);
    expect(parseUdloebsAar('Aktuel rente 3,0410%, loft 6%, udløb 01-10-2041')).toBe(2041);
    expect(parseUdloebsAar('Aktuel rente 2,5570%, refinansiering 01-07-2029')).toBeUndefined();
  });
});

describe('bidrag bands and indfrielse kurs', () => {
  it('picks static prisblad bands by flex/afdragsfri', () => {
    expect(pickBidragsSats(false, false)).toEqual(BIDRAG_FIXED_AFDRAG);
    expect(pickBidragsSats(false, true)).toEqual(BIDRAG_FIXED_AFDRAGSFRI);
    expect(pickBidragsSats(true, false)).toEqual(BIDRAG_FLEX_AFDRAG);
    expect(pickBidragsSats(true, true)).toEqual(BIDRAG_FLEX_AFDRAGSFRI);
  });

  it('uses cheaper of spot and redemption for indfrielse', () => {
    expect(
      resolveIndfrielseKurs({ redemptionRate: '100', spotPriceRateRedemption: '105,80' })
    ).toBe(100);
    expect(
      resolveIndfrielseKurs({ redemptionRate: '100', spotPriceRateRedemption: '97,53' })
    ).toBeCloseTo(97.53);
    expect(resolveIndfrielseKurs({ spotPriceRateRedemption: '100,75' })).toBeCloseTo(100.75);
    expect(resolveIndfrielseKurs({ redemptionRate: '100' })).toBe(100);
    expect(resolveIndfrielseKurs({})).toBeNull();
  });
});

describe('mapTotalkreditEntryToBondLoan', () => {
  it('maps optagelse fixed with afdragsfri flag and loebetid', () => {
    const loan = mapTotalkreditEntryToBondLoan(
      {
        name: '4% 2059 med op til 10 års afdragsfrihed',
        lifetime: '30 år',
        priceRate: '91,85',
        fondCode: '955302',
        isOpenForOffer: true,
        nasdaqUrl: 'https://example.com/bond',
      },
      { flex: false, kind: 'optagelse' }
    );
    expect(loan).not.toBeNull();
    expect(loan!.rente).toBe(4);
    expect(loan!.kurs).toBeCloseTo(91.85);
    expect(loan!.loebetid).toBe(30);
    expect(loan!.maxTerminer).toBe(120);
    expect(loan!.udloebsAar).toBe(2059);
    expect(loan!.afdragsfri).toBe(true);
    expect(loan!.flex).toBe(false);
    expect(loan!.bidragsSats).toEqual(BIDRAG_FIXED_AFDRAGSFRI);
    expect(loan!.fondCode).toBe('955302');
  });

  it('maps variabel optagelse as flex using expectedRate fallback', () => {
    const loan = mapTotalkreditEntryToBondLoan(
      {
        name: 'Variabel uden kupon i navn',
        lifetime: '30 år',
        priceRate: '100,21',
        expectedRate: '2,9548 %',
      },
      { flex: true, kind: 'optagelse' }
    );
    expect(loan).not.toBeNull();
    expect(loan!.flex).toBe(true);
    expect(loan!.rente).toBeCloseTo(2.9548);
    expect(loan!.kurs).toBeCloseTo(100.21);
    expect(loan!.bidragsSats).toEqual(BIDRAG_FLEX_AFDRAG);
  });

  it('drops empty/malformed rows', () => {
    expect(mapTotalkreditEntryToBondLoan({ name: '' }, { flex: false, kind: 'optagelse' })).toBeNull();
    expect(
      mapTotalkreditEntryToBondLoan(
        { name: '5% 2059 med afdrag', priceRate: '' },
        { flex: false, kind: 'optagelse' }
      )
    ).toBeNull();
    expect(
      mapTotalkreditEntryToBondLoan(
        { name: 'Ukendt', priceRate: '99,00' },
        { flex: false, kind: 'optagelse' }
      )
    ).toBeNull();
    expect(
      mapTotalkreditEntryToBondLoan(
        { name: '5% 2059', priceRate: '0' },
        { flex: false, kind: 'optagelse' }
      )
    ).toBeNull();
  });
});

describe('mapTotalkreditTableToBondLoans merge', () => {
  const fastTable: TotalkreditTableResponse = {
    lastUpdatedTimestamp: '2026-09-30T12:00:00',
    groups: [
      {
        name: 'Fast rente',
        entries: [
          {
            name: '5% 2059 med afdrag',
            lifetime: '30 år',
            priceRate: '99,32',
            fondCode: '955620',
          },
          { name: 'bad', priceRate: '' },
        ],
      },
    ],
  };

  const variabelTable: TotalkreditTableResponse = {
    lastUpdatedTimestamp: '2026-09-30T12:01:00',
    groups: [
      {
        name: 'F-kort',
        entries: [
          {
            name: 'Aktuel rente 2,5570%, refinansiering 01-07-2029',
            lifetime: '30 år',
            priceRate: '100,21',
            expectedRate: '2,9548 %',
            fondCode: '955469',
          },
        ],
      },
    ],
  };

  it('maps fast + variabel and marks flex correctly', () => {
    const merged = [
      ...mapTotalkreditTableToBondLoans(fastTable, { flex: false, kind: 'optagelse' }),
      ...mapTotalkreditTableToBondLoans(variabelTable, { flex: true, kind: 'optagelse' }),
    ];
    expect(merged).toHaveLength(2);
    expect(merged[0].name).toBe('5% 2059 med afdrag');
    expect(merged[0].flex).toBe(false);
    expect(merged[1].flex).toBe(true);
    expect(merged[1].rente).toBeCloseTo(2.557);
  });

  it('marks non-fast indfrielse groups as flex', () => {
    const ind: TotalkreditTableResponse = {
      groups: [
        {
          name: 'Fast rente',
          entries: [
            {
              name: '4% 2056 med afdrag',
              redemptionRate: '100',
              spotPriceRateRedemption: '99,85',
            },
          ],
        },
        {
          name: 'F-kort ',
          entries: [
            {
              name: 'Aktuel rente 2,5570%, refinansiering 01-07-2029',
              spotPriceRateRedemption: '100,75',
              expectedRate: '2,9548 %',
            },
          ],
        },
      ],
    };
    const loans = mapTotalkreditTableToBondLoans(ind, { kind: 'indfrielse' });
    expect(loans).toHaveLength(2);
    expect(loans[0].flex).toBe(false);
    expect(loans[0].kurs).toBeCloseTo(99.85);
    expect(loans[1].flex).toBe(true);
    expect(loans[1].kurs).toBeCloseTo(100.75);
  });
});

describe('fetchKurser Totalkredit integration (mocked fetch)', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('merges optagelse tables and returns live source', async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes(TOTALKREDIT_TABLE_IDS.optagelseFast)) {
        return new Response(
          JSON.stringify({
            lastUpdatedTimestamp: '2026-09-30T10:00:00',
            groups: [
              {
                name: 'Fast rente',
                entries: [
                  { name: '5% 2059 med afdrag', lifetime: '30 år', priceRate: '99,32' },
                ],
              },
            ],
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      }
      if (url.includes(TOTALKREDIT_TABLE_IDS.optagelseVariabel)) {
        return new Response(
          JSON.stringify({
            lastUpdatedTimestamp: '2026-09-30T10:01:00',
            groups: [
              {
                name: 'F-kort',
                entries: [
                  {
                    name: 'Aktuel rente 2,5570%, refinansiering 01-07-2029',
                    lifetime: '30 år',
                    priceRate: '100,21',
                  },
                ],
              },
            ],
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      }
      return new Response('not found', { status: 404 });
    });
    vi.stubGlobal('fetch', fetchMock);

    const res = await fetchKurser('optagelse');
    expect(res.source).toBe('live');
    expect(res.loans).toHaveLength(2);
    expect(res.loans.some((l) => l.flex)).toBe(true);
    expect(res.loans.some((l) => !l.flex)).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('falls back on network failure', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => {
      throw new Error('network down');
    }));
    const res = await fetchKurser('optagelse');
    expect(res.source).toBe('fallback');
    expect(res.timestamp).toBe(FALLBACK_RATES_AS_OF_LABEL);
    expect(res.loans).toBe(FALLBACK_OPTAGELSE_LAAN);
  });
});
