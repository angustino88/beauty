export interface BlockedDeleteGroup {
  key: string;
  total: number;
  items: string[];
}

export interface ParsedBlockedDeleteError {
  isConflict: boolean;
  code?: string;
  message: string;
  groups: BlockedDeleteGroup[];
}

interface RawErrorDetail {
  field?: string | null;
  code?: string | null;
  message?: string | null;
}

interface RawApiError {
  status?: number;
  data?: {
    message?: string;
    detail?: string;
    error?: {
      code?: string;
      message?: string;
      details?: RawErrorDetail[] | Record<string, unknown>;
    };
  };
}

/**
 * Extracts the searchable identifier prefix from a `"SKU — Name"` blocker label.
 * Falls back to the full trimmed label when no em-dash separator is present.
 */
export function extractBlockerSearchToken(label: string): string {
  const trimmed = label.trim();
  const separatorIndex = trimmed.indexOf(' — ');
  if (separatorIndex > 0) {
    return trimmed.slice(0, separatorIndex).trim();
  }
  return trimmed;
}

/**
 * Parses a DRF / Lab Mango delete error into a structured conflict summary.
 * Supports the standard flattened `error.details` list (`stations_total`, `stations[0]`, …)
 * as well as legacy message-only 409 conflicts.
 */
export function parseBlockedDeleteError(
  err: unknown,
  fallbackMessage = 'Could not delete this item.',
): ParsedBlockedDeleteError {
  const raw = (err ?? {}) as RawApiError;
  const status = raw.status;
  const code = raw.data?.error?.code;
  const message =
    raw.data?.error?.message ||
    raw.data?.message ||
    raw.data?.detail ||
    fallbackMessage;

  const isConflict =
    status === 409 ||
    code === 'room_conflict' ||
    code === 'location_conflict' ||
    code === 'bench_conflict' ||
    code === 'license_conflict' ||
    code === 'conflict';

  const totals = new Map<string, number>();
  const itemsByGroup = new Map<string, string[]>();
  const order: string[] = [];

  const registerGroup = (group: string) => {
    if (!order.includes(group)) order.push(group);
  };

  const rawDetails = raw.data?.error?.details;
  if (Array.isArray(rawDetails)) {
    for (const entry of rawDetails) {
      const field = typeof entry?.field === 'string' ? entry.field : '';
      const entryMessage = typeof entry?.message === 'string' ? entry.message.trim() : '';
      if (!field || !entryMessage) continue;

      if (field.endsWith('_total')) {
        const group = field.slice(0, -'_total'.length);
        const parsed = Number.parseInt(entryMessage, 10);
        if (group && Number.isFinite(parsed) && parsed > 0) {
          registerGroup(group);
          totals.set(group, parsed);
        }
        continue;
      }

      const bracketIndex = field.indexOf('[');
      if (bracketIndex > 0) {
        const group = field.slice(0, bracketIndex);
        registerGroup(group);
        const list = itemsByGroup.get(group) ?? [];
        list.push(entryMessage);
        itemsByGroup.set(group, list);
      }
    }
  } else if (rawDetails && typeof rawDetails === 'object') {
    for (const [key, value] of Object.entries(rawDetails)) {
      if (key.endsWith('_total') && typeof value === 'number' && value > 0) {
        const group = key.slice(0, -'_total'.length);
        registerGroup(group);
        totals.set(group, value);
      } else if (Array.isArray(value)) {
        const strings = value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0);
        if (strings.length > 0) {
          registerGroup(key);
          itemsByGroup.set(key, strings);
        }
      }
    }
  }

  const groups: BlockedDeleteGroup[] = order
    .map((key) => {
      const items = itemsByGroup.get(key) ?? [];
      const total = totals.get(key) ?? items.length;
      return { key, total, items };
    })
    .filter((group) => group.total > 0 || group.items.length > 0);

  return {
    isConflict,
    code,
    message,
    groups,
  };
}
