import dayjs from 'dayjs';
import { useCallback, useRef, useState } from 'react';
import type { EventInput } from '@fullcalendar/core';
import { useLazyGetBenchBookingsQuery } from '../api';
import { useLazyGetDowntimesQuery } from '@/features/spaces/shared/downtimeApi';
import { useLazyGetBenchByIdQuery } from '@/features/spaces/bench/api';
import { useAuthState } from '@/features/auth/hooks/useAuthState';
import { benchColor } from '../utils/benchColors';

const CALENDAR_DATETIME_FORMAT = 'YYYY-MM-DDTHH:mm:ss';

export function useBookingCalendarEvents() {
  const { id: myUserId } = useAuthState();
  const [bookingEvents, setBookingEvents] = useState<EventInput[]>([]);
  const [fetchBookings, { isFetching: isFetchingBookings }] = useLazyGetBenchBookingsQuery();
  const [fetchDowntimes, { isFetching: isFetchingDowntimes }] = useLazyGetDowntimesQuery();
  const [fetchBench, { isFetching: isFetchingBenches }] = useLazyGetBenchByIdQuery();
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

      // A station or room downtime blocks only the benches set up on that station or in that room,
      // so each selected bench's station and room are needed to pick the windows that apply.
      const benchesPromise = Promise.allSettled(
        benchIds.map((benchId) => fetchBench(benchId, true).unwrap()),
      );

      void Promise.allSettled([bookingsPromise, downtimesPromise, benchesPromise]).then(
        ([bookingsRes, downtimesRes, benchesRes]) => {
          if (fetchSeq !== lastFetchSeqRef.current) return;

          const bookings =
            bookingsRes.status === 'fulfilled' ? bookingsRes.value.data : [];
          const downtimes =
            downtimesRes.status === 'fulfilled' ? downtimesRes.value.data : [];
          const benches =
            benchesRes.status === 'fulfilled'
              ? benchesRes.value.flatMap((res) => (res.status === 'fulfilled' ? [res.value] : []))
              : [];
          const stationIds = new Set(
            benches.flatMap((b) => {
              const id = b.station?.id ?? b.setup_location_id;
              return id != null ? [id] : [];
            }),
          );
          const roomIds = new Set(benches.flatMap((b) => (b.room?.id != null ? [b.room.id] : [])));

          const mappedBookings: EventInput[] = bookings.flatMap((booking) => {
            const startStr = booking.starts_at;
            const endStr = booking.ends_at;
            if (!startStr || !endStr) return [];

            // Colour only says whose booking it is; a coordinator's edit rights do not make others' bookings "mine".
            const isMine = myUserId !== null && booking.creator?.id === myUserId;

            const diffHours = dayjs(endStr).diff(dayjs(startStr), 'hours');
            const projectName = booking.project?.name || 'Unknown Project';
            const reason = booking.reason || '';

            return [
              {
                id: booking.id.toString(),
                creator: booking.creator?.display_name || booking.creator?.username || 'Unknown',
                title: `${projectName}${reason ? ` - ${reason}` : ''}`,
                start: startStr,
                end:
                  diffHours >= 23
                    ? dayjs(endStr).add(1, 'day').format(CALENDAR_DATETIME_FORMAT)
                    : endStr,
                // Colours come from the theme (App.css .lm-event-*): own bookings in green, others' orange.
                // The event title is the project and reason; the bench and computer are in the detail popover.
                classNames: ['lm-event', isMine ? 'lm-event-mine' : 'lm-event-other'],
                allDay: diffHours >= 23,
                stick: true,
                booking,
                // With several benches on screen, each booking carries its bench's colour and SKU.
                benchColor: benchIds.length > 1 ? benchColor(benchIds, booking.bench?.id) : undefined,
                benchSku: benchIds.length > 1 ? booking.bench?.sku || booking.bench?.name : undefined,
              },
            ];
          });

          // Section 7: Grey out downtime windows in calendar
          const mappedDowntimes: EventInput[] = downtimes
            .filter((d) => d.state === 'scheduled' || d.state === 'current')
            .filter((d) => {
              if (d.resource.type === 'bench') return benchIds.includes(d.resource.id);
              if (d.resource.type === 'station') return stationIds.has(d.resource.id);
              if (d.resource.type === 'room') return roomIds.has(d.resource.id);
              // Equipment downtime does not block a bench booking.
              return false;
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
                  title: condLabel,
                  start: startStr,
                  end: endStr,
                  classNames: [
                    'lm-event',
                    'lm-event-downtime',
                    d.condition.value === 'out_of_service' ? 'lm-event-downtime-oos' : 'lm-event-downtime-maint',
                  ],
                  allDay: false,
                  editable: false,
                  extendedProps: {
                    isDowntime: true,
                    downtimeId: d.id,
                    condition: condLabel,
                    conditionValue: d.condition.value,
                    reason: reasonLabel,
                    notes: d.notes,
                    openEnded: !d.ends_at,
                    state: d.state,
                    resourceType: d.resource.type,
                    resourceId: d.resource.id,
                  },
                },
              ];
            });

          setBookingEvents([...mappedBookings, ...mappedDowntimes]);
        },
      );
    },
    [fetchBookings, fetchDowntimes, fetchBench, myUserId],
  );

  return {
    bookingEvents,
    isFetching: isFetchingBookings || isFetchingDowntimes || isFetchingBenches,
    fetchEvents,
  };
}
