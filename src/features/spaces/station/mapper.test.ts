import assert from 'node:assert/strict';
import test from 'node:test';
import { mapStationApiItem } from './mapper.ts';

test('station mapper maps lifecycle_status, access_policy, condition, availability, activity_status', () => {
  const result = mapStationApiItem({
    id: 5,
    sku: 'ST-05',
    name: 'Station 5',
    lifecycle_status: { value: 'in_service', label: 'In Service' },
    access_policy: { value: 'restricted', label: 'Restricted' },
    condition: { value: 'operational', label: 'Operational' },
    availability: {
      value: 'available',
      blocked_by: null,
      condition: null,
      reason: null,
    },
    activity_status: { value: 'active', label: 'In use' },
    slots: [
      {
        id: 1,
        slot_code: 'SLOT-A',
        service_status: 'in_service',
        occupied: false,
      },
    ],
  });

  assert.equal(result.id, 5);
  assert.equal(result.sku, 'ST-05');
  assert.deepEqual(result.lifecycle_status, { value: 'in_service', label: 'In Service' });
  assert.deepEqual(result.access_policy, { value: 'restricted', label: 'Restricted' });
  assert.deepEqual(result.condition, { value: 'operational', label: 'Operational' });
  assert.equal(result.availability.value, 'available');
  assert.deepEqual(result.activity_status, { value: 'active', label: 'In use' });
  assert.equal(result.slots?.length, 1);
  assert.equal(result.slots?.[0].service_status, 'in_service');
  assert.equal(result.slots?.[0].occupied, false);
});

test('station list preserves pagination totals for room inventory loading', async () => {
  const { mapStationListApiResponse } = await import('./mapper.ts');
  const result = mapStationListApiResponse({ data: [{ id: 1 }], meta: { pagination: { count: 150 } } });
  assert.equal(result.total_count, 150);
  assert.equal(result.data.length, 1);
});
