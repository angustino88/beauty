import test from 'node:test';
import assert from 'node:assert/strict';
import type { LabSessionLogEntry } from '../types.ts';
import { checkAgainstSlot, formatSlot } from './sessionBookingSlot.ts';

const row = (login: string, logout: string | null, start = '2026-11-10T08:00:00', end = '2026-11-10T12:00:00') => ({
  login_at: login,
  logout_at: logout,
  booking: { id: 1, booking_code: 'BK-1', starts_at: start, ends_at: end, status: null, project: null },
}) as unknown as LabSessionLogEntry;

test('formatSlot shows times only when the slot is on the login day', () => {
  assert.equal(formatSlot(row('2026-11-10T08:05:00', null)), '08:00 – 12:00');
  assert.equal(
    formatSlot(row('2026-11-10T22:05:00', null, '2026-11-10T22:00:00', '2026-11-11T02:00:00')),
    '22:00 – 11 Nov, 02:00',
  );
  assert.equal(formatSlot({ booking: null } as unknown as LabSessionLogEntry), null);
});

test('checkAgainstSlot passes a session inside the slot', () => {
  assert.equal(checkAgainstSlot(row('2026-11-10T08:00:00', '2026-11-10T12:00:00'))?.ok, true);
});

test('checkAgainstSlot reports early logins and overruns', () => {
  const early = checkAgainstSlot(row('2026-11-10T07:45:00', '2026-11-10T11:00:00'));
  assert.deepEqual([early?.ok, early?.label], [false, '15 min early']);

  const over = checkAgainstSlot(row('2026-11-10T08:10:00', '2026-11-10T13:35:00'));
  assert.deepEqual([over?.ok, over?.label], [false, '1 h 35 min over']);

  const both = checkAgainstSlot(row('2026-11-10T07:30:00', '2026-11-10T12:20:00'));
  assert.equal(both?.label, 'Outside slot');
  assert.equal(both?.detail, 'Logged in 30 min before the slot and logged out 20 min after the slot.');
});

test('checkAgainstSlot has nothing to say without a booking slot', () => {
  assert.equal(checkAgainstSlot({ login_at: '2026-11-10T08:00:00', booking: null } as unknown as LabSessionLogEntry), null);
});
