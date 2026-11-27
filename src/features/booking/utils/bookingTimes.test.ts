import test from 'node:test';
import assert from 'node:assert/strict';
import { actualEnd, endedEarly, isOnSchedule } from './bookingTimes.ts';

const booked = { ends_at: '2026-11-27T15:30:00Z' };

test('cancelled, expired and rejected bookings are not on the schedule', () => {
  assert.equal(isOnSchedule({ status: 'cancelled', approval_status: 'approved' }), false);
  assert.equal(isOnSchedule({ status: 'expired', approval_status: 'approved' }), false);
  assert.equal(isOnSchedule({ status: 'reserved', approval_status: 'rejected' }), false);
  assert.equal(isOnSchedule({ status: 'reserved', approval_status: 'pending' }), true);
  assert.equal(isOnSchedule({ status: 'in_progress', approval_status: 'approved' }), true);
  assert.equal(isOnSchedule({ status: 'completed', approval_status: 'approved' }), true);
});

test('a booking completed early ends when it was completed', () => {
  const early = { ...booked, status: 'completed', completed_at: '2026-11-27T13:40:00Z' };
  assert.equal(actualEnd(early), '2026-11-27T13:40:00Z');
  assert.equal(endedEarly(early), true);
});

test('other bookings keep their booked end', () => {
  assert.equal(actualEnd({ ...booked, status: 'completed', completed_at: '2026-11-27T15:30:00Z' }), booked.ends_at);
  assert.equal(actualEnd({ ...booked, status: 'completed', completed_at: null }), booked.ends_at);
  assert.equal(actualEnd({ ...booked, status: 'in_progress' }), booked.ends_at);
  assert.equal(endedEarly({ ...booked, status: 'in_progress' }), false);
});
