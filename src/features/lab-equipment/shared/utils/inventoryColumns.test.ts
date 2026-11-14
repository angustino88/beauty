import test from 'node:test';
import assert from 'node:assert/strict';
import { getVisibleInventoryColumns } from './inventoryColumns.ts';

const columns = ['sku', 'name', 'kind', 'id', 'owner', 'status', 'actions'].map((key) => ({ key }));

test('ID is first and other visible columns retain their order', () => {
  assert.deepEqual(getVisibleInventoryColumns(columns).map(({ key }) => key),
    ['id', 'sku', 'name', 'kind', 'owner', 'status', 'actions']);
});

test('ID survives space defaults, custom visibility and deselect-all', () => {
  for (const enabled of [['sku', 'name', 'status', 'actions'], ['kind'], []]) {
    const keys = getVisibleInventoryColumns(columns, enabled).map(({ key }) => key);
    assert.equal(keys[0], 'id');
    assert.ok(keys.includes('sku') && keys.includes('name') && keys.includes('status') && keys.includes('actions'));
  }
});

test('active filters keep their column visible', () => {
  assert.deepEqual(getVisibleInventoryColumns(columns, [], { owner: [1] }).map(({ key }) => key),
    ['id', 'sku', 'name', 'owner', 'status', 'actions']);
});