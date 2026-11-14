import test from 'node:test';
import assert from 'node:assert/strict';
import { STANDARD_STATUS_OPTIONS } from './constants.ts';

test('STANDARD_STATUS_OPTIONS contains the supported equipment display statuses', () => {
  const expectedStatuses = [
    'available',
    'in_use',
    'transferred',
    'borrowed',
    'maintenance',
    'broken',
    'calibration_overdue',
    'lost',
    'retired',
    'on_order',
  ];

  const statusValues = STANDARD_STATUS_OPTIONS.map((opt) => opt.value);
  assert.equal(statusValues.length, expectedStatuses.length);

  for (const status of expectedStatuses) {
    assert.ok(statusValues.includes(status), `Status ${status} must be in STANDARD_STATUS_OPTIONS`);
  }
});
