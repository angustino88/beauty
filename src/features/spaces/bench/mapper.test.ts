import assert from 'node:assert/strict';
import test from 'node:test';
import { mapBenchApiItem, mapBenchListApiResponse } from './mapper.ts';
import { readSpaceStatus } from '../shared/spaceStatus.ts';

test('bench list retains the backend lifecycle value and display label', () => {
  const result = mapBenchListApiResponse({
    data: { results: [{ id: 7, status: { value: 'IN_STORAGE', label: 'In storage' } }] },
    meta: { pagination: { count: 1 } },
  });
  assert.equal(result.total_count, 1);
  assert.equal(readSpaceStatus(result.data[0]), 'in_storage');
  assert.equal(result.data[0].status_label, 'In storage');
});

test('bench legacy statuses remain readable without a choice label', () => {
  const result = mapBenchApiItem({ current_status: { status_type: 'reserved' } });
  assert.equal(readSpaceStatus(result), 'reserved');
  assert.equal(result.status_label, null);
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