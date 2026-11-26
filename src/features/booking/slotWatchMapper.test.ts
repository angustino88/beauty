import test from 'node:test';
import assert from 'node:assert/strict';
import { mapSlotWatch } from './slotWatchMapper.ts';

test('mapSlotWatch flattens bench, status and channel references', () => {
  const watch = mapSlotWatch({
    id: 7,
    bench: { id: 3, name: 'Bench 03' },
    starts_at: '2026-11-27T09:00:00+07:00',
    ends_at: '2026-11-27T12:00:00+07:00',
    channels: [{ value: 'email', label: 'Email' }, { value: 'in_app', label: 'Web' }, { value: 'fax' }, null],
    status: { value: 'active', label: 'Active' },
    created_at: '2026-11-26T09:00:00+07:00',
  });
  assert.equal(watch.benchId, 3);
  assert.equal(watch.benchName, 'Bench 03');
  assert.deepEqual(watch.channels, ['email', 'in_app']);
  assert.equal(watch.status, 'active');
});

test('mapSlotWatch tolerates a missing bench and status', () => {
  const watch = mapSlotWatch({ id: 1, starts_at: 'a', ends_at: 'b' });
  assert.equal(watch.benchId, null);
  assert.equal(watch.benchName, 'Bench');
  assert.deepEqual(watch.channels, []);
  assert.equal(watch.status, 'active');
});
