/**
 * Pure model for the Dashboard's "Up next" tiles: bookings and slot alerts in one list, most urgent first.
 * No API client import, so it is unit-testable.
 */
import { formatAlertTime, formatBookingCountdown, type ISlotWatch } from './slotWatchMapper.ts';

export interface UpNextBooking {
  id: number;
  benchName: string;
  startsAt: string;
  endsAt: string;
  awaitingApproval: boolean;
}

/** Colour only where it matters: free now (green), starting soon (amber). */
export type UpNextTone = 'free' | 'soon' | 'neutral';

export type UpNextItem =
  | { key: string; kind: 'booking'; tone: UpNextTone; title: string; status: string; to: string; sortAt: number; booking: UpNextBooking }
  | { key: string; kind: 'alert'; tone: UpNextTone; title: string; status: string; to: string | null; sortAt: number; watch: ISlotWatch };

const HOUR = 3_600_000;
const FREE_NOW = Number.NEGATIVE_INFINITY;
const NEVER = Number.POSITIVE_INFINITY;

const bookPath = (benchId: number, startsAt: string, endsAt: string) =>
  `/booking-calendar?${new URLSearchParams({ action: 'create', bench_ids: String(benchId), starts_at: startsAt, ends_at: endsAt })}`;

function bookingItem(booking: UpNextBooking, t: number, now: Date): UpNextItem {
  const start = new Date(booking.startsAt).getTime();
  const live = start <= t;
  const countdown = formatBookingCountdown(booking.startsAt, booking.endsAt, now);
  return {
    key: `booking-${booking.id}`,
    kind: 'booking',
    tone: !live && start - t <= HOUR ? 'soon' : 'neutral',
    title: booking.benchName,
    status: booking.awaitingApproval ? `${countdown} · awaiting approval` : countdown,
    to: '/my-bookings',
    sortAt: live ? t : start,
    booking,
  };
}

function alertItem(watch: ISlotWatch, t: number, now: Date): UpNextItem {
  const a = watch.availability;
  const base = { key: `alert-${watch.id}`, kind: 'alert' as const, title: watch.benchName, watch };
  if (!a?.nextFreeStartsAt || !a.nextFreeEndsAt) {
    const status = watch.followedBookingId !== null ? `Booking ends ${formatAlertTime(watch.endsAt, now)}` : 'Fully booked';
    return { ...base, tone: 'neutral', status, to: null, sortAt: NEVER };
  }
  const from = new Date(a.nextFreeStartsAt).getTime();
  if (from <= t + 60_000 && watch.benchId) {
    return {
      ...base,
      tone: 'free',
      status: `Free now · until ${formatAlertTime(a.nextFreeEndsAt, now)}`,
      to: bookPath(watch.benchId, a.nextFreeStartsAt, a.nextFreeEndsAt),
      sortAt: FREE_NOW,
    };
  }
  const when = formatAlertTime(a.nextFreeStartsAt, now);
  // "Free at 15:00" today; "Free tomorrow 09:00" / "Free Thu, Nov 27 09:00" later.
  const status = when.includes(' ') ? `Free ${when.replace(/^Tomorrow/, 'tomorrow')}` : `Free at ${when}`;
  return { ...base, tone: 'neutral', status, to: null, sortAt: from };
}

/** Bookings and active alerts, most urgent first: free now, then by the next moment that matters. */
export function buildUpNextItems(bookings: UpNextBooking[], alerts: ISlotWatch[], now: Date = new Date()): UpNextItem[] {
  const t = now.getTime();
  const items = [
    ...bookings.filter((booking) => new Date(booking.endsAt).getTime() > t).map((booking) => bookingItem(booking, t, now)),
    ...alerts.filter((watch) => watch.status === 'active').map((watch) => alertItem(watch, t, now)),
  ];
  return items.sort((a, b) => a.sortAt - b.sortAt || a.title.localeCompare(b.title));
}

/** How many tiles to show before the "+N" tile; the "+N" tile takes the last slot. */
export function visibleCount(total: number, slots: number, expanded: boolean): number {
  if (expanded || total <= slots) return total;
  return Math.max(1, slots - 1);
}
