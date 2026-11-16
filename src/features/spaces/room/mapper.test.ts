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
    slot_capacity: 10,
    power_capacity_w: 5000,
    layout_rows: 2,
    layout_columns: 5,
    length_m: '8.50',
    width_m: '4.00',
    area_m2: '34.00',
    owner: { id: 3, username: 'ada', display_name: 'Ada Lovelace' },
    country: { id: 1, name: 'Germany' },
    city: { id: 2, name: 'Berlin' },
    building: { id: 4, name: 'B1' },
    floor: '2',
    location_path: 'Germany / Berlin / B1 / Room 12',
    label: 'Main Lab',
  });

  assert.equal(result.id, 12);
  assert.equal(result.sku, 'RM-12');
  assert.deepEqual(result.lifecycle_status, { value: 'planned', label: 'Planned' });
  assert.deepEqual(result.access_policy, { value: 'open', label: 'Open' });
  assert.deepEqual(result.condition, { value: 'operational', label: 'Operational' });
  assert.equal(result.availability.value, 'available');
  assert.deepEqual(result.activity_status, { value: 'idle', label: 'Idle' });
  assert.equal(result.setup_capacity, 10);
  assert.equal(result.max_power, 5000);
  assert.equal(result.rows, 2);
  assert.equal(result.cols, 5);
  assert.equal(result.length, 8.5);
  assert.equal(result.primary_owner?.username, 'ada');
  assert.equal(result.primary_owner?.display_name, 'Ada Lovelace');
  assert.equal(result.location_info?.location_string, 'Germany / Berlin / B1 / Room 12');
  assert.equal(result.location_info?.city?.id, 2);
  assert.equal(result.floor, '2');
});
