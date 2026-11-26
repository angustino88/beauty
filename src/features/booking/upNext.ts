/**
 * Pure "what matters most right now" selection for the Dashboard's one-line Up next bar.
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

export type UpNextTone = 'free' | 'soon' | 'neutral';

export interface UpNextHeadline {
  tone: UpNextTone;
  title: string;
  detail: string;
  action: { label: string; to: string } | null;
}

const HOUR = 3_600_000;

const bookPath = (benchId: number, startsAt: string, endsAt: string) =>
  `/booking-calendar?${new URLSearchParams({ action: 'create', bench_ids: String(benchId), starts_at: startsAt, ends_at: endsAt })}`;

/** Priority: free now → booking live or within an hour → bench frees within an hour → next booking → summary. */
export function pickHeadline(bookings: UpNextBooking[], alerts: ISlotWatch[], now: Date = new Date()): UpNextHeadline | null {
  const t = now.getTime();
  const live = alerts.filter((alert) => alert.status === 'active' && alert.availability);

  const freeNow = live.find(
    (alert) => alert.availability!.nextFreeStartsAt && new Date(alert.availability!.nextFreeStartsAt).getTime() <= t + 60_000,
  );
  if (freeNow?.benchId && freeNow.availability?.nextFreeEndsAt) {
    const a = freeNow.availability;
    return {
      tone: 'free',
      title: `${freeNow.benchName} is free now`,
      detail: `Until ${formatAlertTime(a.nextFreeEndsAt!)} · not reserved for you`,
      action: { label: 'Book now', to: bookPath(freeNow.benchId, a.nextFreeStartsAt!, a.nextFreeEndsAt!) },
    };
  }

  const sorted = [...bookings].sort((a, b) => a.startsAt.localeCompare(b.startsAt));
  const urgent = sorted.find((booking) => new Date(booking.startsAt).getTime() - t <= HOUR && new Date(booking.endsAt).getTime() > t);
  if (urgent) {
    const started = new Date(urgent.startsAt).getTime() <= t;
    return {
      tone: started ? 'neutral' : 'soon',
      title: started ? `Your booking on ${urgent.benchName} is in progress` : `Your booking on ${urgent.benchName}`,
      detail: formatBookingCountdown(urgent.startsAt, urgent.endsAt, now),
      action: { label: 'View', to: '/my-bookings' },
    };
  }

  const freesSoon = live
    .filter((alert) => alert.availability!.nextFreeStartsAt)
    .map((alert) => ({ alert, at: new Date(alert.availability!.nextFreeStartsAt!).getTime() }))
    .filter(({ at }) => at - t <= HOUR)
    .sort((a, b) => a.at - b.at)[0];
  if (freesSoon) {
    const a = freesSoon.alert.availability!;
    const others = a.watcherCount > 0 ? ` · ${a.watcherCount} other${a.watcherCount === 1 ? '' : 's'} watching` : '';
    return {
      tone: 'neutral',
      title: `${freesSoon.alert.benchName} frees up at ${formatAlertTime(a.nextFreeStartsAt!)}`,
      detail: `We'll notify you${others}`,
      action: null,
    };
  }

  const next = sorted.find((booking) => new Date(booking.endsAt).getTime() > t);
  if (next) {
    return {
      tone: 'neutral',
      title: `Next booking: ${next.benchName}`,
      detail: `${formatBookingCountdown(next.startsAt, next.endsAt, now)}${next.awaitingApproval ? ' · awaiting approval' : ''}`,
      action: { label: 'View', to: '/my-bookings' },
    };
  }

  if (live.length > 0) {
    return {
      tone: 'neutral',
      title: `Watching ${live.length} bench${live.length === 1 ? '' : 'es'}`,
      detail: "Nothing free yet · we'll notify you",
      action: null,
    };
  }
  return null;
}
