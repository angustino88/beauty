import type {
  DeviceConnectionListConnectionsDeviceConnectionPaginatedResponseRead,
  DeviceConnectionRead,
} from '@/shared/api/generated/api';

/** One observed device on a computing equipment, as served by `GET /api/labs/device-connections`. */
export type DeviceConnection = DeviceConnectionRead;

/** One page of device connections with the standard pagination envelope. */
export type DeviceConnectionPage = DeviceConnectionListConnectionsDeviceConnectionPaginatedResponseRead;

/** Enum values the UI knows how to describe. The server may add more; unknown values get a neutral fallback. */
export type KnownConnectionState = 'connected' | 'disconnected';
export type KnownMatchStatus = 'matched' | 'unmatched' | 'ambiguous' | 'interface_mismatch';
export type KnownFreshness = 'fresh' | 'stale' | 'unknown';
