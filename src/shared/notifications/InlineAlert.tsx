import type { CSSProperties, ReactNode } from 'react';
import { AlertCircle, AlertTriangle, CheckCircle2, Info, X } from 'lucide-react';
import type { NotificationVariant } from './types';
import styles from './InlineAlert.module.css';

export interface InlineAlertProps {
  variant: NotificationVariant;
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  onRetry?: () => void;
  retryLabel?: string;
  dismissible?: boolean;
  onDismiss?: () => void;
  compact?: boolean;
  className?: string;
  style?: CSSProperties;
}

function VariantIcon({ variant }: { variant: NotificationVariant }) {
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

export function InlineAlert({
  variant,
  title,
  description,
  action,
  onRetry,
  retryLabel = 'Retry',
  dismissible = false,
  onDismiss,
  compact = false,
  className,
  style,
}: InlineAlertProps) {
  const isAssertive = variant === 'error' || variant === 'warning';
  const classes = [
    styles.alert,
    styles[`variant_${variant}`],
    compact ? styles.compact : '',
    description ? styles.hasDescription : '',
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
      <VariantIcon variant={variant} />
      <div className={styles.content}>
        <div className={styles.title}>{title}</div>
        {description && <div className={styles.description}>{description}</div>}
      </div>
      {(onRetry || action || dismissible) && (
        <div className={styles.actions}>
          {onRetry && (
            <button type="button" className={styles.retryBtn} onClick={onRetry}>
              {retryLabel}
            </button>
          )}
          {action}
          {dismissible && (
            <button
              type="button"
              className={styles.closeBtn}
              aria-label="Dismiss alert"
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
