import test from "node:test";
import assert from "node:assert/strict";
import {
  mapResourceMappingDataToRows,
  mapBenchToMappingRow,
  mapResourceMappingListResponse,
} from "./mapper.ts";

test("mapResourceMappingDataToRows maps OpenAPI ResourceMappingData graph into ResourceMappingRow hierarchy", () => {
  const backendData = {
    rooms: [
      {
        id: 1,
        uid: "room-uuid-1",
        sku: "RM-101",
        name: "Main Lab Room",
        layout_rows: 5,
        layout_columns: 6,
        location: "Building A, 2nd Floor",
      },
    ],
    room_slots: [
      {
        id: 11,
        room_id: 1,
        row_index: 2,
        col_index: 3,
        slot_code: "R2-C3",
      },
    ],
    stations: [
      {
        id: 21,
        uid: "station-uuid-1",
        sku: "ST-01",
        name: "Station Alpha",
        room_id: 1,
        slot_id: 11,
      },
    ],
    station_slots: [
      {
        id: 31,
        station_id: 21,
        position_index: 1,
        slot_code: "SLOT-1",
        label: "Primary Slot",
      },
    ],
    benches: [
      {
        id: 101,
        uid: "bench-uuid-1",
        sku: "BN-001",
        name: "Bench #1",
        setup_location_id: 21,
        station_slot_id: 31,
        remark: "Active test bench",
        status: { value: "active", label: "Active" },
        criticality: "high",
        requested_power_w: 850,
        required_utilities: ["power", "network"],
      },
      {
        id: 102,
        uid: "bench-uuid-2",
        sku: "BN-002",
        name: "Bench #2 (Unplaced)",
        setup_location_id: null,
        station_slot_id: null,
      },
    ],
    equipment: [
      {
        id: 201,
        uid: "eq-uuid-1",
        sku: "PC-001",
        name: "Workstation Host",
        category: { id: 1, name: "Computing" },
        bench_id: 101,
        bench_assignment: {
          id: 1,
          role: "host",
          position: 1,
          monitor: true,
          assigned_at: "2026-11-04T10:00:00Z",
        },
      },
      {
        id: 202,
        uid: "eq-uuid-2",
        sku: "MON-001",
        name: "Dell UltraSharp",
        category: { id: 2, name: "Display" },
        bench_id: 101,
        bench_assignment: {
          id: 2,
          role: "primary_monitor",
          position: 2,
          monitor: false,
        },
      },
    ],
    licenses: [
      {
        id: 301,
        uid: "lic-uuid-1",
        sku: "LIC-MATLAB",
        name: "MATLAB 2026",
        category: { id: 10, name: "Engineering" },
      },
    ],
    license_assignments: [
      {
        id: 1,
        equipment_id: 201,
        license_id: 301,
        assigned_at: "2026-11-04T10:05:00Z",
      },
    ],
  };

  const rows = mapResourceMappingDataToRows({ data: backendData });

  assert.equal(rows.length, 2);

  // Bench 101 checks
  const b101 = rows.find((r) => r.id === 101);
  assert.ok(b101);
  assert.equal(b101.bench.sku, "BN-001");
  assert.equal(b101.bench.name, "Bench #1");
  assert.equal(b101.bench.status, "Active");
  assert.equal(b101.bench.remark, "Active test bench");
  assert.equal(b101.bench.criticality, "high");
  assert.equal(b101.bench.requested_power_w, 850);
  assert.deepEqual(b101.bench.required_utilities, ["power", "network"]);

  // Station & Slot
  assert.ok(b101.station);
  assert.equal(b101.station.id, 21);
  assert.equal(b101.station.sku, "ST-01");
  assert.ok(b101.station_slot);
  assert.equal(b101.station_slot.slot_code, "SLOT-1");

  // Room & Slot
  assert.ok(b101.room);
  assert.equal(b101.room.id, 1);
  assert.equal(b101.room.sku, "RM-101");
  assert.ok(b101.room_slot);
  assert.equal(b101.room_slot.slot_code, "R2-C3");

  // Equipment & Licenses
  assert.equal(b101.equipment.length, 2);
  const host = b101.equipment.find((e) => e.sku === "PC-001");
  assert.ok(host);
  assert.equal(host.category.name, "Computing");
  assert.equal(host.role, "host");
  assert.equal(host.is_monitored, true);

  assert.equal(b101.licenses.length, 1);
  assert.equal(b101.licenses[0].sku, "LIC-MATLAB");
  assert.equal(b101.licenses[0].equipment_id, 201);

  // Status
  assert.equal(b101.status.is_fully_mapped, true);
  assert.equal(b101.status.has_station, true);
  assert.equal(b101.status.has_room, true);
  assert.equal(b101.status.equipment_count, 2);
  assert.equal(b101.status.license_count, 1);

  // Bench 102 checks (unplaced)
  const b102 = rows.find((r) => r.id === 102);
  assert.ok(b102);
  assert.equal(b102.station, null);
  assert.equal(b102.station_slot, null);
  assert.equal(b102.room, null);
  assert.equal(b102.room_slot, null);
  assert.equal(b102.equipment.length, 0);
  assert.equal(b102.status.is_fully_mapped, false);
});

test("mapBenchToMappingRow maps a single bench record with nested station and equipment", () => {
  const benchPayload = {
    id: 88,
    sku: "BN-088",
    name: "Oscilloscope Station Bench",
    setup_location_id: 12,
    station: {
      id: 12,
      sku: "ST-012",
      name: "RF Station",
      room_id: 3,
    },
    station_slot: {
      id: 55,
      slot_code: "SLOT-B",
    },
    room: {
      id: 3,
      sku: "RM-003",
      name: "Anechoic Chamber",
      location: "Basement Lab",
    },
    equipment: [
      {
        id: 901,
        sku: "OSC-01",
        name: "Keysight DSO",
        category: { id: 7, name: "Instrument" },
        role: "analyzer",
        display_status: { value: "maintenance", label: "Maintenance" },
      },
    ],
    licenses: [
      {
        id: 401,
        sku: "LIC-KEYSIGHT",
        name: "Infiniium App",
        equipment_id: 901,
      },
    ],
  };

  const row = mapBenchToMappingRow(benchPayload);
  assert.equal(row.id, 88);
  assert.equal(row.bench.name, "Oscilloscope Station Bench");
  assert.equal(row.station?.sku, "ST-012");
  assert.equal(row.station_slot?.slot_code, "SLOT-B");
  assert.equal(row.room?.sku, "RM-003");
  assert.equal(row.equipment.length, 1);
  assert.equal(row.equipment[0].role, "analyzer");
  assert.deepEqual(row.equipment[0].display_status, { value: "maintenance", label: "Maintenance" });
  assert.equal(row.licenses.length, 1);
  assert.equal(row.status.is_fully_mapped, true);
});

test("mapResourceMappingListResponse handles pagination meta count", () => {
  const payload = {
    data: {
      benches: [{ id: 5, sku: "BN-5", name: "Bench 5" }],
      rooms: [],
      room_slots: [],
      stations: [],
      station_slots: [],
      equipment: [],
      licenses: [],
      license_assignments: [],
    },
    meta: {
      pagination: {
        count: 42,
        page: 1,
        page_size: 10,
      },
    },
  };

  const response = mapResourceMappingListResponse(payload);
  assert.equal(response.total_count, 42);
  assert.equal(response.data.length, 1);
  assert.equal(response.data[0].bench.sku, "BN-5");
});
