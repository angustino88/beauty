import type { IBench, IBenchListResponse } from "./types";
import { normalizeSpaceStatus } from "../shared/spaceStatus.ts";
import {
  mapAvailability,
  mapChoice,
  type ActivityStatus,
  type Condition,
  type LifecycleStatus,
} from "../shared/resourceStatus.ts";

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

export function mapBenchApiItem(raw: unknown): IBench {
  const b = isRecord(raw) ? raw : {};
  // `bench_group` is the bench's own group; `group` is the department resource group.
  const group = isRecord(b.bench_group) ? b.bench_group : null;
  const type = isRecord(b.type) ? b.type : isRecord(b.bench_type) ? b.bench_type : null;
  const dept = isRecord(b.department) ? b.department : null;
  const owner = isRecord(b.owner) ? b.owner : null;
  // The station a bench is set up on arrives as `setup_location` ({id, uid, name}); `station_slot` is its slot.
  const station = isRecord(b.setup_location) ? b.setup_location : isRecord(b.station) ? b.station : null;
  const stationSlot = isRecord(b.station_slot) ? b.station_slot : null;
  const room = isRecord(b.room) ? b.room : null;
  const currentStatus = isRecord(b.current_status) ? b.current_status : null;
  const status = isRecord(b.status) ? b.status : null;

  return {
    id: asNumber(b.id),
    uid: asNullableString(b.uid) ?? undefined,
    sku: asString(b.sku),
    name: asString(b.name || b.lab_name),
    bench_group: group ? { id: asNumber(group.id), name: asString(group.name || group.lab_group_name) } : null,
    bench_type: type ? { id: asNumber(type.id), name: asString(type.name) } : null,
    department: dept ? { id: asNumber(dept.id), name: asString(dept.name) } : null,
    owner: owner ? { id: asNumber(owner.id), name: asString(owner.name) } : null,
    primary_owner: owner ? { id: asNumber(owner.id), username: asString(owner.name), display_name: asString(owner.name) } : null,
    setup_location_id: station ? asNumber(station.id) : asNullableNumber(b.setup_location_id),
    station_slot_id: stationSlot ? asNumber(stationSlot.id) : asNullableNumber(b.station_slot_id),
    station_slot_name: stationSlot ? asNullableString(stationSlot.name) : null,
    location_path: asNullableString(b.setup_location_path),
    station: station ? { id: asNumber(station.id), sku: asString(station.sku || station.name), name: asString(station.name) } : null,
    room: room ? { id: asNumber(room.id), sku: asString(room.sku), name: asString(room.name) } : null,
    equipment_count: asNumber(b.equipment_count, 0),
    is_favorite: Boolean(b.is_favorite),
    lifecycle_status: mapChoice<LifecycleStatus>(b.lifecycle_status, 'in_service', 'In service'),
    condition: mapChoice<Condition>(b.condition, 'operational', 'Operational'),
    availability: mapAvailability(b.availability),
    activity_status: mapChoice<ActivityStatus>(b.activity_status, 'idle', 'Idle'),
    status: normalizeSpaceStatus(b.status) || normalizeSpaceStatus(currentStatus?.status_type) || normalizeSpaceStatus(currentStatus?.status) || null,
    status_label: typeof status?.label === 'string' ? status.label : null,
    current_status: currentStatus
      ? {
          id: asNumber(currentStatus.id),
          status_type: asNullableString(currentStatus.status_type) ?? undefined,
          status_data: isRecord(currentStatus.status_data) ? currentStatus.status_data : undefined,
          created: asString(currentStatus.created, new Date().toISOString()),
        }
      : null,
    remark: asNullableString(b.remark),
    image: asNullableString(b.image_url ?? b.image),
    location_name: asNullableString(b.location_name || b.location),
  };
}

export function mapBenchListApiResponse(response: unknown): IBenchListResponse {
  const envelope = isRecord(response) ? response : {};
  const data = envelope.data ?? envelope;

  if (Array.isArray(data)) {
    return {
      total_count: data.length,
      data: data.map(mapBenchApiItem),
    };
  }

  const dataRec = isRecord(data) ? data : {};
  const results = Array.isArray(dataRec.results) ? dataRec.results : [];
  const meta = isRecord(envelope.meta) ? envelope.meta : {};
  const pagination = isRecord(meta.pagination) ? meta.pagination : {};

  return {
    total_count: asNumber(pagination.count, asNumber(dataRec.total_count, results.length)),
    data: results.map(mapBenchApiItem),
  };
}

export function mapBenchDetailApiResponse(response: unknown): IBench {
  const envelope = isRecord(response) ? response : {};
  const data = envelope.data ?? envelope;
  return mapBenchApiItem(data);
}
