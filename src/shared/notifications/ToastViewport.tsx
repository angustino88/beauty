import { useSyncExternalStore } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Info,
  Loader2,
  X,
} from 'lucide-react';
import {
  dismissToast,
  getToastsSnapshot,
  pauseToast,
  resumeToast,
  subscribeToasts,
} from './toastStore';
import type { ToastRecord, ToastVariant } from './types';
import styles from './ToastViewport.module.css';

function renderVariantIcon(variant: ToastVariant) {
  switch (variant) {
    case 'success':
      return <CheckCircle2 className={styles.icon} aria-hidden="true" />;
    case 'warning':
      return <AlertTriangle className={styles.icon} aria-hidden="true" />;
    case 'error':
      return <AlertCircle className={styles.icon} aria-hidden="true" />;
    case 'loading':
      return <Loader2 className={`${styles.icon} ${styles.spinner}`} aria-hidden="true" />;
    case 'info':
    default:
      return <Info className={styles.icon} aria-hidden="true" />;
  }
}

function ToastCard({ toast }: { toast: ToastRecord }) {
  const isAssertive = toast.variant === 'error' || toast.variant === 'warning';
  const variantClass = styles[`variant_${toast.variant}`];

  return (
    <div
      className={`${styles.toast} ${variantClass} ${toast.paused ? styles.paused : ''}`}
      role={isAssertive ? 'alert' : 'status'}
      aria-live={isAssertive ? 'assertive' : 'polite'}
      aria-atomic="true"
      tabIndex={0}
      onMouseEnter={() => pauseToast(toast.id)}
      onMouseLeave={() => resumeToast(toast.id)}
      onFocus={() => pauseToast(toast.id)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
          resumeToast(toast.id);
        }
      }}
      onKeyDown={(event) => {
        if (event.key === 'Escape' && toast.dismissible) {
          event.stopPropagation();
          dismissToast(toast.id);
        }
      }}
    >
      <span className={styles.iconWrap}>{renderVariantIcon(toast.variant)}</span>

      <div className={styles.body}>
        <div className={styles.headerRow}>
          {toast.code && <code className={styles.codeBadge}>{toast.code}</code>}
          <span className={styles.title}>{toast.title}</span>
          {toast.count > 1 && (
            <span className={styles.countBadge} aria-label={`${toast.count} occurrences`}>
              ×{toast.count}
            </span>
          )}
        </div>

        {toast.description && <div className={styles.description}>{toast.description}</div>}

        {toast.details && toast.details.length > 0 && (
          <ul className={styles.detailsList}>
            {toast.details.map((detail, idx) => (
              <li
                key={`${detail.label}-${detail.value ?? idx}`}
                className={`${styles.detailItem} ${detail.tone ? styles[`detail_${detail.tone}`] : ''}`}
              >
                <span className={styles.detailDot} aria-hidden="true" />
                <span>
                  <span className={styles.detailLabel}>{detail.label}</span>
                  {detail.value ? ` ${detail.value}` : null}
                </span>
              </li>
            ))}
          </ul>
        )}

        {toast.action && (
          <div className={styles.actionRow}>
            <button
              type="button"
              className={styles.actionBtn}
              onClick={() => {
                toast.action?.onClick();
                dismissToast(toast.id);
              }}
            >
              {toast.action.label}
            </button>
          </div>
        )}
      </div>

      {toast.dismissible && (
        <button
          type="button"
          className={styles.closeBtn}
          aria-label="Dismiss notification"
          onClick={() => dismissToast(toast.id)}
        >
          <X className={styles.closeIcon} aria-hidden="true" />
        </button>
      )}

      {toast.duration > 0 && (
        <div className={styles.progressTrack} aria-hidden="true">
          <div
            key={`${toast.id}-${toast.updatedAt}`}
            className={styles.progressBar}
            style={{ animationDuration: `${toast.duration}ms` }}
          />
        </div>
      )}
    </div>
  );
}

export function ToastViewport() {
  const toasts = useSyncExternalStore(subscribeToasts, getToastsSnapshot, getToastsSnapshot);

  if (toasts.length === 0) return null;

  return (
    <div className={styles.viewport} aria-label="Notifications" role="region">
      <div className={styles.region}>
        {toasts.map((toast) => (
          <ToastCard key={toast.id} toast={toast} />
        ))}
      </div>
    </div>
  );
}
