import assert from 'node:assert/strict';
import test from 'node:test';
import { mapDowntimeItem, mapDowntimeListResponse } from './downtimeMapper.ts';

test('mapDowntimeItem normalizes API downtime record', () => {
  const raw = {
    id: 101,
    resource: { type: 'room', id: 12 },
    condition: { value: 'in_maintenance', label: 'In Maintenance' },
    kind: { value: 'planned', label: 'Planned' },
    reason: { value: 'maintenance', label: 'Maintenance' },
    state: 'scheduled',
    starts_at: '2026-11-20T08:00:00Z',
    ends_at: '2026-11-20T17:00:00Z',
    notes: 'Scheduled server maintenance',
    actor: { id: 7, name: 'Technician One' },
  };

  const item = mapDowntimeItem(raw);
  assert.equal(item.id, 101);
  assert.equal(item.resource.type, 'room');
  assert.equal(item.resource.id, 12);
  assert.equal(item.condition.value, 'in_maintenance');
  assert.equal(item.kind.value, 'planned');
  assert.equal(item.state, 'scheduled');
  assert.equal(item.starts_at, '2026-11-20T08:00:00Z');
  assert.equal(item.ends_at, '2026-11-20T17:00:00Z');
  assert.equal(item.actor?.display_name, 'Technician One');
});

test('mapDowntimeListResponse handles data array and paged envelopes', () => {
  const envelope = {
    data: {
      results: [
        {
          id: 1,
          resource: { type: 'bench', id: 3 },
          condition: { value: 'out_of_service', label: 'Out of Service' },
          kind: { value: 'unplanned', label: 'Unplanned' },
          reason: { value: 'fault', label: 'Fault' },
          state: 'current',
          starts_at: '2026-11-13T10:00:00Z',
          ends_at: null,
          notes: 'Power surge damaged PSU',
        },
      ],
      total_count: 1,
    },
  };

  const res = mapDowntimeListResponse(envelope);
  assert.equal(res.total, 1);
  assert.equal(res.data.length, 1);
  assert.equal(res.data[0].id, 1);
  assert.equal(res.data[0].state, 'current');
  assert.equal(res.data[0].ends_at, null);
});
