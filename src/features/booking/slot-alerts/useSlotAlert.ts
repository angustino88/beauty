import dayjs, { type Dayjs } from 'dayjs';
import { useCallback } from 'react';
import { notify } from '@/shared/notifications';
import { extractBookingErrorMessage } from '@/shared/utils/booking';
import { formatAlertTime, formatAlertWindow } from '../slotWatchMapper';
import { useCreateSlotWatchMutation, useFollowBookingMutation, useGetSlotWatchesQuery } from '../slotWatchApi';

export type SlotAlertTarget = {
  benchId: number;
  startsAt: Dayjs | string;
  endsAt: Dayjs | string;
};

const toApi = (value: Dayjs | string) => dayjs(value).second(0).millisecond(0).format();

/** Create slot alerts with one call and a consistent confirmation; also tells whether one already exists. */
export function useSlotAlert() {
  const [create, { isLoading }] = useCreateSlotWatchMutation();
  const [follow] = useFollowBookingMutation();
  const { data: active } = useGetSlotWatchesQuery({ status: 'active' });

  const findExisting = useCallback(
    (target: SlotAlertTarget) =>
      active?.find(
        (watch) =>
          watch.benchId === target.benchId &&
          dayjs(watch.startsAt).isSame(toApi(target.startsAt), 'minute') &&
          dayjs(watch.endsAt).isSame(toApi(target.endsAt), 'minute'),
      ),
    [active],
  );

  const createAlert = useCallback(
    async (target: SlotAlertTarget): Promise<boolean> => {
      // Never watch the past: clip the start to now.
      const now = dayjs();
      const start = dayjs(target.startsAt).isBefore(now) ? now : dayjs(target.startsAt);
      try {
        const watch = await create({
          bench_id: target.benchId,
          starts_at: toApi(start),
          ends_at: toApi(target.endsAt),
        }).unwrap();
        notify.success('Slot alert is on', {
          description: `We'll let you know as soon as ${watch.benchName} frees up (${formatAlertWindow(
            watch.startsAt,
            watch.endsAt,
          )}).`,
          duration: 5000,
        });
        return true;
      } catch (error) {
        notify.error("Couldn't set the slot alert", {
          description: extractBookingErrorMessage(error, 'Please try again in a moment.'),
        });
        return false;
      }
    },
    [create],
  );

  const findFollow = useCallback(
    (bookingId: number) => active?.find((watch) => watch.followedBookingId === bookingId),
    [active],
  );

  const followBooking = useCallback(
    async (bookingId: number): Promise<boolean> => {
      try {
        const watch = await follow(bookingId).unwrap();
        notify.success("You're following this booking", {
          description: `We'll send you one alert as soon as ${watch.benchName} frees up — when the booking is about to end (now ${formatAlertTime(
            watch.endsAt,
          )}), finishes early, or is cancelled.`,
          duration: 5000,
        });
        return true;
      } catch (error) {
        notify.error("Couldn't follow this booking", {
          description: extractBookingErrorMessage(error, 'Please try again in a moment.'),
        });
        return false;
      }
    },
    [follow],
  );

  return { createAlert, findExisting, followBooking, findFollow, isCreating: isLoading };
}
