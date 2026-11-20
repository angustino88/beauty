import assert from 'node:assert/strict';
import test from 'node:test';
import { describeModbus, duplicateUnitIds, isMacAddress, isNetworkHost, normalizeDeviceUid, timeAgo } from './format.ts';

test('MAC addresses are normalized like the backend; serials are only trimmed', () => {
  assert.equal(normalizeDeviceUid(' a4-cf-12-9b-00-21 '), 'A4:CF:12:9B:00:21');
  assert.equal(normalizeDeviceUid('A4CF129B0021'), 'A4:CF:12:9B:00:21');
  assert.equal(normalizeDeviceUid('  SN-0042  '), 'SN-0042');
  assert.equal(isMacAddress('a4:cf:12:9b:00:21'), true);
  assert.equal(isMacAddress('A4:CF:12'), false);
});

test('network hosts accept IPv4 and host names, not broken addresses', () => {
  assert.equal(isNetworkHost('192.168.50.21'), true);
  assert.equal(isNetworkHost('w630-station-a.lab.local'), true);
  assert.equal(isNetworkHost('300.1.1.1'), false);
  assert.equal(isNetworkHost('not a host!'), false);
});

test('Modbus settings read as address plus serial line', () => {
  const settings = {
    network_host: '192.168.50.21',
    port: 502,
    framing: { value: 'mbap' as const, label: 'Modbus TCP' },
    serial_interface: { value: 'rs485' as const, label: 'RS485' },
    baud_rate: 9600,
    parity: { value: 'N' as const, label: 'None' },
    data_bits: 8,
    stop_bits: 1,
    request_timeout_ms: 800,
    has_shared_bus: true,
  };
  assert.equal(describeModbus(settings), '192.168.50.21:502 · RS485 9600 8N1');
  assert.equal(describeModbus({ ...settings, serial_interface: null, baud_rate: null }), '192.168.50.21:502');
  assert.equal(describeModbus(null), '—');
});

test('duplicate Modbus addresses on one bus are reported once each', () => {
  assert.deepEqual(duplicateUnitIds([1, 2, 2, 3, 1, null, undefined]), [1, 2]);
  assert.deepEqual(duplicateUnitIds([1, 2]), []);
});

test('last-seen times read naturally', () => {
  const now = new Date('2026-11-20T10:00:00Z');
  assert.equal(timeAgo(null, now), 'never');
  assert.equal(timeAgo('2026-11-20T09:59:30Z', now), 'just now');
  assert.equal(timeAgo('2026-11-20T09:45:00Z', now), '15 min ago');
  assert.equal(timeAgo('2026-11-19T10:00:00Z', now), '24 h ago');
  assert.equal(timeAgo('2026-11-15T10:00:00Z', now), '5 d ago');
});
