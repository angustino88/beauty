import dayjs from 'dayjs';
import { useCallback, useRef, useState } from 'react';
import type { EventInput } from '@fullcalendar/core';
import { useLazyGetBenchBookingsQuery } from '../api';
import { useLazyGetDowntimesQuery } from '@/features/spaces/shared/downtimeApi';
import { useAuthState } from '@/features/auth/hooks/useAuthState';

const CALENDAR_DATETIME_FORMAT = 'YYYY-MM-DDTHH:mm:ss';

export function useBookingCalendarEvents() {
  const { id: myUserId, permissionGroups } = useAuthState();
  const [bookingEvents, setBookingEvents] = useState<EventInput[]>([]);
  const [fetchBookings, { isFetching: isFetchingBookings }] = useLazyGetBenchBookingsQuery();
  const [fetchDowntimes, { isFetching: isFetchingDowntimes }] = useLazyGetDowntimesQuery();
  const lastFetchSeqRef = useRef(0);

  const fetchEvents = useCallback(
    (
      benchIds: number[],
      dateRange?: {
        start?: string;
        end?: string;
        starts_at_after?: string;
        starts_at_before?: string;
      },
    ) => {
      const fetchSeq = ++lastFetchSeqRef.current;
      if (!benchIds || benchIds.length === 0) {
        setBookingEvents([]);
        return;
      }

      const startsAtAfter = dateRange?.starts_at_after ?? dateRange?.start;
      const startsAtBefore = dateRange?.starts_at_before ?? dateRange?.end;

      const bookingsPromise = fetchBookings(
        {
          view_side: 'booking_calendar',
          bench_id: benchIds,
          starts_at_after: startsAtAfter,
          starts_at_before: startsAtBefore,
        },
        true,
      ).unwrap();

      const downtimesPromise = fetchDowntimes({ page_size: 100 }, true).unwrap();

      void Promise.allSettled([bookingsPromise, downtimesPromise]).then(
        ([bookingsRes, downtimesRes]) => {
          if (fetchSeq !== lastFetchSeqRef.current) return;

          const bookings =
            bookingsRes.status === 'fulfilled' ? bookingsRes.value.data : [];
          const downtimes =
            downtimesRes.status === 'fulfilled' ? downtimesRes.value.data : [];

          const mappedBookings: EventInput[] = bookings.flatMap((booking) => {
            const startStr = booking.starts_at;
            const endStr = booking.ends_at;
            if (!startStr || !endStr) return [];

            const access =
              !!permissionGroups['lab-coordinator'] ||
              (myUserId !== null && booking.creator?.id === myUserId);

            const diffHours = dayjs(endStr).diff(dayjs(startStr), 'hours');
            const projectName = booking.project?.name || 'Unknown Project';
            const reason = booking.reason || '';

            return [
              {
                id: booking.id.toString(),
                creator: booking.creator?.display_name || booking.creator?.username || 'Unknown',
                title: `${projectName} - ${reason}`,
                start: startStr,
                end:
                  diffHours >= 23
                    ? dayjs(endStr).add(1, 'day').format(CALENDAR_DATETIME_FORMAT)
                    : endStr,
                // Colours come from the theme (App.css .lm-event-*): own bookings in
                // the brand accent, other people's in neutral.
                classNames: ['lm-event', access ? 'lm-event-mine' : 'lm-event-other'],
                allDay: diffHours >= 23,
                stick: true,
              },
            ];
          });

          // Section 7: Grey out downtime windows in calendar
          const mappedDowntimes: EventInput[] = downtimes
            .filter((d) => d.state === 'scheduled' || d.state === 'current')
            .filter((d) => {
              if (d.resource.type === 'bench') {
                return benchIds.includes(d.resource.id);
              }
              // For room or station downtime, show when active
              return true;
            })
            .flatMap((d) => {
              const startStr = d.starts_at;
              const endStr =
                d.ends_at ??
                dayjs(startStr).add(14, 'day').format(CALENDAR_DATETIME_FORMAT);
              const condLabel =
                d.condition.label ||
                (d.condition.value === 'out_of_service'
                  ? 'Out of service'
                  : 'In maintenance');
              const reasonLabel = d.reason.label || d.reason.value;

              return [
                {
                  id: `downtime-${d.id}`,
                  title: `[Unavailable] ${condLabel} (${reasonLabel})`,
                  start: startStr,
                  end: endStr,
                  classNames: ['lm-event', 'lm-event-downtime'],
                  allDay: false,
                  editable: false,
                  extendedProps: {
                    isDowntime: true,
                    downtimeId: d.id,
                    condition: condLabel,
                    reason: reasonLabel,
                    notes: d.notes,
                  },
                },
              ];
            });

          setBookingEvents([...mappedBookings, ...mappedDowntimes]);
        },
      );
    },
    [fetchBookings, fetchDowntimes, myUserId, permissionGroups],
  );

  return {
    bookingEvents,
    isFetching: isFetchingBookings || isFetchingDowntimes,
    fetchEvents,
  };
}
