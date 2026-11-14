import { toneForStatus, type StatusTone } from '../../../shared/status/statusTone.ts';
export type SpaceStatusKind = 'room' | 'station' | 'bench';

export function normalizeSpaceStatus(status: unknown): string {
  if (typeof status === 'string') return status.trim().toLowerCase();
  if (!status || typeof status !== 'object' || Array.isArray(status)) return '';

  const statusRecord = status as Record<string, unknown>;
  return normalizeSpaceStatus(statusRecord.value ?? statusRecord.status_type ?? statusRecord.status);
}

export function readSpaceStatus(record: unknown): string {
  if (!record || typeof record !== 'object' || Array.isArray(record)) return '';
  const item = record as Record<string, unknown>;
  const currentStatus = item.current_status && typeof item.current_status === 'object' && !Array.isArray(item.current_status)
    ? item.current_status as Record<string, unknown>
    : undefined;

  return normalizeSpaceStatus(item.status) || normalizeSpaceStatus(currentStatus?.status_type) || normalizeSpaceStatus(currentStatus?.status);
}

export function spaceStatusLabel(status: unknown): string {
  const value = normalizeSpaceStatus(status);
  if (!value) return 'Unknown';
  return value.replaceAll('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function spaceStatusTone(status: unknown): StatusTone {
  return toneForStatus(normalizeSpaceStatus(status));
}