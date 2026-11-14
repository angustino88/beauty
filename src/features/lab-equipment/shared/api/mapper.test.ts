import test from 'node:test';
import assert from 'node:assert/strict';
import { mapEquipmentOptions } from './mapper.ts';
import { mapRoomOptions } from './mapper.ts';

test('mapEquipmentOptions adapts flat contract options to one legacy consumer group', () => {
  const result = mapEquipmentOptions({
    data: [
      { id: 9, sku: 'ACC-9', name: 'Accessory Nine' },
      { id: 10, sku: null, name: 'Accessory Ten' },
      { id: 11, name: 'Accessory Eleven' },
      { id: 'invalid', sku: 'BAD', name: 'Invalid ID' },
    ],
  }, 'accessory');

  assert.deepEqual(result, {
    accessory: [
      { id: 9, sku: 'ACC-9', name: 'Accessory Nine' },
      { id: 10, name: 'Accessory Ten' },
      { id: 11, name: 'Accessory Eleven' },
    ],
  });
});

test('mapEquipmentOptions safely handles empty and malformed envelopes', () => {
  assert.deepEqual(mapEquipmentOptions({ data: null }, 'computing'), { computing: [] });
  assert.deepEqual(mapEquipmentOptions(null, 'computing'), { computing: [] });
});

test('mapRoomOptions adapts contract options and permits nullable SKUs', () => {
  assert.deepEqual(mapRoomOptions({
    data: [
      { id: 12, sku: null, name: 'Clean Room' },
      { id: 13, sku: 'ROOM-13', name: 'Wet Lab' },
    ],
  }), [
    { id: 12, sku: '', name: 'Clean Room' },
    { id: 13, sku: 'ROOM-13', name: 'Wet Lab' },
  ]);
});

test('mapRoomOptions ignores malformed selector records', () => {
  assert.deepEqual(mapRoomOptions({
    data: [{ id: 'bad', sku: null, name: 'Invalid' }, { id: 14, sku: null, name: '' }],
  }), []);
});
