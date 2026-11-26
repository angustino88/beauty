import test from 'node:test';
import assert from 'node:assert/strict';
import { alertPhase, formatAlertWindow, mapSlotWatch } from './slotWatchMapper.ts';

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
