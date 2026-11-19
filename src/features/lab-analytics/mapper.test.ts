import test from 'node:test';
import assert from 'node:assert/strict';
import { mapSessionLogEntry } from './mapper.ts';

test('mapSessionLogEntry maps the verified booking with its project and slot', () => {
  const row = mapSessionLogEntry({
    id: 1,
    login_at: '2026-11-10T08:05:00Z',
    logout_at: '2026-11-10T11:50:00Z',
    booking_code: 'BK-9',
    booking: {
      id: 9,
      booking_code: 'BK-9',
      starts_at: '2026-11-10T08:00:00Z',
      ends_at: '2026-11-10T12:00:00Z',
      status: { value: 'completed', label: 'Completed' },
      project: { id: 3, name: 'Apollo' },
    },
  });

  assert.deepEqual(row.booking, {
    id: 9,
    booking_code: 'BK-9',
    starts_at: '2026-11-10T08:00:00Z',
    ends_at: '2026-11-10T12:00:00Z',
    status: { value: 'completed', label: 'Completed' },
    project: { id: 3, name: 'Apollo' },
  });
});

test('mapSessionLogEntry leaves booking null for ad hoc and unverified sessions', () => {
  assert.equal(mapSessionLogEntry({ id: 2, booking_code: 'TYPO-1', booking: null }).booking, null);
  assert.equal(mapSessionLogEntry({ id: 3 }).booking, null);
});
