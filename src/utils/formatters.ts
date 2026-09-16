export function formatKr(val: number, includeDecimals = false): string {
  if (isNaN(val) || !isFinite(val)) return '0 kr.';
  const rounded = includeDecimals ? Math.round(val * 100) / 100 : Math.round(val);
  return (
    rounded.toLocaleString('da-DK', {
      minimumFractionDigits: includeDecimals ? 2 : 0,
      maximumFractionDigits: includeDecimals ? 2 : 0,
    }) + ' kr.'
  );
}

export function formatNumber(val: number, decimals = 0): string {
  if (isNaN(val) || !isFinite(val)) return '0';
  return val.toLocaleString('da-DK', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

export function formatPercent(val: number, decimals = 2): string {
  if (isNaN(val) || !isFinite(val)) return '0 %';
  return (
    val.toLocaleString('da-DK', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }) + ' %'
  );
}

export function formatKurs(val: number): string {
  if (isNaN(val) || !isFinite(val)) return '0,00';
  return val.toLocaleString('da-DK', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}
