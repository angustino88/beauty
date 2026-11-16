import dayjs from 'dayjs';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { EventInput } from '@fullcalendar/core';
import { useLazyGetBenchBookingsQuery } from '../api';
import { useLazyGetDowntimesQuery } from '@/features/spaces/shared/downtimeApi';
import { useAuthState } from '@/features/auth/hooks/useAuthState';
import { useGetBookingBenchChoicesQuery } from '../api';
import { formatBenchLabel } from '../utils/benchChoiceOption';

const CALENDAR_DATETIME_FORMAT = 'YYYY-MM-DDTHH:mm:ss';

export function useBookingCalendarEvents() {
  const { id: myUserId } = useAuthState();
  // Same cached request the bench filter makes; gives each bench its computers for the event title.
  const { data: benchChoicesData } = useGetBookingBenchChoicesQuery();
  // A ref, so the choices arriving later do not change `fetchEvents` and trigger another bookings request.
  const benchChoicesRef = useRef(benchChoicesData);
  useEffect(() => {
    benchChoicesRef.current = benchChoicesData;
  }, [benchChoicesData]);
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

      // The list filters on one bench per request, so each visible bench is fetched separately.
      const bookingsPromise = Promise.all(
        benchIds.map((benchId) =>
          fetchBookings(
            {
              view_side: 'booking_calendar',
              bench_id: [benchId],
              starts_at_after: startsAtAfter,
              starts_at_before: startsAtBefore,
            },
            true,
          ).unwrap(),
        ),
      ).then((pages) => ({ data: pages.flatMap((page) => page.data) }));

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

            // Colour only says whose booking it is; a coordinator's edit rights do not make others' bookings "mine".
            const isMine = myUserId !== null && booking.creator?.id === myUserId;
            const choice = benchChoicesRef.current?.find((bench) => bench.id === booking.bench?.id);
            const benchLabel = formatBenchLabel(
              booking.bench?.sku || choice?.sku,
              booking.bench?.name || choice?.name,
              booking.computer?.computer_name
                ? [booking.computer.computer_name]
                : (choice?.computers ?? []).map((computer) => computer.name || computer.sku),
            ) || 'Unknown Bench';

            const diffHours = dayjs(endStr).diff(dayjs(startStr), 'hours');
            const projectName = booking.project?.name || 'Unknown Project';
            const reason = booking.reason || '';

            return [
              {
                id: booking.id.toString(),
                creator: booking.creator?.display_name || booking.creator?.username || 'Unknown',
                title: benchLabel,
                projectTitle: `${projectName}${reason ? ` - ${reason}` : ''}`,
                start: startStr,
                end:
                  diffHours >= 23
                    ? dayjs(endStr).add(1, 'day').format(CALENDAR_DATETIME_FORMAT)
                    : endStr,
                // Colours come from the theme (App.css .lm-event-*): own bookings in
                // green, other people's in neutral.
                classNames: ['lm-event', isMine ? 'lm-event-mine' : 'lm-event-other'],
                allDay: diffHours >= 23,
                stick: true,
                booking,
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
    [fetchBookings, fetchDowntimes, myUserId],
  );

  return {
    bookingEvents,
    isFetching: isFetchingBookings || isFetchingDowntimes,
    fetchEvents,
  };
}
