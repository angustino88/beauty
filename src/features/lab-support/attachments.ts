import type { TicketAttachmentRead } from '@/shared/api/generated/api';
import { getApiErrorMessage } from '../../shared/notifications/apiError.ts';

/**
 * File types the server accepts by default (`DEFAULT_ALLOWED_EXTENSIONS` in the backend support desk
 * settings). Used only to pre-filter the file picker: the server enforces the configured list, size
 * and count limits and verifies the file content, and its error message is shown when it rejects one.
 */
export const SUPPORT_ATTACHMENT_ACCEPT = [
  '.png', '.jpg', '.jpeg', '.gif', '.webp', '.bmp',
  '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.odt', '.ods', '.odp', '.rtf', '.md',
  '.txt', '.log', '.csv', '.json', '.xml',
  '.zip',
].join(',');

export const SUPPORT_ATTACHMENT_HINT =
  'Images, PDF, Word, Excel, PowerPoint, OpenDocument, text, log, CSV and ZIP files. Up to 25 MB each by default.';

export type SupportAttachment = TicketAttachmentRead;

export function formatFileSize(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) return '–';
  if (bytes < 1024) return `${bytes} B`;
  const units = ['KB', 'MB', 'GB'];
  let value = bytes / 1024;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit += 1;
  }
  return `${value.toFixed(value >= 10 ? 0 : 1)} ${units[unit]}`;
}

export function isImageAttachment(attachment: Pick<SupportAttachment, 'content_type' | 'filename'>): boolean {
  return attachment.content_type.startsWith('image/') || /\.(png|jpe?g|gif|webp|bmp)$/i.test(attachment.filename);
}

/** The server's message for a failed request, or a generic fallback. */
export function apiErrorMessage(error: unknown, fallback = 'Please try again.'): string {
  return getApiErrorMessage(error, fallback);
}

/** Narrow the untyped `attachments` array of the ticket detail payload. */
export function toSupportAttachments(raw: unknown): SupportAttachment[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter(
    (item): item is SupportAttachment =>
      typeof item === 'object' && item !== null && typeof (item as { id?: unknown }).id === 'number'
      && typeof (item as { filename?: unknown }).filename === 'string',
  );
}
