/**
 * Session-scoped deduplication for one-time push alerts.
 * Guarantees a notification ID pops up at most once per browser session even across
 * React StrictMode double-mounts, token refreshes, or brief WebSocket reconnects.
 */

const STORAGE_KEY = 'lm:shown-alert-ids';
const MAX_STORED_IDS = 200;

let memoryIds: number[] | null = null;

function readIds(): number[] {
  if (memoryIds !== null) return memoryIds;
  try {
    const raw = typeof sessionStorage !== 'undefined' ? sessionStorage.getItem(STORAGE_KEY) : null;
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        memoryIds = parsed.filter((entry): entry is number => typeof entry === 'number');
        return memoryIds;
      }
    }
  } catch {
    // Ignore storage read errors (private mode / blocked storage).
  }
  memoryIds = [];
  return memoryIds;
}

function writeIds(ids: number[]): void {
  const trimmed = ids.length > MAX_STORED_IDS ? ids.slice(ids.length - MAX_STORED_IDS) : ids;
  memoryIds = trimmed;
  try {
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
    }
  } catch {
    // Fall back to in-memory set when storage is unavailable.
  }
}

export function hasShownAlert(id: number): boolean {
  return readIds().includes(id);
}

export function markAlertShown(id: number): void {
  const current = readIds();
  if (current.includes(id)) return;
  writeIds([...current, id]);
}

export function clearShownAlerts(): void {
  memoryIds = [];
  try {
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.removeItem(STORAGE_KEY);
    }
  } catch {
    // Ignore storage errors.
  }
}
