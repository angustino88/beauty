/**
 * One status colour language for spaces, equipment and licenses.
 *
 * Tones describe what a person should do about a resource, not which entity it is:
 *   success  ready to use                       (available, operational)
 *   info     busy but healthy                    (in use, planned, on order)
 *   reserved committed or access-limited         (reserved, borrowed, closed)
 *   warning  needs attention soon                (maintenance, calibration due)
 *   danger   not usable, needs action            (broken, out of service, lost)
 *   neutral  out of circulation or unknown       (retired, transferred, storage)
 */
export type StatusTone = 'success' | 'info' | 'reserved' | 'warning' | 'danger' | 'neutral';

export const STATUS_TONES: readonly StatusTone[] = ['success', 'info', 'reserved', 'warning', 'danger', 'neutral'];

/** Tones that count towards "needs attention" in overviews. */
export const ATTENTION_TONES: ReadonlySet<StatusTone> = new Set(['warning', 'danger']);

const TONE_BY_STATUS: Record<string, StatusTone> = {
  available: 'success',
  free: 'success',
  online: 'success',
  operational: 'success',
  in_service: 'success',
  active: 'success',

  in_use: 'info',
  occupied: 'info',
  assigned: 'info',
  scheduled: 'info',
  planned: 'info',
  on_order: 'info',
  trial: 'info',

  reserved: 'reserved',
  booked: 'reserved',
  borrowed: 'reserved',
  on_loan: 'reserved',
  closed: 'reserved',
  restricted: 'reserved',

  maintenance: 'warning',
  in_maintenance: 'warning',
  needs_review: 'warning',
  calibration_overdue: 'warning',
  suspended: 'warning',

  issue: 'danger',
  broken: 'danger',
  out_of_service: 'danger',
  lost: 'danger',
  fault: 'danger',
  revoked: 'danger',
  expired: 'danger',

  retired: 'neutral',
  transferred: 'neutral',
  transferred_out: 'neutral',
  in_storage: 'neutral',
  inactive: 'neutral',
  deactivated: 'neutral',
};

export function normalizeStatusKey(status: unknown): string {
  return typeof status === 'string' ? status.trim().toLowerCase().replace(/[\s-]+/g, '_') : '';
}

export function toneForStatus(status: unknown): StatusTone {
  return TONE_BY_STATUS[normalizeStatusKey(status)] ?? 'neutral';
}

/**
 * Bench activity on the dashboard has its own, fixed colour language that lab
 * users already read at a glance: free = green, active (occupied) = red,
 * inactive = yellow, maintaining = blue, offline = grey. Whether a bench is
 * booked is a separate fact and is shown next to the status, not by its colour.
 */
const BENCH_ACTIVITY_TONES: Record<string, StatusTone> = {
  free: 'success',
  online: 'success',
  active: 'danger',
  inactive: 'warning',
  maintaining: 'info',
  maintenance: 'info',
  offline: 'neutral',
};

export const benchActivityTone = (status: unknown): StatusTone => BENCH_ACTIVITY_TONES[normalizeStatusKey(status)] ?? 'neutral';

/** Older call sites pass colour names or legacy class names; map them onto tones. */
const LEGACY_TONES: Record<string, StatusTone> = {
  green: 'success', overviewGreen: 'success', successSubtle: 'success', 'success-subtle': 'success',
  blue: 'info', overviewBlue: 'info',
  violet: 'reserved', overviewViolet: 'reserved',
  amber: 'warning', overviewAmber: 'warning',
  red: 'danger', overviewRed: 'danger',
  slate: 'neutral',
};

export function toTone(value: string | undefined | null): StatusTone {
  if (!value) return 'neutral';
  if ((STATUS_TONES as readonly string[]).includes(value)) return value as StatusTone;
  return LEGACY_TONES[value] ?? 'neutral';
}

/** Purchase orders: draft → ordered → received; cancelled ends the flow. */
const PURCHASE_TONES: Record<string, StatusTone> = {
  draft: 'neutral', ordered: 'info', received: 'success', completed: 'success', approved: 'success', cancelled: 'danger',
};

export const purchaseStatusTone = (status: unknown): StatusTone => PURCHASE_TONES[normalizeStatusKey(status)] ?? 'neutral';

/** Expense / invoice payment state. */
const PAYMENT_TONES: Record<string, StatusTone> = {
  paid: 'success', partial: 'warning', partially_paid: 'warning', pending: 'info', overdue: 'danger', refunded: 'reserved', cancelled: 'neutral',
};

export const paymentStatusTone = (status: unknown): StatusTone => PAYMENT_TONES[normalizeStatusKey(status)] ?? 'neutral';

/** Sentence-case label for raw status codes ("PARTIALLY_PAID" → "Partially paid"). */
export function purchaseStatusLabel(status: unknown): string {
  const key = normalizeStatusKey(status);
  return key ? key.charAt(0).toUpperCase() + key.slice(1).replaceAll('_', ' ') : 'Unknown';
}
