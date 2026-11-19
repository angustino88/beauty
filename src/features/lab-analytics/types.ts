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

export type SessionAccessType = 'booked' | 'ad_hoc' | 'unverified_booking';

/** One completed remote session (GET /api/labs/lab-sessions). */
export interface LabSessionLogEntry {
  id: number;
  login_at: string | null;
  logout_at: string | null;
  duration_minutes: number | null;
  active_minutes: number | null;
  computer: { id: number; name: string } | null;
  host_name: string | null;
  bench: { id: number; name: string } | null;
  remote_user: string | null;
  remote_user_display_name: string | null;
  user: { id: number; username: string; display_name: string } | null;
  access_type: { value: SessionAccessType | string; label: string } | null;
  booking_code: string | null;
  /** The verified booking (access type booked); null for ad hoc and unverified sessions. */
  booking: LabSessionBooking | null;
}

/** The booking a session ran under, to check the session against the booked slot. */
export interface LabSessionBooking {
  id: number;
  booking_code: string;
  starts_at: string | null;
  ends_at: string | null;
  status: { value: string; label: string } | null;
  project: { id: number; name: string } | null;
}

export interface LabSessionLogResponse {
  total_count: number;
  results: LabSessionLogEntry[];
}

