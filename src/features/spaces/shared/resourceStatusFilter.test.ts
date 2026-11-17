import assert from 'node:assert/strict';
import test from 'node:test';
import { splitStatusFilter } from './resourceStatusFilter.ts';

test('grouped status filter becomes the three server filters', () => {
  assert.deepEqual(
    splitStatusFilter(['condition:in_maintenance', 'condition:out_of_service', 'activity:scheduled', 'lifecycle:*']),
    { lifecycle_status: undefined, condition: 'in_maintenance,out_of_service', activity_status: 'scheduled' },
  );
  assert.deepEqual(splitStatusFilter(null), { lifecycle_status: undefined, condition: undefined, activity_status: undefined });
});
