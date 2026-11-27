import test from 'node:test';
import assert from 'node:assert/strict';
import { mapSlotWatch } from './slotWatchMapper.ts';
import { buildUpNextItems, visibleCount, type UpNextBooking } from './upNext.ts';

const now = new Date(2026, 10, 26, 13, 35);
const at = (h: number, m = 0, d = 26) => new Date(2026, 10, d, h, m).toISOString();

const alert = (id: number, bench: string, freeFrom: string | null, freeUntil: string | null, follow = false) =>
  mapSlotWatch({
    id,
    bench: { id, name: bench },
    starts_at: at(13),
    ends_at: at(18),
    followed_booking_id: follow ? 99 : null,
    status: { value: 'active' },
    availability: {
      window_starts_at: at(13, 35),
      window_ends_at: at(18),
      busy_periods: [],
      next_free_starts_at: freeFrom,
      next_free_ends_at: freeUntil,
      watcher_count: 0,
    },
  });

const booking = (id: number, startsAt: string, endsAt: string, pending = false): UpNextBooking => ({
  id,
  benchId: id + 100,
  benchName: `Bench ${id}`,
  startsAt,
  endsAt,
  awaitingApproval: pending,
});

test('mixes bookings and alerts, most urgent first', () => {
  const items = buildUpNextItems(
    [booking(12, at(14), at(16)), booking(3, at(9, 0, 27), at(12, 0, 27), true)],
    [
      alert(7, 'Bench 07', at(15), at(16)),
      alert(1, 'Bench 01', at(13, 30), at(14, 15)),
      alert(5, 'Bench 05', null, null),
    ],
    now,
  );
  assert.deepEqual(
    items.map((item) => [item.title, item.tone, item.status]),
    [
      ['Bench 01', 'free', 'Free now · until 14:15'],
      ['Bench 12', 'soon', 'Starts in 25 min'],
      ['Bench 07', 'neutral', 'Free at 15:00'],
      ['Bench 3', 'neutral', 'Tomorrow 09:00 · awaiting approval'],
      ['Bench 05', 'neutral', 'Fully booked'],
    ],
  );
  assert.match(items[0].to!, /^\/booking-calendar\?action=create&bench_ids=1/);
  assert.match(items[1].to!, /^\/booking-calendar\?booking_id=12&/);
});

test('a followed booking without a free gap says when it ends; ended bookings are dropped', () => {
  const items = buildUpNextItems([booking(1, at(10), at(12))], [alert(8, 'Bench 08', null, null, true)], now);
  assert.deepEqual(items.map((item) => item.status), ['Booking ends 18:00']);
});

test('later free times read naturally', () => {
  const items = buildUpNextItems([], [alert(9, 'Bench 09', at(9, 0, 27), at(11, 0, 27))], now);
  assert.equal(items[0].status, 'Free tomorrow 09:00');
});

test('visibleCount reserves the last slot for "+N"', () => {
  assert.equal(visibleCount(3, 5, false), 3);
  assert.equal(visibleCount(5, 5, false), 5);
  assert.equal(visibleCount(8, 5, false), 4);
  assert.equal(visibleCount(8, 5, true), 8);
  assert.equal(visibleCount(3, 2, false), 1);
});

test('a booking tile opens that booking on the calendar, not the bookings list', () => {
  const [item] = buildUpNextItems([booking(12, at(14), at(16))], [], now);
  const url = new URL(item.to!, 'http://x');
  assert.equal(url.pathname, '/booking-calendar');
  assert.equal(url.searchParams.get('booking_id'), '12');
  assert.equal(url.searchParams.get('bench_ids'), '112');
  assert.equal(url.searchParams.get('date'), at(14));
});
