/** Pure slot-watch types and response mapping (no API client import, so it is unit-testable). */
export type SlotWatchStatus = 'active' | 'cancelled' | 'expired' | 'fulfilled';

export interface ISlotWatch {
  id: number;
  benchId: number | null;
  benchName: string;
  startsAt: string;
  endsAt: string;
  /** Set when the alert follows one booking (one alert when it ends). */
  followedBookingId: number | null;
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
