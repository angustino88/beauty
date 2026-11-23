import type { CSSProperties, ReactNode } from 'react';
import { AlertCircle, AlertTriangle, CheckCircle2, Info, X } from 'lucide-react';
import type { NotificationVariant } from './types';
import styles from './SystemBanner.module.css';

export interface SystemBannerProps {
  variant: NotificationVariant;
  title: ReactNode;
  description?: ReactNode;
  icon?: ReactNode;
  action?: ReactNode;
  dismissible?: boolean;
  onDismiss?: () => void;
  fullBleed?: boolean;
  className?: string;
  style?: CSSProperties;
}

function DefaultIcon({ variant }: { variant: NotificationVariant }) {
  switch (variant) {
    case 'success':
      return <CheckCircle2 className={styles.icon} aria-hidden="true" />;
    case 'warning':
      return <AlertTriangle className={styles.icon} aria-hidden="true" />;
    case 'error':
      return <AlertCircle className={styles.icon} aria-hidden="true" />;
    case 'info':
    default:
      return <Info className={styles.icon} aria-hidden="true" />;
  }
}

export function SystemBanner({
  variant,
  title,
  description,
  icon,
  action,
  dismissible = false,
  onDismiss,
  fullBleed = false,
  className,
  style,
}: SystemBannerProps) {
  const isAssertive = variant === 'error' || variant === 'warning';
  const classes = [
    styles.banner,
    styles[`variant_${variant}`],
    fullBleed ? styles.fullBleed : '',
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div
      className={classes}
      style={style}
      role={isAssertive ? 'alert' : 'status'}
      aria-live={isAssertive ? 'assertive' : 'polite'}
    >
      <div className={styles.lead}>
        {icon ? <span className={styles.icon} aria-hidden="true">{icon}</span> : <DefaultIcon variant={variant} />}
        <div className={styles.textGroup}>
          <div className={styles.title}>{title}</div>
          {description && <div className={styles.description}>{description}</div>}
        </div>
      </div>
      {(action || dismissible) && (
        <div className={styles.controls}>
          {action}
          {dismissible && (
            <button
              type="button"
              className={styles.closeBtn}
              aria-label="Dismiss announcement"
              onClick={onDismiss}
            >
              <X className={styles.closeIcon} aria-hidden="true" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
