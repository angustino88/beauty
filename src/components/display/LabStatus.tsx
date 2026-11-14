import { Tooltip } from 'antd';
import { CalendarCheck2, CircleCheck, CircleHelp, Moon, PowerOff, UserRound, Wrench, type LucideIcon } from 'lucide-react';
import { benchActivityTone, normalizeStatusKey } from '@/shared/status/statusTone';
import styles from './LabStatus.module.css';

type LabStatusProps = {
  labStatus?: string | { value?: string; label?: string } | null;
  /** The bench has a booking running right now. */
  isBooked?: boolean;
  /** Extra detail for the booked tooltip, e.g. "until 15:30 · Tran Minh". */
  bookingDetail?: string;
  /** Size to content instead of the fixed table width. */
  fit?: boolean;
};

/** A different shape per status, so colour is never the only cue. */
const GLYPHS: Record<string, LucideIcon> = {
  free: CircleCheck,
  online: CircleCheck,
  active: UserRound,
  inactive: Moon,
  maintaining: Wrench,
  maintenance: Wrench,
  offline: PowerOff,
};

/**
 * Bench activity status. Whether the bench is booked right now is a separate
 * fact, shown as a calendar glyph in the badge's end cap (details on hover).
 */
export function LabStatus({ labStatus, isBooked, bookingDetail, fit }: LabStatusProps) {
  const statusStr = typeof labStatus === 'string'
    ? labStatus
    : typeof labStatus === 'object' && labStatus !== null && 'value' in labStatus
      ? String((labStatus as { value?: unknown }).value ?? '')
      : '';

  const key = normalizeStatusKey(statusStr);
  const label = key ? key.charAt(0).toUpperCase() + key.slice(1).replaceAll('_', ' ') : 'Unknown';
  const Glyph = GLYPHS[key] ?? CircleHelp;
  const bookedText = bookingDetail ? `Booked now · ${bookingDetail}` : 'Booked now';

  return (
    <span
      className={[styles.badge, styles[benchActivityTone(key)], fit ? styles.fit : ''].filter(Boolean).join(' ')}
      aria-label={isBooked ? `${label}, booked now` : label}
    >
      <span className={styles.main}>
        <Glyph className={styles.glyph} size={14} strokeWidth={2.25} aria-hidden="true" />
        <span className={styles.label}>{label}</span>
      </span>
      {isBooked ? (
        <Tooltip title={bookedText}>
          <span className={styles.booked}>
            <CalendarCheck2 size={14} strokeWidth={2.25} aria-hidden="true" />
          </span>
        </Tooltip>
      ) : null}
    </span>
  );
}
