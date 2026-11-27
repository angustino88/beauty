import test from 'node:test';
import assert from 'node:assert/strict';
import {
  alertPhase,
  formatAlertTime,
  formatAlertWindow,
  formatBookingCountdown,
  mapSlotWatch,
  timelineSegments,
} from './slotWatchMapper.ts';

test('mapSlotWatch flattens bench and status references', () => {
  const watch = mapSlotWatch({
    id: 7,
    bench: { id: 3, name: 'Bench 03' },
    starts_at: '2026-11-27T09:00:00+07:00',
    ends_at: '2026-11-27T12:00:00+07:00',
    status: { value: 'active', label: 'Active' },
    created_at: '2026-11-26T09:00:00+07:00',
  });
  assert.equal(watch.benchId, 3);
  assert.equal(watch.benchName, 'Bench 03');
  assert.equal(watch.followedBookingId, null);
  assert.equal(watch.status, 'active');
});

test('mapSlotWatch tolerates a missing bench and status', () => {
  const watch = mapSlotWatch({ id: 1, starts_at: 'a', ends_at: 'b' });
  assert.equal(watch.benchId, null);
  assert.equal(watch.benchName, 'Bench');
  assert.equal(watch.status, 'active');
});

test('formatAlertWindow names today and tomorrow and spans days', () => {
  const now = new Date(2026, 10, 26, 9, 0);
  assert.equal(
    formatAlertWindow(new Date(2026, 10, 26, 11, 50).toISOString(), new Date(2026, 10, 26, 14, 5).toISOString(), now),
    'Today 11:50 – 14:05',
  );
  assert.equal(
    formatAlertWindow(new Date(2026, 10, 26, 22, 0).toISOString(), new Date(2026, 10, 27, 2, 0).toISOString(), now),
    'Today 22:00 – Tomorrow 02:00',
  );
});

test('alertPhase is watching once the range has started', () => {
  const now = new Date(2026, 10, 26, 12, 0);
  assert.equal(alertPhase(new Date(2026, 10, 26, 11, 0).toISOString(), now), 'watching');
  assert.equal(alertPhase(new Date(2026, 10, 26, 13, 0).toISOString(), now), 'upcoming');
});

test('mapSlotWatch keeps the followed booking and formatAlertTime drops "Today"', () => {
  const watch = mapSlotWatch({ id: 4, starts_at: 'a', ends_at: 'b', followed_booking_id: 42 });
  assert.equal(watch.followedBookingId, 42);
  const now = new Date(2026, 10, 26, 9, 0);
  assert.equal(formatAlertTime(new Date(2026, 10, 26, 14, 0).toISOString(), now), '14:00');
  assert.equal(formatAlertTime(new Date(2026, 10, 27, 9, 30).toISOString(), now), 'Tomorrow 09:30');
});

test('availability maps and timeline marks busy, own and free time', () => {
  const watch = mapSlotWatch({
    id: 5,
    starts_at: '2026-11-26T08:00:00Z',
    ends_at: '2026-11-26T12:00:00Z',
    availability: {
      window_starts_at: '2026-11-26T08:00:00Z',
      window_ends_at: '2026-11-26T12:00:00Z',
      busy_periods: [
        { starts_at: '2026-11-26T08:00:00Z', ends_at: '2026-11-26T09:00:00Z', is_mine: false },
        { starts_at: '2026-11-26T10:00:00Z', ends_at: '2026-11-26T11:00:00Z', is_mine: true },
      ],
      next_free_starts_at: '2026-11-26T09:00:00Z',
      next_free_ends_at: '2026-11-26T10:00:00Z',
      watcher_count: 2,
    },
  });
  assert.equal(watch.availability?.watcherCount, 2);
  const segments = timelineSegments(watch.availability!);
  assert.deepEqual(
    segments.map((s) => [s.kind, Math.round(s.left), Math.round(s.width)]),
    [
      ['busy', 0, 25],
      ['free', 25, 25],
      ['mine', 50, 25],
      ['free', 75, 25],
    ],
  );
  assert.equal(mapSlotWatch({ id: 6, starts_at: 'a', ends_at: 'b' }).availability, null);
});

test('formatBookingCountdown', () => {
  const now = new Date(2026, 10, 26, 13, 35);
  const at = (h: number, m = 0, d = 26) => new Date(2026, 10, d, h, m).toISOString();
  assert.equal(formatBookingCountdown(at(14), at(16), now), 'Starts in 25 min');
  assert.equal(formatBookingCountdown(at(16), at(18), now), 'Starts at 16:00');
  assert.equal(formatBookingCountdown(at(9, 0, 27), at(12, 0, 27), now), 'Tomorrow 09:00');
  assert.equal(formatBookingCountdown(at(13), at(16), now), 'In progress · ends 16:00');
});
