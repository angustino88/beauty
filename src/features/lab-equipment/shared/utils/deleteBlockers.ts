export interface BlockedDeleteEntry {
  label: string;
  sku: string | null;
  name: string | null;
  categoryKey: string | null;
}

export interface BlockedDeleteGroup {
  key: string;
  total: number;
  items: string[];
  entries: BlockedDeleteEntry[];
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
 * Splits a `"SKU — Name"` blocker label into its SKU and Name components.
 */
export function splitBlockerLabel(label: string): { sku: string | null; name: string | null } {
  const trimmed = label.trim();
  if (!trimmed) return { sku: null, name: null };
  const separatorIndex = trimmed.indexOf(' — ');
  if (separatorIndex > 0) {
    const sku = trimmed.slice(0, separatorIndex).trim();
    const name = trimmed.slice(separatorIndex + 3).trim();
    return { sku: sku || null, name: name || null };
  }
  return { sku: trimmed, name: null };
}

/**
 * Extracts the searchable identifier prefix from a `"SKU — Name"` blocker label.
 * Falls back to the full trimmed label when no em-dash separator is present.
 */
export function extractBlockerSearchToken(label: string): string {
  const { sku } = splitBlockerLabel(label);
  return sku ?? label.trim();
}

const METADATA_LIST_GROUPS = new Set(['equipment_categories']);

/**
 * Parses a DRF / Lab Mango delete error into a structured conflict summary.
 * Supports the standard flattened `error.details` list (`stations_total`, `stations[0]`,
 * `equipment_categories[0]`, …) as well as legacy message-only 409 conflicts.
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
  const equipmentCategoriesByIndex = new Map<number, string>();
  const order: string[] = [];

  const registerGroup = (group: string) => {
    if (METADATA_LIST_GROUPS.has(group)) return;
    if (!order.includes(group)) order.push(group);
  };

  const rawDetails = raw.data?.error?.details;
  if (Array.isArray(rawDetails)) {
    for (const entry of rawDetails) {
      const field = typeof entry?.field === 'string' ? entry.field : '';
      const entryMessage = typeof entry?.message === 'string' ? entry.message.trim() : '';
      if (!field) continue;

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
        const closeIndex = field.indexOf(']', bracketIndex);
        const index =
          closeIndex > bracketIndex ? Number.parseInt(field.slice(bracketIndex + 1, closeIndex), 10) : NaN;
        if (group === 'equipment_categories') {
          if (Number.isFinite(index) && entryMessage) {
            equipmentCategoriesByIndex.set(index, entryMessage);
          }
          continue;
        }
        if (!entryMessage) continue;
        registerGroup(group);
        const list = itemsByGroup.get(group) ?? [];
        list.push(entryMessage);
        itemsByGroup.set(group, list);
      }
    }
  } else if (rawDetails && typeof rawDetails === 'object') {
    for (const [key, value] of Object.entries(rawDetails)) {
      if (key === 'equipment_categories' && Array.isArray(value)) {
        value.forEach((item, idx) => {
          if (typeof item === 'string' && item.trim()) {
            equipmentCategoriesByIndex.set(idx, item.trim());
          }
        });
        continue;
      }
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
      const entries: BlockedDeleteEntry[] = items.map((label, idx) => {
        const { sku, name } = splitBlockerLabel(label);
        const categoryKey = key === 'equipment' ? (equipmentCategoriesByIndex.get(idx) ?? null) : null;
        return { label, sku, name, categoryKey };
      });
      return { key, total, items, entries };
    })
    .filter((group) => group.total > 0 || group.items.length > 0);

  return {
    isConflict,
    code,
    message,
    groups,
  };
}
