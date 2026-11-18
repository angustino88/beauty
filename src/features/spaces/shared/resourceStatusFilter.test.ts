import assert from 'node:assert/strict';
import test from 'node:test';
import { stateFilterParams } from './resourceStatusFilter.ts';

test('each state column maps to its own server filter', () => {
  assert.deepEqual(
    stateFilterParams({ availability: ['in_maintenance', 'out_of_service'], activity: ['scheduled'], status: null }),
    { lifecycle_status: undefined, condition: 'in_maintenance,out_of_service', activity_status: 'scheduled' },
  );
  assert.deepEqual(stateFilterParams({}), { lifecycle_status: undefined, condition: undefined, activity_status: undefined });
});
