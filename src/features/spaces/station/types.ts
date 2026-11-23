import type { StationCreate } from "@/shared/api/generated/api";
import type { NamedReference } from '@/shared/utils/resourceReferences';
import type { IEquipmentStatus, ILabAudit, IPrimaryOwner } from "@/features/lab-equipment/shared";
import type {
  AccessPolicy,
  ActivityStatus,
  Availability,
  Choice,
  Condition,
  LifecycleStatus,
  LocationState,
} from "../shared/resourceStatus";

export interface IStationRoomRef {
  id: number;
  sku: string;
  name?: string | null;
}

export interface IStationSlot {
  id: number;
  slot_code: string;
  label?: string | null;
  service_status?: 'in_service' | 'out_of_service' | 'retired' | string;
  occupied?: boolean;
}

export interface IStation extends LocationState {
  id: number;
  uid?: string;
  sku: string;
  name: string;
  room?: IStationRoomRef | null;
  room_id?: number | null;
  slot_id?: number | null;
  slot_code?: string | null;
  power_reserved_w?: number | null;
  station_type?: NamedReference | null;
  available_slot_count?: number | null;
  slot_count?: number | null;
  slots_url?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  width_mm?: number | null;
  depth_mm?: number | null;
  height_mm?: number | null;
  max_load_kg?: number | null;
  power_capacity_w?: number | null;
  network_port_capacity?: number | null;
  rack_manufacturer?: { manufacturer_name?: string | null } | null;
  rack_model?: { model_name?: string | null } | null;
  department?: { id: number; name: string } | null;
  group?: { id: number; name: string } | null;
  primary_owner?: IPrimaryOwner | null;
  lifecycle_status: Choice<LifecycleStatus>;
  access_policy: Choice<AccessPolicy>;
  condition: Choice<Condition>;
  availability: Availability;
  activity_status: Choice<ActivityStatus>;
  /** @deprecated use the status fields above */
  status?: string | null;
  current_status?: IEquipmentStatus | null;
  label?: string;
  remark?: string | null;
  bench_count?: number;
  active_bench_count?: number | null;
  bench_capacity?: number | null;
  allocated_power_w?: number | null;
  available_power_w?: number | null;
  temperature?: number | null;
  humidity?: number | null;
  power_usage?: number | null;
  lab_audit?: ILabAudit | null;
  image?: string | null;
  location?: string | null;
  location_string?: string | null;
  slots?: IStationSlot[];
}

/** Legacy alias for interactive dashboard compatibility */
export type IRack = IStation;

export interface IStationListResponse {
  total_count: number;
  data: IStation[];
}

export interface IStationParams {
  page?: number;
  page_size?: number;
  search?: string;
  ordering?: string;
  room_id?: number | string;
  owner_id?: number | string;
  lifecycle_status?: string;
  access_policy?: string;
  condition?: string;
  activity_status?: string;
  /** @deprecated */
  status?: string;
}

export interface IStationPayload extends Partial<Omit<StationCreate, "remark" | "power_reserved_w">> {
  sku?: string;
  name?: string;
  room_id?: number | null;
  slot_id?: number | null;
  power_reserved_w?: number | string | null;
  width_mm?: number | null;
  depth_mm?: number | null;
  height_mm?: number | null;
  max_load_kg?: number | null;
  power_capacity_w?: number | null;
  network_port_capacity?: number | null;
  /** Number of bench positions; the station's slots S1..Sn follow it. */
  bench_capacity?: number | null;
  department?: number | null;
  group?: number | null;
  owner?: number | null;
  primary_owner?: number | null;
  label?: string;
  remark?: string | null;
  current_status?: {
    status_type: string;
    status_data: Record<string, unknown>;
  } | null;
}

export interface IStationDropdownOptions {
  rooms: Array<{ id: number; sku?: string | null; name: string }>;
  departments: Array<{ id: number; name: string }>;
  groups: Array<{ id: number; name: string }>;
}
