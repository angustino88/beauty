import type {
  MappingBenchRef,
  MappingEquipmentItem,
  MappingLicenseItem,
  MappingRoomRef,
  MappingRoomSlotRef,
  MappingState,
  MappingStationRef,
  MappingStationSlotRef,
  MappingSummary,
  ResourceMappingListResponse,
  ResourceMappingRow,
} from "./types";

interface RawRecord {
  [key: string]: unknown;
}

const asRecord = (v: unknown): RawRecord =>
  v && typeof v === "object" && !Array.isArray(v) ? (v as RawRecord) : {};

const asList = (v: unknown): RawRecord[] => (Array.isArray(v) ? v.map(asRecord) : []);

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

const asOptionalString = (v: unknown): string | undefined =>
  v != null && v !== "" ? String(v) : undefined;

const byId = <T extends { id: number }>(items: T[]) => new Map(items.map((item) => [item.id, item]));

/** Mapping completeness, the same rule as the server's `mapping_state`. */
export const mappingState = (hasRoom: boolean, equipmentCount: number): MappingState =>
  !hasRoom ? "needs_placement" : equipmentCount === 0 ? "needs_equipment" : "fully_mapped";

/**
 * Join the flat collections of a mapping read (`data.rooms`, `data.stations`, `data.benches`, …) into one row per
 * bench, in the order of `data.benches`. Used by the bench mapping list and the per-resource mapping reads.
 */
