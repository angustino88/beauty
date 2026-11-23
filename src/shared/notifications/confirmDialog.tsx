import { Modal } from 'antd';
import { AlertCircle, AlertTriangle, HelpCircle } from 'lucide-react';
import type { ConfirmDialogOptions } from './types';

function renderConfirmIcon(variant: ConfirmDialogOptions['variant']) {
  const baseStyle = {
    width: 20,
    height: 20,
    flexShrink: 0,
    marginRight: 10,
    marginTop: 2,
  } as const;

  if (variant === 'danger') {
    return <AlertCircle style={{ ...baseStyle, color: 'var(--lm-danger-fg)' }} aria-hidden="true" />;
  }
  if (variant === 'warning') {
    return <AlertTriangle style={{ ...baseStyle, color: 'var(--lm-warning-fg)' }} aria-hidden="true" />;
  }
  return <HelpCircle style={{ ...baseStyle, color: 'var(--lm-info-fg)' }} aria-hidden="true" />;
}

/**
 * Opens a standardized enterprise confirmation dialog for destructive or consequential actions.
 * Always prefers explicit action verbs (e.g. "Delete", "Revoke", "Discard", "Submit").
 */
export function confirmAction({
  title,
  description,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'default',
  onConfirm,
  onCancel,
}: ConfirmDialogOptions): void {
  Modal.confirm({
    title,
    icon: renderConfirmIcon(variant),
    content: description,
    okText: confirmText,
    cancelText,
    okButtonProps: variant === 'danger' ? { danger: true } : undefined,
    centered: true,
    mask: { closable: false },
    onOk: onConfirm,
    onCancel,
  });
}
