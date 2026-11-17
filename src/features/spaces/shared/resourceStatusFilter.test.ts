import assert from 'node:assert/strict';
import test from 'node:test';
import { stateFilterParams } from './resourceStatusFilter.ts';

test('each state column maps to its own server filter', () => {
  assert.deepEqual(
    stateFilterParams({ status: ['in_maintenance', 'out_of_service'], activity: ['scheduled'], lifecycle: null }),
    { condition: 'in_maintenance,out_of_service', activity_status: 'scheduled', lifecycle_status: undefined },
  );
  assert.deepEqual(stateFilterParams({}), { condition: undefined, activity_status: undefined, lifecycle_status: undefined });
});
