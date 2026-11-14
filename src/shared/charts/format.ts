/** 1234 → "1.2k", 1_250_000 → "1.25M". Keeps small numbers exact. */
export function formatCompact(value: unknown, digits = 1): string {
  const n = Number(value);
  if (!Number.isFinite(n)) return '—';
  const abs = Math.abs(n);
  if (abs >= 1_000_000) return `${+(n / 1_000_000).toFixed(digits + 1)}M`;
  if (abs >= 10_000) return `${+(n / 1000).toFixed(0)}k`;
  if (abs >= 1000) return `${+(n / 1000).toFixed(digits)}k`;
  return Number.isInteger(n) ? String(n) : n.toFixed(digits);
}

export function formatNumber(value: unknown, digits = 1): string {
  const n = Number(value);
  if (!Number.isFinite(n)) return '—';
  return n.toLocaleString(undefined, { maximumFractionDigits: Number.isInteger(n) ? 0 : digits });
}

export function formatPercent(part: number, total: number): string {
  if (!total) return '0%';
  const pct = (part / total) * 100;
  return pct > 0 && pct < 1 ? '<1%' : `${Math.round(pct)}%`;
}

/** Min / average / max of a numeric series, ignoring non-finite values. */
export function seriesStats(values: number[]): { min: number; avg: number; max: number } | null {
  const finite = values.filter((v) => Number.isFinite(v));
  if (!finite.length) return null;
  const sum = finite.reduce((a, b) => a + b, 0);
  return { min: Math.min(...finite), avg: sum / finite.length, max: Math.max(...finite) };
}
