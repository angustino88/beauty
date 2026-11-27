/**
 * Schedule facts shared by the calendar, the bookings table and the booking popover.
 * No API client import, so it is unit-testable.
 */

type BookingTimes = {
  status?: string | null;
  approval_status?: string | null;
  ends_at: string;
  completed_at?: string | null;
};

/** Cancelled, expired and rejected bookings gave their time back: they are not on the schedule. */
const RELEASED_STATUSES = new Set(['cancelled', 'expired']);

export const isOnSchedule = (booking: Pick<BookingTimes, 'status' | 'approval_status'>): boolean =>
  !RELEASED_STATUSES.has(booking.status ?? '') && booking.approval_status !== 'rejected';

/** When the bench was actually released: a booking completed early ends at its completion time. */
export function actualEnd(booking: BookingTimes): string {
  const { completed_at: completedAt, ends_at: endsAt } = booking;
  if (booking.status !== 'completed' || !completedAt) return endsAt;
  return new Date(completedAt).getTime() < new Date(endsAt).getTime() ? completedAt : endsAt;
}

/** True when the booking was completed before its booked end (the booked end is then worth showing too). */
export const endedEarly = (booking: BookingTimes): boolean => actualEnd(booking) !== booking.ends_at;
