import type { BondLoan } from '../calculator/types';
import { formatPercent } from './formatters';

export interface ParsedBondAttributes {
  renteKey: string; // e.g. "4.0" or "flex"
  renteDisplay: string; // e.g. "4,0 %" or "F-kort (variabel)"
  yearKey: string; // e.g. "2059" or "30"
  yearDisplay: string; // e.g. "30 år (2059)"
  afdragKey: string; // e.g. "med-afdrag" or "10-aar" or "30-aar"
  afdragDisplay: string; // e.g. "Med afdrag" or "Afdragsfrihed (op til 10 år)"
}

export function parseBondLoan(loan: BondLoan): ParsedBondAttributes {
  // 1. Rente
  const isFlex = Boolean(loan.flex) || loan.name.toLowerCase().includes('f-kort');
  const renteKey = isFlex ? 'flex' : loan.rente.toFixed(1);
  const renteDisplay = isFlex ? `F-kort (${formatPercent(loan.rente)})` : formatPercent(loan.rente);

  // 2. Year / Maturity
  let yearKey = '';
  let yearDisplay = '';
  const matchYear = loan.name.match(/\b(20\d\d)\b/);
  const udloeb = loan.udloebsAar || (matchYear ? parseInt(matchYear[1], 10) : undefined);
  const loebetid = loan.loebetid;

  if (udloeb) {
    yearKey = udloeb.toString();
    yearDisplay = loebetid ? `${loebetid} år (${udloeb})` : `Udløb ${udloeb}`;
  } else if (loebetid) {
    yearKey = loebetid.toString();
    yearDisplay = `${loebetid} år`;
  } else {
    yearKey = '30';
    yearDisplay = '30 år';
  }

  // 3. Afdragsfrihed
  let afdragKey = 'med-afdrag';
  let afdragDisplay = 'Med afdrag';

  const lowerName = loan.name.toLowerCase();
  if (lowerName.includes('30 års afdragsfri') || lowerName.includes('30 da')) {
    afdragKey = '30-aar';
    afdragDisplay = 'Afdragsfri (op til 30 år)';
  } else if (loan.afdragsfri || lowerName.includes('afdragsfri') || lowerName.includes('da')) {
    afdragKey = '10-aar';
    afdragDisplay = 'Afdragsfri (op til 10 år)';
  }

  return {
    renteKey,
    renteDisplay,
    yearKey,
    yearDisplay,
    afdragKey,
    afdragDisplay,
  };
}
