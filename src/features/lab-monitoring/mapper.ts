import type {
  LabsMonitoringEventsRetrieveApiResponse,
  LabsMonitoringEventsExportRetrieveApiResponse,
} from '@/shared/api/generated/api';
import type { ILabMonitoringResponse } from './types';

export function mapLabMonitoringListResponse(
  response: LabsMonitoringEventsRetrieveApiResponse,
): ILabMonitoringResponse {
  return {
    value: response.data,
    total_count: response.meta.pagination.count,
  };
}

export function mapLabMonitoringExportResponse(
  response: LabsMonitoringEventsExportRetrieveApiResponse,
): ILabMonitoringResponse {
  return { value: response.data, total_count: undefined };
}
