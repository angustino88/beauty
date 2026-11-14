import type { ReactNode } from 'react';
import { toneForStatus, toTone, type StatusTone } from '@/shared/status/statusTone';
import styles from './StatusIndicator.module.css';

interface StatusBadgeProps {
  /** Tone name, legacy tone class name, or omit to derive it from `status`. */
  tone?: StatusTone | string;
  /** Raw status value; used for the tone when `tone` is not given. */
  status?: unknown;
  label: ReactNode;
  /** Full text for the hover tooltip; defaults to the label when it is a string. */
  title?: string;
  /** Replaces the status dot, e.g. an approval icon. */
  icon?: ReactNode;
  /** Size to content instead of the shared fixed width (for inline sentences). */
  fit?: boolean;
  className?: string;
}

/** The one status pill used in tables, sheets and modals. Fixed width keeps columns aligned. */
export function StatusBadge({ tone, status, label, title, icon, fit = false, className }: StatusBadgeProps) {
  const resolved = tone ? toTone(tone) : toneForStatus(status);
  return (
    <span
      className={[styles.indicator, styles[resolved], fit ? styles.fit : '', className ?? ''].filter(Boolean).join(' ')}
      title={title ?? (typeof label === 'string' ? label : undefined)}
    >
      {icon ? <span className={styles.icon} aria-hidden="true">{icon}</span> : <span className={styles.statusDot} aria-hidden="true" />}
      <span className={styles.label}>{label}</span>
    </span>
  );
}

export default StatusBadge;