export function mapResourceMappingDataToRows(rawData: unknown): ResourceMappingRow[] {
  const envelope = asRecord(rawData);
  const data = asRecord(envelope.data ?? envelope);

  const rooms = byId(asList(data.rooms).filter((r) => asNumber(r.id)).map((r): MappingRoomRef => ({
    id: asNumber(r.id),
    uid: asOptionalString(r.uid),
    sku: asString(r.sku),
    name: asString(r.name),
    image_url: asOptionalString(r.image_url) ?? null,
    layout_rows: asNullableNumber(r.layout_rows),
    layout_columns: asNullableNumber(r.layout_columns),
  })));
  const roomSlots = byId(asList(data.room_slots).filter((s) => asNumber(s.id)).map((s): MappingRoomSlotRef => ({
    id: asNumber(s.id),
    room_id: asNumber(s.room_id),
    row_index: asNumber(s.row_index),
    col_index: asNumber(s.col_index),
    slot_code: asString(s.slot_code),
    x_mm: asNullableNumber(s.x_mm),
    y_mm: asNullableNumber(s.y_mm),
    width_mm: asNullableNumber(s.width_mm),
    depth_mm: asNullableNumber(s.depth_mm),
    orientation_degrees: asNullableNumber(s.orientation_degrees) ?? undefined,
  })));
  const stations = byId(asList(data.stations).filter((s) => asNumber(s.id)).map((s): MappingStationRef => ({
    id: asNumber(s.id),
    uid: asOptionalString(s.uid),
    sku: asString(s.sku),
    name: asString(s.name),
    image_url: asOptionalString(s.image_url) ?? null,
    room_id: asNullableNumber(s.room_id),
    slot_id: asNullableNumber(s.slot_id),
  })));
  const stationSlots = byId(asList(data.station_slots).filter((s) => asNumber(s.id)).map((s): MappingStationSlotRef => ({
    id: asNumber(s.id),
    station_id: asNumber(s.station_id),
    position_index: asNumber(s.position_index),
    slot_code: asString(s.slot_code),
    label: asOptionalString(s.label),
  })));
  const licenses = byId(asList(data.licenses).filter((l) => asNumber(l.id)).map((l) => {
    const category = asRecord(l.category);
    return {
      id: asNumber(l.id),
      uid: asOptionalString(l.uid),
      sku: asString(l.sku),
      name: asString(l.name),
      category: category.id != null ? { id: asNumber(category.id), name: asOptionalString(category.name) ?? null } : null,
    };
  }));

  const licensesByEquipment = new Map<number, MappingLicenseItem[]>();
  for (const assignment of asList(data.license_assignments)) {
    const equipmentId = asNumber(assignment.equipment_id);
    const license = licenses.get(asNumber(assignment.license_id));
    if (!equipmentId || !license) continue;
    const list = licensesByEquipment.get(equipmentId) ?? [];
    list.push({ ...license, equipment_id: equipmentId, assigned_at: asOptionalString(assignment.assigned_at) });
    licensesByEquipment.set(equipmentId, list);
  }

  const equipmentByBench = new Map<number, MappingEquipmentItem[]>();
  for (const eq of asList(data.equipment)) {
    const id = asNumber(eq.id);
    const benchId = asNullableNumber(eq.bench_id);
    if (!id || benchId == null) continue;
    const category = asRecord(eq.category);
    const assignment = asRecord(eq.bench_assignment);
    const list = equipmentByBench.get(benchId) ?? [];
    list.push({
      id,
      uid: asOptionalString(eq.uid),
      sku: asString(eq.sku),
      name: asString(eq.name),
      image_url: asOptionalString(eq.image_url) ?? null,
      category: { id: asNumber(category.id), name: asString(category.name, "Uncategorized") || "Uncategorized" },
      bench_id: benchId,
      role: asOptionalString(assignment.role),
      position: asNullableNumber(assignment.position) ?? undefined,
      is_monitored: typeof assignment.is_monitored === "boolean" ? assignment.is_monitored : undefined,
      assigned_at: asOptionalString(assignment.assigned_at),
    });
    equipmentByBench.set(benchId, list);
  }
  for (const list of equipmentByBench.values()) {
    list.sort((a, b) => (a.position ?? 0) - (b.position ?? 0) || a.sku.localeCompare(b.sku));
  }

  return asList(data.benches)
    .filter((b) => asNumber(b.id))
    .map((b): ResourceMappingRow => {
      const bench: MappingBenchRef = {
        id: asNumber(b.id),
        uid: asOptionalString(b.uid),
        sku: asString(b.sku),
        name: asString(b.name),
        image_url: asOptionalString(b.image_url) ?? null,
        setup_location_id: asNullableNumber(b.setup_location_id),
        station_slot_id: asNullableNumber(b.station_slot_id),
      };
      const stationSlot = bench.station_slot_id ? stationSlots.get(bench.station_slot_id) ?? null : null;
      const stationId = stationSlot?.station_id ?? bench.setup_location_id ?? null;
      const station = stationId ? stations.get(stationId) ?? null : null;
      const roomSlot = station?.slot_id ? roomSlots.get(station.slot_id) ?? null : null;
      const roomId = station?.room_id ?? roomSlot?.room_id ?? null;
      const room = roomId ? rooms.get(roomId) ?? null : null;
      const equipment = equipmentByBench.get(bench.id) ?? [];
      const benchLicenses = equipment.flatMap((item) => licensesByEquipment.get(item.id) ?? []);
      const state = mappingState(Boolean(room), equipment.length);
      return {
        id: bench.id,
        bench,
        station,
        station_slot: stationSlot,
        room,
        room_slot: roomSlot,
        equipment,
        licenses: benchLicenses,
        status: {
          state,
          is_fully_mapped: state === "fully_mapped",
          has_station: Boolean(station),
          has_room: Boolean(room),
          equipment_count: equipment.length,
          license_count: benchLicenses.length,
        },
      };
    });
}

const EMPTY_SUMMARY: MappingSummary = {
  benches: 0,
  fully_mapped: 0,
  needs_equipment: 0,
  needs_placement: 0,
  equipment: 0,
};

/** GET /api/labs/resource-mappings → rows of the page, the filtered total and the summary. */
export function mapBenchMappingList(raw: unknown): ResourceMappingListResponse {
  const envelope = asRecord(raw);
  const meta = asRecord(envelope.meta);
  const pagination = asRecord(meta.pagination);
  const summary = asRecord(meta.summary);
  const rows = mapResourceMappingDataToRows(envelope);
  return {
    total_count: asNumber(pagination.count, rows.length),
    data: rows,
    summary: Object.fromEntries(
      Object.keys(EMPTY_SUMMARY).map((key) => [key, asNumber(summary[key])]),
    ) as unknown as MappingSummary,
  };
}
