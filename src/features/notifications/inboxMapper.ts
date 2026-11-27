/** Pure inbox types and formatting (no API client import, so it is unit-testable). */

export type InboxKind = 'success' | 'info' | 'warning' | 'error' | 'announcement';

export interface InboxItem {
  id: number;
  title: string;
  details: string;
  kind: InboxKind;
  /** In-app destination of the primary action, e.g. a prefilled booking form. */
  actionPath: string | null;
  isRead: boolean;
  createdAt: string;
}

type Raw = {
  id: number;
  message?: string;
  details?: string | null;
  message_type?: string | { value?: string } | null;
  action_path?: string | null;
  is_read?: boolean;
  created_at?: string;
  created?: string;
};

const KINDS: InboxKind[] = ['success', 'info', 'warning', 'error', 'announcement'];

/** Only links that stay inside the app are followed. */
export const isInAppPath = (path?: string | null): path is string =>
  !!path && path.startsWith('/') && !path.startsWith('//');

export function mapInboxItem(raw: Raw): InboxItem {
  const type = typeof raw.message_type === 'string' ? raw.message_type : raw.message_type?.value;
  return {
    id: raw.id,
    title: raw.message ?? '',
    details: raw.details ?? '',
    kind: KINDS.includes(type as InboxKind) ? (type as InboxKind) : 'info',
    actionPath: isInAppPath(raw.action_path) ? raw.action_path : null,
    isRead: !!raw.is_read,
    createdAt: raw.created_at ?? raw.created ?? new Date(0).toISOString(),
  };
}

const ACTION_LABELS: [prefix: string, label: string][] = [
  ['/booking-calendar', 'Book now'],
  ['/my-bookings', 'View booking'],
  ['/support-tickets', 'View ticket'],
  ['/lab-equipment/license', 'View licenses'],
  ['/lab-monitoring', 'Open monitoring'],
];

/** Label for the primary action, by where it leads. */
export const actionLabel = (path: string): string =>
  ACTION_LABELS.find(([prefix]) => path.startsWith(prefix))?.[1] ?? 'Open';

/** "Just now", "5 min ago", "3 h ago", "Yesterday", "Nov 24". */
export function formatRelative(value: string, now: Date = new Date()): string {
  const date = new Date(value);
  const seconds = Math.max(0, (now.getTime() - date.getTime()) / 1000);
  if (seconds < 60) return 'Just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)} min ago`;
  const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const days = Math.round((startOfDay(now) - startOfDay(date)) / 86_400_000);
  if (days === 0) return `${Math.floor(seconds / 3600)} h ago`;
  if (days === 1) return 'Yesterday';
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/** Badge text: hidden at 0, "99+" above 99. */
export const badgeLabel = (count: number): string | null => (count <= 0 ? null : count > 99 ? '99+' : String(count));
