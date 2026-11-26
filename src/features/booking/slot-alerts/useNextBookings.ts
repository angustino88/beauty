import dayjs from 'dayjs';
import { useMemo, useState } from 'react';
import { useGetBenchBookingsQuery } from '../api';
import type { BenchBookingItem } from '../types';
import type { UpNextBooking } from '../upNext';

const ACTIVE = new Set(['reserved', 'in_progress']);

export const benchLabel = (booking: BenchBookingItem) =>
  [booking.bench?.name ?? booking.bench?.sku ?? 'Bench', booking.computer?.computer_name].filter(Boolean).join(' · ');

/** The signed-in user's reserved or running bookings in the coming week, soonest first. */
export function useNextBookings() {
  // Fixed for the page view so the query key stays stable.
  const [range] = useState(() => ({
    after: dayjs().startOf('minute').toISOString(),
    before: dayjs().add(7, 'day').endOf('day').toISOString(),
  }));
  const { data, isLoading } = useGetBenchBookingsQuery({
    view_side: 'my_booking',
    starts_at_after: range.after,
    starts_at_before: range.before,
    page: 1,
    page_size: 20,
  });
  const bookings = useMemo(
    () =>
      (data?.data ?? [])
        .filter((booking) => ACTIVE.has(booking.status) && dayjs(booking.ends_at).isAfter(dayjs()))
        .sort((a, b) => a.starts_at.localeCompare(b.starts_at)),
    [data],
  );
  const summaries = useMemo<UpNextBooking[]>(
    () =>
      bookings.map((booking) => ({
        id: booking.id,
        benchName: benchLabel(booking),
        startsAt: booking.starts_at,
        endsAt: booking.ends_at,
        awaitingApproval: booking.approval_status === 'pending',
      })),
    [bookings],
  );
  return { bookings, summaries, isLoading };
}
