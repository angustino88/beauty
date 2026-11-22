import type { ReactNode } from 'react';

export type NotificationVariant = 'success' | 'info' | 'warning' | 'error';

export type ToastVariant = NotificationVariant | 'loading';

export interface ToastAction {
  label: string;
  onClick: () => void;
}

export interface ToastDetailItem {
  tone?: 'added' | 'removed' | 'neutral';
  label: string;
  value?: string;
}

export interface ToastOptions {
  /** Stable identifier for deduplicating or programmatically updating/dismissing a toast. */
  key?: string;
  /** Optional supporting sentence providing context or recovery guidance. */
  description?: string;
  /** Optional monospace identifier badge (e.g. asset SKU, booking code, ticket key). */
  code?: string;
  /** Optional structured bullet list (e.g. mapping additions/removals). */
  details?: ToastDetailItem[];
  /** Auto-dismiss duration in milliseconds. Use `0` for persistent toasts. */
  duration?: number;
  /** Whether the manual close button is rendered. Defaults to `true` (except `loading`). */
  dismissible?: boolean;
  /** Optional inline action button (e.g. Retry, Copy, Undo). */
  action?: ToastAction;
}

export interface ToastInput extends ToastOptions {
  variant: ToastVariant;
  title: string;
}

export interface ToastRecord {
  id: string;
  key: string;
  variant: ToastVariant;
  title: string;
  description?: string;
  code?: string;
  details?: ToastDetailItem[];
  duration: number;
  dismissible: boolean;
  action?: ToastAction;
  createdAt: number;
  updatedAt: number;
  /** Incremented when a duplicate notification is coalesced into an active toast. */
  count: number;
  paused: boolean;
  remainingMs: number;
}

export interface ApiFieldError {
  field: string;
  message: string;
}

export interface NormalizedApiError {
  code: string;
  status?: number | string;
  message: string;
  fields: ApiFieldError[];
  nonFieldErrors: string[];
  isNetworkError: boolean;
  isTimeout: boolean;
  isPermissionError: boolean;
  isConflict: boolean;
}

export interface ConfirmDialogOptions {
  title: string;
  description: ReactNode;
  confirmText?: string;
  cancelText?: string;
  variant?: 'default' | 'warning' | 'danger';
  onConfirm: () => void | Promise<void>;
  onCancel?: () => void;
}
