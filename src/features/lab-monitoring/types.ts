import type { MonitoringEventRead } from '@/shared/api/generated/api';

export type ILabMonitoring = MonitoringEventRead;

export interface ILabMonitoringParams {
  lab?: number;
  from_date_time?: string;
  to_date_time?: string;
  page?: number;
  page_size?: number;
}

export interface ILabMonitoringResponse {
  value: ILabMonitoring[];
  total_count?: number;
}
