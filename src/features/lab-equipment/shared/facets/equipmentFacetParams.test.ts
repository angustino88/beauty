import assert from 'node:assert/strict';
import test from 'node:test';
import { buildEquipmentFacetParams, resetDependentFilters, selectedFilterCsv } from './equipmentFacetParams.ts';

const filters = {
  kind: [1], type: [2], manufacturer: [3], product_model: [4], department: [6], group_id: [7], owner: [5], status: ['AVAILABLE'],
};

test('Kind menu retains alternatives after Kind and descendants are selected', () => {
  const params = buildEquipmentFacetParams('kind', 12, filters, '  laptop  ');
  assert.equal(params.category, '12');
  assert.equal(params.kind, undefined);
  assert.equal(params.type, undefined);
  assert.equal(params.manufacturer, undefined);
  assert.equal(params.product_model_id, undefined);
  assert.equal(params.owner_id, '5');
  assert.equal(params.status, 'AVAILABLE');
  assert.equal(params.search, 'laptop');
});

test('Type menu is scoped to Kind but not locked to its own selection or model', () => {
  const params = buildEquipmentFacetParams('type', 12, filters, '');
  assert.equal(params.kind, '1');
  assert.equal(params.type, undefined);
  assert.equal(params.product_model_id, undefined);
  assert.equal(params.manufacturer, '3');
});

test('Manufacturer and Model menus exclude their own selection', () => {
  const manufacturer = buildEquipmentFacetParams('manufacturer', 12, filters, '');
  assert.equal(manufacturer.manufacturer, undefined);
  assert.equal(manufacturer.product_model_id, undefined);
  const model = buildEquipmentFacetParams('product_model_id', 12, filters, '');
  assert.equal(model.type, '2');
  assert.equal(model.manufacturer, '3');
  assert.equal(model.product_model_id, undefined);
});

test('multiple selections serialize as deduplicated CSV, not just the first value', () => {
  assert.equal(selectedFilterCsv([1, 2, '1', '']), '1,2');
  assert.equal(selectedFilterCsv(null), undefined);
  assert.equal(selectedFilterCsv([]), undefined);
});

test('parent change clears incompatible descendants without mutating inputs', () => {
  const next = { ...filters, kind: [6] };
  const result = resetDependentFilters(filters, next);
  assert.equal(result.type, null);
  assert.equal(result.manufacturer, null);
  assert.equal(result.product_model, null);
  assert.deepEqual(result.owner, [5]);
  assert.deepEqual(next.type, [2]);
});

test('reordered selections do not reset descendants', () => {
  const previous = { ...filters, kind: [1, 6] };
  const result = resetDependentFilters(previous, { ...previous, kind: [6, 1] });
  assert.deepEqual(result.type, [2]);
});

test('clearing all selections leaves no stale facet criteria', () => {
  const params = buildEquipmentFacetParams('kind', undefined, {}, '  ');
  assert.equal(params.category, undefined);
  assert.equal(params.kind, undefined);
  assert.equal(params.search, undefined);
});

test('Department and Group menus serialize ownership filters without constraining themselves', () => {
  const department = buildEquipmentFacetParams('department_id', 12, filters, '');
  assert.equal(department.department_id, undefined);
  assert.equal(department.group_id, undefined);
  const group = buildEquipmentFacetParams('group_id', 12, filters, '');
  assert.equal(group.department_id, '6');
  assert.equal(group.group_id, undefined);
});

test('changing department clears the selected group', () => {
  const result = resetDependentFilters(filters, { ...filters, department: [8] });
  assert.equal(result.group_id, null);
});