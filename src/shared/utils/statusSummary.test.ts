import assert from 'node:assert/strict';
import test from 'node:test';
import { groupStatusCounts } from './statusSummary.ts';
import { equipmentStatusLabel, equipmentStatusTone, equipmentStatusValue } from '../../features/lab-equipment/shared/utils/equipmentStatus.ts';
import { licenseStatusLabel, licenseStatusTone, licenseStatusValue } from '../../features/lab-equipment/license/licenseStatus.ts';

test('equipment summary merges legacy values by the badge status and color', () => {
  const statuses = groupStatusCounts([
    { status: { value: 'in_storage', label: 'In Storage' }, count: 3 },
    { status: { value: 'available', label: 'Available' }, count: 4 },
    { status: { value: 'in-use', label: 'In use' }, count: 2 },
    { status: { value: 'in_service', label: 'In Service' }, count: 1 },
    { status: { value: 'broken', label: 'Broken' }, count: 5 },
    { status: { value: 'maintenance', label: 'Maintenance' }, count: 2 },
    { status: { value: 'new_status', label: 'Custom label' }, count: 1 },
  ], equipmentStatusValue, equipmentStatusLabel);

  assert.deepEqual(statuses.map(({ status, count }) => [status.value, status.label, count]), [
    ['available', 'Available', 7],
    ['in_use', 'In use', 3],
    ['broken', 'Broken', 5],
    ['maintenance', 'Maintenance', 2],
    ['new_status', 'Custom label', 1],
  ]);
  assert.equal(equipmentStatusTone('in_storage'), equipmentStatusTone('available'));
  assert.equal(equipmentStatusTone('broken'), 'danger');
  assert.equal(equipmentStatusTone('maintenance'), 'warning');
});

test('license summaries use recorded license states rather than equipment aliases', () => {
  const statuses = groupStatusCounts([
    { status: { value: 'ACTIVE', label: 'Active' }, count: 2 },
    { status: { value: 'active', label: 'Active' }, count: 3 },
    { status: { value: 'in_storage', label: 'In Storage' }, count: 1 },
    { status: { value: 'future_state', label: 'Future state' }, count: 4 },
  ], licenseStatusValue, licenseStatusLabel);

  assert.deepEqual(statuses.map(({ status, count }) => [status.value, status.label, count]), [
    ['active', 'Active', 5],
    ['in_storage', 'In Storage', 1],
    ['future_state', 'Future state', 4],
  ]);
  assert.equal(licenseStatusTone('ACTIVE'), licenseStatusTone('active'));
});
