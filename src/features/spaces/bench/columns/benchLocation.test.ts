import assert from 'node:assert/strict';
import test from 'node:test';
import { benchLocationView } from './benchLocation.ts';

const station = { sku: 'STATION-01', name: 'STATION-01' };

test('a station without a room has no room label, not a repeat of the station', () => {
  assert.deepEqual(benchLocationView({ station, location_path: 'STATION-01' }), {
    roomLabel: null,
    path: 'STATION-01',
  });
});

test('the room part is the path without the trailing station segment', () => {
  const view = benchLocationView({ station, location_path: 'VN-HCM-B1-3F-LAB-A-STATION-01' });
  assert.equal(view.roomLabel, 'VN-HCM-B1-3F-LAB-A');
});

test('a room sent by the API wins over the path', () => {
  const view = benchLocationView({
    station,
    room: { sku: 'R-1', name: 'Lab A' },
    location_path: 'X-STATION-01',
  });
  assert.equal(view.roomLabel, 'Lab A');
});

test('an unknown station label keeps the whole path', () => {
  const view = benchLocationView({ station, location_path: 'LAB-A-S1' });
  assert.equal(view.roomLabel, 'LAB-A-S1');
});

test('no path and no room means no room label', () => {
  assert.equal(benchLocationView({ station, location_path: '' }).roomLabel, null);
});
