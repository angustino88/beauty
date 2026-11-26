import dayjs from 'dayjs';
import { useCallback, useMemo, useState } from 'react';
import { useGetSlotWatchesQuery } from '../slotWatchApi';

const RECENT_HOURS = 12;
const STORAGE_KEY = 'lm:slot-alerts:dismissed';

const readDismissed = (): number[] => {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]');
    return Array.isArray(parsed) ? parsed.filter((id): id is number => typeof id === 'number') : [];
  } catch {
    return [];
  }
};

/** Alerts sent in the last hours, so users can see an alert went out; dismissed ones stay hidden on this device. */
export function useRecentlyNotified(enabled = true) {
  // Rounded to the hour so the query key stays stable between renders.
  const [updatedAfter] = useState(() => dayjs().subtract(RECENT_HOURS, 'hour').startOf('hour').toISOString());
  const { data } = useGetSlotWatchesQuery({ status: 'fulfilled', updatedAfter }, { skip: !enabled });
  const [dismissed, setDismissed] = useState<number[]>(readDismissed);

  const dismiss = useCallback((id: number) => {
    setDismissed((previous) => {
      const next = [...previous, id].slice(-50);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        // Storage unavailable: dismissal lasts for this page view only.
      }
      return next;
    });
  }, []);

  const recent = useMemo(() => (data ?? []).filter((watch) => !dismissed.includes(watch.id)), [data, dismissed]);
  return { recent, dismiss };
}
