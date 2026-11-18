import assert from 'node:assert/strict';
import test from 'node:test';
import { carrierLabel, inventoryDifferences, observationPresentation, probeSummary, runTone } from './presentation.ts';

test('observation outcomes carry a tone and a fix', () => {
  assert.equal(observationPresentation({ status: { value: 'matched', label: 'Matched' } }).fix, '');
  assert.match(observationPresentation({ status: { value: 'carrier_unlinked', label: 'x' } }).fix, /hardware ID/);
  assert.equal(observationPresentation({ status: { value: 'future_value', label: 'x' } }).tone, 'default');
  assert.equal(runTone('failed'), 'error');
  assert.equal(runTone('unknown'), 'default');
});

test('carrier label prefers the inventory unit', () => {
  const unit = { id: 1, uid: '00000000-0000-4000-8000-000000000001', name: 'CANcase 3' };
  assert.equal(carrierLabel({ carrier_type: 'device', carrier_equipment: unit, carrier_hardware_value: '007113-585343' }), 'CANcase 3 (007113-585343)');
  assert.equal(carrierLabel({ carrier_type: 'device', carrier_equipment: null, carrier_hardware_value: '007113-585343' }), 'Device 007113-585343');
  assert.equal(carrierLabel({ carrier_type: 'computer', carrier_equipment: null, carrier_hardware_value: '' }), 'This computer');
});

test('inventory differences compare instants, not strings', () => {
  const inventory = { serial_number: 'S', expires_at: '2027-04-10T06:59:59+07:00', max_version: '15.0' };
  assert.deepEqual(inventoryDifferences({ inventory, expires_at: '2027-04-09T23:59:59Z', max_version: '15.0' }), []);
  assert.deepEqual(inventoryDifferences({ inventory, expires_at: null, max_version: '16.0' }), ['expiry', 'version']);
  assert.deepEqual(inventoryDifferences({ inventory: null, expires_at: null, max_version: '' }), []);
});

test('probe summary', () => {
  assert.equal(probeSummary({ type: 'command', executable: 'C:\\Program Files\\Vector License Client\\Vector.LicenseClient.exe', args: ['-listlicenses'] }), 'Command Vector.LicenseClient.exe -listlicenses');
  assert.equal(probeSummary({ type: 'registry', key: 'SOFTWARE\\Tool' }), 'Registry SOFTWARE\\Tool');
  assert.equal(probeSummary(null), '—');
});
