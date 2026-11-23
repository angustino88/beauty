import test from "node:test";
import assert from "node:assert/strict";
import { mapBenchMappingList, mapResourceMappingDataToRows, mapRoomMappingStations } from "./mapper.ts";

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
          is_monitored: true,
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
          is_monitored: false,
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
  assert.equal(b101.status.state, "fully_mapped");
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
  assert.equal(b102.status.state, "needs_placement");
  assert.equal(b102.status.is_fully_mapped, false);
});

test("mapResourceMappingDataToRows keeps the server bench order and orders units by position", () => {
  const rows = mapResourceMappingDataToRows({
    data: {
      benches: [
        { id: 9, sku: "BN-B", name: "B" },
        { id: 3, sku: "BN-A", name: "A" },
      ],
      equipment: [
        { id: 2, sku: "Z", name: "z", category: { id: 1, name: "Display" }, bench_id: 9, bench_assignment: { position: 2 } },
        { id: 1, sku: "Y", name: "y", category: null, bench_id: 9, bench_assignment: { position: 1 } },
      ],
    },
  });

  assert.deepEqual(rows.map((row) => row.bench.sku), ["BN-B", "BN-A"]);
  assert.deepEqual(rows[0].equipment.map((item) => item.sku), ["Y", "Z"]);
  assert.equal(rows[0].equipment[0].category.name, "Uncategorized");
  // A bench with units but no room still needs placement.
  assert.equal(rows[0].status.state, "needs_placement");
});

test("mapBenchMappingList reads the page rows, the filtered count and the summary", () => {
  const response = mapBenchMappingList({
    data: {
      rooms: [{ id: 1, sku: "RM-1", name: "Room" }],
      stations: [{ id: 2, sku: "ST-1", name: "Station", room_id: 1 }],
      benches: [{ id: 3, sku: "BN-1", name: "Bench", setup_location_id: 2 }],
      equipment: [],
      licenses: [],
      license_assignments: [],
    },
    meta: {
      pagination: { count: 42, page: 2, page_size: 1, next: null, previous: null },
      summary: { benches: 50, fully_mapped: 30, needs_equipment: 12, needs_placement: 8, equipment: 77 },
    },
  });

  assert.equal(response.total_count, 42);
  assert.equal(response.data.length, 1);
  assert.equal(response.data[0].status.state, "needs_equipment");
  assert.deepEqual(response.summary, {
    benches: 50,
    fully_mapped: 30,
    needs_equipment: 12,
    needs_placement: 8,
    equipment: 77,
  });
});

test("mapBenchMappingList tolerates a missing summary", () => {
  const response = mapBenchMappingList({ data: { benches: [] }, meta: {} });

  assert.equal(response.total_count, 0);
  assert.equal(response.summary.benches, 0);
});

test("mapRoomMappingStations extracts stations with slot code, bench count, and equipment count", () => {
  const stations = mapRoomMappingStations(
    {
      data: {
        rooms: [{ id: 1, sku: "RM-01", name: "Main Lab" }],
        room_slots: [
          { id: 10, room_id: 1, row_index: 0, col_index: 1, slot_code: "A2" },
          { id: 11, room_id: 1, row_index: 0, col_index: 0, slot_code: "A1" },
        ],
        stations: [
          { id: 20, sku: "ST-02", name: "Station Two", room_id: 1, slot_id: 10 },
          { id: 21, sku: "ST-01", name: "Station One", room_id: 1, slot_id: 11 },
          { id: 22, sku: "ST-03", name: "Unplaced Slot Station", room_id: 1, slot_id: null },
        ],
        station_slots: [{ id: 30, station_id: 21, position_index: 0, slot_code: "S1" }],
        benches: [
          { id: 100, sku: "BN-01", name: "Bench 1", setup_location_id: 21, station_slot_id: 30 },
          { id: 101, sku: "BN-02", name: "Bench 2", setup_location_id: 21, station_slot_id: null },
        ],
        equipment: [
          { id: 200, sku: "PC-01", name: "Host", bench_id: 100 },
          { id: 201, sku: "MON-01", name: "Monitor", bench_id: 100 },
          { id: 202, sku: "PSU-01", name: "Power", bench_id: 101 },
        ],
      },
    },
    1,
  );

  assert.deepEqual(stations, [
    { id: 21, sku: "ST-01", name: "Station One", slotCode: "A1", benchCount: 2, equipmentCount: 3 },
    { id: 20, sku: "ST-02", name: "Station Two", slotCode: "A2", benchCount: 0, equipmentCount: 0 },
    { id: 22, sku: "ST-03", name: "Unplaced Slot Station", slotCode: null, benchCount: 0, equipmentCount: 0 },
  ]);
});
