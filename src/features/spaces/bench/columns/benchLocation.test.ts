import assert from 'node:assert/strict';
import test from 'node:test';
import { benchLocationView } from './benchLocation.ts';
import { mapBenchApiItem } from '../mapper.ts';

test('a station without a room has no room label, not a repeat of the station', () => {
  const bench = mapBenchApiItem({
    id: 1,
    setup_location: { id: 1, sku: 'STATION-01', name: 'STATION-01' },
    setup_location_path: 'STATION-01',
    room: null,
  });
  assert.deepEqual(benchLocationView(bench), { roomLabel: null, path: 'STATION-01' });
});

test('the room comes from the API room, by name', () => {
  const bench = mapBenchApiItem({
    id: 2,
    setup_location: { id: 2, sku: 'STATION-02', name: 'STATION-02' },
    setup_location_path: 'VN-HCM-LAB-A-STATION-02',
    room: { id: 7, uid: 'u', sku: 'LAB-A', name: 'Lab A' },
  });
  assert.equal(bench.room?.sku, 'LAB-A');
  assert.equal(benchLocationView(bench).roomLabel, 'Lab A');
});

test('a room without a name falls back to its SKU', () => {
  assert.equal(benchLocationView({ room: { sku: 'LAB-A', name: '' } }).roomLabel, 'LAB-A');
});
