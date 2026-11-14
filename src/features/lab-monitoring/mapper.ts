import type {
  MonitoringEventRead,
  LabsLabMonitoringRetrieveApiResponse,
  LabsLabMonitoringExportRetrieveApiResponse,
} from '@/shared/api/generated/api';
import type { ILabMonitoringResponse } from './types';

export type LabMonitoringItem = MonitoringEventRead;
export type LabMonitoringListApiResponse = LabsLabMonitoringRetrieveApiResponse;

export function mapLabMonitoringListResponse(
  response: LabMonitoringListApiResponse,
): ILabMonitoringResponse {
  return {
    value: response.data,
    total_count: response.meta.pagination.count,
  };
}

export function mapLabMonitoringExportResponse(
  response: LabsLabMonitoringExportRetrieveApiResponse,
): ILabMonitoringResponse {
  return { value: response.data, total_count: undefined };
}
