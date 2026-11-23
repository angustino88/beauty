import dayjs, { type Dayjs } from 'dayjs';
import { getApiErrorMessage } from '../notifications/apiError.ts';

export const DATE_FORMAT = 'YYYY-MM-DD';
export const FULL_FORMAT = 'YYYY-MM-DD hh:mm A';
export const TIME_FORMAT = 'HH:mm';
export const DATETIMEFORMAT = `MM/DD/YYYY, ${TIME_FORMAT}`;
export const BOOKING_DATETIME_FORMAT = 'YYYY-MM-DDTHH:mm:ssZ';

export function roundUpToNearest5Minutes(dt: Dayjs): Dayjs {
  const minutes = dt.minute();
  const remainder = minutes % 5;
  if (remainder === 0) return dt.second(0).millisecond(0);
  return dt.add(5 - remainder, 'minute').second(0).millisecond(0);
}

export function range(start: number, end: number): number[] {
  const result: number[] = [];
  for (let i = start; i < end; i += 1) result.push(i);
  return result;
}

export function disabledRangeTime(date: Dayjs | null, start?: Dayjs | null) {
  const startD = (start ?? dayjs()).add(0, 'minute');

  return {
    disabledHours: () => {
      if (!date || date.isAfter(startD, 'day')) return [];
      return range(0, startD.hour());
    },
    disabledMinutes: () => {
      if (!date || date.isAfter(startD, 'day') || date.isAfter(startD, 'hour')) return [];
      return range(0, startD.minute());
    },
  };
}

export interface ProcessedBooking {
  id?: number;
  bench_id?: number;
  project_id?: number | null;
  starts_at: string;
  ends_at: string;
  reason?: string | null;
  status?: string;
  approval_status?: string;
  [key: string]: unknown;
}

function extractNumericValue(value: unknown): number | undefined {
  if (typeof value === 'number') return value;
  if (!value || typeof value !== 'object') return undefined;

  const candidate = value as { id?: unknown; value?: unknown };
  if (typeof candidate.value === 'number') return candidate.value;
  if (typeof candidate.id === 'number') return candidate.id;
  return undefined;
}

function formatBookingDateTime(value: unknown): string {
  const localDateTime = dayjs.isDayjs(value) ? value : dayjs(value as string);

  if (!localDateTime.isValid()) {
    throw new Error('Booking datetime is invalid');
  }

  return localDateTime.format(BOOKING_DATETIME_FORMAT);
}

export function processBookingBody(booking: Record<string, unknown>): ProcessedBooking {
  const {
    bench_id,
    project_id,
    starts_at,
    ends_at,
    reason,
    ...otherValues
  } = booking;

  if (!starts_at || !ends_at) {
    throw new Error('Booking must include both starts_at and ends_at datetime');
  }

  const benchIdNum = extractNumericValue(bench_id);
  const projectIdNum = extractNumericValue(project_id);
  const formattedStart = formatBookingDateTime(starts_at);
  const formattedEnd = formatBookingDateTime(ends_at);
  const reasonText = (reason ?? '') as string;

  return {
    ...otherValues,
    id: extractNumericValue(booking.id),
    bench_id: benchIdNum,
    project_id: projectIdNum,
    starts_at: formattedStart,
    ends_at: formattedEnd,
    reason: reasonText || null,
  };
}

export function extractBookingErrorMessage(
  error: unknown,
  fallback = 'Unable to process booking. Please try again.',
): string {
  return getApiErrorMessage(error, fallback);
}

