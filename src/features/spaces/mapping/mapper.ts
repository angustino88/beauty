import type {
  MappingBenchRef,
  MappingEquipmentCategory,
  MappingEquipmentItem,
  MappingLicenseItem,
  MappingRoomRef,
  MappingRoomSlotRef,
  MappingStationRef,
  MappingStationSlotRef,
  ResourceMappingListResponse,
  ResourceMappingRow,
  ResourceMappingStatus,
} from "./types";

interface RawRecord {
  [key: string]: unknown;
}

const asRecord = (v: unknown): RawRecord =>
  v && typeof v === "object" && !Array.isArray(v) ? (v as RawRecord) : {};

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

export function mapResourceMappingDataToRows(rawData: unknown): ResourceMappingRow[] {
  const envelope = asRecord(rawData);
  const data = asRecord(envelope.data ?? envelope);

  const rawRooms = Array.isArray(data.rooms) ? data.rooms : [];
  const rawRoomSlots = Array.isArray(data.room_slots) ? data.room_slots : [];
  const rawStations = Array.isArray(data.stations) ? data.stations : [];
  const rawStationSlots = Array.isArray(data.station_slots) ? data.station_slots : [];
  const rawBenches = Array.isArray(data.benches) ? data.benches : [];
  const rawEquipment = Array.isArray(data.equipment) ? data.equipment : [];
  const rawLicenses = Array.isArray(data.licenses) ? data.licenses : [];
  const rawLicenseAssignments = Array.isArray(data.license_assignments)
    ? data.license_assignments
    : [];

  const roomsById = new Map<number, MappingRoomRef>();
  for (const item of rawRooms) {
    const r = asRecord(item);
    const id = asNumber(r.id);
    if (!id) continue;
    roomsById.set(id, {
      id,
      uid: asNullableString(r.uid) ?? undefined,
      sku: asString(r.sku),
      name: asString(r.name),
      layout_rows: asNullableNumber(r.layout_rows),
      layout_columns: asNullableNumber(r.layout_columns),
      location: asNullableString(r.location),
      status: asNullableString(asRecord(r.status).label ?? r.status),
    });
  }

  const roomSlotsById = new Map<number, MappingRoomSlotRef>();
  for (const item of rawRoomSlots) {
    const s = asRecord(item);
    const id = asNumber(s.id);
    if (!id) continue;
    roomSlotsById.set(id, {
      id,
      room_id: asNumber(s.room_id),
      row_index: asNumber(s.row_index),
      col_index: asNumber(s.col_index),
      slot_code: asString(s.slot_code),
      x_mm: asNullableNumber(s.x_mm),
      y_mm: asNullableNumber(s.y_mm),
      width_mm: asNullableNumber(s.width_mm),
      depth_mm: asNullableNumber(s.depth_mm),
      orientation_degrees: asNullableNumber(s.orientation_degrees) ?? undefined,
    });
  }

  const stationsById = new Map<number, MappingStationRef>();
  for (const item of rawStations) {
    const st = asRecord(item);
    const id = asNumber(st.id);
    if (!id) continue;
    stationsById.set(id, {
      id,
      uid: asNullableString(st.uid) ?? undefined,
      sku: asString(st.sku),
      name: asString(st.name),
      room_id: asNullableNumber(st.room_id),
      slot_id: asNullableNumber(st.slot_id),
      status: asNullableString(asRecord(st.status).label ?? st.status),
    });
  }

  const stationSlotsById = new Map<number, MappingStationSlotRef>();
  for (const item of rawStationSlots) {
    const ss = asRecord(item);
    const id = asNumber(ss.id);
    if (!id) continue;
    stationSlotsById.set(id, {
      id,
      station_id: asNumber(ss.station_id),
      position_index: asNumber(ss.position_index),
      slot_code: asString(ss.slot_code),
      label: asNullableString(ss.label) ?? undefined,
    });
  }

  const licensesById = new Map<number, { id: number; uid?: string; sku: string; name: string; category?: { id: number; name: string | null } }>();
  for (const item of rawLicenses) {
    const lic = asRecord(item);
    const id = asNumber(lic.id);
    if (!id) continue;
    const cat = asRecord(lic.category);
    licensesById.set(id, {
      id,
      uid: asNullableString(lic.uid) ?? undefined,
      sku: asString(lic.sku),
      name: asString(lic.name),
      category: cat.id != null ? { id: asNumber(cat.id), name: asNullableString(cat.name) } : undefined,
    });
  }

  const licensesByEquipmentId = new Map<number, MappingLicenseItem[]>();
  for (const item of rawLicenseAssignments) {
    const assign = asRecord(item);
    const eqId = asNumber(assign.equipment_id);
    const licId = asNumber(assign.license_id);
    if (!eqId || !licId) continue;
    const lic = licensesById.get(licId);
    if (!lic) continue;
    const licItem: MappingLicenseItem = {
      id: lic.id,
      uid: lic.uid,
      sku: lic.sku,
      name: lic.name,
      category: lic.category,
      equipment_id: eqId,
      assigned_at: asNullableString(assign.assigned_at) ?? undefined,
    };
    const list = licensesByEquipmentId.get(eqId) ?? [];
    list.push(licItem);
    licensesByEquipmentId.set(eqId, list);
  }

  const equipmentByBenchId = new Map<number, MappingEquipmentItem[]>();
  for (const item of rawEquipment) {
    const eq = asRecord(item);
    const id = asNumber(eq.id);
    const benchId = asNullableNumber(eq.bench_id);
    if (!id) continue;
    const cat = asRecord(eq.category);
    const assignment = asRecord(eq.bench_assignment);
    const category: MappingEquipmentCategory = {
      id: asNumber(cat.id, 0),
      name: asString(cat.name, "Uncategorized"),
    };
    const eqItem: MappingEquipmentItem = {
      id,
      uid: asNullableString(eq.uid) ?? undefined,
      sku: asString(eq.sku),
      name: asString(eq.name),
      category,
      bench_id: benchId,
      role: asNullableString(assignment.role) ?? undefined,
      position: asNullableNumber(assignment.position) ?? undefined,
      is_monitored: typeof assignment.monitor === "boolean" ? assignment.monitor : undefined,
      assigned_at: asNullableString(assignment.assigned_at) ?? undefined,
      display_status: eq.display_status && typeof eq.display_status === "object"
        ? {
            value: asNullableString(asRecord(eq.display_status).value) ?? undefined,
            label: asNullableString(asRecord(eq.display_status).label) ?? undefined,
          }
        : asNullableString(eq.display_status),
      remark: asNullableString(eq.remark),
    };

    if (benchId != null) {
      const list = equipmentByBenchId.get(benchId) ?? [];
      list.push(eqItem);
      equipmentByBenchId.set(benchId, list);
    }
  }

  const rows: ResourceMappingRow[] = [];

  for (const item of rawBenches) {
    const b = asRecord(item);
    const id = asNumber(b.id);
    if (!id) continue;

    const benchRef: MappingBenchRef = {
      id,
      uid: asNullableString(b.uid) ?? undefined,
      sku: asString(b.sku),
      name: asString(b.name),
      setup_location_id: asNullableNumber(b.setup_location_id),
      station_slot_id: asNullableNumber(b.station_slot_id),
      status: asNullableString(asRecord(b.status).label ?? b.status),
      remark: asNullableString(b.remark),
      criticality: asNullableString(b.criticality),
      requested_power_w: asNullableNumber(b.requested_power_w),
      requested_load_kg: asNullableNumber(b.requested_load_kg),
      requested_cooling_w: asNullableNumber(b.requested_cooling_w),
      required_utilities: Array.isArray(b.required_utilities)
        ? b.required_utilities.map((utility) => String(utility))
        : asNullableString(b.required_utilities),
    };

    const stationSlot = benchRef.station_slot_id
      ? stationSlotsById.get(benchRef.station_slot_id) ?? null
      : null;

    const stationId = stationSlot?.station_id ?? benchRef.setup_location_id ?? null;
    const station = stationId ? stationsById.get(stationId) ?? null : null;

    const roomSlot = station?.slot_id ? roomSlotsById.get(station.slot_id) ?? null : null;
    const roomId = station?.room_id ?? roomSlot?.room_id ?? null;
    const room = roomId ? roomsById.get(roomId) ?? null : null;

    const equipmentList = equipmentByBenchId.get(id) ?? [];
    const licenseList: MappingLicenseItem[] = [];
    for (const eq of equipmentList) {
      const eqLicenses = licensesByEquipmentId.get(eq.id) ?? [];
      licenseList.push(...eqLicenses);
    }

    const hasStation = Boolean(station);
    const hasRoom = Boolean(room);
    const isFullyMapped = hasStation && hasRoom && equipmentList.length > 0;

    const status: ResourceMappingStatus = {
      is_fully_mapped: isFullyMapped,
      has_station: hasStation,
      has_room: hasRoom,
      equipment_count: equipmentList.length,
      license_count: licenseList.length,
    };

    rows.push({
      id,
      bench: benchRef,
      station,
      station_slot: stationSlot,
      room,
      room_slot: roomSlot,
      equipment: equipmentList,
      licenses: licenseList,
      status,
      remark: asNullableString(b.remark),
    });
  }

  return rows;
}

