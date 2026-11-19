import dayjs from 'dayjs';
import type { LabSessionLogEntry } from '../types';

/** 95 → "1 h 35 min"; minutes stay readable at a glance, hours for long sessions. */
export function formatMinutes(minutes: number | null): string {
  if (minutes == null) return '—';
  const total = Math.round(minutes);
  if (total < 60) return `${total} min`;
  const hours = Math.floor(total / 60);
  const rest = total % 60;
  return rest ? `${hours} h ${rest} min` : `${hours} h`;
}

/** "08:00 – 12:00" when the slot is on the login day; dates are added otherwise. */
export function formatSlot(row: LabSessionLogEntry): string | null {
  const { starts_at: start, ends_at: end } = row.booking ?? {};
  if (!start || !end) return null;
  const from = dayjs(start);
  const to = dayjs(end);
  const loginDay = row.login_at ? dayjs(row.login_at) : from;
  const fromText = from.isSame(loginDay, 'day') ? from.format('HH:mm') : from.format('DD MMM, HH:mm');
  const toText = to.isSame(from, 'day') ? to.format('HH:mm') : to.format('DD MMM, HH:mm');
  return `${fromText} – ${toText}`;
}

/** Whether the session stayed inside the booked slot, and by how much it did not. */
export function checkAgainstSlot(row: LabSessionLogEntry): { ok: boolean; label: string; detail: string } | null {
  const { starts_at: start, ends_at: end } = row.booking ?? {};
  if (!start || !end || !row.login_at) return null;
  const early = dayjs(start).diff(dayjs(row.login_at), 'minute');
  const late = row.logout_at ? dayjs(row.logout_at).diff(dayjs(end), 'minute') : 0;
  const issues: string[] = [];
  if (early > 0) issues.push(`logged in ${formatMinutes(early)} before the slot`);
  if (late > 0) issues.push(`logged out ${formatMinutes(late)} after the slot`);
  if (!issues.length) return { ok: true, label: 'Within slot', detail: 'The session started and ended inside the booked slot.' };
  const detail = issues.join(' and ');
  const label = early > 0 && late > 0 ? 'Outside slot' : early > 0 ? `${formatMinutes(early)} early` : `${formatMinutes(late)} over`;
  return { ok: false, label, detail: `${detail.charAt(0).toUpperCase()}${detail.slice(1)}.` };
}
