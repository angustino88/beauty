import type { IEquipmentStatus, ILabAudit, IPrimaryOwner } from "@/features/lab-equipment/shared";
import type {
  ActivityStatus,
  Availability,
  Choice,
  Condition,
  LifecycleStatus,
  ResourceState,
} from "../shared/resourceStatus";

export interface IBench extends ResourceState {
  id: number;
  uid?: string;
  sku: string;
  name: string;
  bench_group?: { id: number; name: string } | null;
  bench_type?: { id: number; name: string } | null;
  department?: { id: number; name: string } | null;
  owner?: { id: number; name: string } | null;
  primary_owner?: IPrimaryOwner | null;
  setup_location_id?: number | null;
  station_slot_id?: number | null;
  station?: { id: number; sku: string; name: string } | null;
  room?: { id: number; sku: string; name: string } | null;
  equipment_count?: number;
  is_favorite?: boolean;
  lifecycle_status: Choice<LifecycleStatus>;
  condition: Choice<Condition>;
  availability: Availability;
  activity_status: Choice<ActivityStatus>;
  /** @deprecated use lifecycle_status, condition, availability, activity_status */
  status?: string | null;
  status_label?: string | null;
  current_status?: IEquipmentStatus | null;
  remark?: string | null;
  image?: string | null;
  location_name?: string | null;
  lab_audit?: ILabAudit | null;
}

/** Legacy alias for compatibility during migration */
export type ILabInfo = IBench;

export interface IBenchListResponse {
  total_count: number;
  data: IBench[];
}

export type ILabInfoListResponse = IBenchListResponse;

export interface IBenchParams {
  page?: number;
  page_size?: number;
  search?: string;
  ordering?: string;
  bench_group_id?: string;
  type_id?: string;
  setup_location_id?: number | string;
  owner_id?: number | string;
  lifecycle_status?: string;
  condition?: string;
  activity_status?: string;
  /** @deprecated */
  status?: string;
  favorite?: boolean;
}

export type ILabInfoParams = IBenchParams;

export interface IBenchPayload {
  sku?: string;
  name?: string;
  type_id?: number | null;
  /** Bench group (`bench_group_id`); `group_id` is the department resource group. */
  bench_group_id?: number | null;
  group_id?: number | null;
  department_id?: number | null;
  owner_id?: number | null;
  /** Station the bench is set up on. */
  setup_location_id?: number | null;
  station_slot_id?: number | null;
  remark?: string | null;
}

export type ILabInfoUpsertPayload = IBenchPayload;

export interface IBenchGroup {
  id: number;
  name: string;
}