export function mapBenchToMappingRow(benchRaw: unknown): ResourceMappingRow {
  const b = asRecord(benchRaw);
  const id = asNumber(b.id);

  const benchRef: MappingBenchRef = {
    id,
    uid: asNullableString(b.uid) ?? undefined,
    sku: asString(b.sku),
    name: asString(b.name),
    setup_location_id: asNullableNumber(b.setup_location_id),
    station_slot_id: asNullableNumber(b.station_slot_id),
    status: asNullableString(asRecord(b.status).label ?? b.status),
    remark: asNullableString(b.remark),
    criticality: asNullableString(b.criticality),
    requested_power_w: asNullableNumber(b.requested_power_w),
    requested_load_kg: asNullableNumber(b.requested_load_kg),
    requested_cooling_w: asNullableNumber(b.requested_cooling_w),
    required_utilities: Array.isArray(b.required_utilities)
      ? b.required_utilities.map((utility) => String(utility))
      : asNullableString(b.required_utilities),
  };

  const rawStation = asRecord(b.station);
  const stationId = asNullableNumber(rawStation.id) ?? benchRef.setup_location_id;
  const station: MappingStationRef | null = stationId
    ? {
        id: stationId,
        uid: asNullableString(rawStation.uid) ?? undefined,
        sku: asString(rawStation.sku),
        name: asString(rawStation.name || rawStation.station_name),
        room_id: asNullableNumber(rawStation.room_id),
        slot_id: asNullableNumber(rawStation.slot_id),
        status: asNullableString(asRecord(rawStation.status).label ?? rawStation.status),
      }
    : null;

  const rawStationSlot = asRecord(b.station_slot);
  const stationSlotId = asNullableNumber(rawStationSlot.id) ?? benchRef.station_slot_id;
  const stationSlot: MappingStationSlotRef | null = stationSlotId
    ? {
        id: stationSlotId,
        station_id: asNumber(rawStationSlot.station_id || station?.id),
        position_index: asNumber(rawStationSlot.position_index),
        slot_code: asString(rawStationSlot.slot_code),
        label: asNullableString(rawStationSlot.label) ?? undefined,
      }
    : null;

  const rawRoom = asRecord(b.room);
  const roomId = asNullableNumber(rawRoom.id) ?? station?.room_id;
  const room: MappingRoomRef | null = roomId
    ? {
        id: roomId,
        uid: asNullableString(rawRoom.uid) ?? undefined,
        sku: asString(rawRoom.sku),
        name: asString(rawRoom.name || rawRoom.room_name),
        location: asNullableString(rawRoom.location),
        status: asNullableString(asRecord(rawRoom.status).label ?? rawRoom.status),
      }
    : null;

  const rawRoomSlot = asRecord(b.room_slot);
  const roomSlotId = asNullableNumber(rawRoomSlot.id) ?? station?.slot_id;
  const roomSlot: MappingRoomSlotRef | null = roomSlotId
    ? {
        id: roomSlotId,
        room_id: asNumber(rawRoomSlot.room_id || room?.id),
        row_index: asNumber(rawRoomSlot.row_index),
        col_index: asNumber(rawRoomSlot.col_index),
        slot_code: asString(rawRoomSlot.slot_code),
      }
    : null;

  const rawEquipment = Array.isArray(b.equipment)
    ? b.equipment
    : Array.isArray(b.equipment_list)
      ? b.equipment_list
      : [];

  const equipment: MappingEquipmentItem[] = rawEquipment.map((item) => {
    const eq = asRecord(item);
    const cat = asRecord(eq.category);
    return {
      id: asNumber(eq.id),
      uid: asNullableString(eq.uid) ?? undefined,
      sku: asString(eq.sku),
      name: asString(eq.name),
      category: {
        id: asNumber(cat.id, 0),
        name: asString(cat.name, "Uncategorized"),
      },
      bench_id: id,
      role: asNullableString(eq.role) ?? undefined,
      position: asNullableNumber(eq.position) ?? undefined,
      is_monitored: typeof eq.monitor === "boolean" ? eq.monitor : undefined,
      assigned_at: asNullableString(eq.assigned_at) ?? undefined,
      display_status: eq.display_status && typeof eq.display_status === "object"
        ? {
            value: asNullableString(asRecord(eq.display_status).value) ?? undefined,
            label: asNullableString(asRecord(eq.display_status).label) ?? undefined,
          }
        : asNullableString(eq.display_status),
      remark: asNullableString(eq.remark),
    };
  });

  const rawLicenses = Array.isArray(b.licenses)
    ? b.licenses
    : Array.isArray(b.license_list)
      ? b.license_list
      : [];

  const licenses: MappingLicenseItem[] = rawLicenses.map((item) => {
    const lic = asRecord(item);
    const cat = asRecord(lic.category);
    return {
      id: asNumber(lic.id),
      uid: asNullableString(lic.uid) ?? undefined,
      sku: asString(lic.sku),
      name: asString(lic.name),
      category: cat.id != null ? { id: asNumber(cat.id), name: asNullableString(cat.name) } : undefined,
      equipment_id: asNumber(lic.equipment_id),
      assigned_at: asNullableString(lic.assigned_at) ?? undefined,
    };
  });

  const equipmentCount = asNullableNumber(b.equipment_count) ?? equipment.length;
  const hasStation = Boolean(station);
  const hasRoom = Boolean(room);
  const isFullyMapped = hasStation && hasRoom && equipmentCount > 0;

  const status: ResourceMappingStatus = {
    is_fully_mapped: isFullyMapped,
    has_station: hasStation,
    has_room: hasRoom,
    equipment_count: equipmentCount,
    license_count: licenses.length,
  };

  return {
    id,
    bench: benchRef,
    station,
    station_slot: stationSlot,
    room,
    room_slot: roomSlot,
    equipment,
    licenses,
    status,
    remark: asNullableString(b.remark),
  };
}

export function mapResourceMappingListResponse(raw: unknown): ResourceMappingListResponse {
  const envelope = asRecord(raw);
  const data = envelope.data ?? envelope;

  if (data && typeof data === "object" && "benches" in (data as RawRecord)) {
    const rows = mapResourceMappingDataToRows(data);
    const meta = asRecord(envelope.meta);
    const pagination = asRecord(meta.pagination);
    const totalCount = asNumber(pagination.count, rows.length);
    return { total_count: totalCount, data: rows };
  }

  const items = Array.isArray(data)
    ? data
    : Array.isArray((data as RawRecord).results)
      ? ((data as RawRecord).results as unknown[])
      : [];

  const rows = items.map(mapBenchToMappingRow);
  const meta = asRecord(envelope.meta);
  const pagination = asRecord(meta.pagination);
  const totalCount = asNumber(pagination.count, asNumber(envelope.total_count, rows.length));

  return { total_count: totalCount, data: rows };
}
