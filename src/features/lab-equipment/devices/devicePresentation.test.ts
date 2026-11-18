import assert from 'node:assert/strict';
import test from 'node:test';
import type { DeviceConnection } from './types.ts';
import {
  clampPage,
  computingRowSpans,
  connectionCounts,
  deviceConnectionPresentation,
  formatObserved,
  historyLabel,
  presencePresentation,
} from './devicePresentation.ts';

const connection: DeviceConnection = {
  id: 1,
  computing: { id: 10, uid: '00000000-0000-4000-8000-000000000010', name: 'Lab PC' },
  bench: { id: 4, name: 'B-12' },
  equipment: { id: 20, uid: '00000000-0000-4000-8000-000000000020', name: 'Oscilloscope' },
  interface: { id: 3, name: 'USB' },
  interface_name: 'USB',
  collector_key: 'usb',
  observation_key: 'usb-serial-1',
  name: 'Detected scope',
  serial_number: 'scope-1',
  state: { value: 'connected', label: 'Connected' },
  match_status: { value: 'matched', label: 'Matched' },
  freshness: { value: 'fresh', label: 'Fresh' },
  is_attention_required: false,
  expected_device_id: null,
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
    assert.equal(result.connectionTone, 'warning');
    assert.equal(result.dot, 'unconfirmed');
    assert.match(result.freshnessDescription, /unconfirmed/);
  }
});

test('failed refresh marks cached fresh observations unconfirmed without changing server data', () => {
  const cached = structuredClone(connection);
  const result = deviceConnectionPresentation(cached, false);
  assert.equal(result.freshnessLabel, 'Unconfirmed');
  assert.equal(result.freshnessTone, 'warning');
  assert.equal(result.connectionLabel, 'Last reported: connected');
  assert.equal(result.connectionTone, 'warning');
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

test('stale and unknown explain why the connection is unconfirmed', () => {
  assert.match(deviceConnectionPresentation({ ...connection, freshness: { value: 'stale', label: 'Stale' } }).freshnessDescription, /No recent report/);
  assert.match(deviceConnectionPresentation({ ...connection, freshness: { value: 'unknown', label: 'Unknown' } }).freshnessDescription, /re-enrolled or retired/);
});

test('enum values added by the server later get a neutral fallback', () => {
  const result = deviceConnectionPresentation({
    ...connection,
    match_status: { value: 'quarantined', label: 'Quarantined' },
    freshness: { value: 'pending', label: 'Pending' },
  });
  assert.equal(result.matchTone, 'default');
  assert.equal(result.matchDescription, 'Match status: Quarantined');
  assert.match(result.freshnessDescription, /unconfirmed/);
});

test('page is clamped to the last page that still exists', () => {
  assert.equal(clampPage(3, 45, 20), 3);
  assert.equal(clampPage(3, 21, 20), 2);
  assert.equal(clampPage(2, 0, 20), 1);
  assert.equal(clampPage(0, 10, 20), 1);
});

test('compact meta line and link eligibility', () => {
  const matched = deviceConnectionPresentation(connection);
  assert.equal(matched.meta, 'USB · scope-1');
  assert.equal(matched.canLink, false);
  const unmatched = deviceConnectionPresentation({ ...connection, equipment: null, match_status: { value: 'unmatched', label: 'Unmatched' } });
  assert.equal(unmatched.matchLabel, 'Not in inventory');
  assert.equal(unmatched.canLink, true);
  assert.equal(deviceConnectionPresentation({ ...connection, serial_number: '', match_status: { value: 'unmatched', label: 'Unmatched' } }).canLink, false);
  const ambiguous = deviceConnectionPresentation({ ...connection, match_status: { value: 'ambiguous', label: 'Ambiguous' } });
  assert.equal(ambiguous.canLink, false);
  assert.match(ambiguous.inventoryFix, /share this serial/);
  assert.match(deviceConnectionPresentation({ ...connection, match_status: { value: 'interface_mismatch', label: 'Interface mismatch' } }).inventoryFix, /USB interface/);
  assert.equal(matched.inventoryFix, '');
  assert.equal(deviceConnectionPresentation({ ...connection, state: { value: 'disconnected', label: 'Disconnected' } }).dot, 'disconnected');
});

test('presence and history labels', () => {
  assert.deepEqual(presencePresentation({ presence: { value: 'missing', label: 'Missing' } }).tone, 'error');
  assert.equal(presencePresentation({ presence: { value: 'later', label: 'Later' } }).tone, 'default');
  assert.equal(
    historyLabel({ state: { value: 'disconnected', label: 'Disconnected' }, observed_at: '2026-11-17T01:00:00Z', sequence: 7, is_complete: true }),
    'Disconnected · full snapshot #7',
  );
});

test('observation time is compact relative to today', () => {
  const now = new Date(2026, 10, 17, 15, 0);
  assert.equal(formatObserved(new Date(2026, 10, 17, 9, 5).toISOString(), now), '09:05');
  assert.equal(formatObserved(new Date(2026, 10, 16, 18, 3).toISOString(), now), 'Yesterday 18:03');
  assert.equal(formatObserved(new Date(2026, 10, 14, 10, 42).toISOString(), now), '14 Nov 10:42');
});

test('computing column merges consecutive rows of one unit', () => {
  const rows = [10, 10, 11, 12, 12, 12].map((id) => ({ computing: { ...connection.computing, id } }));
  assert.deepEqual(computingRowSpans(rows), [2, 0, 1, 3, 0, 0]);
  assert.deepEqual(computingRowSpans([]), []);
});

test('popover counts', () => {
  const rows = [
    connection,
    { ...connection, id: 2, match_status: { value: 'unmatched', label: 'Unmatched' } },
    { ...connection, id: 3, state: { value: 'disconnected', label: 'Disconnected' } },
  ];
  assert.deepEqual(connectionCounts(rows), { connected: 2, toMatch: 1, unplugged: 1 });
});
