import assert from 'node:assert/strict';
import test from 'node:test';
import type { DeviceConnection } from '../../types/deviceConnections.ts';
import { deviceConnectionPresentation } from './deviceConnectionPresentation.ts';

const connection: DeviceConnection = {
  id: 1,
  computer: { id: 10, name: 'Lab PC' },
  equipment: { id: 20, name: 'Oscilloscope' },
  interface: { id: 3, name: 'USB' },
  interface_name: 'USB',
  collector_key: 'usb',
  observation_key: 'usb-serial-1',
  name: 'Detected scope',
  serial_number: 'scope-1',
  state: { value: 'connected', label: 'Connected' },
  match_status: { value: 'matched', label: 'Matched' },
  freshness: { value: 'fresh', label: 'Fresh' },
  observed_at: '2026-11-17T01:00:00Z',
  received_at: '2026-11-17T01:00:01Z',
};

test('fresh matched observation uses the inventory identity and connected state', () => {
  const result = deviceConnectionPresentation(connection);
  assert.equal(result.title, 'Oscilloscope');
  assert.equal(result.connectionLabel, 'Connected');
  assert.equal(result.connectionTone, 'success');
  assert.equal(result.matchTone, 'success');
});

test('stale and unknown observations do not claim a current physical connection', () => {
  for (const value of ['stale', 'unknown'] as const) {
    const result = deviceConnectionPresentation({ ...connection, freshness: { value, label: value } });
    assert.equal(result.connectionLabel, 'Last reported: connected');
    assert.equal(result.connectionTone, 'default');
    assert.match(result.freshnessDescription, /unconfirmed/);
  }
});

test('failed refresh marks cached fresh observations unconfirmed without changing server data', () => {
  const cached = structuredClone(connection);
  const result = deviceConnectionPresentation(cached, false);
  assert.equal(result.freshnessLabel, 'Unconfirmed');
  assert.equal(result.freshnessTone, 'warning');
  assert.equal(result.connectionLabel, 'Last reported: connected');
  assert.equal(result.connectionTone, 'default');
  assert.match(result.freshnessDescription, /unconfirmed/);
  assert.deepEqual(cached, connection);

  const recovered = deviceConnectionPresentation(cached, true);
  assert.equal(recovered.freshnessLabel, 'Fresh');
  assert.equal(recovered.connectionLabel, 'Connected');
  assert.equal(recovered.connectionTone, 'success');
});

test('confirmed detach remains disconnected instead of being described as offline', () => {
  const result = deviceConnectionPresentation({ ...connection, state: { value: 'disconnected', label: 'Disconnected' } });
  assert.equal(result.connectionLabel, 'Disconnected');
  assert.equal(result.connectionTone, 'default');
});

test('unresolved observations preserve detected identity and explain each match outcome', () => {
  for (const value of ['unmatched', 'ambiguous', 'interface_mismatch'] as const) {
    const result = deviceConnectionPresentation({ ...connection, equipment: null, match_status: { value, label: value } });
    assert.equal(result.title, 'Detected scope');
    assert.equal(result.matchTone, 'warning');
    assert.ok(result.matchDescription);
    assert.ok(!result.title.includes('[object Object]'));
  }
  assert.match(deviceConnectionPresentation({ ...connection, match_status: { value: 'ambiguous', label: 'Ambiguous' } }).matchDescription, /More than one/);
  assert.match(deviceConnectionPresentation({ ...connection, match_status: { value: 'interface_mismatch', label: 'Interface mismatch' } }).matchDescription, /interface differs/);
});

test('missing device and inventory names have a clear fallback', () => {
  assert.equal(deviceConnectionPresentation({ ...connection, equipment: null, name: '' }).title, 'Unidentified device');
});
