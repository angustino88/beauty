import dayjs from 'dayjs';
import { useGetBenchBookingsQuery } from '../api';

/**
 * Whether a booking (known only by id, bench and start, as on the Dashboard) was made by the signed-in user.
 * Reads the user's own bookings on that bench around that start; following your own booking makes no sense.
 */
export function useIsOwnBooking(booking?: { id: number; benchId: number; startsAt: string } | null) {
  const start = booking ? dayjs(booking.startsAt) : null;
  const { data, isFetching } = useGetBenchBookingsQuery(
    {
      view_side: 'my_booking',
      bench_id: booking ? [booking.benchId] : [],
      starts_at_after: start?.subtract(1, 'minute').toISOString(),
      starts_at_before: start?.add(1, 'minute').toISOString(),
      page: 1,
      page_size: 10,
    },
    { skip: !booking },
  );
  return {
    isOwn: !!booking && (data?.data ?? []).some((item) => Number(item.id) === booking.id),
    isChecking: isFetching,
  };
}
