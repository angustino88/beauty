import assert from 'node:assert/strict';
import test from 'node:test';
import { mapRoomApiItem } from './mapper.ts';

test('room mapper maps lifecycle_status, access_policy, condition, availability, activity_status', () => {
  const result = mapRoomApiItem({
    id: 12,
    sku: 'RM-12',
    name: 'Room 12',
    lifecycle_status: { value: 'planned', label: 'Planned' },
    access_policy: { value: 'open', label: 'Open' },
    condition: { value: 'operational', label: 'Operational' },
    availability: {
      value: 'available',
      blocked_by: null,
      condition: null,
      reason: null,
    },
    activity_status: { value: 'idle', label: 'Idle' },
    rack_list: [],
    setup_capacity: 10,
    temperature: 21,
    humidity: 45,
    max_power: 5000,
    power_usage: 1200,
    label: 'Main Lab',
    current_status: null,
    lab_audit: null,
  });

  assert.equal(result.id, 12);
  assert.equal(result.sku, 'RM-12');
  assert.deepEqual(result.lifecycle_status, { value: 'planned', label: 'Planned' });
  assert.deepEqual(result.access_policy, { value: 'open', label: 'Open' });
  assert.deepEqual(result.condition, { value: 'operational', label: 'Operational' });
  assert.equal(result.availability.value, 'available');
  assert.deepEqual(result.activity_status, { value: 'idle', label: 'Idle' });
});
