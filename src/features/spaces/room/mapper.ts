import type { IRoom, IRoomListResponse, IRoomPayload } from './types';
import { normalizeSpaceStatus } from '../shared/spaceStatus.ts';
import {
  mapAvailability,
  mapChoice,
  type AccessPolicy,
  type ActivityStatus,
  type Condition,
  type LifecycleStatus,
} from '../shared/resourceStatus.ts';
import { toUserRef } from '../../../shared/utils/userRef.ts';

export type RoomWriteApiPayload = Record<string, unknown>;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

/** `{id, name}` relation (or null). */
const relation = (value: unknown): { id: number; name: string } | null =>
  isRecord(value) ? { id: Number(value.id) || 0, name: String(value.name ?? '') } : null;

const toNumber = (value: unknown): number | null => {
  if (value == null || value === '') return null;
  const n = Number(value);
  return Number.isNaN(n) ? null : n;
};

// The API sends relations (`country`, `city`, `building`, `owner`), `layout_rows` / `layout_columns`,
// `length_m` / `width_m` / `area_m2` and `power_capacity_w`; the table reads the UI's own names.
export function mapRoomApiItem(raw: unknown): IRoom {
  const room = isRecord(raw) ? raw : {};
  const country = relation(room.country);
  const city = relation(room.city);
  const building = relation(room.building);
  const floor = room.floor != null && room.floor !== '' ? String(room.floor) : null;

  return {
    id: (room.id as number) ?? 0,
    sku: (room.sku as string) ?? '',
    name: (room.name as string) ?? '',
    location: (room.map_url as string) || null,
    country: country?.name ?? null,
    location_info: {
      location_string: (room.location_path as string) || null,
      floor,
      label: (room.label as string) || null,
      country,
      city,
      building,
    } as unknown as IRoom['location_info'],
    // Stations are not part of the room payload; the room's own capacity is.
    rack_list: [],
    setup_capacity: (room.slot_capacity as number) ?? 0,
    rows: (room.layout_rows as number) ?? null,
    cols: (room.layout_columns as number) ?? null,
    slot_summary: undefined,
    length: toNumber(room.length_m),
    width: toNumber(room.width_m),
    floor,
    size: room.area_m2 == null ? null : String(room.area_m2),
    temperature: 0,
    humidity: 0,
    max_power: (room.power_capacity_w as number) ?? 0,
    power_usage: 0,
    label: (room.label as string) ?? '',
    primary_owner: toUserRef(room.owner),
    lifecycle_status: mapChoice<LifecycleStatus>(room.lifecycle_status, 'in_service', 'In service'),
    access_policy: mapChoice<AccessPolicy>(room.access_policy, 'open', 'Open'),
    condition: mapChoice<Condition>(room.condition, 'operational', 'Operational'),
    availability: mapAvailability(room.availability),
    activity_status: mapChoice<ActivityStatus>(room.activity_status, 'idle', 'Idle'),
    current_status: null,
    status: normalizeSpaceStatus(room.status) || null,
    lab_audit: null,
    remark: (room.remark as string) ?? null,
    image: (room.image_url ?? room.image ?? null) as string | null,
  };
}

export function mapRoomListApiResponse(response: unknown): IRoomListResponse {
  const envelope = isRecord(response) ? response : {};
  const data = envelope.data;

  if (Array.isArray(data)) {
    return {
      total_count: data.length,
      data: data.map(mapRoomApiItem),
    };
  }

  const dataRec = isRecord(data) ? data : {};
  const results = Array.isArray(dataRec.results) ? dataRec.results : [];
  return {
    total_count: (dataRec.total_count as number) ?? (dataRec.count as number) ?? results.length,
    data: results.map(mapRoomApiItem),
  };
}

export function mapRoomDetailApiResponse(response: unknown): IRoom {
  const envelope = isRecord(response) ? response : {};
  const data = envelope.data ?? envelope;
  return mapRoomApiItem(data);
}

export function mapRoomWritePayload(payload: IRoomPayload): RoomWriteApiPayload {
  const body: RoomWriteApiPayload = {};
  const fields: Array<[keyof IRoomPayload, string]> = [
    ["sku", "sku"],
    ["name", "name"],
    ["label", "label"],
    ["remark", "remark"],
    ["location", "map_url"],
    ["length", "length_m"],
    ["width", "width_m"],
    ["country", "country_id"],
    ["city", "city_id"],
    ["building", "building_id"],
    ["floor", "floor"],
    ["rows", "layout_rows"],
    ["cols", "layout_columns"],
  ];

  for (const [source, target] of fields) {
    const value = payload[source];
    if (value !== undefined) {
      body[target] = (source === "length" || source === "width") && value !== null
        ? String(value)
        : value;
    }
  }

  // Inline edit also sends the table's own names for capacity and owner.
  const draft = payload as Record<string, unknown>;
  if (draft.max_power !== undefined) body.power_capacity_w = draft.max_power;
  if (draft.primary_owner !== undefined) body.owner_id = draft.primary_owner;

  return body;
}
