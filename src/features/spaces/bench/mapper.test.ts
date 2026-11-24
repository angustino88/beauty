import assert from 'node:assert/strict';
import test from 'node:test';
import { mapBenchApiItem, mapBenchListApiResponse } from './mapper.ts';

test('bench list reads only the canonical state fields', () => {
  const result = mapBenchListApiResponse({
    data: { results: [{ id: 7, lifecycle_status: { value: 'in_service', label: 'In service' } }] },
    meta: { pagination: { count: 1 } },
  });
  assert.equal(result.total_count, 1);
  assert.deepEqual(result.data[0].lifecycle_status, { value: 'in_service', label: 'In service' });
});

test('bench mapper extracts lifecycle_status, condition, availability, and activity_status', () => {
  const result = mapBenchApiItem({
    id: 10,
    sku: 'B-01',
    name: 'Bench 1',
    lifecycle_status: { value: 'in_service', label: 'In Service' },
    condition: { value: 'in_maintenance', label: 'In Maintenance' },
    availability: {
      value: 'unavailable',
      blocked_by: { type: 'room', id: 5, name: 'Room 5' },
      condition: 'in_maintenance',
      reason: 'maintenance',
    },
    activity_status: { value: 'scheduled', label: 'Booked today' },
  });

  assert.deepEqual(result.lifecycle_status, { value: 'in_service', label: 'In Service' });
  assert.deepEqual(result.condition, { value: 'in_maintenance', label: 'In Maintenance' });
  assert.equal(result.availability.value, 'unavailable');
  assert.deepEqual(result.availability.blocked_by, { type: 'room', id: 5, name: 'Room 5' });
  assert.deepEqual(result.activity_status, { value: 'scheduled', label: 'Booked today' });
});