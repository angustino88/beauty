import type { MonitoringEventRead } from '@/shared/api/generated/api';

export type ILabMonitoring = MonitoringEventRead;

export interface ILabMonitoringParams {
  bench_id?: number;
  /** Computing unit (equipment id). */
  computing_id?: number;
  from_date?: string;
  to_date?: string;
  page?: number;
  page_size?: number;
}

export interface ILabMonitoringResponse {
  value: ILabMonitoring[];
  total_count?: number;
}
