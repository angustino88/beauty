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
}

export interface IRoomDashboardLayout {
  contents?: Record<number, import('./stationContents').StationPosition[]>;
  /** 3D library model each station shows (own or its station type's), by station id. */
  station_models?: Record<number, number | null>;
  room: {
    id: number;
    sku: string | null;
    name: string | null;
    rows: number | null;
    cols: number | null;
    setup_capacity: number | null;
  };
  slots: IRoomDashboardSlot[];
  unplaced_racks: IRoomDashboardRack[];
}
