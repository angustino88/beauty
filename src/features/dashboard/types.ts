import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc.js';

dayjs.extend(utc);

// ─── Bench Groups ─────────────────────────────────────────────────────────────

export interface BenchGroup {
  id: number;
  name: string;
  description?: string;
  is_active?: boolean;
}

/** Legacy alias for backwards compatibility */
export type LabGroup = BenchGroup & {
  lab_group_name?: string;
};

// ─── Booking Info ─────────────────────────────────────────────────────────────

export interface BookingInfo {
  id: number;
  booking_code: string;
  from_date_time: string;
  to_date_time: string;
  starts_at?: string;
  ends_at?: string;
  status: string;
  creator: { id: number; username: string; display_name?: string };
}

export interface BookingStatus {
  is_booked: boolean;
  booking_info: BookingInfo | null;
}

// ─── Equipment & Computing ────────────────────────────────────────────────────

export interface LabComputer {
  id: number;
  computer_ip: string;
  computer_name: string;
  status: string;
  rdp_file?: string;
}

export interface LabSample {
  id: number;
  name: string;
  sku: string;
}

export interface LabLicense {
  id: number;
  name: string;
  sku: string;
}

export interface RemoteUser {
  username: string;
  displayname: string;
}

// ─── Dashboard Bench Model (GET /api/labs/dashboard) ──────────────────────────

export interface DashboardBench {
  id: number;
  sku: string;
  name: string;
  lifecycle_status: string;
  condition: string;
  bench_group: BenchGroup | null;
  bench_type: { id: number; name: string } | null;
  location: {
    station_id: number | null;
    station_name: string | null;
    room_id: number | null;
    room_name: string | null;
    building_name: string | null;
    slot_label: string | null;
  } | null;
  is_favorite?: boolean;
  current_booking: {
    id: number;
    booking_code: string;
    starts_at: string;
    ends_at: string;
    status: string;
    user: {
      id: number;
      username: string;
      display_name?: string;
    } | null;
  } | null;
  computing: {
    id: number;
    sku?: string;
    name?: string;
    ip_address: string | null;
    os_name: string;
    rdp_file_url: string | null;
    activity_status: string;
    remote_user: string;
    remote_user_display_name: string;
    remote_ip: string | null;
    /** Start of the current offline or inactive spell; null for other statuses. */
    status_started_at: string | null;
  } | null;
  samples: Array<{ id: number; sku?: string; name?: string }>;
  licenses: Array<{ id: number; sku?: string; name?: string }>;
  assigned_equipment_count: number;
  image_url: string | null;
  updated_at: string;

  // Compatibility properties for UI components
  lab_name?: string;
  location_name?: string;
  location_url?: string;
  lab_group?: { id: number; lab_group_name: string } | null;
  booking_status?: BookingStatus;
  computer?: LabComputer | null;
  samples_list?: LabSample[];
  license_list?: LabLicense[];
  remote_user?: RemoteUser | null;
}

// ─── Filter Options ───────────────────────────────────────────────────────────

export interface BenchFilterOptions {
  bench_groups: BenchGroup[];
  locations: string[];
  statuses: string[];
}

// ─── Column Filters ───────────────────────────────────────────────────────────

export interface DashboardColumnFilters {
  status: string[];
  lab_group_ids: number[];
  sample_filter_values: string[];
  sample_ids: number[];
  license_filter_values: string[];
  license_ids: number[];
}

export const SUMMARY_STATUS_VALUES = ['free', 'active', 'inactive', 'maintaining', 'offline'] as const;
export type SummaryStatus = (typeof SUMMARY_STATUS_VALUES)[number] | null;

export const INITIAL_COLUMN_FILTERS: DashboardColumnFilters = {
  status: [],
  lab_group_ids: [],
  sample_filter_values: [],
  sample_ids: [],
  license_filter_values: [],
  license_ids: [],
};

// ─── Query Params & Response ──────────────────────────────────────────────────

export interface DashboardPageParams {
  page: number;
  page_size: number;
  search?: string;
  status?: string[];
  bench_group?: number[];
  sample_ids?: number[];
  license_ids?: number[];
  is_favorite?: boolean;
}

export interface DashboardPageResponse {
  total_count: number;
  results: DashboardBench[];
}

// ─── Operational Summary ──────────────────────────────────────────────────────

export interface DashboardOperationalSummary {
  total_benches: number;
  active_bookings_count: number;
  favorited_benches_count: number;
  lifecycle_distribution: Record<string, number>;
  condition_distribution: Record<string, number>;
  activity_distribution: Record<string, number>;
  utilization_rate: number;
  // Compatibility fields
  total?: number;
  status?: Record<string, number>;
}

export type DashboardSummaryResponse = DashboardOperationalSummary & {
  total: number;
  status: Record<string, number>;
};

export interface DerivedDashboardStats {
  totalCount: number;
  freeCount: number;
  activeCount: number;
  inactiveCount: number;
  maintainingCount: number;
  offlineCount: number;
}

