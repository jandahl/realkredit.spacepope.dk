export type AppMode = 'edit' | 'report';

/** True when URL looks like a shared calculator link (has scenario params). */
export function hasShareParams(search: string): boolean {
  const params = new URLSearchParams(
    search.startsWith('?') ? search.slice(1) : search,
  );
  return params.has('tab') || params.has('pv') || params.has('debt');
}

/**
 * Resolve edit vs report mode from the query string.
 * - Explicit `mode=edit|report` always wins.
 * - Shared links (tab/pv/debt) default to report.
 * - Fresh visits without share params default to edit.
 */
export function resolveAppMode(search: string): AppMode {
  const params = new URLSearchParams(
    search.startsWith('?') ? search.slice(1) : search,
  );
  const modeParam = params.get('mode');
  if (modeParam === 'edit' || modeParam === 'report') return modeParam;
  return hasShareParams(search) ? 'report' : 'edit';
}

/** Build a share URL that forces recipients into report mode. */
export function buildShareUrl(href: string): string {
  const url = new URL(href);
  url.searchParams.set('mode', 'report');
  return url.toString();
}
