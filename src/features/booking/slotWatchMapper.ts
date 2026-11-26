/** Pure slot-watch types and response mapping (no API client import, so it is unit-testable). */
export type SlotWatchStatus = 'active' | 'cancelled' | 'expired' | 'fulfilled';

export interface SlotAvailability {
  windowStartsAt: string;
  windowEndsAt: string;
  busyPeriods: { startsAt: string; endsAt: string; isMine: boolean }[];
  nextFreeStartsAt: string | null;
  nextFreeEndsAt: string | null;
  /** Other people with an alert on this bench and time (count only). */
  watcherCount: number;
}

export interface ISlotWatch {
  id: number;
  benchId: number | null;
  benchName: string;
  startsAt: string;
  endsAt: string;
  /** Set when the alert follows one booking (one alert when it ends). */
  followedBookingId: number | null;
  /** Live view of the watched time; null once the alert is no longer active. */
  availability: SlotAvailability | null;
  status: SlotWatchStatus;
  statusLabel: string;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface SlotWatchCreateRequest {
  bench_id: number;
  starts_at: string;
  ends_at: string;
}

type ChoiceRef = { value?: string; label?: string } | null | undefined;
export type RawSlotWatch = {
  id: number;
  bench?: { id?: number; name?: string; uid?: string } | null;
  starts_at: string;
  ends_at: string;
  followed_booking_id?: number | null;
  availability?: {
    window_starts_at: string;
    window_ends_at: string;
    busy_periods?: { starts_at: string; ends_at: string; is_mine?: boolean }[];
    next_free_starts_at?: string | null;
    next_free_ends_at?: string | null;
    watcher_count?: number;
  } | null;
  status?: ChoiceRef;
  created_at?: string | null;
  updated_at?: string | null;
};

export const mapSlotWatch = (raw: RawSlotWatch): ISlotWatch => ({
  id: raw.id,
  benchId: raw.bench?.id ?? null,
  benchName: raw.bench?.name ?? 'Bench',
  startsAt: raw.starts_at,
  endsAt: raw.ends_at,
  followedBookingId: raw.followed_booking_id ?? null,
  availability: raw.availability
    ? {
        windowStartsAt: raw.availability.window_starts_at,
        windowEndsAt: raw.availability.window_ends_at,
        busyPeriods: (raw.availability.busy_periods ?? []).map((period) => ({
          startsAt: period.starts_at,
          endsAt: period.ends_at,
          isMine: !!period.is_mine,
        })),
        nextFreeStartsAt: raw.availability.next_free_starts_at ?? null,
        nextFreeEndsAt: raw.availability.next_free_ends_at ?? null,
        watcherCount: raw.availability.watcher_count ?? 0,
      }
    : null,
  status: (raw.status?.value as SlotWatchStatus) ?? 'active',
  statusLabel: raw.status?.label ?? 'Active',
  createdAt: raw.created_at ?? null,
  updatedAt: raw.updated_at ?? null,
});

const dayLabel = (value: Date, now: Date): string => {
  const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const diffDays = Math.round((startOfDay(value) - startOfDay(now)) / 86_400_000);
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Tomorrow';
  return value.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
};

const clock = (value: Date): string =>
  `${String(value.getHours()).padStart(2, '0')}:${String(value.getMinutes()).padStart(2, '0')}`;

/** Human window such as "Today 11:50 – 14:50" or "Today 22:00 – Tomorrow 02:00". */
export function formatAlertWindow(startsAt: string, endsAt: string, now: Date = new Date()): string {
  const start = new Date(startsAt);
  const end = new Date(endsAt);
  const startDay = dayLabel(start, now);
  const endDay = dayLabel(end, now);
  return startDay === endDay
    ? `${startDay} ${clock(start)} – ${clock(end)}`
    : `${startDay} ${clock(start)} – ${endDay} ${clock(end)}`;
}

/** "watching" while the range is open, "upcoming" before it starts. */
export function alertPhase(startsAt: string, now: Date = new Date()): 'watching' | 'upcoming' {
  return new Date(startsAt).getTime() <= now.getTime() ? 'watching' : 'upcoming';
}

/** "14:00" today, "Tomorrow 09:30", or "Thu, Nov 27 09:30". */
export function formatAlertTime(value: string, now: Date = new Date()): string {
  const date = new Date(value);
  const day = dayLabel(date, now);
  return day === 'Today' ? clock(date) : `${day} ${clock(date)}`;
}

export type TimelineSegment = { kind: 'busy' | 'mine' | 'free'; left: number; width: number; startsAt: string; endsAt: string };

/** Busy and free segments of the watched window as percentages, for the mini timeline. */
export function timelineSegments(availability: SlotAvailability): TimelineSegment[] {
  const lo = new Date(availability.windowStartsAt).getTime();
  const hi = new Date(availability.windowEndsAt).getTime();
  const span = hi - lo;
  if (span <= 0) return [];
  const pct = (t: number) => Math.min(100, Math.max(0, ((t - lo) / span) * 100));
  const segments: TimelineSegment[] = [];
  let cursor = lo;
  const busy = [...availability.busyPeriods].sort((a, b) => a.startsAt.localeCompare(b.startsAt));
  const iso = (t: number) => new Date(t).toISOString();
  for (const period of busy) {
    const start = Math.max(new Date(period.startsAt).getTime(), lo);
    const end = Math.min(new Date(period.endsAt).getTime(), hi);
    if (end <= start) continue;
    if (start > cursor) {
      segments.push({ kind: 'free', left: pct(cursor), width: pct(start) - pct(cursor), startsAt: iso(cursor), endsAt: iso(start) });
    }
    segments.push({ kind: period.isMine ? 'mine' : 'busy', left: pct(start), width: pct(end) - pct(start), startsAt: iso(start), endsAt: iso(end) });
    cursor = Math.max(cursor, end);
  }
  if (cursor < hi) segments.push({ kind: 'free', left: pct(cursor), width: 100 - pct(cursor), startsAt: iso(cursor), endsAt: iso(hi) });
  return segments;
}

/** "Starts in 25 min", "Starts at 14:00", "Tomorrow 09:00", "In progress · ends 16:00". */
export function formatBookingCountdown(startsAt: string, endsAt: string, now: Date = new Date()): string {
  const start = new Date(startsAt);
  const end = new Date(endsAt);
  if (start.getTime() <= now.getTime()) return `In progress · ends ${clock(end)}`;
  const minutes = Math.round((start.getTime() - now.getTime()) / 60_000);
  if (minutes < 60) return `Starts in ${Math.max(1, minutes)} min`;
  const day = dayLabel(start, now);
  return day === 'Today' ? `Starts at ${clock(start)}` : `${day} ${clock(start)}`;
}
