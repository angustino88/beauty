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

export type RoomWriteApiPayload = Record<string, unknown>;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const nullableText = (value: unknown): string | null => {
  if (typeof value === 'string') return value;
  if (typeof value === 'number') return String(value);
  return null;
};

const mapLabAudit = (audit: unknown): IRoom['lab_audit'] => {
  if (!isRecord(audit)) return null;
  return {
    audit_id: nullableText(audit.audit_id),
    auditor: nullableText(audit.auditor),
    audited_at: nullableText(audit.audited_at),
    audit_status: nullableText(audit.audit_status),
    remarks: nullableText(audit.remarks),
  };
};

export function mapRoomApiItem(raw: unknown): IRoom {
  const room = isRecord(raw) ? raw : {};
  const locationInfo = isRecord(room.location_info) ? room.location_info : {};
  const currentStatus = isRecord(room.current_status) ? room.current_status : null;
  const racks = Array.isArray(room.rack_list) ? room.rack_list : [];

  return {
    id: (room.id as number) ?? 0,
    sku: (room.sku as string) ?? '',
    name: (room.name as string) ?? '',
    location: (room.location as string) ?? (locationInfo.location_string as string) ?? null,
    country: (locationInfo.country as { name?: string })?.name ?? null,
    location_info: locationInfo as unknown as IRoom['location_info'],
    rack_list: racks.map((rack) => {
      const r = isRecord(rack) ? rack : {};
      return {
        id: (r.id as number) ?? 0,
        sku: (r.sku as string) ?? '',
        name: (r.rack_name || r.name || '') as string,
      };
    }),
    setup_capacity: (room.setup_capacity as number) ?? 0,
    rows: (room.rows as number) ?? null,
    cols: (room.cols as number) ?? null,
    slot_summary: room.slot_summary as IRoom['slot_summary'],
    length: (room.length as number) ?? null,
    width: (room.width as number) ?? null,
    floor: room.floor != null ? String(room.floor) : locationInfo.floor != null ? String(locationInfo.floor) : null,
    size: room.size === null ? null : String(room.size ?? ''),
    temperature: (room.temperature as number) ?? 0,
    humidity: (room.humidity as number) ?? 0,
    max_power: (room.max_power as number) ?? 0,
    power_usage: (room.power_usage as number) ?? 0,
    label: (room.label as string) ?? '',
    primary_owner: room.primary_owner as IRoom['primary_owner'],
    lifecycle_status: mapChoice<LifecycleStatus>(room.lifecycle_status, 'in_service', 'In service'),
    access_policy: mapChoice<AccessPolicy>(room.access_policy, 'open', 'Open'),
    condition: mapChoice<Condition>(room.condition, 'operational', 'Operational'),
    availability: mapAvailability(room.availability),
    activity_status: mapChoice<ActivityStatus>(room.activity_status, 'idle', 'Idle'),
    current_status: currentStatus
      ? {
          id: (currentStatus.id as number) ?? 0,
          status_type: (currentStatus.status_type as string) ?? undefined,
          status_data: isRecord(currentStatus.status_data) ? currentStatus.status_data : undefined,
          created: (currentStatus.created as string) ?? new Date().toISOString(),
        }
      : null,
    status: normalizeSpaceStatus(room.status) || normalizeSpaceStatus(currentStatus?.status_type) || normalizeSpaceStatus(currentStatus?.status) || null,
    lab_audit: mapLabAudit(room.lab_audit),
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

  return body;
}