/** Booking statuses that mean the bench is booked now (backend sends `reserved` / `in_progress`; the rest are legacy). */
const BOOKING_LIVE_STATUSES: ReadonlySet<string> = new Set(['reserved', 'in_progress', 'in-progress', 'active', 'available']);

/** Returns true if a bench/lab has an active booking RIGHT NOW */
export function isCurrentlyBooked(bookingStatus?: DashboardBench['current_booking'] | BookingStatus | null): boolean {
  if (!bookingStatus) return false;

  // New DashboardBooking shape
  if ('starts_at' in bookingStatus && 'ends_at' in bookingStatus) {
    const { starts_at, ends_at, status } = bookingStatus;
    if (!starts_at || !ends_at) return false;
    const now = dayjs.utc();
    return (
      now.isAfter(dayjs.utc(starts_at)) &&
      now.isBefore(dayjs.utc(ends_at)) &&
      BOOKING_LIVE_STATUSES.has(status)
    );
  }

  // Legacy BookingStatus shape
  if ('booking_info' in bookingStatus && bookingStatus.booking_info) {
    const { from_date_time, to_date_time, status } = bookingStatus.booking_info;
    const now = dayjs.utc();
    return (
      now.isAfter(dayjs.utc(from_date_time)) &&
      now.isBefore(dayjs.utc(to_date_time)) &&
      BOOKING_LIVE_STATUSES.has(status)
    );
  }

  return false;
}

// ─── Detail Types (GET /api/labs/dashboard/benches/{bench_id}) ────────────────

export interface LabEquipmentDetail {
  id: number;
  computer: { id: number; computer_name: string; sku: string; serial_number?: string } | null;
  rack: { id: number; name: string; sku: string } | null;
  samples_list: Array<{ id: number; sku: string; name: string; serial_number?: string }>;
  license_list: Array<{ id: number; sku: string; license_name: string }>;
  network_interface_list: Array<{ id: number; sku: string; network_interface_name: string; serial_number?: string }>;
  debug_hardware_list: Array<{ id: number; sku: string; debug_hardware_name?: string }>;
  powersupply_list: Array<{ id: number; sku: string; powersupply_name?: string }>;
  monitor_list: Array<{ id: number; sku: string; monitor_name: string; serial_number?: string }>;
  accessory_list: Array<{ id: number; sku: string; accessory_name: string; serial_number?: string }>;
}

export interface LabCurrentActivity {
  id: number;
  status: string;
  inactive_time: string | null;
  offline_time: string | null;
  booking_code: string | null;
  remote_user: string | null;
  remote_user_displayname: string | null;
  remote_computer: string | null;
  remote_ip: string | null;
  source: string | null;
  created: string;
  modified: string;
}

export interface DashboardBenchDetail {
  id: number;
  sku: string;
  name: string;
  lifecycle_status: string;
  condition: string;
  bench_group: BenchGroup | null;
  bench_type: { id: number; name: string } | null;
  location: {
    station_id: number | null;
    station_name: string | null;
    room_id: number | null;
    room_name: string | null;
    building_name: string | null;
    slot_label: string | null;
  } | null;
  is_favorite?: boolean;
  current_booking: {
    id: number;
    booking_code: string;
    starts_at: string;
    ends_at: string;
    status: string;
  } | null;
  computing: {
    id: number;
    sku?: string;
    name?: string;
    activity_status: string;
    last_agent_report_at: string | null;
    is_stale: boolean | null;
    /** Start of the current offline or inactive spell; null for other statuses. */
    status_started_at: string | null;
  } | null;
  samples: Array<{ id: number; sku?: string; name?: string }>;
  licenses: Array<{ id: number; sku?: string; name?: string }>;
  assigned_equipment_count: number;
  image_url: string | null;
  updated_at: string;
  description?: string;
  documentation_url?: string;
  criticality?: string;
  equipment_by_category: Array<{
    id: number | null;
    name: string;
    equipment: Array<{
      id: number;
      sku: string;
      name: string;
      category: { id: number; name: string } | null;
      role: string;
      position: number;
      assigned_at: string;
      computing_activity: {
        status: string;
        last_agent_report_at: string | null;
        is_stale: boolean | null;
      } | null;
      licenses: Array<{ id: number; sku?: string; name?: string }>;
    }>;
  }>;
  upcoming_bookings: Array<{
    id: number;
    booking_code: string;
    starts_at: string;
    ends_at: string;
    status: string;
  }>;

  // Compatibility fields for InfoModal
  lab_name?: string;
  location_name?: string;
  location_url?: string;
  image?: string | null;
  remark?: string;
  lab_group?: { id: number; lab_group_name: string } | null;
  technical_user?: { id: number; first_name: string; last_name: string; email: string; username: string } | null;
  primary_owner?: { id: number; username: string; display_name: string } | null;
  computer?: LabComputer | null;
  lab_equipment?: LabEquipmentDetail | null;
  current_activity?: LabCurrentActivity | null;
  booking_status?: BookingStatus;
}

export type LabDetail = DashboardBenchDetail;
