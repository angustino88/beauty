import test from 'node:test';
import assert from 'node:assert/strict';
import { mapSlotWatch } from './slotWatchMapper.ts';
import { pickHeadline, type UpNextBooking } from './upNext.ts';

const now = new Date(2026, 10, 26, 13, 35);
const at = (h: number, m = 0, d = 26) => new Date(2026, 10, d, h, m).toISOString();

const alert = (id: number, bench: string, freeFrom: string | null, freeUntil: string | null, watchers = 0) =>
  mapSlotWatch({
    id,
    bench: { id, name: bench },
    starts_at: at(13),
    ends_at: at(18),
    status: { value: 'active' },
    availability: {
      window_starts_at: at(13, 35),
      window_ends_at: at(18),
      busy_periods: [],
      next_free_starts_at: freeFrom,
      next_free_ends_at: freeUntil,
      watcher_count: watchers,
    },
  });

const booking = (startsAt: string, endsAt: string, pending = false): UpNextBooking => ({
  id: 1,
  benchName: 'Bench 12',
  startsAt,
  endsAt,
  awaitingApproval: pending,
});

test('a bench free right now wins, with Book now', () => {
  const headline = pickHeadline([booking(at(14), at(16))], [alert(1, 'Bench 01', at(13, 30), at(15))], now);
  assert.equal(headline?.tone, 'free');
  assert.equal(headline?.title, 'Bench 01 is free now');
  assert.equal(headline?.action?.label, 'Book now');
  assert.match(headline!.action!.to, /^\/booking-calendar\?action=create&bench_ids=1/);
});

test('then a booking starting within the hour', () => {
  const headline = pickHeadline([booking(at(14), at(16))], [alert(2, 'Bench 07', at(15), at(16))], now);
  assert.equal(headline?.tone, 'soon');
  assert.equal(headline?.detail, 'Starts in 25 min');
});

test('then a bench that frees within the hour', () => {
  const headline = pickHeadline([booking(at(9, 0, 27), at(12, 0, 27))], [alert(3, 'Bench 07', at(14), at(15), 2)], now);
  assert.equal(headline?.title, 'Bench 07 frees up at 14:00');
  assert.equal(headline?.detail, "We'll notify you · 2 others watching");
});

test('then the next booking, then a calm summary, else nothing', () => {
  assert.equal(pickHeadline([booking(at(9, 0, 27), at(12, 0, 27), true)], [], now)?.detail, 'Tomorrow 09:00 · awaiting approval');
  assert.equal(pickHeadline([], [alert(4, 'Bench 05', null, null)], now)?.title, 'Watching 1 bench');
  assert.equal(pickHeadline([], [], now), null);
});
