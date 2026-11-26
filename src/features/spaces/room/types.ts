import type { RoomCreate } from "@/shared/api/generated/api";
import type { NamedReference } from '@/shared/utils/resourceReferences';
import type { ILabAudit, IPrimaryOwner } from "@/features/lab-equipment/shared";
import type {
  AccessPolicy,
  ActivityStatus,
  Availability,
  Choice,
  Condition,
  LifecycleStatus,
  LocationState,
} from "../shared/resourceStatus";

export interface ILocationCountry {
  id: number;
  name: string;
  code?: string;
}

export interface ILocationCity {
  id: number;
  name: string;
}

export interface ILocationBuilding {
  id: number;
  name: string;
}

export interface ILocationInfo {
  location_string?: string | null;
  floor?: string | null;
  label?: string | null;
  country?: ILocationCountry | null;
  city?: ILocationCity | null;
  building?: ILocationBuilding | null;
}

export interface IRoomRackItem {
  id: number;
  sku: string;
  name?: string | null;
}

export interface IRoomSlotSummary {
  total_slots?: number;
  occupied_slots?: number;
  available_slots?: number;
}

export interface IRoom extends LocationState {
  id: number;
  sku: string;
  name: string;
  department?: NamedReference | null;
  group?: NamedReference | null;
  uid?: string;
  coordinate_unit?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  location?: string | null;
  country?: string | null;
  location_info?: ILocationInfo | null;
  rack_list: IRoomRackItem[] | number[];
  setup_capacity: number;
  rows?: number | null;
  cols?: number | null;
  slot_summary?: IRoomSlotSummary;
  length?: number | null;
  width?: number | null;
  floor?: string | null;
  size?: string | null;
  temperature: number | null;
  humidity: number | null;
  max_power: number | null;
  power_usage: number | null;
  label: string;
  primary_owner: IPrimaryOwner | null;
  lifecycle_status: Choice<LifecycleStatus>;
  access_policy: Choice<AccessPolicy>;
  condition: Choice<Condition>;
  availability: Availability;
  activity_status: Choice<ActivityStatus>;
  lab_audit: ILabAudit | null;
  remark?: string;
  image?: string | null;
}

export interface IRoomListResponse {
  total_count: number;
  data: IRoom[];
}

export interface IRoomParams {
  country_id?: string;
  city_id?: string;
  building_id?: string;
  owner_id?: string;
  page?: number;
  page_size?: number;
  search?: string;
  ordering?: string;
  lifecycle_status?: string;
  access_policy?: string;
  condition?: string;
  activity_status?: string;
}

export interface IRoomPayload extends Partial<Omit<RoomCreate, "remark" | "power_capacity_w">> {
  max_power?: number | null;
  primary_owner?: number | null;
  sku?: string;
  name?: string;
  location?: string;
  label?: string;
  remark?: string | null;
  country?: number | null;
  city?: number | null;
  building?: number | null;
  floor?: string;
  length?: number | null;
  width?: number | null;
  rows?: number | null;
  cols?: number | null;
}

export interface IRoomDashboardRack {
  id: number;
  sku: string | null;
  name: string | null;
  slot_id: number | null;
  slot_code: string | null;
  slot_row: number | null;
  slot_col: number | null;
}

export interface IRoomDashboardSlot {
  id: number;
  row_index: number;
  col_index: number;
  slot_code: string;
  service_status?: 'usable' | 'blocked' | 'retired' | string;
  occupied?: boolean;
  rack: IRoomDashboardRack | null;
  /** Slot centre from the room's back-left corner (x across the width, y along the length), in mm. */
  x_mm?: number | null;
  y_mm?: number | null;
  width_mm?: number | null;
  depth_mm?: number | null;
  orientation_degrees?: number | null;
  /** station, storage, aisle, safety, utility or reserved. */
  slot_type?: string;
}

/** Current conditions from fresh telemetry placed in a room or station. */
export interface IDashboardConditions {
  temperature_c: number | null;
  humidity_percent: number | null;
  power_w: number | null;
  observed_at: string | null;
  channel_count: number;
}

export interface IDashboardRackItem {
  equipment_id: number;
  sku: string;
  name: string;
  category: string | null;
  power_draw_w: number | null;
  rack_unit: number;
  rack_unit_height: number;
  rack_face: string;
}

export interface IDashboardStationCapacity {
  bench_capacity: number | null;
  rack_units: number | null;
  rack_units_used?: number;
  power_capacity_w: number | null;
  power_reserved_w: number | null;
  power_installed_w?: number;
  max_load_kg: number | null;
  load_installed_kg?: number;
  network_port_capacity: number | null;
  installed_units?: number;
}

/** What the room mapping adds per station for the DCIM view. */
export interface IDashboardStationInfo {
  capacity?: IDashboardStationCapacity;
  rack?: IDashboardRackItem[];
  conditions?: IDashboardConditions | null;
  layout?: { width_mm: number | null; depth_mm: number | null; height_mm: number | null; orientation_degrees: number | null };
}

export interface IRoomDashboardLayout {
  contents?: Record<number, import('./stationContents').StationPosition[]>;
  /** 3D library model each station shows (own or its station type's), by station id. */
  station_models?: Record<number, number | null>;
  /** Capacity, rack contents and live conditions by station id. */
  stations?: Record<number, IDashboardStationInfo>;
  room: {
    id: number;
    sku: string | null;
    name: string | null;
    rows: number | null;
    cols: number | null;
    setup_capacity: number | null;
    width_m?: number | null;
    length_m?: number | null;
    conditions?: IDashboardConditions | null;
  };
  slots: IRoomDashboardSlot[];
  unplaced_racks: IRoomDashboardRack[];
}
