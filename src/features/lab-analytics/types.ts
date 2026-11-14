export type SortOrder = 'asc' | 'desc';
export type StatisticUnit = 'day' | 'week' | 'month' | 'quarter' | 'year';

export interface ChartParams {
  top?: number;
  order?: SortOrder;
  unit?: StatisticUnit;
}

export interface ChartDurationParams extends ChartParams {
  from_date_time: string;
  to_date_time: string;
}

export interface ChartDateParams extends ChartParams {
  log_date: string;
}

export interface ChartEnvelope<T> {
  data: T;
}

export interface LabGroupChartEntry {
  lab_group: number | null;
  lab_group_name: string | null;
  entries: number;
}

export interface LabEquipmentStatusSummary {
  status_type: string;
  entries: number;
}

export interface LabEfficiencyChartEntry {
  lab_name: string;
  computer_name: string;
  duration: number;
  booking: number;
  efficiency: number;
}

export interface ProjectUsageChartEntry {
  project_name: string | null;
  usage: number;
}

export interface UserByLabUsageChartEntry {
  remote_user: string;
  remote_user_displayname?: string | null;
  usage: number;
}

export interface UserByBookingEfficiencyChartEntry {
  remote_user: string;
  remote_user_displayname?: string | null;
  efficiency: number;
}

export interface LabUsageByTimeFrameChartEntry {
  timeslot: string;
  usage: number;
}

export interface UserStorageQuotaChartEntry {
  username: string;
  display_name: string;
  used: number;
  quota: number;
}

export interface LabVisitEntry {
  id: number;
  lab: {
    id: number;
    lab_name: string;
  };
  visit_date: string;
  visit_count: number;
  source: string;
  created: string;
}

export interface BookingCountByStatus {
  available?: number;
  'in-progress'?: number;
  done?: number;
  cancel?: number;
  expired?: number;
}

export interface BookingCountSummary {
  total_bookings: number;
  approved: number;
  pending: number;
  rejected: number;
  by_status: BookingCountByStatus;
}

export interface SnapshotCountSummary {
  current_count: number;
  last_week_count: number;
  delta: number;
}

export interface ChartStatistics {
  trend: number;
  count: number;
}

export interface StatisticsChartEntry {
  count: number;
  [key: string]: string | number;
}

export interface LabSessionLogRemoteUser {
  username: string | null;
  displayname: string | null;
}

export interface LabSessionLogBookingInfo {
  project: string | null;
  from_date_time: string | null;
  to_date_time: string | null;
}

export interface LabSessionLogEntry {
  id: number;
  computer_name: string | null;
  login_time: string | null;
  logout_time: string | null;
  duration_in_hour: number | null;
  active_time_in_hour: number | null;
  remote_user: LabSessionLogRemoteUser;
  remote_computer: string | null;
  remote_ip: string | null;
  booking_code: string | null;
  booking_info: LabSessionLogBookingInfo | null;
}

export interface LabSessionLogResponse {
  total_count: number;
  total_usage_hours: number;
  results: LabSessionLogEntry[];
}

