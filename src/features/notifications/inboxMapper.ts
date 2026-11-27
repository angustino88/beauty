/** Pure inbox & banner types and formatting (no API client import, so it is unit-testable). */

export type InboxKind = 'success' | 'info' | 'warning' | 'error' | 'announcement';
export type DisplayMode = 'alert' | 'banner';
export type BannerVariant = 'success' | 'info' | 'warning' | 'error';

export interface InboxItem {
  id: number;
  title: string;
  details: string;
  kind: InboxKind;
  displayMode: DisplayMode;
  /** Banners only: when false, the banner stays pinned until expiry and cannot be dismissed. */
  isDismissible: boolean;
  expiresAt: string | null;
  /** In-app destination of the primary action, e.g. a prefilled booking form. */
  actionPath: string | null;
  isRead: boolean;
  createdAt: string;
}

export type RawNotificationPayload = {
  id: number;
  message?: string;
  details?: string | null;
  message_type?: string | { value?: string } | null;
  display_mode?: string | { value?: string } | null;
  is_dismissible?: boolean | null;
  expires_at?: string | null;
  expiry_date?: string | null;
  action_path?: string | null;
  is_read?: boolean;
  created_at?: string;
  created?: string;
};

const KINDS: InboxKind[] = ['success', 'info', 'warning', 'error', 'announcement'];
const DISPLAY_MODES: DisplayMode[] = ['alert', 'banner'];

/** Only links that stay inside the app are followed. */
export const isInAppPath = (path?: string | null): path is string =>
  !!path && path.startsWith('/') && !path.startsWith('//');

export function mapInboxItem(raw: RawNotificationPayload): InboxItem {
  const type = typeof raw.message_type === 'string' ? raw.message_type : raw.message_type?.value;
  const kind: InboxKind = KINDS.includes(type as InboxKind) ? (type as InboxKind) : 'info';

  const modeRaw = typeof raw.display_mode === 'string' ? raw.display_mode : raw.display_mode?.value;
  const displayMode: DisplayMode = DISPLAY_MODES.includes(modeRaw as DisplayMode)
    ? (modeRaw as DisplayMode)
    : kind === 'announcement'
      ? 'banner'
      : 'alert';

  return {
    id: raw.id,
    title: raw.message ?? '',
    details: raw.details ?? '',
    kind,
    displayMode,
    isDismissible: raw.is_dismissible ?? true,
    expiresAt: raw.expires_at ?? raw.expiry_date ?? null,
    actionPath: isInAppPath(raw.action_path) ? raw.action_path : null,
    isRead: !!raw.is_read,
    createdAt: raw.created_at ?? raw.created ?? new Date(0).toISOString(),
  };
}

/** Map a notification kind (including legacy "announcement") to a SystemBanner severity variant. */
export function toBannerVariant(kind?: string | null): BannerVariant {
  if (kind === 'success' || kind === 'warning' || kind === 'error' || kind === 'info') {
    return kind;
  }
  return 'info';
}

/** True when a notification should currently be displayed in the sticky top banner. */
export function isBannerVisible(
  item: Pick<InboxItem, 'displayMode' | 'expiresAt' | 'isDismissible' | 'isRead'>,
  nowMs: number = Date.now(),
): boolean {
  if (item.displayMode !== 'banner') return false;
  if (item.expiresAt) {
    const expiryMs = Date.parse(item.expiresAt);
    if (!Number.isNaN(expiryMs) && expiryMs <= nowMs) return false;
  }
  if (!item.isDismissible) return true;
  return !item.isRead;
}

const SEVERITY_RANK: Record<BannerVariant, number> = {
  error: 0,
  warning: 1,
  info: 2,
  success: 3,
};

/** Sort active banners: pinned non-dismissible first, then severity (error → warning → info → success), then newest. */
export function sortBanners<T extends { is_dismissible: boolean; message_type?: string; created?: string; id: number }>(
  items: readonly T[],
): T[] {
  return [...items].sort((a, b) => {
    if (a.is_dismissible !== b.is_dismissible) {
      return a.is_dismissible ? 1 : -1;
    }
    const sevDiff = SEVERITY_RANK[toBannerVariant(a.message_type)] - SEVERITY_RANK[toBannerVariant(b.message_type)];
    if (sevDiff !== 0) return sevDiff;
    const aTime = a.created ? Date.parse(a.created) : 0;
    const bTime = b.created ? Date.parse(b.created) : 0;
    if (aTime !== bTime) return bTime - aTime;
    return b.id - a.id;
  });
}

/** Human-readable expiry label for banners: "Until 17:00", "Until tomorrow, 17:00", or "Until Nov 28, 17:00". */
export function formatExpiry(value: string | null | undefined, now: Date = new Date()): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  const time = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
  const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const days = Math.round((startOfDay(date) - startOfDay(now)) / 86_400_000);

  if (days === 0) return `Until ${time}`;
  if (days === 1) return `Until tomorrow, ${time}`;
  const dayLabel = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  return `Until ${dayLabel}, ${time}`;
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
