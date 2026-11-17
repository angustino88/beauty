import type { IStation, IStationListResponse, IStationPayload } from "./types";
import { normalizeSpaceStatus } from "../shared/spaceStatus.ts";
import {
  mapAvailability,
  mapChoice,
  type AccessPolicy,
  type ActivityStatus,
  type Condition,
  type LifecycleStatus,
} from "../shared/resourceStatus.ts";
import { toUserRef } from '../../../shared/utils/userRef.ts';

const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);

const asNumber = (v: unknown, fallback = 0): number => {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
};

const asNullableNumber = (v: unknown): number | null => {
  if (v == null || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

const asString = (v: unknown, fallback = ""): string =>
  typeof v === "string" ? v : v != null ? String(v) : fallback;

const asNullableString = (v: unknown): string | null =>
  v != null && v !== "" ? String(v) : null;

export function mapStationApiItem(raw: unknown): IStation {
  const st = isRecord(raw) ? raw : {};
  const room = isRecord(st.room) ? st.room : null;
  const dept = isRecord(st.department) ? st.department : null;
  const grp = isRecord(st.group) ? st.group : null;
  const owner = isRecord(st.owner) ? st.owner : null;
  const currentStatus = isRecord(st.current_status) ? st.current_status : null;

  const rawBenches = Array.isArray(st.benches)
    ? st.benches
    : Array.isArray(st.lab_equipment_list)
      ? st.lab_equipment_list
      : [];

  return {
    id: asNumber(st.id),
    uid: asNullableString(st.uid) ?? undefined,
    sku: asString(st.sku),
    name: asString(st.name || st.station_name),
    room: room
      ? {
          id: asNumber(room.id),
          // Room references carry uid and name; the name is what the list search matches.
          sku: asString(room.sku || room.name),
          name: asNullableString(room.name || room.room_name),
        }
      : null,
    room_id: asNullableNumber(st.room_id || room?.id),
    slot_id: isRecord(st.slot) ? asNumber(st.slot.id) : asNullableNumber(st.slot_id),
    slot_code: isRecord(st.slot) ? asNullableString(st.slot.name) : asNullableString(st.slot_code),
    power_reserved_w: asNullableString(st.power_reserved_w),
    width_mm: asNullableNumber(st.width_mm || st.width),
    depth_mm: asNullableNumber(st.depth_mm || st.depth),
    height_mm: asNullableNumber(st.height_mm || st.height),
    max_load_kg: asNullableNumber(st.max_load_kg || st.max_total_load),
    power_capacity_w: asNullableNumber(st.power_capacity_w || st.max_power),
    network_port_capacity: asNullableNumber(st.network_port_capacity),
    department: dept ? { id: asNumber(dept.id), name: asString(dept.name) } : null,
    group: grp ? { id: asNumber(grp.id), name: asString(grp.name) } : null,
    primary_owner: toUserRef(owner),
    lifecycle_status: mapChoice<LifecycleStatus>(st.lifecycle_status, 'in_service', 'In service'),
    access_policy: mapChoice<AccessPolicy>(st.access_policy, 'open', 'Open'),
    condition: mapChoice<Condition>(st.condition, 'operational', 'Operational'),
    availability: mapAvailability(st.availability),
    activity_status: mapChoice<ActivityStatus>(st.activity_status, 'idle', 'Idle'),
    status: normalizeSpaceStatus(st.status) || normalizeSpaceStatus(currentStatus?.status_type) || normalizeSpaceStatus(currentStatus?.status) || null,
    current_status: currentStatus
      ? {
          id: asNumber(currentStatus.id),
          status_type: asNullableString(currentStatus.status_type) ?? undefined,
          status_data: isRecord(currentStatus.status_data) ? currentStatus.status_data : undefined,
          created: asString(currentStatus.created, new Date().toISOString()),
        }
      : null,
    label: asString(st.label),
    remark: asNullableString(st.remark),
    bench_count: asNullableNumber(st.active_bench_count ?? st.bench_count) ?? rawBenches.length,
    active_bench_count: asNullableNumber(st.active_bench_count),
    bench_capacity: asNullableNumber(st.bench_capacity),
    allocated_power_w: asNullableNumber(st.allocated_power_w),
    available_power_w: asNullableNumber(st.available_power_w),
    temperature: asNullableNumber(st.temperature),
    humidity: asNullableNumber(st.humidity),
    power_usage: asNullableNumber(st.power_usage),
    image: asNullableString(st.image_url ?? st.image),
    location: asNullableString(st.location),
    location_string: asNullableString(st.location_path || st.location_string || st.location),
    slots: Array.isArray(st.slots)
      ? st.slots.map((s: unknown) => {
          const slot = isRecord(s) ? s : {};
          return {
            id: asNumber(slot.id),
            slot_code: asString(slot.slot_code),
            label: asNullableString(slot.label),
            service_status: asNullableString(slot.service_status) ?? undefined,
            occupied: Boolean(slot.is_occupied),
          };
        })
      : undefined,
  };
}

export function mapStationListApiResponse(response: unknown): IStationListResponse {
  const envelope = isRecord(response) ? response : {};
  const data = envelope.data ?? envelope;

  if (Array.isArray(data)) {
    return {
      total_count: data.length,
      data: data.map(mapStationApiItem),
    };
  }

  const dataRec = isRecord(data) ? data : {};
  const results = Array.isArray(dataRec.results) ? dataRec.results : [];
  const meta = isRecord(envelope.meta) ? envelope.meta : {};
  const pagination = isRecord(meta.pagination) ? meta.pagination : {};

  return {
    total_count: asNumber(pagination.count, asNumber(dataRec.total_count, results.length)),
    data: results.map(mapStationApiItem),
  };
}

export function mapStationDetailApiResponse(response: unknown): IStation {
  const envelope = isRecord(response) ? response : {};
  const data = envelope.data ?? envelope;
  return mapStationApiItem(data);
}

export function mapStationWritePayload(payload: IStationPayload): Record<string, unknown> {
  return {
    sku: payload.sku,
    name: payload.name,
    room_id: payload.room_id,
    slot_id: payload.slot_id,
    power_reserved_w: payload.power_reserved_w,
    width_mm: payload.width_mm,
    depth_mm: payload.depth_mm,
    height_mm: payload.height_mm,
    max_load_kg: payload.max_load_kg,
    power_capacity_w: payload.power_capacity_w,
    network_port_capacity: payload.network_port_capacity,
    bench_capacity: payload.bench_capacity,
    department: payload.department,
    group: payload.group,
    owner: payload.owner,
    label: payload.label,
    remark: payload.remark,
    current_status: payload.current_status,
  };
}
