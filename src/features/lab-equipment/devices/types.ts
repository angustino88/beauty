import type {
  DeviceConnectionChangeRead,
  DeviceConnectionDetailRead,
  DeviceConnectionRead,
  DeviceConnectionSummary as GeneratedSummary,
  ExpectedDeviceRead,
  LabsDeviceConnectionsRetrieveApiResponse,
  LabsExpectedDevicesRetrieveApiResponse,
} from '@/shared/api/generated/api';

/** One observed device on a computing unit (`GET /api/labs/device-connections`). */
export type DeviceConnection = DeviceConnectionRead;
export type DeviceConnectionDetail = DeviceConnectionDetailRead;
export type DeviceConnectionChange = DeviceConnectionChangeRead;
export type DeviceConnectionPage = LabsDeviceConnectionsRetrieveApiResponse;
export type DeviceConnectionSummary = GeneratedSummary;
export type ExpectedDevice = ExpectedDeviceRead;
export type ExpectedDevicePage = LabsExpectedDevicesRetrieveApiResponse;

/** Enum values the UI knows how to describe. The server may add more; unknown values get a neutral fallback. */
export type KnownConnectionState = 'connected' | 'disconnected';
export type KnownMatchStatus = 'matched' | 'unmatched' | 'ambiguous' | 'interface_mismatch';
export type KnownFreshness = 'fresh' | 'stale' | 'unknown';
export type KnownPresence = 'present' | 'missing' | 'unconfirmed';

export interface DeviceConnectionFilters {
  computingId?: number;
  benchId?: number;
  state?: KnownConnectionState;
  isAttentionRequired?: boolean;
  q?: string;
  page: number;
  pageSize?: number;
}
