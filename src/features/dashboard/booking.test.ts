import test from 'node:test';
import assert from 'node:assert/strict';
import { isCurrentlyBooked } from './types.ts';

const window = () => ({
  starts_at: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
  ends_at: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
});

test('a reserved or in_progress booking inside its window counts as booked now', () => {
  for (const status of ['reserved', 'in_progress']) {
    assert.equal(isCurrentlyBooked({ id: 1, booking_code: 'B1', status, ...window(), user: null }), true, status);
  }
});

test('finished, cancelled or out-of-window bookings do not count', () => {
  for (const status of ['completed', 'cancelled', 'expired']) {
    assert.equal(isCurrentlyBooked({ id: 1, booking_code: 'B1', status, ...window(), user: null }), false, status);
  }
  const past = {
    starts_at: new Date(Date.now() - 4 * 3600 * 1000).toISOString(),
    ends_at: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
  };
  assert.equal(isCurrentlyBooked({ id: 1, booking_code: 'B1', status: 'reserved', ...past, user: null }), false);
  assert.equal(isCurrentlyBooked(null), false);
});
