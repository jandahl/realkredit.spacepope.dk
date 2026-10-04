import type { LoanAmortizationResult } from '../calculator/types';

/**
 * Generates a standard Danish CSV string (semicolon-delimited with comma decimals)
 * for an amortization schedule and triggers a client-side file download.
 */
export function exportAmortizationToCsv(
  calculation: LoanAmortizationResult,
  fileName: string = 'amortiseringsplan.csv',
  mode: 'quarterly' | 'yearly' = 'quarterly',
): void {
  const formatNum = (n: number): string => {
    return Math.round(n).toString();
  };

  let rows: string[][] = [];

  if (mode === 'yearly') {
    rows.push([
      'År',
      'Restgæld primo (kr)',
      'Afdrag (kr)',
      'Rente (kr)',
      'Bidrag (kr)',
      'Ydelse før skat (kr)',
      'Skattefradrag (kr)',
      'Ydelse efter skat (kr)',
      'Restgæld ultimo (kr)',
    ]);

    const totalYears = Math.ceil(calculation.schedule.length / 4);
    for (let y = 1; y <= totalYears; y++) {
      const qInYear = calculation.schedule.filter((q) => q.year === y);
      const startRestgaeld = qInYear[0]?.startRestgaeld || 0;
      const endRestgaeld = qInYear[qInYear.length - 1]?.endRestgaeld || 0;
      const afdrag = qInYear.reduce((s, q) => s + q.afdrag, 0);
      const rente = qInYear.reduce((s, q) => s + q.rente, 0);
      const bidrag = qInYear.reduce((s, q) => s + q.bidrag, 0);
      const ydelseFoerSkat = qInYear.reduce((s, q) => s + q.ydelseFoerSkat, 0);
      const skatFradrag = qInYear.reduce((s, q) => s + q.skatFradrag, 0);
      const ydelseEfterSkat = qInYear.reduce((s, q) => s + q.ydelseEfterSkat, 0);

      rows.push([
        y.toString(),
        formatNum(startRestgaeld),
        formatNum(afdrag),
        formatNum(rente),
        formatNum(bidrag),
        formatNum(ydelseFoerSkat),
        formatNum(skatFradrag),
        formatNum(ydelseEfterSkat),
        formatNum(endRestgaeld),
      ]);
    }
  } else {
    rows.push([
      'Termin',
      'År',
      'Kvartal',
      'Restgæld primo (kr)',
      'Afdrag (kr)',
      'Rente (kr)',
      'Bidrag (kr)',
      'Ydelse før skat (kr)',
      'Skattefradrag (kr)',
      'Ydelse efter skat (kr)',
      'Restgæld ultimo (kr)',
    ]);

    for (const q of calculation.schedule) {
      rows.push([
        q.quarter.toString(),
        q.year.toString(),
        q.quarterOfYear.toString(),
        formatNum(q.startRestgaeld),
        formatNum(q.afdrag),
        formatNum(q.rente),
        formatNum(q.bidrag),
        formatNum(q.ydelseFoerSkat),
        formatNum(q.skatFradrag),
        formatNum(q.ydelseEfterSkat),
        formatNum(q.endRestgaeld),
      ]);
    }
  }

  // Semicolon separator with BOM for seamless opening in Excel (Danish locale)
  const csvContent =
    '\uFEFF' + rows.map((r) => r.map((c) => `"${c.replace(/"/g, '""')}"`).join(';')).join('\r\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', fileName.endsWith('.csv') ? fileName : `${fileName}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
