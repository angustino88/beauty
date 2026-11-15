import test from 'node:test';
import assert from 'node:assert/strict';
import { equipmentLabel } from './equipmentLabel.ts';

test('an equipment item shows its SKU and its name', () => {
  assert.equal(equipmentLabel({ id: 1, sku: 'EQ-001', name: 'Oscilloscope' }), 'EQ-001 · Oscilloscope');
});

test('an item with only one of them shows that one, and never an empty label', () => {
  assert.equal(equipmentLabel({ id: 1, sku: 'EQ-001', name: '' }), 'EQ-001');
  assert.equal(equipmentLabel({ id: 1, sku: '', name: 'Oscilloscope' }), 'Oscilloscope');
  assert.equal(equipmentLabel({ id: 9, sku: null, name: null }), '#9');
});
