export interface StatusSummaryEntry {
  status: { value: string; label?: string };
  count: number;
}

/** Merge aliases without losing counts; unknown states stay visible as their own entries. */
export function groupStatusCounts<T extends StatusSummaryEntry>(
  statuses: readonly T[],
  normalize: (status: unknown) => string,
  labelFor: (status: unknown) => string,
): StatusSummaryEntry[] {
  const groups = new Map<string, StatusSummaryEntry>();
  for (const entry of statuses) {
    const value = normalize(entry.status.value);
    if (!value) continue;
    const existing = groups.get(value);
    if (existing) {
      existing.count += entry.count;
    } else {
      const rawValue = entry.status.value.trim().toLowerCase().replace(/[\s-]+/g, '_');
      groups.set(value, {
        status: {
          value,
          label: value === rawValue
            ? entry.status.label || labelFor(value)
            : labelFor(value),
        },
        count: entry.count,
      });
    }
  }
  return [...groups.values()];
}