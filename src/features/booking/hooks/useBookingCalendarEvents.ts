import dayjs from 'dayjs';
import { useCallback, useRef, useState } from 'react';
import type { EventInput } from '@fullcalendar/core';
import { useLazyGetBenchBookingsQuery } from '../api';
import { useLazyGetDowntimesQuery } from '@/features/spaces/shared/downtimeApi';
import { useAuthState } from '@/features/auth/hooks/useAuthState';

const CALENDAR_DATETIME_FORMAT = 'YYYY-MM-DDTHH:mm:ss';

export function useBookingCalendarEvents() {
  const { id: myUserId, username: myUsername, permissionGroups } = useAuthState();
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
              (myUserId !== null && booking.creator?.id === myUserId) ||
              (booking.creator?.username != null &&
                booking.creator.username.trim().toLowerCase() === myUsername.trim().toLowerCase());

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
                color: access ? 'rgb(255, 230, 200)' : 'rgb(223, 237, 204)',
                borderColor: access ? 'rgb(230, 120, 30)' : 'rgb(113, 150, 62)',
                allDay: diffHours >= 23,
                stick: true,
                textColor: 'black',
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
                  color: 'rgba(209, 213, 219, 0.85)',
                  borderColor: '#9ca3af',
                  textColor: '#374151',
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
    [fetchBookings, fetchDowntimes, myUserId, myUsername, permissionGroups],
  );

  return {
    bookingEvents,
    isFetching: isFetchingBookings || isFetchingDowntimes,
    fetchEvents,
  };
}
