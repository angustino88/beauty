import test from 'node:test';
import assert from 'node:assert/strict';
import { equipmentStatusLabel, equipmentStatusValue } from './equipmentStatus.ts';

test('reads canonical backend lifecycle choices and preserves labels', () => {
  const status = { value: 'in_use', label: 'In Use' };
  assert.equal(equipmentStatusValue(status), 'in_use');
  assert.equal(equipmentStatusLabel(status), 'In Use');
});
test('missing lifecycle status is not invented or confused with activity', () => {
  assert.equal(equipmentStatusValue(null), '');
  assert.equal(equipmentStatusLabel(null), 'Unknown');
  assert.equal(equipmentStatusValue({ activity: 'active' }), '');
});
test('supports legacy strings and unknown future lifecycle choices', () => {
  assert.equal(equipmentStatusValue(' AVAILABLE '), 'available');
  assert.equal(equipmentStatusLabel('on_order'), 'On Order');
  assert.equal(equipmentStatusLabel({ value: 'future', label: 'Future status' }), 'Future status');
});

test('maps the legacy In Storage display status to the supported Available status', () => {
  assert.equal(equipmentStatusValue('in_storage'), 'available');
  assert.equal(equipmentStatusValue({ value: 'in_storage', label: 'In Storage' }), 'available');
  assert.equal(equipmentStatusLabel('in_storage'), 'Available');
});