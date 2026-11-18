import { StatusBadge } from '@/shared/components/StatusBadge';
import type { StatusDot, Tone } from './devicePresentation';
import styles from './Devices.module.css';

const DOT_CLASS: Record<StatusDot, string> = {
  connected: styles.dotConnected,
  unconfirmed: styles.dotUnconfirmed,
  disconnected: styles.dotDisconnected,
};

const DOT_TEXT: Record<StatusDot, string> = {
  connected: 'connected',
  unconfirmed: 'last reported connected, unconfirmed',
  disconnected: 'unplugged',
};

/** Colored dot with a screen-reader equivalent; color is never the only signal. */
export function DeviceDot({ dot }: { dot: StatusDot }) {
  return (
    <>
      <span className={`${styles.dot} ${DOT_CLASS[dot]}`} aria-hidden="true" />
      <span className={styles.srOnly}>{DOT_TEXT[dot]}</span>
    </>
  );
}

const BADGE_TONE: Record<Tone, string> = {
  success: 'success',
  warning: 'warning',
  error: 'danger',
  processing: 'info',
  default: 'neutral',
};

export function ToneBadge({ tone, label, title }: { tone: Tone; label: string; title?: string }) {
  return <StatusBadge tone={BADGE_TONE[tone]} label={label} title={title} fit />;
}
