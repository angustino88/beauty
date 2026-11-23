import assert from 'node:assert/strict';
import test from 'node:test';
import { mapBenchApiItem } from '../bench/mapper.ts';
import { mapRoomApiItem, mapRoomWritePayload, roomDetailsPayload } from '../room/mapper.ts';
import { mapStationApiItem, mapStationWritePayload } from '../station/mapper.ts';
import { BENCH_DETAILS, STATION_DETAILS, detailPayload } from './resourceForm.ts';
import { changedReference, ownershipPayload } from '../../../shared/utils/resourceReferences.ts';

test('a bench type is loaded from the API and can be set or cleared without resending an unchanged type', () => {
  const bench = mapBenchApiItem({ type: { id: 7, name: 'RF' }, group: { id: 3, name: 'Team' } });
  assert.deepEqual(bench.bench_type, { id: 7, name: 'RF' });
  assert.deepEqual(bench.group, { id: 3, name: 'Team' });
  assert.equal(changedReference(7, bench.bench_type?.id), undefined);
  assert.equal(changedReference(9, bench.bench_type?.id), 9);
  assert.equal(changedReference(undefined, bench.bench_type?.id), null);
});

test('bench requirements round trip zero, JSON objects, and nullable inspection dates', () => {
  const bench = mapBenchApiItem({
    requested_power_w: 0,
    required_utilities: { network: true },
    last_inspected_at: '2026-11-23T22:30:00+07:00',
    commissioning_date: '2026-11-23',
  });
  const existing = { ...bench };
  assert.deepEqual(detailPayload(BENCH_DETAILS, existing, existing), {});
  assert.deepEqual(detailPayload(BENCH_DETAILS, {
    ...existing,
    requested_power_w: null,
    required_utilities: undefined,
    last_inspected_at: '2026-11-23T15:30:00.000Z',
  }, existing), { requested_power_w: null, required_utilities: {} });
  assert.deepEqual(detailPayload(BENCH_DETAILS, { requested_power_w: 0 }), { requested_power_w: 0 });
});

test('room specifications and ownership use the API field names and decimal format', () => {
  const room = mapRoomApiItem({ usable_height_m: '2.500', department: { id: 3, name: 'Lab' } });
  assert.deepEqual(roomDetailsPayload({ ...room }, room), {});
  assert.deepEqual(mapRoomWritePayload({
    ...roomDetailsPayload({ ...room, usable_height_m: 2.75, max_occupancy: 0 }, room),
    ...ownershipPayload({ department_id: 4, group_id: 6 }, room),
  }), { department_id: 4, group_id: 6, usable_height_m: '2.75', max_occupancy: 0 });
});

test('station type, position, capacities and ownership map to accepted request keys', () => {
  const station = mapStationApiItem({
    type: { id: 5, name: 'Cabinet' },
    orientation_degrees: 0,
    power_reserved_w: 0,
    position: { x: 0, y: 1, z: 2 },
  });
  assert.equal(station.station_type?.id, 5);
  assert.equal(station.power_reserved_w, 0);
  const payload = mapStationWritePayload({
    type_id: 6,
    ...ownershipPayload({ department_id: 1, group_id: 2, owner_id: 3 }),
    ...detailPayload(STATION_DETAILS, { ...station, position: null, orientation_degrees: 90 }, { ...station }),
  });
  assert.deepEqual(JSON.parse(JSON.stringify(payload)), {
    department_id: 1, group_id: 2, owner_id: 3, type_id: 6, position: null, orientation_degrees: 90,
  });
});
