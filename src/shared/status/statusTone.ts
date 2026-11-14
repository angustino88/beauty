/**
 * One status colour language for spaces, equipment and licenses.
 *
 * Tones describe what a person should do about a resource, not which entity it is:
 *   success  ready to use                       (available, operational)
 *   info     busy but healthy                    (in use, planned, on order)
 *   violet   committed or access-limited         (reserved, borrowed, closed)
 *   warning  needs attention soon                (maintenance, calibration due)
 *   danger   not usable, needs action            (broken, out of service, lost)
 *   neutral  out of circulation or unknown       (retired, transferred, storage)
 */
export type StatusTone = 'success' | 'info' | 'violet' | 'warning' | 'danger' | 'neutral';

export const STATUS_TONES: readonly StatusTone[] = ['success', 'info', 'violet', 'warning', 'danger', 'neutral'];

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

  reserved: 'violet',
  booked: 'violet',
  borrowed: 'violet',
  on_loan: 'violet',
  closed: 'violet',
  restricted: 'violet',

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

/** Older call sites pass colour names or legacy class names; map them onto tones. */
const LEGACY_TONES: Record<string, StatusTone> = {
  green: 'success', overviewGreen: 'success', successSubtle: 'success', 'success-subtle': 'success',
  blue: 'info', overviewBlue: 'info',
  violet: 'violet', overviewViolet: 'violet',
  amber: 'warning', overviewAmber: 'warning',
  red: 'danger', overviewRed: 'danger',
  slate: 'neutral',
};

export function toTone(value: string | undefined | null): StatusTone {
  if (!value) return 'neutral';
  if ((STATUS_TONES as readonly string[]).includes(value)) return value as StatusTone;
  return LEGACY_TONES[value] ?? 'neutral';
}
