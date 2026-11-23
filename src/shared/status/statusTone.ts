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
  open: 'info',
  new: 'info',
  reopened: 'info',

  reserved: 'reserved',
  booked: 'reserved',
  borrowed: 'reserved',
  on_loan: 'reserved',
  closed: 'reserved',
  restricted: 'reserved',
  waiting: 'reserved',
  waiting_for_customer: 'reserved',
  waiting_on_customer: 'reserved',
  waiting_on_requester: 'reserved',
  on_hold: 'reserved',
  pending: 'reserved',

  maintenance: 'warning',
  in_maintenance: 'warning',
  needs_review: 'warning',
  calibration_overdue: 'warning',
  suspended: 'warning',
  in_progress: 'warning',
  investigating: 'warning',
  triaged: 'warning',

  issue: 'danger',
  broken: 'danger',
  out_of_service: 'danger',
  lost: 'danger',
  fault: 'danger',
  revoked: 'danger',
  expired: 'danger',

  resolved: 'success',
  done: 'success',

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

const SUPPORT_TICKET_STATUS_TONES: Record<string, StatusTone> = {
  open: 'info',
  new: 'info',
  reopened: 'info',
  in_progress: 'warning',
  active: 'warning',
  investigating: 'warning',
  triaged: 'warning',
  waiting: 'reserved',
  waiting_for_customer: 'reserved',
  waiting_on_customer: 'reserved',
  waiting_on_requester: 'reserved',
  waiting_for_support: 'info',
  on_hold: 'reserved',
  hold: 'reserved',
  pending: 'reserved',
  paused: 'reserved',
  resolved: 'success',
  done: 'success',
  completed: 'success',
  closed: 'neutral',
  cancelled: 'neutral',
  canceled: 'neutral',
};

export function supportTicketStatusTone(status: unknown, systemState?: unknown): StatusTone {
  const key = normalizeStatusKey(status);
  if (key && SUPPORT_TICKET_STATUS_TONES[key]) {
    return SUPPORT_TICKET_STATUS_TONES[key];
  }
  if (key.includes('resolv') || key.includes('complete')) return 'success';
  if (key.includes('close') || key.includes('cancel')) return 'neutral';
  if (key.includes('wait') || key.includes('hold') || key.includes('pend') || key.includes('pause')) return 'reserved';
  if (key.includes('progress') || key.includes('investig') || key.includes('triage') || key.includes('active')) return 'warning';
  if (key.includes('open') || key.includes('new')) return 'info';

  const stateKey = normalizeStatusKey(systemState);
  if (stateKey && SUPPORT_TICKET_STATUS_TONES[stateKey]) {
    return SUPPORT_TICKET_STATUS_TONES[stateKey];
  }
  return 'neutral';
}

const SUPPORT_TICKET_PRIORITY_TONES: Record<string, StatusTone> = {
  critical: 'danger',
  urgent: 'danger',
  blocker: 'danger',
  p1: 'danger',
  highest: 'danger',
  high: 'warning',
  major: 'warning',
  p2: 'warning',
  medium: 'info',
  normal: 'info',
  standard: 'info',
  p3: 'info',
  low: 'neutral',
  minor: 'neutral',
  trivial: 'neutral',
  p4: 'neutral',
};

export function supportTicketPriorityTone(priority: unknown): StatusTone {
  const key = normalizeStatusKey(priority);
  if (key && SUPPORT_TICKET_PRIORITY_TONES[key]) {
    return SUPPORT_TICKET_PRIORITY_TONES[key];
  }
  if (key.includes('crit') || key.includes('urgent') || key.includes('block') || key.includes('p1')) return 'danger';
  if (key.includes('high') || key.includes('major') || key.includes('p2')) return 'warning';
  if (key.includes('med') || key.includes('norm') || key.includes('p3')) return 'info';
  return 'neutral';
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

/** Label and plain-language meaning of each bench activity, for badges, summary chips and filters. */
export const BENCH_ACTIVITY_META: Record<string, { label: string; meaning: string }> = {
  free: { label: 'Free', meaning: 'The computer is online and nobody is logged in.' },
  active: { label: 'Active', meaning: 'Someone is logged in and working.' },
  inactive: { label: 'Inactive', meaning: 'Someone is logged in but has been idle.' },
  maintaining: { label: 'Maintenance', meaning: 'Being serviced; not for use.' },
  offline: { label: 'Offline', meaning: "The computer isn't reporting: switched off or its agent isn't running." },
  unknown: { label: 'Unknown', meaning: 'No computer on this bench has reported a status yet.' },
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
