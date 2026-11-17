/**
 * One colour per selected bench on the booking calendar, by its position in the selection. Green and orange are left
 * out: on the calendar they already mean "my booking" and "someone else's booking".
 */
export const BENCH_COLORS = [
  'var(--lm-chart-1)',
  'var(--lm-chart-5)',
  'var(--lm-chart-3)',
  'var(--lm-chart-2)',
  'var(--lm-cat-instrument)',
  'var(--lm-cat-mechanical)',
] as const;

export function benchColor(selectedIds: readonly number[], benchId: number | null | undefined): string | undefined {
  if (benchId == null) return undefined;
  const index = selectedIds.indexOf(benchId);
  return index < 0 ? undefined : BENCH_COLORS[index % BENCH_COLORS.length];
}

/** The calendar remembers each person's bench selection in this browser. */
export const benchSelectionStorageKey = (userKey: string | number | null | undefined) =>
  `labmango.booking-calendar.benches.${userKey ?? 'anonymous'}`;

export function readBenchSelection(key: string): number[] {
  try {
    const raw = window.localStorage.getItem(key);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((id): id is number => Number.isInteger(id)) : [];
  } catch {
    return [];
  }
}

export function writeBenchSelection(key: string, ids: number[]): void {
  try {
    if (ids.length) window.localStorage.setItem(key, JSON.stringify(ids));
    else window.localStorage.removeItem(key);
  } catch {
    // Private windows or blocked storage: the selection just isn't remembered.
  }
}
