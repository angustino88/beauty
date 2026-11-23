import assert from 'node:assert/strict';
import test from 'node:test';
import { roomFilterParams, selectedRoomLocation, updateRoomFilters } from './roomFilters.ts';

test('room filters submit relation IDs and keep lifecycle filters in the same query', () => {
  const filters = { country: ['21'], city: [34], building: [53], primary_owner: [5, 7], status: ['in_service'] };
  const params = roomFilterParams(filters);
  assert.deepEqual(selectedRoomLocation(filters), { country: 21, city: 34, building: 53 });
  assert.equal(params.country_id, '21');
  assert.equal(params.city_id, '34');
  assert.equal(params.building_id, '53');
  assert.equal(params.owner_id, '5,7');
  assert.equal(params.lifecycle_status, 'in_service');
});

test('a country change clears both dependent filters and keeps unrelated filters', () => {
  const previous = { country: [1], city: [10], building: [100], primary_owner: [2] };
  assert.deepEqual(updateRoomFilters(previous, { ...previous, country: [3] }), {
    country: [3], city: null, building: null, primary_owner: [2],
  });
  assert.deepEqual(selectedRoomLocation(updateRoomFilters(previous, { ...previous, country: null })), {
    country: null, city: null, building: null,
  });
});

test('a city change clears the building and selecting a building keeps the hierarchy', () => {
  const previous = { country: [1], city: [10], building: [100] };
  assert.deepEqual(updateRoomFilters(previous, { ...previous, city: [20] }), {
    country: [1], city: [20], building: null,
  });
  const next = { ...previous, country: ['1'], building: [101] };
  assert.deepEqual(updateRoomFilters(previous, next), next);
});
