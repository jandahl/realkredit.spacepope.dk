import type { BondLoan } from '../calculator/types';

/** ISO date when the embedded snapshot rates were last captured / refreshed. */
export const FALLBACK_RATES_AS_OF = '2026-09-16';

/** Danish-locale label for Navbar when rateSource is fallback. */
export const FALLBACK_RATES_AS_OF_LABEL = '16.09.2026';

export const FALLBACK_OPTAGELSE_LAAN: BondLoan[] = [
  {
    "name": "4% 2059 med afdrag",
    "rente": 4.0,
    "loebetid": 30,
    "maxTerminer": 120,
    "kurs": 94.02,
    "flex": false,
    "afdragsfri": false,
    "bidragsSats": [
      0.0045,
      0.0085,
      0.012
    ],
    "bidrag": [
      0.0045,
      0.0085,
      0.012
    ],
    "isOpenForOffer": true,
    "fondCode": "955299",
    "nasdaqUrl": "https://www.nasdaq.com/da/european-market-activity/mortgage-bonds/4NYK01EA59"
  },
  {
    "name": "1% 2059 med afdrag",
    "rente": 1.0,
    "loebetid": 30,
    "maxTerminer": 120,
    "kurs": 64.7,
    "flex": false,
    "afdragsfri": false,
    "bidragsSats": [
      0.0045,
      0.0085,
      0.012
    ],
    "bidrag": [
      0.0045,
      0.0085,
      0.012
    ],
    "isOpenForOffer": true,
    "fondCode": "955345",
    "nasdaqUrl": "https://www.nasdaq.com/da/european-market-activity/mortgage-bonds/1NYK01EA59"
  },
  {
    "name": "4% 2059 med op til 10 års afdragsfrihed",
    "rente": 4.0,
    "loebetid": 30,
    "maxTerminer": 120,
    "kurs": 92.56,
    "flex": false,
    "afdragsfri": true,
    "bidragsSats": [
      0.0055,
      0.0115,
      0.02
    ],
    "bidrag": [
      0.0055,
      0.0115,
      0.02
    ],
    "isOpenForOffer": true,
    "fondCode": "955302",
    "nasdaqUrl": "https://www.nasdaq.com/da/european-market-activity/mortgage-bonds/4NYK01EDA59"
  },
  {
    "name": "4% 2059 med op til 30 års afdragsfrihed",
    "rente": 4.0,
    "loebetid": 30,
    "maxTerminer": 120,
    "kurs": 91.18,
    "flex": false,
    "afdragsfri": true,
    "bidragsSats": [
      0.0055,
      0.0115,
      0.02
    ],
    "bidrag": [
      0.0055,
      0.0115,
      0.02
    ],
    "isOpenForOffer": true,
    "fondCode": "955310",
    "nasdaqUrl": "https://www.nasdaq.com/da/european-market-activity/mortgage-bonds/4NYK01E30DA59"
  },
  {
    "name": "3,5% 2049 med afdrag",
    "rente": 3.5,
    "loebetid": 20,
    "maxTerminer": 80,
    "kurs": 92.83,
    "flex": false,
    "afdragsfri": false,
    "bidragsSats": [
      0.0045,
      0.0085,
      0.012
    ],
    "bidrag": [
      0.0045,
      0.0085,
      0.012
    ],
    "isOpenForOffer": true,
    "fondCode": "955353",
    "nasdaqUrl": "https://www.nasdaq.com/da/european-market-activity/mortgage-bonds/35NYK01EA49"
  },
  {
    "name": "2% 2039 med afdrag",
    "rente": 2.0,
    "loebetid": 10,
    "maxTerminer": 40,
    "kurs": 92.7,
    "flex": false,
    "afdragsfri": false,
    "bidragsSats": [
      0.0045,
      0.0085,
      0.012
    ],
    "bidrag": [
      0.0045,
      0.0085,
      0.012
    ],
    "isOpenForOffer": true,
    "fondCode": "955361",
    "nasdaqUrl": "https://www.nasdaq.com/da/european-market-activity/mortgage-bonds/2NYK01EA39"
  },
  {
    "name": "F-kort med op til 10 års afdragsfri",
    "rente": 2.557,
    "loebetid": 30,
    "kurs": 100.3,
    "flex": true,
    "afdragsfri": true,
    "bidrag": [
      0.006,
      0.0135,
      0.0235
    ],
    "bidragsSats": [
      0.006,
      0.0135,
      0.0235
    ],
    "isOpenForOffer": true,
    "fondCode": "fkortafdragsfri"
  },
  {
    "name": "F-kort med afdrag",
    "rente": 2.557,
    "loebetid": 30,
    "kurs": 100.3,
    "flex": true,
    "afdragsfri": false,
    "bidrag": [
      0.005,
      0.0105,
      0.0155
    ],
    "bidragsSats": [
      0.005,
      0.0105,
      0.0155
    ],
    "isOpenForOffer": true,
    "fondCode": "fkort"
  }
];

