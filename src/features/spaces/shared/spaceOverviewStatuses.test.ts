import assert from 'node:assert/strict';
import test from 'node:test';
import { spaceOverviewStatuses } from './spaceOverviewStatuses.ts';
import { spaceStatusTone } from './spaceStatus.ts';

test('space cards use only backend lifecycle statuses including zero counts', () => {
  assert.deepEqual(spaceOverviewStatuses([
    { status: { value: 'IN_STORAGE', label: 'In storage' }, resource_count: 2 },
    { status: { value: 'reserved', label: 'Reserved' }, resource_count: 0 },
    { status: { value: 'new_status', label: 'Custom state' }, resource_count: 1 },
  ]), [
    { key: 'in_storage', label: 'In storage', description: '', tone: 'slate' },
    { key: 'reserved', label: 'Reserved', description: 'Booked today', tone: 'amber' },
    { key: 'new_status', label: 'Custom state', description: '', tone: 'slate' },
  ]);
  assert.deepEqual(spaceOverviewStatuses([]), []);
});

test('room and station feature only familiar statuses reported by the backend without reserved', () => {
  const statuses = [
    { status: { value: 'available', label: 'Available' }, resource_count: 5 },
    { status: { value: 'new_status', label: 'Custom state' }, resource_count: 1 },
    { status: { value: 'reserved', label: 'Reserved' }, resource_count: 0 },
    { status: { value: 'maintenance', label: 'Maintenance' }, resource_count: 3 },
    { status: { value: 'retired', label: 'Retired' }, resource_count: 2 },
  ];
  assert.deepEqual(spaceOverviewStatuses(statuses, 'room').map(({ key, label }) => ({ key, label })), [
    { key: 'available', label: 'Operational' },
    { key: 'maintenance', label: 'Maintenance' },
    { key: 'retired', label: 'Retired' },
  ]);
  assert.deepEqual(spaceOverviewStatuses(statuses, 'station').map(({ key, label }) => ({ key, label })), [
    { key: 'available', label: 'Operational' },
    { key: 'maintenance', label: 'Maintenance' },
    { key: 'retired', label: 'Retired' },
  ]);
  assert.deepEqual(spaceOverviewStatuses(statuses, 'bench').map(({ key, label }) => ({ key, label })), [
    { key: 'available', label: 'Available' },
    { key: 'new_status', label: 'Custom state' },
    { key: 'reserved', label: 'Reserved' },
    { key: 'maintenance', label: 'Maintenance' },
    { key: 'retired', label: 'Retired' },
  ]);
});

test('bench service lifecycle has distinct summary and badge colors', () => {
  const statuses = [
    { status: { value: 'planned', label: 'Planned' }, resource_count: 1 },
    { status: { value: 'in_service', label: 'In service' }, resource_count: 2 },
    { status: { value: 'out_of_service', label: 'Out of service' }, resource_count: 3 },
  ];
  assert.deepEqual(spaceOverviewStatuses(statuses, 'bench').map(({ tone }) => tone), ['amber', 'green', 'red']);
  assert.deepEqual(statuses.map(({ status }) => spaceStatusTone(status)), [
    'overviewAmber', 'overviewGreen', 'overviewRed',
  ]);
});