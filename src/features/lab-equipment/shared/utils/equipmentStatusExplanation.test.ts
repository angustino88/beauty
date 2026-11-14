import assert from 'node:assert/strict';
import test from 'node:test';
import { equipmentLocation, explainEquipmentStatus } from './equipmentStatusExplanation.ts';

const now = new Date('2026-11-14T10:00:00Z');

test('borrowed equipment names the borrower and flags an overdue return', () => {
  const result = explainEquipmentStatus({
    display_status: { value: 'borrowed', label: 'Borrowed' },
    loan: { borrower_name: 'Le Van C', handed_over_at: '2026-11-02T08:00:00Z', due_at: '2026-11-12T17:00:00Z', overdue: true, purpose: 'Site test' },
  }, now);
  assert.equal(result.tone, 'reserved');
  assert.match(result.description, /Le Van C/);
  const overdue = result.facts.find((fact) => fact.label === 'Overdue');
  assert.equal(overdue?.tone, 'danger');
  assert.match(overdue?.value ?? '', /^1 day late/);
});

test('in-use equipment explains its bench placement', () => {
  const record = {
    display_status: { value: 'in_use', label: 'In use' },
    placement: { bench: { id: 1, name: 'ECU Bench 01' }, room: { id: 1, name: 'Lab A' }, station: null, location_note: '' },
  };
  assert.match(explainEquipmentStatus(record, now).description, /ECU Bench 01/);
  assert.equal(equipmentLocation(record), 'Lab A › ECU Bench 01');
});

test('reference objects never leak as [object Object]', () => {
  const result = explainEquipmentStatus({
    display_status: { value: 'available', label: 'Available' },
    storage_room: { id: 2, name: 'Store 1' },
    owner: { id: 3, display_name: 'Tran Thi B' },
  }, now);
  assert.ok(result.facts.every((fact) => !fact.value.includes('[object')));
  assert.deepEqual(result.facts.map((fact) => fact.value), ['Storage: Store 1', 'Tran Thi B']);
});

test('overdue calibration surfaces as a warning fact', () => {
  const result = explainEquipmentStatus({ display_status: { value: 'maintenance', label: 'Maintenance' }, calibration_overdue: true }, now);
  assert.equal(result.tone, 'warning');
  assert.equal(result.facts.find((fact) => fact.label === 'Calibration')?.tone, 'warning');
});
