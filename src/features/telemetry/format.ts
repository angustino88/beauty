/** Pure display helpers for telemetry screens (unit-tested in format.test.ts). */
import type { StatusTone } from '@/shared/status/statusTone';
import type { DeviceState, ModbusSettings, TargetType } from './types';

const MAC = /^[0-9A-F]{2}([:-]?[0-9A-F]{2}){5}$/;

/** Mirrors the backend: MAC addresses become `AA:BB:CC:DD:EE:FF`; anything else is trimmed. */
export function normalizeDeviceUid(value: string): string {
  const trimmed = value.trim();
  const upper = trimmed.toUpperCase();
  if (!MAC.test(upper)) return trimmed;
  const digits = upper.replace(/[:-]/g, '');
  return digits.match(/.{2}/g)!.join(':');
}

export function isMacAddress(value: string): boolean {
  return MAC.test(value.trim().toUpperCase());
}

const IPV4 = /^(25[0-5]|2[0-4]\d|1?\d?\d)(\.(25[0-5]|2[0-4]\d|1?\d?\d)){3}$/;
const HOST = /^(?=.{1,253}$)[A-Za-z0-9]([A-Za-z0-9-]{0,61}[A-Za-z0-9])?(\.[A-Za-z0-9]([A-Za-z0-9-]{0,61}[A-Za-z0-9])?)*$/;

export function isNetworkHost(value: string): boolean {
  const host = value.trim();
  return IPV4.test(host) || (HOST.test(host) && !/^\d+(\.\d+)*$/.test(host));
}

export const DEVICE_STATE_TONE: Record<DeviceState, StatusTone> = {
  claimed: 'success',
  discovered: 'warning',
  retired: 'neutral',
};

export const PROFILE_STATUS_TONE: Record<'draft' | 'approved', StatusTone> = {
  approved: 'success',
  draft: 'neutral',
};

export const TARGET_TYPE_LABEL: Record<TargetType, string> = {
  room: 'Room',
  station: 'Station',
  bench: 'Bench',
  equipment: 'Equipment',
};

/** `192.168.50.21:502 · RS485 9600 8N1` */
export function describeModbus(settings: ModbusSettings | null): string {
  if (!settings) return '—';
  const address = `${settings.network_host}:${settings.port}`;
  if (!settings.serial_interface || !settings.baud_rate) return address;
  const parity = settings.parity?.value ?? 'N';
  return `${address} · ${settings.serial_interface.label} ${settings.baud_rate} ${settings.data_bits ?? 8}${parity}${settings.stop_bits ?? 1}`;
}

/** Common serial presets offered in the device wizard. */
export const SERIAL_PRESETS = [
  { key: '9600-8N1', label: '9600 8N1', baud_rate: 9600, parity: 'N', data_bits: 8, stop_bits: 1 },
  { key: '19200-8N1', label: '19200 8N1', baud_rate: 19200, parity: 'N', data_bits: 8, stop_bits: 1 },
  { key: '9600-8E1', label: '9600 8E1', baud_rate: 9600, parity: 'E', data_bits: 8, stop_bits: 1 },
  { key: '4800-8N1', label: '4800 8N1', baud_rate: 4800, parity: 'N', data_bits: 8, stop_bits: 1 },
] as const;

/** Relative "x min ago" for last-seen timestamps; `now` is injectable for tests. */
export function timeAgo(iso: string | null, now: Date = new Date()): string {
  if (!iso) return 'never';
  const seconds = Math.max(0, Math.round((now.getTime() - new Date(iso).getTime()) / 1000));
  if (seconds < 60) return 'just now';
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 48) return `${hours} h ago`;
  return `${Math.round(hours / 24)} d ago`;
}

/** Sensors on one bus must have distinct Modbus addresses; returns the duplicated unit IDs. */
export function duplicateUnitIds(unitIds: readonly (number | null | undefined)[]): number[] {
  const seen = new Set<number>();
  const duplicates = new Set<number>();
  for (const unitId of unitIds) {
    if (unitId == null) continue;
    if (seen.has(unitId)) duplicates.add(unitId);
    seen.add(unitId);
  }
  return [...duplicates].sort((a, b) => a - b);
}