export const FALLBACK_INDFRIELSE_LAAN: BondLoan[] = [
  {
    "name": "7% 2041 med afdrag",
    "rente": 7.0,
    "udloebsAar": 2041,
    "kurs": 100.0,
    "flex": false,
    "afdragsfri": false,
    "bidragsSats": [
      0.0045,
      0.0085,
      0.012
    ],
    "bidrag": [
      0.0045,
      0.0085,
      0.012
    ],
    "isOpenForOffer": true,
    "fondCode": "977233",
    "nasdaqUrl": "https://www.nasdaq.com/da/european-market-activity/mortgage-bonds/7NYKE A41?id=XCSE7NYKE_A41"
  },
  {
    "name": "6% 2041 med afdrag",
    "rente": 6.0,
    "udloebsAar": 2041,
    "kurs": 100.0,
    "flex": false,
    "afdragsfri": false,
    "bidragsSats": [
      0.0045,
      0.0085,
      0.012
    ],
    "bidrag": [
      0.0045,
      0.0085,
      0.012
    ],
    "isOpenForOffer": true,
    "fondCode": "976989",
    "nasdaqUrl": "https://www.nasdaq.com/da/european-market-activity/mortgage-bonds/6NYK01EA 41?id=XCSE6NYK01EA_41"
  },
  {
    "name": "6% 2053 med afdrag",
    "rente": 6.0,
    "udloebsAar": 2053,
    "kurs": 100.0,
    "flex": false,
    "afdragsfri": false,
    "bidragsSats": [
      0.0045,
      0.0085,
      0.012
    ],
    "bidrag": [
      0.0045,
      0.0085,
      0.012
    ],
    "isOpenForOffer": true,
    "fondCode": "954012",
    "nasdaqUrl": "https://www.nasdaq.com/da/european-market-activity/mortgage-bonds/6NYK01EA53?id=XCSE6NYK01EA53"
  },
  {
    "name": "5% 2056 med afdrag",
    "rente": 5.0,
    "udloebsAar": 2056,
    "kurs": 100.0,
    "flex": false,
    "afdragsfri": false,
    "bidragsSats": [
      0.0045,
      0.0085,
      0.012
    ],
    "bidrag": [
      0.0045,
      0.0085,
      0.012
    ],
    "isOpenForOffer": true,
    "fondCode": "954098",
    "nasdaqUrl": "https://www.nasdaq.com/da/european-market-activity/mortgage-bonds/5NYK01EA56?id=XCSE5NYK01EA56"
  },
  {
    "name": "5% 2041 med afdrag",
    "rente": 5.0,
    "udloebsAar": 2041,
    "kurs": 100.0,
    "flex": false,
    "afdragsfri": false,
    "bidragsSats": [
      0.0045,
      0.0085,
      0.012
    ],
    "bidrag": [
      0.0045,
      0.0085,
      0.012
    ],
    "isOpenForOffer": true,
    "fondCode": "976970",
    "nasdaqUrl": "https://www.nasdaq.com/da/european-market-activity/mortgage-bonds/5NYK01E A41?id=XCSE5NYK01E_A41"
  },
  {
    "name": "5% 2053 med afdrag",
    "rente": 5.0,
    "udloebsAar": 2053,
    "kurs": 100.0,
    "flex": false,
    "afdragsfri": false,
    "bidragsSats": [
      0.0045,
      0.0085,
      0.012
    ],
    "bidrag": [
      0.0045,
      0.0085,
      0.012
    ],
    "isOpenForOffer": true,
    "fondCode": "953911",
    "nasdaqUrl": "https://www.nasdaq.com/da/european-market-activity/mortgage-bonds/5NYK01EA53?id=XCSE5NYK01EA53"
  },
  {
    "name": "4% 2053 med afdrag",
    "rente": 4.0,
    "udloebsAar": 2053,
    "kurs": 100.0,
    "flex": false,
    "afdragsfri": false,
    "bidragsSats": [
      0.0045,
      0.0085,
      0.012
    ],
    "bidrag": [
      0.0045,
      0.0085,
      0.012
    ],
    "isOpenForOffer": true,
    "fondCode": "953741",
    "nasdaqUrl": "https://www.nasdaq.com/da/european-market-activity/mortgage-bonds/4NYK01EA53?id=XCSE4NYK01EA53"
  },
  {
    "name": "4% 2044 med afdrag",
    "rente": 4.0,
    "udloebsAar": 2044,
    "kurs": 100.0,
    "flex": false,
    "afdragsfri": false,
    "bidragsSats": [
      0.0045,
      0.0085,
      0.012
    ],
    "bidrag": [
      0.0045,
      0.0085,
      0.012
    ],
    "isOpenForOffer": true,
    "fondCode": "977985",
    "nasdaqUrl": "https://www.nasdaq.com/da/european-market-activity/mortgage-bonds/4NYKE A44 44?id=XCSE4NYKE_A44_44"
  },
  {
    "name": "4% 2041 med afdrag",
    "rente": 4.0,
    "udloebsAar": 2041,
    "kurs": 100.0,
    "flex": false,
    "afdragsfri": false,
    "bidragsSats": [
      0.0045,
      0.0085,
      0.012
    ],
    "bidrag": [
      0.0045,
      0.0085,
      0.012
    ],
    "isOpenForOffer": true,
    "fondCode": "977535",
    "nasdaqUrl": "https://www.nasdaq.com/da/european-market-activity/mortgage-bonds/4NYKE A41?id=XCSE4NYKE_A41"
  },
  {
    "name": "4% 2056 med afdrag",
    "rente": 4.0,
    "udloebsAar": 2056,
    "kurs": 99.85,
    "flex": false,
    "afdragsfri": false,
    "bidragsSats": [
      0.0045,
      0.0085,
      0.012
    ],
    "bidrag": [
      0.0045,
      0.0085,
      0.012
    ],
    "isOpenForOffer": true,
    "fondCode": "954187",
    "nasdaqUrl": "https://www.nasdaq.com/da/european-market-activity/mortgage-bonds/4NYK01EA56?id=XCSE4NYK01EA56"
  },
  {
    "name": "3,5% 2053 med afdrag",
    "rente": 3.5,
    "udloebsAar": 2053,
    "kurs": 97.53,
    "flex": false,
    "afdragsfri": false,
    "bidragsSats": [
      0.0045,
      0.0085,
      0.012
    ],
    "bidrag": [
      0.0045,
      0.0085,
      0.012
    ],
    "isOpenForOffer": true,
    "fondCode": "953709",
    "nasdaqUrl": "https://www.nasdaq.com/da/european-market-activity/mortgage-bonds/35NYK01EA53?id=XCSE35NYK01EA53"
  },
  {
    "name": "3,5% 2044 med afdrag",
    "rente": 3.5,
    "udloebsAar": 2044,
    "kurs": 100.0,
    "flex": false,
    "afdragsfri": false,
    "bidragsSats": [
      0.0045,
      0.0085,
      0.012
    ],
    "bidrag": [
      0.0045,
      0.0085,
      0.012
    ],
    "isOpenForOffer": true,
    "fondCode": "978736",
    "nasdaqUrl": "https://www.nasdaq.com/da/european-market-activity/mortgage-bonds/3,5NYKE A44?id=XCSE3_5NYKE_A44"
  },
  {
    "name": "3,5% 2047 med afdrag",
    "rente": 3.5,
    "udloebsAar": 2047,
    "kurs": 100.0,
    "flex": false,
    "afdragsfri": false,
    "bidragsSats": [
      0.0045,
      0.0085,
      0.012
    ],
    "bidrag": [
      0.0045,
      0.0085,
      0.012
    ],
    "isOpenForOffer": true,
    "fondCode": "950823",
    "nasdaqUrl": "https://www.nasdaq.com/da/european-market-activity/mortgage-bonds/35NYK01EA47?id=XCSE35NYK01EA47"
  },
  {
    "name": "3,5% 2056 med afdrag",
    "rente": 3.5,
    "udloebsAar": 2056,
    "kurs": 96.47,
    "flex": false,
    "afdragsfri": false,
    "bidragsSats": [
      0.0045,
      0.0085,
      0.012
    ],
    "bidrag": [
      0.0045,
      0.0085,
      0.012
    ],
    "isOpenForOffer": true,
    "fondCode": "954837",
    "nasdaqUrl": "https://www.nasdaq.com/da/european-market-activity/mortgage-bonds/35NYK01A56?id=XCSE35NYK01A56"
  },
  {
    "name": "3% 2053 med afdrag",
    "rente": 3.0,
    "udloebsAar": 2053,
    "kurs": 94.35,
    "flex": false,
    "afdragsfri": false,
    "bidragsSats": [
      0.0045,
      0.0085,
      0.012
    ],
    "bidrag": [
      0.0045,
      0.0085,
      0.012
    ],
    "isOpenForOffer": true,
    "fondCode": "953547",
    "nasdaqUrl": "https://www.nasdaq.com/da/european-market-activity/mortgage-bonds/3NYK01EA53?id=XCSE3NYK01EA53"
  },
  {
    "name": "3% 2047 med afdrag",
    "rente": 3.0,
    "udloebsAar": 2047,
    "kurs": 98.67,
    "flex": false,
    "afdragsfri": false,
    "bidragsSats": [
      0.0045,
      0.0085,
      0.012
    ],
    "bidrag": [
      0.0045,
      0.0085,
      0.012
    ],
    "isOpenForOffer": true,
    "fondCode": "979546",
    "nasdaqUrl": "https://www.nasdaq.com/da/european-market-activity/mortgage-bonds/3NYK01E A47?id=XCSE3NYK01E_A47"
  },
  {
    "name": "3% 2044 med afdrag",
    "rente": 3.0,
    "udloebsAar": 2044,
    "kurs": 100.0,
    "flex": false,
    "afdragsfri": false,
    "bidragsSats": [
      0.0045,
      0.0085,
      0.012
    ],
    "bidrag": [
      0.0045,
      0.0085,
      0.012
    ],
    "isOpenForOffer": true,
    "fondCode": "978949",
    "nasdaqUrl": "https://www.nasdaq.com/da/european-market-activity/mortgage-bonds/3NYKE A44?id=XCSE3NYKE_A44"
  },
  {
    "name": "2,5% 2047 med afdrag",
    "rente": 2.5,
    "udloebsAar": 2047,
    "kurs": 93.66,
    "flex": false,
    "afdragsfri": false,
    "bidragsSats": [
      0.0045,
      0.0085,
      0.012
    ],
    "bidrag": [
      0.0045,
      0.0085,
      0.012
    ],
    "isOpenForOffer": true,
    "fondCode": "979880",
    "nasdaqUrl": "https://www.nasdaq.com/da/european-market-activity/mortgage-bonds/25NYK01EA47?id=XCSE25NYK01EA47"
  },
  {
    "name": "2,5% 2053 med afdrag",
    "rente": 2.5,
    "udloebsAar": 2053,
    "kurs": 90.41,
    "flex": false,
    "afdragsfri": false,
    "bidragsSats": [
      0.0045,
      0.0085,
      0.012
    ],
    "bidrag": [
      0.0045,
      0.0085,
      0.012
    ],
    "isOpenForOffer": true,
    "fondCode": "953512",
    "nasdaqUrl": "https://www.nasdaq.com/da/european-market-activity/mortgage-bonds/25NYK01EA53?id=XCSE25NYK01EA53"
  },
  {
    "name": "2% 2053 med afdrag",
    "rente": 2.0,
    "udloebsAar": 2053,
    "kurs": 86.43,
    "flex": false,
    "afdragsfri": false,
    "bidragsSats": [
      0.0045,
      0.0085,
      0.012
    ],
    "bidrag": [
      0.0045,
      0.0085,
      0.012
    ],
    "isOpenForOffer": true,
    "fondCode": "952850",
    "nasdaqUrl": "https://www.nasdaq.com/da/european-market-activity/mortgage-bonds/2NYK01EA53?id=XCSE2NYK01EA53"
  },
  {
    "name": "2% 2047 med afdrag",
    "rente": 2.0,
    "udloebsAar": 2047,
    "kurs": 89.37,
    "flex": false,
    "afdragsfri": false,
    "bidragsSats": [
      0.0045,
      0.0085,
      0.012
    ],
    "bidrag": [
      0.0045,
      0.0085,
      0.012
    ],
    "isOpenForOffer": true,
    "fondCode": "950416",
    "nasdaqUrl": "https://www.nasdaq.com/da/european-market-activity/mortgage-bonds/2NYK01EA47?id=XCSE2NYK01EA47"
  },
  {
    "name": "2% 2050 med afdrag",
    "rente": 2.0,
    "udloebsAar": 2050,
    "kurs": 88.12,
    "flex": false,
    "afdragsfri": false,
    "bidragsSats": [
      0.0045,
      0.0085,
      0.012
    ],
    "bidrag": [
      0.0045,
      0.0085,
      0.012
    ],
    "isOpenForOffer": true,
    "fondCode": "951358",
    "nasdaqUrl": "https://www.nasdaq.com/da/european-market-activity/mortgage-bonds/2NYK01EA50?id=XCSE2NYK01EA50"
  },
  {
    "name": "1,5% 2050 med afdrag",
    "rente": 1.5,
    "udloebsAar": 2050,
    "kurs": 83.24,
    "flex": false,
    "afdragsfri": false,
    "bidragsSats": [
      0.0045,
      0.0085,
      0.012
    ],
    "bidrag": [
      0.0045,
      0.0085,
      0.012
    ],
    "isOpenForOffer": true,
    "fondCode": "951315",
    "nasdaqUrl": "https://www.nasdaq.com/da/european-market-activity/mortgage-bonds/1,5NYK01EA50?id=XCSE1_5NYK01EA50"
  },
  {
    "name": "1,5% 2053 med afdrag",
    "rente": 1.5,
    "udloebsAar": 2053,
    "kurs": 81.64,
    "flex": false,
    "afdragsfri": false,
    "bidragsSats": [
      0.0045,
      0.0085,
      0.012
    ],
    "bidrag": [
      0.0045,
      0.0085,
      0.012
    ],
    "isOpenForOffer": true,
    "fondCode": "952761",
    "nasdaqUrl": "https://www.nasdaq.com/da/european-market-activity/mortgage-bonds/15NYK01EA53?id=XCSE15NYK01EA53"
  },
  {
    "name": "1,5% 2047 med afdrag",
    "rente": 1.5,
    "udloebsAar": 2047,
    "kurs": 86.35,
    "flex": false,
    "afdragsfri": false,
    "bidragsSats": [
      0.0045,
      0.0085,
      0.012
    ],
    "bidrag": [
      0.0045,
      0.0085,
      0.012
    ],
    "isOpenForOffer": true,
    "fondCode": "950602",
    "nasdaqUrl": "https://www.nasdaq.com/da/european-market-activity/mortgage-bonds/1,5NYK01EA47?id=XCSE1_5NYK01EA47"
  },
  {
    "name": "1% 2053 med afdrag",
    "rente": 1.0,
    "udloebsAar": 2053,
    "kurs": 78.55,
    "flex": false,
    "afdragsfri": false,
    "bidragsSats": [
      0.0045,
      0.0085,
      0.012
    ],
    "bidrag": [
      0.0045,
      0.0085,
      0.012
    ],
    "isOpenForOffer": true,
    "fondCode": "952729",
    "nasdaqUrl": "https://www.nasdaq.com/da/european-market-activity/mortgage-bonds/1NYK01EA53?id=XCSE1NYK01EA53"
  },
  {
    "name": "1% 2050 med afdrag",
    "rente": 1.0,
    "udloebsAar": 2050,
    "kurs": 78.74,
    "flex": false,
    "afdragsfri": false,
    "bidragsSats": [
      0.0045,
      0.0085,
      0.012
    ],
    "bidrag": [
      0.0045,
      0.0085,
      0.012
    ],
    "isOpenForOffer": true,
    "fondCode": "952281",
    "nasdaqUrl": "https://www.nasdaq.com/da/european-market-activity/mortgage-bonds/1NYK01EA50?id=XCSE1NYK01EA50"
  },
  {
    "name": "1% 2056 med afdrag",
    "rente": 1.0,
    "udloebsAar": 2056,
    "kurs": 70.98,
    "flex": false,
    "afdragsfri": false,
    "bidragsSats": [
      0.0045,
      0.0085,
      0.012
    ],
    "bidrag": [
      0.0045,
      0.0085,
      0.012
    ],
    "isOpenForOffer": true,
    "fondCode": "954470",
    "nasdaqUrl": "https://www.nasdaq.com/da/european-market-activity/mortgage-bonds/1NYK01EA56?id=XCSE1NYK01EA56"
  },
  {
    "name": "0,5% 2050 med afdrag",
    "rente": 0.5,
    "udloebsAar": 2050,
    "kurs": 74.18,
    "flex": false,
    "afdragsfri": false,
    "bidragsSats": [
      0.0045,
      0.0085,
      0.012
    ],
    "bidrag": [
      0.0045,
      0.0085,
      0.012
    ],
    "isOpenForOffer": true,
    "fondCode": "952508",
    "nasdaqUrl": "https://www.nasdaq.com/da/european-market-activity/mortgage-bonds/0,5NYK01EA50?id=XCSE0_5NYK01EA50"
  },
  {
    "name": "0,5% 2053 med afdrag",
    "rente": 0.5,
    "udloebsAar": 2053,
    "kurs": 72.05,
    "flex": false,
    "afdragsfri": false,
    "bidragsSats": [
      0.0045,
      0.0085,
      0.012
    ],
    "bidrag": [
      0.0045,
      0.0085,
      0.012
    ],
    "isOpenForOffer": true,
    "fondCode": "953024",
    "nasdaqUrl": "https://www.nasdaq.com/da/european-market-activity/mortgage-bonds/05NYK01EA53?id=XCSE05NYK01EA53"
  },
  {
    "name": "7% 2041 med op til 10 års afdragsfrihed",
    "rente": 7.0,
    "udloebsAar": 2041,
    "kurs": 100.0,
    "flex": false,
    "afdragsfri": true,
    "bidragsSats": [
      0.0055,
      0.0115,
      0.02
    ],
    "bidrag": [
      0.0055,
      0.0115,
      0.02
    ],
    "isOpenForOffer": true,
    "fondCode": "977241",
    "nasdaqUrl": "https://www.nasdaq.com/da/european-market-activity/mortgage-bonds/7NYKE DA41?id=XCSE7NYKE_DA41"
  },
  {
    "name": "6% 2041 med op til 10 års afdragsfrihed",
    "rente": 6.0,
    "udloebsAar": 2041,
    "kurs": 100.0,
    "flex": false,
    "afdragsfri": true,
    "bidragsSats": [
      0.0055,
      0.0115,
      0.02
    ],
    "bidrag": [
      0.0055,
      0.0115,
      0.02
    ],
    "isOpenForOffer": true,
    "fondCode": "977020",
    "nasdaqUrl": "https://www.nasdaq.com/da/european-market-activity/mortgage-bonds/6NYK01EDA 41?id=XCSE6NYK01EDA_41"
  },
  {
    "name": "6% 2053 med op til 10 års afdragsfrihed",
    "rente": 6.0,
    "udloebsAar": 2053,
    "kurs": 100.0,
    "flex": false,
    "afdragsfri": true,
    "bidragsSats": [
      0.0055,
      0.0115,
      0.02
    ],
    "bidrag": [
      0.0055,
      0.0115,
      0.02
    ],
    "isOpenForOffer": true,
    "fondCode": "954047",
    "nasdaqUrl": "https://www.nasdaq.com/da/european-market-activity/mortgage-bonds/6NYK01EDA53?id=XCSE6NYK01EDA53"
  },
  {
    "name": "5% 2053 med op til 10 års afdragsfrihed",
    "rente": 5.0,
    "udloebsAar": 2053,
    "kurs": 100.0,
    "flex": false,
    "afdragsfri": true,
    "bidragsSats": [
      0.0055,
      0.0115,
      0.02
    ],
    "bidrag": [
      0.0055,
      0.0115,
      0.02
    ],
    "isOpenForOffer": true,
    "fondCode": "953938",
    "nasdaqUrl": "https://www.nasdaq.com/da/european-market-activity/mortgage-bonds/5NYK01EDA53?id=XCSE5NYK01EDA53"
  },
  {
    "name": "5% 2041 med op til 10 års afdragsfrihed",
    "rente": 5.0,
    "udloebsAar": 2041,
    "kurs": 100.0,
    "flex": false,
    "afdragsfri": true,
    "bidragsSats": [
      0.0055,
      0.0115,
      0.02
    ],
    "bidrag": [
      0.0055,
      0.0115,
      0.02
    ],
    "isOpenForOffer": true,
    "fondCode": "977012",
    "nasdaqUrl": "https://www.nasdaq.com/da/european-market-activity/mortgage-bonds/5NYK01EDA 41?id=XCSE5NYK01EDA_41"
  },
  {
    "name": "5% 2056 med op til 10 års afdragsfrihed",
    "rente": 5.0,
    "udloebsAar": 2056,
    "kurs": 100.0,
    "flex": false,
    "afdragsfri": true,
    "bidragsSats": [
      0.0055,
      0.0115,
      0.02
    ],
    "bidrag": [
      0.0055,
      0.0115,
      0.02
    ],
    "isOpenForOffer": true,
    "fondCode": "954101",
    "nasdaqUrl": "https://www.nasdaq.com/da/european-market-activity/mortgage-bonds/5NYK01EDA56?id=XCSE5NYK01EDA56"
  },
  {
    "name": "4% 2053 med op til 10 års afdragsfrihed",
    "rente": 4.0,
    "udloebsAar": 2053,
    "kurs": 99.89,
    "flex": false,
    "afdragsfri": true,
    "bidragsSats": [
      0.0055,
      0.0115,
      0.02
    ],
    "bidrag": [
      0.0055,
      0.0115,
      0.02
    ],
    "isOpenForOffer": true,
    "fondCode": "953768",
    "nasdaqUrl": "https://www.nasdaq.com/da/european-market-activity/mortgage-bonds/4NYK01EDA53?id=XCSE4NYK01EDA53"
  },
  {
    "name": "4% 2041 med op til 10 års afdragsfrihed",
    "rente": 4.0,
    "udloebsAar": 2041,
    "kurs": 100.0,
    "flex": false,
    "afdragsfri": true,
    "bidragsSats": [
      0.0055,
      0.0115,
      0.02
    ],
    "bidrag": [
      0.0055,
      0.0115,
      0.02
    ],
    "isOpenForOffer": true,
    "fondCode": "977772",
    "nasdaqUrl": "https://www.nasdaq.com/da/european-market-activity/mortgage-bonds/4NYK01EDA 41?id=XCSE4NYK01EDA_41"
  },
  {
    "name": "4% 2044 med op til 10 års afdragsfrihed",
    "rente": 4.0,
    "udloebsAar": 2044,
    "kurs": 100.0,
    "flex": false,
    "afdragsfri": true,
    "bidragsSats": [
      0.0055,
      0.0115,
      0.02
    ],
    "bidrag": [
      0.0055,
      0.0115,
      0.02
    ],
    "isOpenForOffer": true,
    "fondCode": "977993",
    "nasdaqUrl": "https://www.nasdaq.com/da/european-market-activity/mortgage-bonds/4NYKE DA44?id=XCSE4NYKE_DA44"
  },
  {
    "name": "4% 2056 med op til 10 års afdragsfrihed",
    "rente": 4.0,
    "udloebsAar": 2056,
    "kurs": 99.0,
    "flex": false,
    "afdragsfri": true,
    "bidragsSats": [
      0.0055,
      0.0115,
      0.02
    ],
    "bidrag": [
      0.0055,
      0.0115,
      0.02
    ],
    "isOpenForOffer": true,
    "fondCode": "954195",
    "nasdaqUrl": "https://www.nasdaq.com/da/european-market-activity/mortgage-bonds/4NYK01EDA56?id=XCSE4NYK01EDA56"
  },
  {
    "name": "3,5% 2053 med op til 10 års afdragsfrihed",
    "rente": 3.5,
    "udloebsAar": 2053,
    "kurs": 97.07,
    "flex": false,
    "afdragsfri": true,
    "bidragsSats": [
      0.0055,
      0.0115,
      0.02
    ],
    "bidrag": [
      0.0055,
      0.0115,
      0.02
    ],
    "isOpenForOffer": true,
    "fondCode": "953695",
    "nasdaqUrl": "https://www.nasdaq.com/da/european-market-activity/mortgage-bonds/35NYK01EDA53?id=XCSE35NYK01EDA53"
  },
  {
    "name": "3,5% 2044 med op til 10 års afdragsfrihed",
    "rente": 3.5,
    "udloebsAar": 2044,
    "kurs": 100.0,
    "flex": false,
    "afdragsfri": true,
    "bidragsSats": [
      0.0055,
      0.0115,
      0.02
    ],
    "bidrag": [
      0.0055,
      0.0115,
      0.02
    ],
    "isOpenForOffer": true,
    "fondCode": "978744",
    "nasdaqUrl": "https://www.nasdaq.com/da/european-market-activity/mortgage-bonds/3 5NYKE DA44?id=XCSE3_5NYKE_DA44"
  },
  {
    "name": "3,5% 2047 med op til 10 års afdragsfrihed",
    "rente": 3.5,
    "udloebsAar": 2047,
    "kurs": 100.0,
    "flex": false,
    "afdragsfri": true,
    "bidragsSats": [
      0.0055,
      0.0115,
      0.02
    ],
    "bidrag": [
      0.0055,
      0.0115,
      0.02
    ],
    "isOpenForOffer": true,
    "fondCode": "979589",
    "nasdaqUrl": "https://www.nasdaq.com/da/european-market-activity/mortgage-bonds/35NYK01EDA47?id=XCSE35NYK01EDA47"
  },
  {
    "name": "3,5% 2056 med op til 10 års afdragsfrihed",
    "rente": 3.5,
    "udloebsAar": 2056,
    "kurs": 95.37,
    "flex": false,
    "afdragsfri": true,
    "bidragsSats": [
      0.0055,
      0.0115,
      0.02
    ],
    "bidrag": [
      0.0055,
      0.0115,
      0.02
    ],
    "isOpenForOffer": true,
    "fondCode": "954977",
    "nasdaqUrl": "https://www.nasdaq.com/da/european-market-activity/mortgage-bonds/35NYK01EDA56?id=XCSE35NYK01EDA56"
  },
  {
    "name": "3% 2053 med op til 10 års afdragsfrihed",
    "rente": 3.0,
    "udloebsAar": 2053,
    "kurs": 93.09,
    "flex": false,
    "afdragsfri": true,
    "bidragsSats": [
      0.0055,
      0.0115,
      0.02
    ],
    "bidrag": [
      0.0055,
      0.0115,
      0.02
    ],
    "isOpenForOffer": true,
    "fondCode": "953539",
    "nasdaqUrl": "https://www.nasdaq.com/da/european-market-activity/mortgage-bonds/3NYK01EDA53?id=XCSE3NYK01EDA53"
  },
  {
    "name": "3% 2047 med op til 10 års afdragsfrihed",
    "rente": 3.0,
    "udloebsAar": 2047,
    "kurs": 98.62,
    "flex": false,
    "afdragsfri": true,
    "bidragsSats": [
      0.0055,
      0.0115,
      0.02
    ],
    "bidrag": [
      0.0055,
      0.0115,
      0.02
    ],
    "isOpenForOffer": true,
    "fondCode": "979570",
    "nasdaqUrl": "https://www.nasdaq.com/da/european-market-activity/mortgage-bonds/3NYK01E DA47?id=XCSE3NYK01E_DA47"
  },
  {
    "name": "3% 2044 med op til 10 års afdragsfrihed",
    "rente": 3.0,
    "udloebsAar": 2044,
    "kurs": 99.95,
    "flex": false,
    "afdragsfri": true,
    "bidragsSats": [
      0.0055,
      0.0115,
      0.02
    ],
    "bidrag": [
      0.0055,
      0.0115,
      0.02
    ],
    "isOpenForOffer": true,
    "fondCode": "978957",
    "nasdaqUrl": "https://www.nasdaq.com/da/european-market-activity/mortgage-bonds/3NYKE DA44?id=XCSE3NYKE_DA44"
  },
  {
    "name": "2,5% 2047 med op til 10 års afdragsfrihed",
    "rente": 2.5,
    "udloebsAar": 2047,
    "kurs": 93.06,
    "flex": false,
    "afdragsfri": true,
    "bidragsSats": [
      0.0055,
      0.0115,
      0.02
    ],
    "bidrag": [
      0.0055,
      0.0115,
      0.02
    ],
    "isOpenForOffer": true,
    "fondCode": "979899",
    "nasdaqUrl": "https://www.nasdaq.com/da/european-market-activity/mortgage-bonds/25NYK01EDA47?id=XCSE25NYK01EDA47"
  },
  {
    "name": "2,5% 2050 med op til 10 års afdragsfrihed",
    "rente": 2.5,
    "udloebsAar": 2050,
    "kurs": 93.03,
    "flex": false,
    "afdragsfri": true,
    "bidragsSats": [
      0.0055,
      0.0115,
      0.02
    ],
    "bidrag": [
      0.0055,
      0.0115,
      0.02
    ],
    "isOpenForOffer": true,
    "fondCode": "951366",
    "nasdaqUrl": "https://www.nasdaq.com/da/european-market-activity/mortgage-bonds/25NYK01EDA50?id=XCSE25NYK01EDA50"
  },
  {
    "name": "2,5% 2053 med op til 10 års afdragsfrihed",
    "rente": 2.5,
    "udloebsAar": 2053,
    "kurs": 88.34,
    "flex": false,
    "afdragsfri": true,
    "bidragsSats": [
      0.0055,
      0.0115,
      0.02
    ],
    "bidrag": [
      0.0055,
      0.0115,
      0.02
    ],
    "isOpenForOffer": true,
    "fondCode": "953490",
    "nasdaqUrl": "https://www.nasdaq.com/da/european-market-activity/mortgage-bonds/25NYK01EDA53?id=XCSE25NYK01EDA53"
  },
  {
    "name": "2% 2053 med op til 10 års afdragsfrihed",
    "rente": 2.0,
    "udloebsAar": 2053,
    "kurs": 84.13,
    "flex": false,
    "afdragsfri": true,
    "bidragsSats": [
      0.0055,
      0.0115,
      0.02
    ],
    "bidrag": [
      0.0055,
      0.0115,
      0.02
    ],
    "isOpenForOffer": true,
    "fondCode": "952869",
    "nasdaqUrl": "https://www.nasdaq.com/da/european-market-activity/mortgage-bonds/2NYK01EDA53?id=XCSE2NYK01EDA53"
  },
  {
    "name": "2% 2050 med op til 10 års afdragsfrihed",
    "rente": 2.0,
    "udloebsAar": 2050,
    "kurs": 86.59,
    "flex": false,
    "afdragsfri": true,
    "bidragsSats": [
      0.0055,
      0.0115,
      0.02
    ],
    "bidrag": [
      0.0055,
      0.0115,
      0.02
    ],
    "isOpenForOffer": true,
    "fondCode": "951587",
    "nasdaqUrl": "https://www.nasdaq.com/da/european-market-activity/mortgage-bonds/2NYK01EDA50?id=XCSE2NYK01EDA50"
  },
  {
    "name": "2% 2047 med op til 10 års afdragsfrihed",
    "rente": 2.0,
    "udloebsAar": 2047,
    "kurs": 89.18,
    "flex": false,
    "afdragsfri": true,
    "bidragsSats": [
      0.0055,
      0.0115,
      0.02
    ],
    "bidrag": [
      0.0055,
      0.0115,
      0.02
    ],
    "isOpenForOffer": true,
    "fondCode": "950475",
    "nasdaqUrl": "https://www.nasdaq.com/da/european-market-activity/mortgage-bonds/2NYK01EDA47?id=XCSE2NYK01EDA47"
  },
  {
    "name": "1,5% 2050 med op til 10 års afdragsfrihed",
    "rente": 1.5,
    "udloebsAar": 2050,
    "kurs": 81.0,
    "flex": false,
    "afdragsfri": true,
    "bidragsSats": [
      0.0055,
      0.0115,
      0.02
    ],
    "bidrag": [
      0.0055,
      0.0115,
      0.02
    ],
    "isOpenForOffer": true,
    "fondCode": "952125",
    "nasdaqUrl": "https://www.nasdaq.com/da/european-market-activity/mortgage-bonds/1,5NYK01EDA50?id=XCSE1_5NYK01EDA50"
  },
  {
    "name": "1,5% 2053 med op til 10 års afdragsfrihed",
    "rente": 1.5,
    "udloebsAar": 2053,
    "kurs": 79.13,
    "flex": false,
    "afdragsfri": true,
    "bidragsSats": [
      0.0055,
      0.0115,
      0.02
    ],
    "bidrag": [
      0.0055,
      0.0115,
      0.02
    ],
    "isOpenForOffer": true,
    "fondCode": "952842",
    "nasdaqUrl": "https://www.nasdaq.com/da/european-market-activity/mortgage-bonds/15NYK01EDA53?id=XCSE15NYK01EDA53"
  },
  {
    "name": "1% 2050 med op til 10 års afdragsfrihed",
    "rente": 1.0,
    "udloebsAar": 2050,
    "kurs": 79.21,
    "flex": false,
    "afdragsfri": true,
    "bidragsSats": [
      0.0055,
      0.0115,
      0.02
    ],
    "bidrag": [
      0.0055,
      0.0115,
      0.02
    ],
    "isOpenForOffer": true,
    "fondCode": "952443",
    "nasdaqUrl": "https://www.nasdaq.com/da/european-market-activity/mortgage-bonds/1NYK01EDA50?id=XCSE1NYK01EDA50"
  },
  {
    "name": "1% 2053 med op til 10 års afdragsfrihed",
    "rente": 1.0,
    "udloebsAar": 2053,
    "kurs": 74.67,
    "flex": false,
    "afdragsfri": true,
    "bidragsSats": [
      0.0055,
      0.0115,
      0.02
    ],
    "bidrag": [
      0.0055,
      0.0115,
      0.02
    ],
    "isOpenForOffer": true,
    "fondCode": "952737",
    "nasdaqUrl": "https://www.nasdaq.com/da/european-market-activity/mortgage-bonds/1NYK01EDA53?id=XCSE1NYK01EDA53"
  },
  {
    "name": "0,5% 2050 med op til 10 års afdragsfrihed",
    "rente": 0.5,
    "udloebsAar": 2050,
    "kurs": 69.67,
    "flex": false,
    "afdragsfri": true,
    "bidragsSats": [
      0.0055,
      0.0115,
      0.02
    ],
    "bidrag": [
      0.0055,
      0.0115,
      0.02
    ],
    "isOpenForOffer": true,
    "fondCode": "952532",
    "nasdaqUrl": "https://www.nasdaq.com/da/european-market-activity/mortgage-bonds/0,5NYK01EDA50?id=XCSE0_5NYK01EDA50"
  },
  {
    "name": "0,5% 2053 med op til 10 års afdragsfrihed",
    "rente": 0.5,
    "udloebsAar": 2053,
    "kurs": 67.48,
    "flex": false,
    "afdragsfri": true,
    "bidragsSats": [
      0.0055,
      0.0115,
      0.02
    ],
    "bidrag": [
      0.0055,
      0.0115,
      0.02
    ],
    "isOpenForOffer": true,
    "fondCode": "953091",
    "nasdaqUrl": "https://www.nasdaq.com/da/european-market-activity/mortgage-bonds/0,5NYK01EDA53?id=XCSE0_5NYK01EDA53"
  },
  {
    "name": "5% 2053 med op til 30 års afdragsfrihed",
    "rente": 5.0,
    "udloebsAar": 2053,
    "kurs": 100.0,
    "flex": false,
    "afdragsfri": true,
    "bidragsSats": [
      0.0055,
      0.0115,
      0.02
    ],
    "bidrag": [
      0.0055,
      0.0115,
      0.02
    ],
    "isOpenForOffer": true,
    "fondCode": "953946",
    "nasdaqUrl": "https://www.nasdaq.com/da/european-market-activity/mortgage-bonds/5NYK01E30DA53?id=XCSE5NYK01E30DA53"
  },
  {
    "name": "5% 2056 med op til 30 års afdragsfrihed",
    "rente": 5.0,
    "udloebsAar": 2056,
    "kurs": 100.0,
    "flex": false,
    "afdragsfri": true,
    "bidragsSats": [
      0.0055,
      0.0115,
      0.02
    ],
    "bidrag": [
      0.0055,
      0.0115,
      0.02
    ],
    "isOpenForOffer": true,
    "fondCode": "954446",
    "nasdaqUrl": "https://www.nasdaq.com/da/european-market-activity/mortgage-bonds/5NYK01E30DA56?id=XCSE5NYK01E30DA56"
  },
  {
    "name": "4% 2056 med op til 30 års afdragsfrihed",
    "rente": 4.0,
    "udloebsAar": 2056,
    "kurs": 97.38,
    "flex": false,
    "afdragsfri": true,
    "bidragsSats": [
      0.0055,
      0.0115,
      0.02
    ],
    "bidrag": [
      0.0055,
      0.0115,
      0.02
    ],
    "isOpenForOffer": true,
    "fondCode": "954594",
    "nasdaqUrl": "https://www.nasdaq.com/da/european-market-activity/mortgage-bonds/4NYK01E30DA56?id=XCSE4NYK01E30DA56"
  },
  {
    "name": "4% 2053 med op til 30 års afdragsfrihed",
    "rente": 4.0,
    "udloebsAar": 2053,
    "kurs": 99.54,
    "flex": false,
    "afdragsfri": true,
    "bidragsSats": [
      0.0055,
      0.0115,
      0.02
    ],
    "bidrag": [
      0.0055,
      0.0115,
      0.02
    ],
    "isOpenForOffer": true,
    "fondCode": "953687",
    "nasdaqUrl": "https://www.nasdaq.com/da/european-market-activity/mortgage-bonds/4NYK01E30DA53?id=XCSE4NYK01E30DA53"
  },
  {
    "name": "3% 2053 med op til 30 års afdragsfrihed",
    "rente": 3.0,
    "udloebsAar": 2053,
    "kurs": 90.51,
    "flex": false,
    "afdragsfri": true,
    "bidragsSats": [
      0.0055,
      0.0115,
      0.02
    ],
    "bidrag": [
      0.0055,
      0.0115,
      0.02
    ],
    "isOpenForOffer": true,
    "fondCode": "953520",
    "nasdaqUrl": "https://www.nasdaq.com/da/european-market-activity/mortgage-bonds/3NYK01E30DA53?id=XCSE3NYK01E30DA53"
  },
  {
    "name": "2,5% 2053 med op til 30 års afdragsfrihed",
    "rente": 2.5,
    "udloebsAar": 2053,
    "kurs": 84.91,
    "flex": false,
    "afdragsfri": true,
    "bidragsSats": [
      0.0055,
      0.0115,
      0.02
    ],
    "bidrag": [
      0.0055,
      0.0115,
      0.02
    ],
    "isOpenForOffer": true,
    "fondCode": "953482",
    "nasdaqUrl": "https://www.nasdaq.com/da/european-market-activity/mortgage-bonds/25NYK01E30DA53?id=XCSE25NYK01E30DA53"
  },
  {
    "name": "2% 2053 med op til 30 års afdragsfrihed",
    "rente": 2.0,
    "udloebsAar": 2053,
    "kurs": 78.25,
    "flex": false,
    "afdragsfri": true,
    "bidragsSats": [
      0.0055,
      0.0115,
      0.02
    ],
    "bidrag": [
      0.0055,
      0.0115,
      0.02
    ],
    "isOpenForOffer": true,
    "fondCode": "953288",
    "nasdaqUrl": "https://www.nasdaq.com/da/european-market-activity/mortgage-bonds/2NYK01E30DA53?id=XCSE2NYK01E30DA53"
  },
  {
    "name": "1,5% 2053 med op til 30 års afdragsfrihed",
    "rente": 1.5,
    "udloebsAar": 2053,
    "kurs": 71.05,
    "flex": false,
    "afdragsfri": true,
    "bidragsSats": [
      0.0055,
      0.0115,
      0.02
    ],
    "bidrag": [
      0.0055,
      0.0115,
      0.02
    ],
    "isOpenForOffer": true,
    "fondCode": "953202",
    "nasdaqUrl": "https://www.nasdaq.com/da/european-market-activity/mortgage-bonds/15NYK01E30DA53?id=XCSE15NYK01E30DA53"
  },
  {
    "name": "1% 2053 med op til 30 års afdragsfrihed",
    "rente": 1.0,
    "udloebsAar": 2053,
    "kurs": 64.82,
    "flex": false,
    "afdragsfri": true,
    "bidragsSats": [
      0.0055,
      0.0115,
      0.02
    ],
    "bidrag": [
      0.0055,
      0.0115,
      0.02
    ],
    "isOpenForOffer": true,
    "fondCode": "953105",
    "nasdaqUrl": "https://www.nasdaq.com/da/european-market-activity/mortgage-bonds/1NYK01E30DA53?id=XCSE1NYK01E30DA53"
  },
  {
    "name": "6% 2031 med afdrag",
    "rente": 6.0,
    "udloebsAar": 2031,
    "kurs": 100.0,
    "flex": false,
    "afdragsfri": false,
    "bidragsSats": [
      0.0045,
      0.0085,
      0.012
    ],
    "bidrag": [
      0.0045,
      0.0085,
      0.012
    ],
    "isOpenForOffer": true,
    "fondCode": "977268",
    "nasdaqUrl": "https://www.nasdaq.com/da/european-market-activity/mortgage-bonds/6NYKE A31?id=XCSE6NYKE_A31"
  },
  {
    "name": "5% 2031 med afdrag",
    "rente": 5.0,
    "udloebsAar": 2031,
    "kurs": 100.0,
    "flex": false,
    "afdragsfri": false,
    "bidragsSats": [
      0.0045,
      0.0085,
      0.012
    ],
    "bidrag": [
      0.0045,
      0.0085,
      0.012
    ],
    "isOpenForOffer": true,
    "fondCode": "976997",
    "nasdaqUrl": "https://www.nasdaq.com/da/european-market-activity/mortgage-bonds/5NYK01EA 31?id=XCSE5NYK01EA_31"
  },
  {
    "name": "5% 2043 med afdrag",
    "rente": 5.0,
    "udloebsAar": 2043,
    "kurs": 100.0,
    "flex": false,
    "afdragsfri": false,
    "bidragsSats": [
      0.0045,
      0.0085,
      0.012
    ],
    "bidrag": [
      0.0045,
      0.0085,
      0.012
    ],
    "isOpenForOffer": true,
    "fondCode": "954055",
    "nasdaqUrl": "https://www.nasdaq.com/da/european-market-activity/mortgage-bonds/5NYK01EA43?id=XCSE5NYK01EA43"
  },
  {
    "name": "5% 2046 med afdrag",
    "rente": 5.0,
    "udloebsAar": 2046,
    "kurs": 100.0,
    "flex": false,
    "afdragsfri": false,
    "bidragsSats": [
      0.0045,
      0.0085,
      0.012
    ],
    "bidrag": [
      0.0045,
      0.0085,
      0.012
    ],
    "isOpenForOffer": true,
    "fondCode": "954500",
    "nasdaqUrl": "https://www.nasdaq.com/da/european-market-activity/mortgage-bonds/5NYK01EA46?id=XCSE5NYK01EA46"
  },
  {
    "name": "4% 2046 med afdrag",
    "rente": 4.0,
    "udloebsAar": 2046,
    "kurs": 100.0,
    "flex": false,
    "afdragsfri": false,
    "bidragsSats": [
      0.0045,
      0.0085,
      0.012
    ],
    "bidrag": [
      0.0045,
      0.0085,
      0.012
    ],
    "isOpenForOffer": true,
    "fondCode": "954268",
    "nasdaqUrl": "https://www.nasdaq.com/da/european-market-activity/mortgage-bonds/4NYK01EA46?id=XCSE4NYK01EA46"
  },
  {
    "name": "4% 2034 med afdrag",
    "rente": 4.0,
    "udloebsAar": 2034,
    "kurs": 100.0,
    "flex": false,
    "afdragsfri": false,
    "bidragsSats": [
      0.0045,
      0.0085,
      0.012
    ],
    "bidrag": [
      0.0045,
      0.0085,
      0.012
    ],
    "isOpenForOffer": true,
    "fondCode": "978019",
    "nasdaqUrl": "https://www.nasdaq.com/da/european-market-activity/mortgage-bonds/4NYKE A34?id=XCSE4NYKE_A34"
  },
  {
    "name": "4% 2031 med afdrag",
    "rente": 4.0,
    "udloebsAar": 2031,
    "kurs": 100.0,
    "flex": false,
    "afdragsfri": false,
    "bidragsSats": [
      0.0045,
      0.0085,
      0.012
    ],
    "bidrag": [
      0.0045,
      0.0085,
      0.012
    ],
    "isOpenForOffer": true,
    "fondCode": "977519",
    "nasdaqUrl": "https://www.nasdaq.com/da/european-market-activity/mortgage-bonds/4NYK01EA 31?id=XCSE4NYK01EA_31"
  },
  {
    "name": "4% 2043 med afdrag",
    "rente": 4.0,
    "udloebsAar": 2043,
    "kurs": 100.0,
    "flex": false,
    "afdragsfri": false,
    "bidragsSats": [
      0.0045,
      0.0085,
      0.012
    ],
    "bidrag": [
      0.0045,
      0.0085,
      0.012
    ],
    "isOpenForOffer": true,
    "fondCode": "953954",
    "nasdaqUrl": "https://www.nasdaq.com/da/european-market-activity/mortgage-bonds/4NYK01EA43?id=XCSE4NYK01EA43"
  },
  {
    "name": "3,5% 2046 med afdrag",
    "rente": 3.5,
    "udloebsAar": 2046,
    "kurs": 97.99,
    "flex": false,
    "afdragsfri": false,
    "bidragsSats": [
      0.0045,
      0.0085,
      0.012
    ],
    "bidrag": [
      0.0045,
      0.0085,
      0.012
    ],
    "isOpenForOffer": true,
    "fondCode": "954845",
    "nasdaqUrl": "https://www.nasdaq.com/da/european-market-activity/mortgage-bonds/35NYK01A46?id=XCSE35NYK01A46"
  },
  {
    "name": "3% 2043 med afdrag",
    "rente": 3.0,
    "udloebsAar": 2043,
    "kurs": 97.91,
    "flex": false,
    "afdragsfri": false,
    "bidragsSats": [
      0.0045,
      0.0085,
      0.012
    ],
    "bidrag": [
      0.0045,
      0.0085,
      0.012
    ],
    "isOpenForOffer": true,
    "fondCode": "953717",
    "nasdaqUrl": "https://www.nasdaq.com/da/european-market-activity/mortgage-bonds/3NYK01EA43?id=XCSE3NYK01EA43"
  },
  {
    "name": "3% 2031 med afdrag",
    "rente": 3.0,
    "udloebsAar": 2031,
    "kurs": 100.0,
    "flex": false,
    "afdragsfri": false,
    "bidragsSats": [
      0.0045,
      0.0085,
      0.012
    ],
    "bidrag": [
      0.0045,
      0.0085,
      0.012
    ],
    "isOpenForOffer": true,
    "fondCode": "977853",
    "nasdaqUrl": "https://www.nasdaq.com/da/european-market-activity/mortgage-bonds/3NYK01EA 31?id=XCSE3NYK01EA_31"
  },
  {
    "name": "3% 2034 med afdrag",
    "rente": 3.0,
    "udloebsAar": 2034,
    "kurs": 100.0,
    "flex": false,
    "afdragsfri": false,
    "bidragsSats": [
      0.0045,
      0.0085,
      0.012
    ],
    "bidrag": [
      0.0045,
      0.0085,
      0.012
    ],
    "isOpenForOffer": true,
    "fondCode": "978639",
    "nasdaqUrl": "https://www.nasdaq.com/da/european-market-activity/mortgage-bonds/3NYKE A34?id=XCSE3NYKE_A34"
  },
  {
    "name": "2,5% 2037 med afdrag",
    "rente": 2.5,
    "udloebsAar": 2037,
    "kurs": 99.3,
    "flex": false,
    "afdragsfri": false,
    "bidragsSats": [
      0.0045,
      0.0085,
      0.012
    ],
    "bidrag": [
      0.0045,
      0.0085,
      0.012
    ],
    "isOpenForOffer": true,
    "fondCode": "979562",
    "nasdaqUrl": "https://www.nasdaq.com/da/european-market-activity/mortgage-bonds/25NYK01E A37?id=XCSE25NYK01E_A37"
  },
  {
    "name": "2% 2034 med afdrag",
    "rente": 2.0,
    "udloebsAar": 2034,
    "kurs": 98.7,
    "flex": false,
    "afdragsfri": false,
    "bidragsSats": [
      0.0045,
      0.0085,
      0.012
    ],
    "bidrag": [
      0.0045,
      0.0085,
      0.012
    ],
    "isOpenForOffer": true,
    "fondCode": "978965",
    "nasdaqUrl": "https://www.nasdaq.com/da/european-market-activity/mortgage-bonds/2NYKE A34?id=XCSE2NYKE_A34"
  },
  {
    "name": "2% 2037 med afdrag",
    "rente": 2.0,
    "udloebsAar": 2037,
    "kurs": 96.94,
    "flex": false,
    "afdragsfri": false,
    "bidragsSats": [
      0.0045,
      0.0085,
      0.012
    ],
    "bidrag": [
      0.0045,
      0.0085,
      0.012
    ],
    "isOpenForOffer": true,
    "fondCode": "979864",
    "nasdaqUrl": "https://www.nasdaq.com/da/european-market-activity/mortgage-bonds/2NYK01E A37?id=XCSE2NYK01E_A37"
  },
  {
    "name": "2% 2043 med afdrag",
    "rente": 2.0,
    "udloebsAar": 2043,
    "kurs": 92.21,
    "flex": false,
    "afdragsfri": false,
    "bidragsSats": [
      0.0045,
      0.0085,
      0.012
    ],
    "bidrag": [
      0.0045,
      0.0085,
      0.012
    ],
    "isOpenForOffer": true,
    "fondCode": "953555",
    "nasdaqUrl": "https://www.nasdaq.com/da/european-market-activity/mortgage-bonds/2NYK01EA43?id=XCSE2NYK01EA43"
  },
  {
    "name": "1,5% 2043 med afdrag",
    "rente": 1.5,
    "udloebsAar": 2043,
    "kurs": 89.09,
    "flex": false,
    "afdragsfri": false,
    "bidragsSats": [
      0.0045,
      0.0085,
      0.012
    ],
    "bidrag": [
      0.0045,
      0.0085,
      0.012
    ],
    "isOpenForOffer": true,
    "fondCode": "953423",
    "nasdaqUrl": "https://www.nasdaq.com/da/european-market-activity/mortgage-bonds/15NYK01EA43?id=XCSE15NYK01EA43"
  },
  {
    "name": "1,5% 2037 med afdrag",
    "rente": 1.5,
    "udloebsAar": 2037,
    "kurs": 93.23,
    "flex": false,
    "afdragsfri": false,
    "bidragsSats": [
      0.0045,
      0.0085,
      0.012
    ],
    "bidrag": [
      0.0045,
      0.0085,
      0.012
    ],
    "isOpenForOffer": true,
    "fondCode": "950432",
    "nasdaqUrl": "https://www.nasdaq.com/da/european-market-activity/mortgage-bonds/1,5NYK01EA37?id=XCSE1_5NYK01EA37"
  },
  {
    "name": "1,5% 2040 med afdrag",
    "rente": 1.5,
    "udloebsAar": 2040,
    "kurs": 91.33,
    "flex": false,
    "afdragsfri": false,
    "bidragsSats": [
      0.0045,
      0.0085,
      0.012
    ],
    "bidrag": [
      0.0045,
      0.0085,
      0.012
    ],
    "isOpenForOffer": true,
    "fondCode": "951331",
    "nasdaqUrl": "https://www.nasdaq.com/da/european-market-activity/mortgage-bonds/15NYK01EA40?id=XCSE15NYK01EA40"
  },
  {
    "name": "1% 2040 med afdrag",
    "rente": 1.0,
    "udloebsAar": 2040,
    "kurs": 87.86,
    "flex": false,
    "afdragsfri": false,
    "bidragsSats": [
      0.0045,
      0.0085,
      0.012
    ],
    "bidrag": [
      0.0045,
      0.0085,
      0.012
    ],
    "isOpenForOffer": true,
    "fondCode": "951501",
    "nasdaqUrl": "https://www.nasdaq.com/da/european-market-activity/mortgage-bonds/1NYK01EA40?id=XCSE1NYK01EA40"
  },
  {
    "name": "1% 2043 med afdrag",
    "rente": 1.0,
    "udloebsAar": 2043,
    "kurs": 85.34,
    "flex": false,
    "afdragsfri": false,
    "bidragsSats": [
      0.0045,
      0.0085,
      0.012
    ],
    "bidrag": [
      0.0045,
      0.0085,
      0.012
    ],
    "isOpenForOffer": true,
    "fondCode": "952931",
    "nasdaqUrl": "https://www.nasdaq.com/da/european-market-activity/mortgage-bonds/1NYK01EA43?id=XCSE1NYK01EA43"
  },
  {
    "name": "0,5% 2043 med afdrag",
    "rente": 0.5,
    "udloebsAar": 2043,
    "kurs": 82.8,
    "flex": false,
    "afdragsfri": false,
    "bidragsSats": [
      0.0045,
      0.0085,
      0.012
    ],
    "bidrag": [
      0.0045,
      0.0085,
      0.012
    ],
    "isOpenForOffer": true,
    "fondCode": "952710",
    "nasdaqUrl": "https://www.nasdaq.com/da/european-market-activity/mortgage-bonds/05NYK01EA43?id=XCSE05NYK01EA43"
  },
  {
    "name": "0,5% 2040 med afdrag",
    "rente": 0.5,
    "udloebsAar": 2040,
    "kurs": 84.02,
    "flex": false,
    "afdragsfri": false,
    "bidragsSats": [
      0.0045,
      0.0085,
      0.012
    ],
    "bidrag": [
      0.0045,
      0.0085,
      0.012
    ],
    "isOpenForOffer": true,
    "fondCode": "952435",
    "nasdaqUrl": "https://www.nasdaq.com/da/european-market-activity/mortgage-bonds/0,5NYK01EA40?id=XCSE0_5NYK01EA40"
  },
  {
    "name": "0% 2040 med afdrag",
    "rente": 0.0,
    "udloebsAar": 2040,
    "kurs": 82.47,
    "flex": false,
    "afdragsfri": false,
    "bidragsSats": [
      0.0045,
      0.0085,
      0.012
    ],
    "bidrag": [
      0.0045,
      0.0085,
      0.012
    ],
    "isOpenForOffer": true,
    "fondCode": "952524",
    "nasdaqUrl": "https://www.nasdaq.com/da/european-market-activity/mortgage-bonds/0NYK01EA40?id=XCSE0NYK01EA40"
  },
  {
    "name": "4% 2026 med afdrag",
    "rente": 4.0,
    "udloebsAar": 2026,
    "kurs": 100.0,
    "flex": false,
    "afdragsfri": false,
    "bidragsSats": [
      0.0045,
      0.0085,
      0.012
    ],
    "bidrag": [
      0.0045,
      0.0085,
      0.012
    ],
    "isOpenForOffer": true,
    "fondCode": "977527",
    "nasdaqUrl": "https://www.nasdaq.com/da/european-market-activity/mortgage-bonds/4NYK01EA 26?id=XCSE4NYK01EA_26"
  },
  {
    "name": "3% 2026 med afdrag",
    "rente": 3.0,
    "udloebsAar": 2026,
    "kurs": 100.0,
    "flex": false,
    "afdragsfri": false,
    "bidragsSats": [
      0.0045,
      0.0085,
      0.012
    ],
    "bidrag": [
      0.0045,
      0.0085,
      0.012
    ],
    "isOpenForOffer": true,
    "fondCode": "977802",
    "nasdaqUrl": "https://www.nasdaq.com/da/european-market-activity/mortgage-bonds/3NYK01EA 26?id=XCSE3NYK01EA_26"
  },
  {
    "name": "3% 2029 med afdrag",
    "rente": 3.0,
    "udloebsAar": 2029,
    "kurs": 100.0,
    "flex": false,
    "afdragsfri": false,
    "bidragsSats": [
      0.0045,
      0.0085,
      0.012
    ],
    "bidrag": [
      0.0045,
      0.0085,
      0.012
    ],
    "isOpenForOffer": true,
    "fondCode": "978620",
    "nasdaqUrl": "https://www.nasdaq.com/da/european-market-activity/mortgage-bonds/3NYKE A29?id=XCSE3NYKE_A29"
  },
  {
    "name": "2% 2029 med afdrag",
    "rente": 2.0,
    "udloebsAar": 2029,
    "kurs": 100.0,
    "flex": false,
    "afdragsfri": false,
    "bidragsSats": [
      0.0045,
      0.0085,
      0.012
    ],
    "bidrag": [
      0.0045,
      0.0085,
      0.012
    ],
    "isOpenForOffer": true,
    "fondCode": "978930",
    "nasdaqUrl": "https://www.nasdaq.com/da/european-market-activity/mortgage-bonds/2NYKE A29?id=XCSE2NYKE_A29"
  },
  {
    "name": "2% 2032 med afdrag",
    "rente": 2.0,
    "udloebsAar": 2032,
    "kurs": 99.73,
    "flex": false,
    "afdragsfri": false,
    "bidragsSats": [
      0.0045,
      0.0085,
      0.012
    ],
    "bidrag": [
      0.0045,
      0.0085,
      0.012
    ],
    "isOpenForOffer": true,
    "fondCode": "979554",
    "nasdaqUrl": "https://www.nasdaq.com/da/european-market-activity/mortgage-bonds/2NYK01E A32?id=XCSE2NYK01E_A32"
  },
  {
    "name": "2% 2041 med afdrag",
    "rente": 2.0,
    "udloebsAar": 2041,
    "kurs": 92.71,
    "flex": false,
    "afdragsfri": false,
    "bidragsSats": [
      0.0045,
      0.0085,
      0.012
    ],
    "bidrag": [
      0.0045,
      0.0085,
      0.012
    ],
    "isOpenForOffer": true,
    "fondCode": "954454",
    "nasdaqUrl": "https://www.nasdaq.com/da/european-market-activity/mortgage-bonds/2NYK01EA41?id=XCSE2NYK01EA41"
  },
  {
    "name": "1,5% 2038 med afdrag",
    "rente": 1.5,
    "udloebsAar": 2038,
    "kurs": 94.25,
    "flex": false,
    "afdragsfri": false,
    "bidragsSats": [
      0.0045,
      0.0085,
      0.012
    ],
    "bidrag": [
      0.0045,
      0.0085,
      0.012
    ],
    "isOpenForOffer": true,
    "fondCode": "953563",
    "nasdaqUrl": "https://www.nasdaq.com/da/european-market-activity/mortgage-bonds/15NYK01EA38?id=XCSE15NYK01EA38"
  },
  {
    "name": "1,5% 2032 med afdrag",
    "rente": 1.5,
    "udloebsAar": 2032,
    "kurs": 98.9,
    "flex": false,
    "afdragsfri": false,
    "bidragsSats": [
      0.0045,
      0.0085,
      0.012
    ],
    "bidrag": [
      0.0045,
      0.0085,
      0.012
    ],
    "isOpenForOffer": true,
    "fondCode": "979821",
    "nasdaqUrl": "https://www.nasdaq.com/da/european-market-activity/mortgage-bonds/15NYK01E A32?id=XCSE15NYK01E_A32"
  },
  {
    "name": "1% 2032 med afdrag",
    "rente": 1.0,
    "udloebsAar": 2032,
    "kurs": 96.14,
    "flex": false,
    "afdragsfri": false,
    "bidragsSats": [
      0.0045,
      0.0085,
      0.012
    ],
    "bidrag": [
      0.0045,
      0.0085,
      0.012
    ],
    "isOpenForOffer": true,
    "fondCode": "950467",
    "nasdaqUrl": "https://www.nasdaq.com/da/european-market-activity/mortgage-bonds/1NYK01EA32?id=XCSE1NYK01EA32"
  },
  {
    "name": "1% 2035 med afdrag",
    "rente": 1.0,
    "udloebsAar": 2035,
    "kurs": 94.48,
    "flex": false,
    "afdragsfri": false,
    "bidragsSats": [
      0.0045,
      0.0085,
      0.012
    ],
    "bidrag": [
      0.0045,
      0.0085,
      0.012
    ],
    "isOpenForOffer": true,
    "fondCode": "951463",
    "nasdaqUrl": "https://www.nasdaq.com/da/european-market-activity/mortgage-bonds/1NYK01EA35?id=XCSE1NYK01EA35"
  },
  {
    "name": "0,5% 2035 med afdrag",
    "rente": 0.5,
    "udloebsAar": 2035,
    "kurs": 91.4,
    "flex": false,
    "afdragsfri": false,
    "bidragsSats": [
      0.0045,
      0.0085,
      0.012
    ],
    "bidrag": [
      0.0045,
      0.0085,
      0.012
    ],
    "isOpenForOffer": true,
    "fondCode": "951870",
    "nasdaqUrl": "https://www.nasdaq.com/da/european-market-activity/mortgage-bonds/0,5NYK01EA35?id=XCSE0_5NYK01EA35"
  },
  {
    "name": "0,5% 2038 med afdrag",
    "rente": 0.5,
    "udloebsAar": 2038,
    "kurs": 89.35,
    "flex": false,
    "afdragsfri": false,
    "bidragsSats": [
      0.0045,
      0.0085,
      0.012
    ],
    "bidrag": [
      0.0045,
      0.0085,
      0.012
    ],
    "isOpenForOffer": true,
    "fondCode": "952958",
    "nasdaqUrl": "https://www.nasdaq.com/da/european-market-activity/mortgage-bonds/0,5NYK01EA38?id=XCSE0_5NYK01EA38"
  },
  {
    "name": "0% 2038 med afdrag",
    "rente": 0.0,
    "udloebsAar": 2038,
    "kurs": 87.48,
    "flex": false,
    "afdragsfri": false,
    "bidragsSats": [
      0.0045,
      0.0085,
      0.012
    ],
    "bidrag": [
      0.0045,
      0.0085,
      0.012
    ],
    "isOpenForOffer": true,
    "fondCode": "953032",
    "nasdaqUrl": "https://www.nasdaq.com/da/european-market-activity/mortgage-bonds/0NYK01EA38?id=XCSE0NYK01EA38"
  },
  {
    "name": "0% 2035 med afdrag",
    "rente": 0.0,
    "udloebsAar": 2035,
    "kurs": 89.18,
    "flex": false,
    "afdragsfri": false,
    "bidragsSats": [
      0.0045,
      0.0085,
      0.012
    ],
    "bidrag": [
      0.0045,
      0.0085,
      0.012
    ],
    "isOpenForOffer": true,
    "fondCode": "952494",
    "nasdaqUrl": "https://www.nasdaq.com/da/european-market-activity/mortgage-bonds/0NYK01EA35?id=XCSE0NYK01EA35"
  },
  {
    "name": "3% 2033 med afdrag",
    "rente": 3.0,
    "udloebsAar": 2033,
    "kurs": 100.0,
    "flex": false,
    "afdragsfri": false,
    "bidragsSats": [
      0.0045,
      0.0085,
      0.012
    ],
    "bidrag": [
      0.0045,
      0.0085,
      0.012
    ],
    "isOpenForOffer": true,
    "fondCode": "953962",
    "nasdaqUrl": "https://www.nasdaq.com/da/european-market-activity/mortgage-bonds/3NYK01EA33?id=XCSE3NYK01EA33"
  },
  {
    "name": "3% 2036 med afdrag",
    "rente": 3.0,
    "udloebsAar": 2036,
    "kurs": 100.0,
    "flex": false,
    "afdragsfri": false,
    "bidragsSats": [
      0.0045,
      0.0085,
      0.012
    ],
    "bidrag": [
      0.0045,
      0.0085,
      0.012
    ],
    "isOpenForOffer": true,
    "fondCode": "954462",
    "nasdaqUrl": "https://www.nasdaq.com/da/european-market-activity/mortgage-bonds/3NYK01EA36?id=XCSE3NYK01EA36"
  },
  {
    "name": "2% 2036 med afdrag",
    "rente": 2.0,
    "udloebsAar": 2036,
    "kurs": 96.22,
    "flex": false,
    "afdragsfri": false,
    "bidragsSats": [
      0.0045,
      0.0085,
      0.012
    ],
    "bidrag": [
      0.0045,
      0.0085,
      0.012
    ],
    "isOpenForOffer": true,
    "fondCode": "954969",
    "nasdaqUrl": "https://www.nasdaq.com/da/european-market-activity/mortgage-bonds/2NYK01EA36?id=XCSE2NYK01EA36"
  },
  {
    "name": "2% 2033 med afdrag",
    "rente": 2.0,
    "udloebsAar": 2033,
    "kurs": 98.7,
    "flex": false,
    "afdragsfri": false,
    "bidragsSats": [
      0.0045,
      0.0085,
      0.012
    ],
    "bidrag": [
      0.0045,
      0.0085,
      0.012
    ],
    "isOpenForOffer": true,
    "fondCode": "953725",
    "nasdaqUrl": "https://www.nasdaq.com/da/european-market-activity/mortgage-bonds/2NYK01EA33?id=XCSE2NYK01EA33"
  },
  {
    "name": "1% 2033 med afdrag",
    "rente": 1.0,
    "udloebsAar": 2033,
    "kurs": 95.35,
    "flex": false,
    "afdragsfri": false,
    "bidragsSats": [
      0.0045,
      0.0085,
      0.012
    ],
    "bidrag": [
      0.0045,
      0.0085,
      0.012
    ],
    "isOpenForOffer": true,
    "fondCode": "953571",
    "nasdaqUrl": "https://www.nasdaq.com/da/european-market-activity/mortgage-bonds/1NYK01EA33?id=XCSE1NYK01EA33"
  },
  {
    "name": "1% 2027 med afdrag",
    "rente": 1.0,
    "udloebsAar": 2027,
    "kurs": 100.0,
    "flex": false,
    "afdragsfri": false,
    "bidragsSats": [
      0.0045,
      0.0085,
      0.012
    ],
    "bidrag": [
      0.0045,
      0.0085,
      0.012
    ],
    "isOpenForOffer": true,
    "fondCode": "979627",
    "nasdaqUrl": "https://www.nasdaq.com/da/european-market-activity/mortgage-bonds/1NYK01E A27?id=XCSE1NYK01E_A27"
  },
  {
    "name": "0,5% 2030 med afdrag",
    "rente": 0.5,
    "udloebsAar": 2030,
    "kurs": 97.43,
    "flex": false,
    "afdragsfri": false,
    "bidragsSats": [
      0.0045,
      0.0085,
      0.012
    ],
    "bidrag": [
      0.0045,
      0.0085,
      0.012
    ],
    "isOpenForOffer": true,
    "fondCode": "951455",
    "nasdaqUrl": "https://www.nasdaq.com/da/european-market-activity/mortgage-bonds/0,5NYK01EA30?id=XCSE0_5NYK01EA30"
  },
  {
    "name": "0,5% 2027 med afdrag",
    "rente": 0.5,
    "udloebsAar": 2027,
    "kurs": 98.96,
    "flex": false,
    "afdragsfri": false,
    "bidragsSats": [
      0.0045,
      0.0085,
      0.012
    ],
    "bidrag": [
      0.0045,
      0.0085,
      0.012
    ],
    "isOpenForOffer": true,
    "fondCode": "950459",
    "nasdaqUrl": "https://www.nasdaq.com/da/european-market-activity/mortgage-bonds/0,5NYK01EA27?id=XCSE0_5NYK01EA27"
  },
  {
    "name": "0% 2030 med afdrag",
    "rente": 0.0,
    "udloebsAar": 2030,
    "kurs": 95.2,
    "flex": false,
    "afdragsfri": false,
    "bidragsSats": [
      0.0045,
      0.0085,
      0.012
    ],
    "bidrag": [
      0.0045,
      0.0085,
      0.012
    ],
    "isOpenForOffer": true,
    "fondCode": "951269",
    "nasdaqUrl": "https://www.nasdaq.com/da/european-market-activity/mortgage-bonds/0NYK01EA30?id=XCSE0NYK01EA30"
  },
  {
    "name": "0% 2033 med afdrag",
    "rente": 0.0,
    "udloebsAar": 2033,
    "kurs": 93.26,
    "flex": false,
    "afdragsfri": false,
    "bidragsSats": [
      0.0045,
      0.0085,
      0.012
    ],
    "bidrag": [
      0.0045,
      0.0085,
      0.012
    ],
    "isOpenForOffer": true,
    "fondCode": "952966",
    "nasdaqUrl": "https://www.nasdaq.com/da/european-market-activity/mortgage-bonds/0NYK01EA33?id=XCSE0NYK01EA33"
  },
  {
    "name": "-0,5% 2033 med afdrag",
    "rente": -0.5,
    "udloebsAar": 2033,
    "kurs": 92.34,
    "flex": false,
    "afdragsfri": false,
    "bidragsSats": [
      0.0045,
      0.0085,
      0.012
    ],
    "bidrag": [
      0.0045,
      0.0085,
      0.012
    ],
    "isOpenForOffer": true,
    "fondCode": "953059",
    "nasdaqUrl": "https://www.nasdaq.com/da/european-market-activity/mortgage-bonds/-05NYK01EA33?id=XCSE_05NYK01EA33"
  },
  {
    "name": "-0,5% 2030 med afdrag",
    "rente": -0.5,
    "udloebsAar": 2030,
    "kurs": 96.8,
    "flex": false,
    "afdragsfri": false,
    "bidragsSats": [
      0.0045,
      0.0085,
      0.012
    ],
    "bidrag": [
      0.0045,
      0.0085,
      0.012
    ],
    "isOpenForOffer": true,
    "fondCode": "952516",
    "nasdaqUrl": "https://www.nasdaq.com/da/european-market-activity/mortgage-bonds/-05NYK01EA30?id=XCSE_05NYK01EA30"
  },
  {
    "name": "6% 2053 med afdrag",
    "rente": 6.0,
    "udloebsAar": 2053,
    "kurs": 100.0,
    "flex": false,
    "afdragsfri": false,
    "bidragsSats": [
      0.0045,
      0.0085,
      0.012
    ],
    "bidrag": [
      0.0045,
      0.0085,
      0.012
    ],
    "isOpenForOffer": true,
    "fondCode": "954063",
    "nasdaqUrl": "https://www.nasdaq.com/da/european-market-activity/mortgage-bonds/6NYK01IA53?id=XCSE6NYK01IA53"
  },
  {
    "name": "3,5% 2044 med afdrag",
    "rente": 3.5,
    "udloebsAar": 2044,
    "kurs": 100.0,
    "flex": false,
    "afdragsfri": false,
    "bidragsSats": [
      0.0045,
      0.0085,
      0.012
    ],
    "bidrag": [
      0.0045,
      0.0085,
      0.012
    ],
    "isOpenForOffer": true,
    "fondCode": "978833",
    "nasdaqUrl": "https://www.nasdaq.com/da/european-market-activity/mortgage-bonds/35NYKI A44?id=XCSE35NYKI_A44"
  },
  {
    "name": "3,5% 2044 med afdrag",
    "rente": 3.5,
    "udloebsAar": 2044,
    "kurs": 100.0,
    "flex": false,
    "afdragsfri": false,
    "bidragsSats": [
      0.0045,
      0.0085,
      0.012
    ],
    "bidrag": [
      0.0045,
      0.0085,
      0.012
    ],
    "isOpenForOffer": true,
    "fondCode": "978760",
    "nasdaqUrl": "https://www.nasdaq.com/da/european-market-activity/mortgage-bonds/3,5NYKG A44?id=XCSE3_5NYKG_A44"
  },
  {
    "name": "3,5% 2044 med afdrag",
    "rente": 3.5,
    "udloebsAar": 2044,
    "kurs": 100.0,
    "flex": false,
    "afdragsfri": false,
    "bidragsSats": [
      0.0045,
      0.0085,
      0.012
    ],
    "bidrag": [
      0.0045,
      0.0085,
      0.012
    ],
    "isOpenForOffer": true,
    "fondCode": "978752",
    "nasdaqUrl": "https://www.nasdaq.com/da/european-market-activity/mortgage-bonds/3,5NYKD A44?id=XCSE3_5NYKD_A44"
  },
  {
    "name": "3% 2044 med afdrag",
    "rente": 3.0,
    "udloebsAar": 2044,
    "kurs": 100.0,
    "flex": false,
    "afdragsfri": false,
    "bidragsSats": [
      0.0045,
      0.0085,
      0.012
    ],
    "bidrag": [
      0.0045,
      0.0085,
      0.012
    ],
    "isOpenForOffer": true,
    "fondCode": "978582",
    "nasdaqUrl": "https://www.nasdaq.com/da/european-market-activity/mortgage-bonds/3NYKI A44?id=XCSE3NYKI_A44"
  },
  {
    "name": "3% 2047 med afdrag",
    "rente": 3.0,
    "udloebsAar": 2047,
    "kurs": 100.0,
    "flex": false,
    "afdragsfri": false,
    "bidragsSats": [
      0.0045,
      0.0085,
      0.012
    ],
    "bidrag": [
      0.0045,
      0.0085,
      0.012
    ],
    "isOpenForOffer": true,
    "fondCode": "979732",
    "nasdaqUrl": "https://www.nasdaq.com/da/european-market-activity/mortgage-bonds/3NYK01I A47?id=XCSE3NYK01I_A47"
  },
  {
    "name": "3% 2053 med afdrag",
    "rente": 3.0,
    "udloebsAar": 2053,
    "kurs": 95.85,
    "flex": false,
    "afdragsfri": false,
    "bidragsSats": [
      0.0045,
      0.0085,
      0.012
    ],
    "bidrag": [
      0.0045,
      0.0085,
      0.012
    ],
    "isOpenForOffer": true,
    "fondCode": "953598",
    "nasdaqUrl": "https://www.nasdaq.com/da/european-market-activity/mortgage-bonds/3NYK01IA53?id=XCSE3NYK01IA53"
  },
  {
    "name": "2,5% 2047 med afdrag",
    "rente": 2.5,
    "udloebsAar": 2047,
    "kurs": 95.16,
    "flex": false,
    "afdragsfri": false,
    "bidragsSats": [
      0.0045,
      0.0085,
      0.012
    ],
    "bidrag": [
      0.0045,
      0.0085,
      0.012
    ],
    "isOpenForOffer": true,
    "fondCode": "979724",
    "nasdaqUrl": "https://www.nasdaq.com/da/european-market-activity/mortgage-bonds/2,5NYK01I A47?id=XCSE2_5NYK01I_A47"
  },
  {
    "name": "2,5% 2047 med afdrag",
    "rente": 2.5,
    "udloebsAar": 2047,
    "kurs": 100.0,
    "flex": false,
    "afdragsfri": false,
    "bidragsSats": [
      0.0045,
      0.0085,
      0.012
    ],
    "bidrag": [
      0.0045,
      0.0085,
      0.012
    ],
    "isOpenForOffer": true,
    "fondCode": "979759",
    "nasdaqUrl": "https://www.nasdaq.com/da/european-market-activity/mortgage-bonds/2,5NYK03D A47?id=XCSE2_5NYK03D_A47"
  },
  {
    "name": "2% 2047 med afdrag",
    "rente": 2.0,
    "udloebsAar": 2047,
    "kurs": 90.87,
    "flex": false,
    "afdragsfri": false,
    "bidragsSats": [
      0.0045,
      0.0085,
      0.012
    ],
    "bidrag": [
      0.0045,
      0.0085,
      0.012
    ],
    "isOpenForOffer": true,
    "fondCode": "950564",
    "nasdaqUrl": "https://www.nasdaq.com/da/european-market-activity/mortgage-bonds/2,0NYK01IA47?id=XCSE2_0NYK01IA47"
  },
  {
    "name": "2% 2050 med afdrag",
    "rente": 2.0,
    "udloebsAar": 2050,
    "kurs": 89.62,
    "flex": false,
    "afdragsfri": false,
    "bidragsSats": [
      0.0045,
      0.0085,
      0.012
    ],
    "bidrag": [
      0.0045,
      0.0085,
      0.012
    ],
    "isOpenForOffer": true,
    "fondCode": "951625",
    "nasdaqUrl": "https://www.nasdaq.com/da/european-market-activity/mortgage-bonds/2NYK01IA50?id=XCSE2NYK01IA50"
  },
  {
    "name": "1,5% 2050 med afdrag",
    "rente": 1.5,
    "udloebsAar": 2050,
    "kurs": 84.74,
    "flex": false,
    "afdragsfri": false,
    "bidragsSats": [
      0.0045,
      0.0085,
      0.012
    ],
    "bidrag": [
      0.0045,
      0.0085,
      0.012
    ],
    "isOpenForOffer": true,
    "fondCode": "951862",
    "nasdaqUrl": "https://www.nasdaq.com/da/european-market-activity/mortgage-bonds/1,5NYK01IA50?id=XCSE1_5NYK01IA50"
  },
  {
    "name": "1,5% 2053 med afdrag",
    "rente": 1.5,
    "udloebsAar": 2053,
    "kurs": 83.14,
    "flex": false,
    "afdragsfri": false,
    "bidragsSats": [
      0.0045,
      0.0085,
      0.012
    ],
    "bidrag": [
      0.0045,
      0.0085,
      0.012
    ],
    "isOpenForOffer": true,
    "fondCode": "953296",
    "nasdaqUrl": "https://www.nasdaq.com/da/european-market-activity/mortgage-bonds/1,5NYK01IA53?id=XCSE1_5NYK01IA53"
  },
  {
    "name": "1% 2050 med afdrag",
    "rente": 1.0,
    "udloebsAar": 2050,
    "kurs": 80.24,
    "flex": false,
    "afdragsfri": false,
    "bidragsSats": [
      0.0045,
      0.0085,
      0.012
    ],
    "bidrag": [
      0.0045,
      0.0085,
      0.012
    ],
    "isOpenForOffer": true,
    "fondCode": "952486",
    "nasdaqUrl": "https://www.nasdaq.com/da/european-market-activity/mortgage-bonds/1NYK01IA50?id=XCSE1NYK01IA50"
  },
  {
    "name": "1% 2053 med afdrag",
    "rente": 1.0,
    "udloebsAar": 2053,
    "kurs": 80.05,
    "flex": false,
    "afdragsfri": false,
    "bidragsSats": [
      0.0045,
      0.0085,
      0.012
    ],
    "bidrag": [
      0.0045,
      0.0085,
      0.012
    ],
    "isOpenForOffer": true,
    "fondCode": "952974",
    "nasdaqUrl": "https://www.nasdaq.com/da/european-market-activity/mortgage-bonds/1NYK01IA53?id=XCSE1NYK01IA53"
  },
  {
    "name": "0,5% 2050 med afdrag",
    "rente": 0.5,
    "udloebsAar": 2050,
    "kurs": 75.68,
    "flex": false,
    "afdragsfri": false,
    "bidragsSats": [
      0.0045,
      0.0085,
      0.012
    ],
    "bidrag": [
      0.0045,
      0.0085,
      0.012
    ],
    "isOpenForOffer": true,
    "fondCode": "952559",
    "nasdaqUrl": "https://www.nasdaq.com/da/european-market-activity/mortgage-bonds/05NYK01IA50?id=XCSE05NYK01IA50"
  },
  {
    "name": "2% 2043 med afdrag",
    "rente": 2.0,
    "udloebsAar": 2043,
    "kurs": 93.71,
    "flex": false,
    "afdragsfri": false,
    "bidragsSats": [
      0.0045,
      0.0085,
      0.012
    ],
    "bidrag": [
      0.0045,
      0.0085,
      0.012
    ],
    "isOpenForOffer": true,
    "fondCode": "953601",
    "nasdaqUrl": "https://www.nasdaq.com/da/european-market-activity/mortgage-bonds/2NYK01A43?id=XCSE2NYK01A43"
  },
  {
    "name": "1,5% 2040 med afdrag",
    "rente": 1.5,
    "udloebsAar": 2040,
    "kurs": 92.83,
    "flex": false,
    "afdragsfri": false,
    "bidragsSats": [
      0.0045,
      0.0085,
      0.012
    ],
    "bidrag": [
      0.0045,
      0.0085,
      0.012
    ],
    "isOpenForOffer": true,
    "fondCode": "951021",
    "nasdaqUrl": "https://www.nasdaq.com/da/european-market-activity/mortgage-bonds/1,5NYK01IA40?id=XCSE1_5NYK01IA40"
  },
  {
    "name": "1% 2040 med afdrag",
    "rente": 1.0,
    "udloebsAar": 2040,
    "kurs": 89.36,
    "flex": false,
    "afdragsfri": false,
    "bidragsSats": [
      0.0045,
      0.0085,
      0.012
    ],
    "bidrag": [
      0.0045,
      0.0085,
      0.012
    ],
    "isOpenForOffer": true,
    "fondCode": "952257",
    "nasdaqUrl": "https://www.nasdaq.com/da/european-market-activity/mortgage-bonds/1,0NYK01IA40?id=XCSE1_0NYK01IA40"
  },
  {
    "name": "1% 2043 med afdrag",
    "rente": 1.0,
    "udloebsAar": 2043,
    "kurs": 86.84,
    "flex": false,
    "afdragsfri": false,
    "bidragsSats": [
      0.0045,
      0.0085,
      0.012
    ],
    "bidrag": [
      0.0045,
      0.0085,
      0.012
    ],
    "isOpenForOffer": true,
    "fondCode": "952982",
    "nasdaqUrl": "https://www.nasdaq.com/da/european-market-activity/mortgage-bonds/1NYK01IA43?id=XCSE1NYK01IA43"
  },
  {
    "name": "0,5% 2043 med afdrag",
    "rente": 0.5,
    "udloebsAar": 2043,
    "kurs": 84.3,
    "flex": false,
    "afdragsfri": false,
    "bidragsSats": [
      0.0045,
      0.0085,
      0.012
    ],
    "bidrag": [
      0.0045,
      0.0085,
      0.012
    ],
    "isOpenForOffer": true,
    "fondCode": "953040",
    "nasdaqUrl": "https://www.nasdaq.com/da/european-market-activity/mortgage-bonds/0,5NYK01IA43?id=XCSE0_5NYK01IA43"
  },
  {
    "name": "0,5% 2040 med afdrag",
    "rente": 0.5,
    "udloebsAar": 2040,
    "kurs": 85.52,
    "flex": false,
    "afdragsfri": false,
    "bidragsSats": [
      0.0045,
      0.0085,
      0.012
    ],
    "bidrag": [
      0.0045,
      0.0085,
      0.012
    ],
    "isOpenForOffer": true,
    "fondCode": "952753",
    "nasdaqUrl": "https://www.nasdaq.com/da/european-market-activity/mortgage-bonds/05NYK01IA40?id=XCSE05NYK01IA40"
  },
  {
    "name": "2% 2032 med afdrag",
    "rente": 2.0,
    "udloebsAar": 2032,
    "kurs": 100.0,
    "flex": false,
    "afdragsfri": false,
    "bidragsSats": [
      0.0045,
      0.0085,
      0.012
    ],
    "bidrag": [
      0.0045,
      0.0085,
      0.012
    ],
    "isOpenForOffer": true,
    "fondCode": "979805",
    "nasdaqUrl": "https://www.nasdaq.com/da/european-market-activity/mortgage-bonds/2NYK01I A32?id=XCSE2NYK01I_A32"
  }
];
