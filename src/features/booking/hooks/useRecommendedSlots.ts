import { useEffect, useMemo } from 'react';
import dayjs, { type Dayjs } from 'dayjs';
import { useLazyGetBenchBookingsQuery } from '../api';
import type { IBenchBookingRecommendedSlot } from '../types';
import { DATE_FORMAT, roundUpToNearest5Minutes } from '@/shared/utils/booking';

const DEFAULT_SLOT_DURATION_MINUTES = 30;
const MAX_RECOMMENDED_SLOTS = 4;

export function useRecommendedSlots(
  benchId: number | undefined,
  durationMinutes?: number,
  selectedDate?: Dayjs,
): {
  recommendedSlots: IBenchBookingRecommendedSlot[];
  loading: boolean;
  hasBlockingBookings: boolean;
} {
  const [fetchBookings, { data, isFetching }] = useLazyGetBenchBookingsQuery();

  useEffect(() => {
    if (benchId == null) return;
    const date = selectedDate ?? dayjs();
    void fetchBookings({
      bench_id: [benchId],
      starts_at_after: date.format(DATE_FORMAT),
      starts_at_before: date.add(1, 'day').format(DATE_FORMAT),
      view_side: 'booking_calendar',
    });
  }, [fetchBookings, benchId, selectedDate]);

  const { recommendedSlots, hasBlockingBookings } = useMemo(() => {
    const empty = { recommendedSlots: [] as IBenchBookingRecommendedSlot[], hasBlockingBookings: false };
    if (benchId == null || !data?.data) return empty;

    const selectedDay = (selectedDate ?? dayjs()).startOf('day');
    const now = dayjs();
    const cursorStart = selectedDay.isSame(now, 'day')
      ? roundUpToNearest5Minutes(now)
      : selectedDay;
    const endOfDay = selectedDay.endOf('day');
    const slotDuration = Math.max(durationMinutes ?? DEFAULT_SLOT_DURATION_MINUTES, 10);

    const activeBookings = data.data
      .filter(
        (b) =>
          b.status !== 'cancelled' &&
          b.status !== 'cancel' &&
          dayjs(b.ends_at).isAfter(cursorStart),
      )
      .sort((a, b) => (dayjs(a.starts_at).isBefore(dayjs(b.starts_at)) ? -1 : 1));

    const slots: IBenchBookingRecommendedSlot[] = [];
    let cursor: Dayjs = cursorStart;

    for (const booking of activeBookings) {
      const bookingStart = dayjs(booking.starts_at);
      const bookingEnd = dayjs(booking.ends_at);

      const gapMinutes = bookingStart.diff(cursor, 'minute');
      if (gapMinutes >= slotDuration) {
        slots.push({ start: cursor, end: cursor.add(slotDuration, 'minute') });
        if (slots.length === MAX_RECOMMENDED_SLOTS) break;
      }

      if (bookingEnd.isAfter(cursor)) cursor = bookingEnd;
    }

    if (slots.length < MAX_RECOMMENDED_SLOTS && endOfDay.diff(cursor, 'minute') >= slotDuration) {
      slots.push({ start: cursor, end: cursor.add(slotDuration, 'minute') });
    }

    return { recommendedSlots: slots, hasBlockingBookings: activeBookings.length > 0 };
  }, [data, durationMinutes, benchId, selectedDate]);

  return { recommendedSlots, loading: isFetching, hasBlockingBookings };
}
