import dayjs from 'dayjs';

export const toPercent = (v: number | null | undefined, d = 1): string =>
  v != null ? `${(v * 100).toFixed(d)}%` : '—';

export const toPercentAbsolute = (v: number | null | undefined, d = 1): string =>
  v != null ? `${v.toFixed(d)}%` : '—';

export const toNumber = (v: number | null | undefined, suffix = ''): string =>
  v != null ? `${v}${suffix}` : '—';

export const toMinutes = (v: number | null | undefined): string => {
  if (v == null) return '—';
  const m = Math.round(v);
  return `${m} ${m > 1 ? 'mins' : 'min'}`;
};

export const toHours = (v: number | null | undefined): string => {
  if (v == null) return '—';
  const rounded = Math.round(v);
  // Use 0.01 tolerance (≈36 seconds) — Number.EPSILON is too tight for floating-point hours
  const isWhole = Math.abs(v - rounded) < 0.01;
  const display = isWhole ? `${rounded}` : `${v.toFixed(1)}`;
  const numeric = parseFloat(display);
  const unit = Math.abs(numeric - 1) < 0.01 ? 'hr' : 'hrs';
  return `${display} ${unit}`;
};

export const toDateTime = (v: string | null | undefined): string =>
  v ? dayjs(v).format('YYYY-MM-DD HH:mm') : '—';
