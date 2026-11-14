import assert from 'node:assert/strict';
import test from 'node:test';
import { EQUIPMENT_OVERVIEW_FEATURED_STATUSES } from './equipmentOverviewStatuses.ts';

test('equipment overview keeps the five key statuses as featured tiles', () => {
  assert.deepEqual(EQUIPMENT_OVERVIEW_FEATURED_STATUSES.map(({ key }) => key), [
    'in_use',
    'available',
    'borrowed',
    'broken',
    'maintenance',
  ]);
});
