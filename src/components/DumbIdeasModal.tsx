import React, { useState } from 'react';
import type { RefinancingComparison, TillaegslaanComparison } from '../calculator/types';
import { formatKr, formatKurs } from '../utils/formatters';
import { 
  Lightbulb, 
  X, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  CheckCircle2, 
  Compass,
  Layers,
  ArrowRightLeft,
} from 'lucide-react';

interface DumbIdeasModalProps {
  isOpen: boolean;
  onClose: () => void;
  comparison: RefinancingComparison;
  tillaegslaanComparison?: TillaegslaanComparison | null;
  breakevenYears: number | null;
}

export const DumbIdeasModal: React.FC<DumbIdeasModalProps> = ({
  isOpen,
  onClose,
  comparison,
  tillaegslaanComparison,
  breakevenYears,
}) => {
  const [activeStrategy, setActiveStrategy] = useState<'full' | 'tillaeg'>('full');

  if (!isOpen) return null;

  const {
    existingLoan,
    newLoan,
    nyHovedstol,
    deltaRestgaeld,
    deltaMonthlyYdelseEfterSkat,
    fees,
  } = comparison;

  const renteDiff = Number((newLoan.rente - existingLoan.rente).toFixed(2));
  const isOpkonvertering = renteDiff > 0;
  const isNedkonvertering = renteDiff < 0;

  const newKurs = newLoan.kurs;

  // Common Danish rules of thumb evaluation:
  // 1. Omkostninger i forhold til gevinst/ændring:
  // For opkonvertering: Omkostninger som procent af kursgevinsten ved indfrielse
  // For nedkonvertering: Omkostninger i forhold til årlig likviditetsbesparelse (antal år at tjene hjem)
  const annualSavings = Math.max(1, Math.abs(deltaMonthlyYdelseEfterSkat) * 12);
  const feeImpactPercent = isOpkonvertering
    ? (comparison.kursgevinstIndfrielse > 0 ? (fees.samledeOmkostninger / comparison.kursgevinstIndfrielse) * 100 : 100)
    : isNedkonvertering
    ? (fees.samledeOmkostninger / annualSavings)
    : 0;

  const isFeeProportionHealthy = isOpkonvertering
    ? feeImpactPercent <= 10.0 // Costs shouldn't eat more than 10% of debt cut
    : isNedkonvertering
    ? feeImpactPercent <= 3.0 // Costs should be earned back within 3 years of savings
    : true;

  // 2. Renteforskel rule of thumb:
  // - Opkonvertering: renteforskel should ideally be >= +1.5%
  // - Nedkonvertering: renteforskel should ideally be <= -1.0% to -1.5%
  const meetsRateThreshold = isOpkonvertering 
    ? renteDiff >= 1.5 
    : isNedkonvertering 
    ? renteDiff <= -1.0 
    : false;

  // 3. Kurs rule of thumb on new loan:
  // New loan price should ideally be >= 95-96 to avoid heavy kurstab
  const isGoodNewKurs = newKurs >= 95.0;

  // Breakeven horizon evaluation
  const hasSensibleBreakeven = isOpkonvertering 
    ? (breakevenYears !== null && breakevenYears >= 7) // You want many years before higher ydelse eats your debt reduction!
    : (breakevenYears !== null && breakevenYears <= 8); // For nedkonvertering, you want costs earned back quickly

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-hidden">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className="relative w-full max-w-3xl max-h-[90vh] flex flex-col rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-5 sm:p-7 z-10 overflow-hidden text-slate-800 dark:text-slate-100 transition-colors">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 shrink-0">
              <Lightbulb className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                  Dumb Ideas & Tommelfingerregler
                </h3>
                <span className="rounded-md bg-amber-100 dark:bg-amber-900/40 px-2 py-0.5 text-[11px] font-semibold text-amber-800 dark:text-amber-300">
                  Reality Check
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Konsekvenser og tommelfingerregler for {existingLoan.name} &rarr; {newLoan.name}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {tillaegslaanComparison && (
              <div className="flex items-center rounded-lg bg-slate-100 dark:bg-slate-800 p-1 text-xs font-medium">
                <button
                  type="button"
                  onClick={() => setActiveStrategy('full')}
                  className={`flex items-center gap-1 rounded-md px-2.5 py-1 transition-all ${
                    activeStrategy === 'full'
                      ? 'bg-white text-slate-900 shadow-xs font-semibold dark:bg-slate-700 dark:text-white'
                      : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
                  }`}
                >
                  <ArrowRightLeft className="h-3.5 w-3.5" />
                  <span>Option A: Fuld omlægning</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveStrategy('tillaeg')}
                  className={`flex items-center gap-1 rounded-md px-2.5 py-1 transition-all ${
                    activeStrategy === 'tillaeg'
                      ? 'bg-white text-slate-900 shadow-xs font-semibold dark:bg-slate-700 dark:text-white'
                      : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
                  }`}
                >
                  <Layers className="h-3.5 w-3.5" />
                  <span>Option B: Tillægslån</span>
                </button>
              </div>
            )}

            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition-colors cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="mt-4 space-y-6 flex-1 overflow-y-auto pr-1 py-1">
          
          {/* Section 1: "If you do this now, the effects are" */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/75 dark:bg-slate-800/40 p-5 space-y-3">
            <h4 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Compass className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              Hvis du gennemfører denne omlægning nu:
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div className="rounded-lg border border-slate-200/80 dark:border-slate-700/80 bg-white dark:bg-slate-900 p-3.5 flex flex-col justify-between">
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Kort sigt (måned til måned)</span>
                <div className="mt-1">
                  <div className={`text-base font-bold ${deltaMonthlyYdelseEfterSkat <= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                    {deltaMonthlyYdelseEfterSkat > 0 ? '+' : ''}{formatKr(deltaMonthlyYdelseEfterSkat)}/md.
                  </div>
                  <p className="mt-1 text-xs text-slate-600 dark:text-slate-400 leading-normal">
                    {deltaMonthlyYdelseEfterSkat > 0
                      ? `Din månedlige ydelse efter skat stiger med ${formatKr(deltaMonthlyYdelseEfterSkat)}. Dit månedlige rådighedsbeløb bliver strammere.`
                      : `Din månedlige ydelse falder med ${formatKr(Math.abs(deltaMonthlyYdelseEfterSkat))}. Du sparer ${formatKr(Math.abs(deltaMonthlyYdelseEfterSkat) * 12)} om året.`}
                  </p>
                </div>
              </div>

              <div className="rounded-lg border border-slate-200/80 dark:border-slate-700/80 bg-white dark:bg-slate-900 p-3.5 flex flex-col justify-between">
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Lang sigt (restgæld & breakeven)</span>
                <div className="mt-1">
                  <div className={`text-base font-bold ${deltaRestgaeld <= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                    {deltaRestgaeld > 0 ? '+' : ''}{formatKr(deltaRestgaeld)} i restgæld
                  </div>
                  <p className="mt-1 text-xs text-slate-600 dark:text-slate-400 leading-normal">
                    {isOpkonvertering
                      ? breakevenYears 
                        ? `Du skærer ${formatKr(Math.abs(deltaRestgaeld))} af din restgæld. Breakeven er ca. ${breakevenYears.toFixed(1)} år, hvorefter den højere ydelse har ædt kursgevinsten op.`
                        : `Gælden falder med ${formatKr(Math.abs(deltaRestgaeld))}.`
                      : breakevenYears
                        ? `Din restgæld øges med ${formatKr(deltaRestgaeld)} pga. kurstab og omkostninger (${formatKr(fees.samledeOmkostninger)}). Dette er tjent hjem på ca. ${breakevenYears.toFixed(1)} år.`
                        : `Din gæld øges med ${formatKr(deltaRestgaeld)}.`
                    }
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Scenarier - Renter stiger vs. falder */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Renter falder */}
            <div className="rounded-xl border border-blue-200 dark:border-blue-900/60 bg-blue-50/40 dark:bg-blue-950/20 p-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 text-sm font-bold text-blue-900 dark:text-blue-300">
                  <TrendingDown className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  Hvis renten falder fremover
                </div>
                <div className="mt-2 text-xs text-slate-600 dark:text-slate-400 leading-relaxed space-y-2">
                  {(Boolean(newLoan.flex) || newLoan.name.toLowerCase().includes('f-kort')) ? (
                    <p>
                      <strong className="text-emerald-600 dark:text-emerald-400 font-semibold">Automatisk rentefald ({newLoan.name}):</strong> Dit variabelt forrentede lån tilpasses automatisk hver 6. måned. Hvis markedsrenten falder, får du automatisk en lavere månedlig ydelse uden konverteringsomkostninger.
                    </p>
                  ) : isOpkonvertering ? (
                    <p>
                      <strong className="text-emerald-600 dark:text-emerald-400 font-semibold">Du er foran (drømmescenariet):</strong> Du kan nedkonvertere dit nye {newLoan.name} lån til kurs ~100 med en lav rente, og dermed <em>fastlåse</em> den reducerede restgæld permanent med en lav månedlig ydelse.
                    </p>
                  ) : (
                    <p>
                      <strong className="text-amber-600 dark:text-amber-400 font-semibold">Du kan overveje ny omlægning:</strong> Men husk, at du lige har betalt {formatKr(fees.samledeOmkostninger)} i omkostninger. Hvis du omlægger igen for hurtigt, når de gamle stiftelsesomkostninger ikke at tjene sig hjem.
                    </p>
                  )}
                </div>
              </div>
              <div className="mt-3 pt-2.5 border-t border-blue-200/60 dark:border-blue-900/40 text-[11px] font-medium text-blue-700 dark:text-blue-400">
                {(Boolean(newLoan.flex) || newLoan.name.toLowerCase().includes('f-kort')) ? 'Status: F-kort slår igennem direkte på ydelsen uden gebyrer' : isOpkonvertering ? 'Status: Kæmpe gevinst hvis renten falder inden for 3-5 år' : 'Status: Foran på ydelse, men låst af stiftelsesomkostninger'}
              </div>
            </div>

            {/* Renter stiger */}
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 p-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-slate-200">
                  <TrendingUp className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                  Hvis renten stiger yderligere
                </div>
                <div className="mt-2 text-xs text-slate-600 dark:text-slate-400 leading-relaxed space-y-2">
                  {(Boolean(newLoan.flex) || newLoan.name.toLowerCase().includes('f-kort')) ? (
                    <p>
                      <strong className="text-rose-600 dark:text-rose-400 font-semibold">Variabel renterisiko ({newLoan.name}):</strong> Dit lån har ingen kursbeskyttelse mod rentestigninger. Hvis CITA/CIBOR-renten stiger, stiger din ydelse direkte uden at give dig kursgevinst på restgælden.
                    </p>
                  ) : isOpkonvertering ? (
                    <p>
                      <strong className="text-amber-600 dark:text-amber-400 font-semibold">Tidspres på breakeven:</strong> Kursen på dit nye lån vil også falde, så du kan skære endnu mere af gælden ved en ny konvertering. Men hvis du bliver i lånet, vil den høje ydelse efter ca. {breakevenYears ? breakevenYears.toFixed(0) : '7-10'} år overstige din oprindelige gældsgevinst.
                    </p>
                  ) : (
                    <p>
                      <strong className="text-rose-600 dark:text-rose-400 font-semibold">Bagud på restgæld:</strong> Du sidder med et nyt lån med højere nominel restgæld ({formatKr(nyHovedstol)}) end hvis du var blevet i dit gamle lån.
                    </p>
                  )}
                </div>
              </div>
              <div className="mt-3 pt-2.5 border-t border-slate-200/80 dark:border-slate-700 text-[11px] font-medium text-slate-600 dark:text-slate-400">
                {(Boolean(newLoan.flex) || newLoan.name.toLowerCase().includes('f-kort')) ? 'Status: Eksponeret over for rentehop på halvårlige refiksinger' : isOpkonvertering ? 'Status: Kræver aktiv overvågning af rentemarkedet' : 'Status: Sikret på den faste månedlige rentebesparelse'}
              </div>
            </div>

          </div>

          {/* Section 3: Tommelfingerregler i Realkredit (Checklist) */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-4">
            <h4 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              Tjek mod klassiske tommelfingerregler
            </h4>

            <div className="space-y-3 text-xs">
              
              {/* Regel 1: Omkostninger i forhold til gevinst/ændring */}
              <div className="flex items-start justify-between gap-4 p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                <div className="space-y-0.5">
                  <div className="font-semibold text-slate-800 dark:text-slate-200">
                    1. Omkostninger i forhold til gevinst ({formatKr(fees.samledeOmkostninger)})
                  </div>
                  <div className="text-slate-500 dark:text-slate-400">
                    {isOpkonvertering ? (
                      <>
                        Omkostningerne udgør <strong>{feeImpactPercent.toFixed(1)} %</strong> af din kursgevinst ved indfrielse ({formatKr(comparison.kursgevinstIndfrielse)}).
                        {feeImpactPercent <= 10
                          ? ' En sund omlægning hvor gebyrerne kun æder en lille brøkdel af gældskuttet.'
                          : ' Gebyrerne æder en mærkbar del af gældsreduktionen.'}
                      </>
                    ) : isNedkonvertering ? (
                      <>
                        Omkostningerne svarer til ca. <strong>{feeImpactPercent.toFixed(1)} års</strong> rentebesparelse ({formatKr(Math.abs(deltaMonthlyYdelseEfterSkat) * 12)}/år efter skat).
                        {feeImpactPercent <= 3
                          ? ' Omkostningerne er hurtigt tjent hjem af den lavere ydelse.'
                          : ' Det tager relativt lang tid alene at tjene stiftelsesomkostningerne hjem.'}
                      </>
                    ) : (
                      <>
                        Samlede omkostninger på {formatKr(fees.samledeOmkostninger)} skal vurderes mod lånets ændrede vilkår.
                      </>
                    )}
                  </div>
                </div>
                <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold shrink-0 ${
                  isFeeProportionHealthy 
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300' 
                    : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                }`}>
                  {isOpkonvertering 
                    ? `${feeImpactPercent.toFixed(1)} % af gevinst ${isFeeProportionHealthy ? '(Sundt)' : '(Højt)'}`
                    : isNedkonvertering
                    ? `${feeImpactPercent.toFixed(1)} års besparelse ${isFeeProportionHealthy ? '(Sundt)' : '(Langsomt)'}`
                    : `${formatKr(fees.samledeOmkostninger)}`}
                </span>
              </div>

              {/* Regel 2: Renteforskel */}
              <div className="flex items-start justify-between gap-4 p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                <div className="space-y-0.5">
                  <div className="font-semibold text-slate-800 dark:text-slate-200">
                    2. Renteforskel på mindst {isOpkonvertering ? '+1,5 procentpoint' : '1,0 – 1,5 procentpoint'}
                  </div>
                  <div className="text-slate-500 dark:text-slate-400">
                    {isOpkonvertering
                      ? `Ved opkonvertering skal rentestigningen give et markant kursfald for at retfærdiggøre mer-ydelsen.`
                      : `Ved nedkonvertering skal rentebesparelsen være stor nok til at tjene kurstabet og stiftelsesomkostningerne hjem.`}
                  </div>
                </div>
                <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold shrink-0 ${
                  meetsRateThreshold 
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300' 
                    : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                }`}>
                  {renteDiff > 0 ? `+${renteDiff} %-point` : `${renteDiff} %-point`} {meetsRateThreshold ? '(Godkendt)' : '(Lille forskel)'}
                </span>
              </div>

              {/* Regel 3: Kurs på det nye lån */}
              <div className="flex items-start justify-between gap-4 p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                <div className="space-y-0.5">
                  <div className="font-semibold text-slate-800 dark:text-slate-200">
                    3. Kurs på nyt lån tæt på 100 (mindst 95-96)
                  </div>
                  <div className="text-slate-500 dark:text-slate-400">
                    Når obligationskursen er under 100, lider du et kurstab ved udbetaling. Lige nu er kursen {formatKurs(newKurs)} (kurstab: {formatKr(comparison.kurstabOptagelse)}).
                  </div>
                </div>
                <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold shrink-0 ${
                  isGoodNewKurs 
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300' 
                    : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                }`}>
                  Kurs {formatKurs(newKurs)} {isGoodNewKurs ? '(Høj)' : '(Lav kurs / kurstab)'}
                </span>
              </div>

              {/* Regel 4: Tidshorisont og Breakeven */}
              <div className="flex items-start justify-between gap-4 p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                <div className="space-y-0.5">
                  <div className="font-semibold text-slate-800 dark:text-slate-200">
                    4. Boetid vs. Breakeven-horisont
                  </div>
                  <div className="text-slate-500 dark:text-slate-400">
                    {isOpkonvertering
                      ? `Hvis du skal sælge eller omlægge inden for 3-7 år, når mer-ydelsen ikke at udhule gældsbesparelsen.`
                      : `Du bør forvente at blive boende i mindst 5-8 år, så den lavere ydelse når at tjene stiftelsesomkostningerne hjem.`}
                  </div>
                </div>
                <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold shrink-0 ${
                  hasSensibleBreakeven
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                    : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                }`}>
                  {breakevenYears ? `Breakeven: ${breakevenYears.toFixed(1)} år` : 'Ingen breakeven'}
                </span>
              </div>

            </div>
          </div>

          {/* Section 4: The "Trap" Warning / Reality Check */}
          <div className="rounded-xl border border-amber-200 dark:border-amber-900/60 bg-amber-50/50 dark:bg-amber-950/20 p-4 text-xs text-amber-900 dark:text-amber-300 leading-relaxed flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div>
              <strong className="font-bold text-amber-950 dark:text-amber-200">
                {isOpkonvertering ? 'Fælden ved opkonvertering:' : 'Fælden ved nedkonvertering:'}
              </strong>{' '}
              {isOpkonvertering ? (
                <>
                  Hvis renten <em>ikke</em> falder igen, og du bliver boende i hele lånets løbetid, vil du have betalt langt mere i renter, end du skar af gælden. En opkonvertering er en aktiv satsning på, at renten falder inden for de næste 3–7 år.
                </>
              ) : (
                <>
                  Hvis du optager et nyt lån med for lav kurs (under 95), eller planlægger at flytte inden for få år, når du aldrig at tjene kurstabet og stiftelsesomkostningerne på {formatKr(fees.samledeOmkostninger)} hjem gennem de månedlige besparelser.
                </>
              )}
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="mt-4 border-t border-slate-100 dark:border-slate-800 pt-3 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="rounded-xl bg-slate-900 px-5 py-2.5 text-xs font-semibold text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white transition-colors cursor-pointer"
          >
            Forstået, luk reality check
          </button>
        </div>

      </div>
    </div>
  );
};
