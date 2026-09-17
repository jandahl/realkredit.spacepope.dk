# realkredit.spacepope.dk

Dansk realkredit-beregner til sammenligning af omlægning, standardlån og to-lags belåning — med live (eller snapshot) obligationskurser.

> **Disclaimer:** Dette er et estimeringsværktøj, ikke rådgivning. Gebyrer, skat, bidrag og kurser er forenklinger. Undersøg altid selv (og gerne med bank/rådgiver) før du ændrer lån, der påvirker årtier af dit økonomi.

## Formål

Hjælper boligejere med at:

- Se konsekvenser af **op-/nedkonvertering** (kursgevinst, kurstab, ydelse, breakeven)
- Sammenligne **fuld omlægning** vs. **tillægslån** ved friværdiudtag
- Beregne **standardlån** og **to-lags belåning** med realistiske bidrag/skat-estimater

## Tre views

| View | Hvad den gør |
|------|----------------|
| **Låneomlægning** | Sammenlign nuværende lån (indfrielse) med nyt lån (optagelse). Afdragsfri-sliders, friværdi/tillægslån (Option A/B), grafer og “Dumb Ideas” reality check. |
| **Standardlån** | Simpel annuitetsberegning for ét nyt lån. |
| **To-lags belåning** | Split af beløb mellem to lag (forskellige obligationer / LTV-bånd). |

## Kør lokalt

```bash
npm install
npm run dev
```

Byg / preview:

```bash
npm run build
npm run preview
```

## Tests

```bash
npm test
```

Vitest dækker amortisering, refinancing/afdragsfri-regressioner og tillægslån-sammenligning.

## Kurser / API

- Live kurser hentes fra API (`/kurser/optagelse` og `/kurser/indfrielse`).
- Ved fejl eller tomt svar bruges **indbyggede snapshot-kurser** (`src/api/fallbackRates.ts`), stemplet med `FALLBACK_RATES_AS_OF`.
- Navbar viser `Live`, `Delvist live` eller `Snapshot fra <dato>` — fallback bruger **ikke** et fake “nu”-tidspunkt.

I udvikling proxies Vite til API’et (se `vite.config.ts`).

## Gebyr- og skat-antagelser (estimater)

Beregningerne bruger faste, forenklede estimater — ikke din banks tilbud:

- **Tinglysning:** fast gebyr + variabel %-sats af gældsforhøjelse (forenklet § 5a-model)
- **Kurtage / bank-/institutgebyrer:** typiske runde tal (kan afvige kraftigt i praksis)
- **Rentefradrag:** fast sats (ca. 25,6 %) — ingen progressiv topskat/loft-model
- **Bidrag:** vægtet over LTV-intervaller [0–40], [40–60], [60–80] ud fra start-LTV

### Kendte forenklinger

- **Bidrag falder ikke** automatisk over lånets løbetid, når LTV falder (dokumenteret forenkling).
- Afdragsfri-defaults følger produktnavn (10 vs. 30 år); resterende IO på eksisterende lån synces fra obligationens `loebetid` / udløb — justér gerne manuelt.
- Flex/F-kort usikkerheds-bånd i grafer er illustrative, ikke prognoser.

## Stack

React 19 + TypeScript + Vite + Tailwind CSS 4 + Vitest.

## Licens / ansvar

Brug på eget ansvar. Ingen garanti for korrekthed ift. aktuelle Totalkredit/Nasdaq-vilkår, skat eller gebyrer.
