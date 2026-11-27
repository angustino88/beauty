import { test } from "node:test";
import assert from "node:assert/strict";
import {
  computeRoomRollup,
  deriveStationAlerts,
  findContiguousFreeU,
  matchCapacityPlan,
} from "./dcimMetrics.ts";
import type { RackData } from "../types.ts";

function makeCapacity(
  overrides: Partial<NonNullable<RackData["capacity"]>> = {},
): NonNullable<RackData["capacity"]> {
  return {
    bench_capacity: null,
    rack_units: 42,
    rack_units_used: 10,
    power_capacity_w: 10000,
    power_installed_w: 4000,
    power_reserved_w: 1000,
    max_load_kg: 1000,
    load_installed_kg: 300,
    network_port_capacity: null,
    ...overrides,
  };
}

function makeRack(overrides: Partial<RackData> = {}): RackData {
  return {
    id: 1,
    name: "Rack A1",
    temperature: 24,
    humidity: 45,
    powerUsage: 3.2,
    status: "ok",
    position: [0, 0, 0],
    slotCode: "A1",
    manufacturer: null,
    model: null,
    stationType: "Server Rack",
    modelKind: "rack",
    dimensions: [0.6, 2.0, 1.07],
    rotation: 0,
    benchCount: 0,
    benchCapacity: null,
    capacity: makeCapacity(),
    rackItems: [],
    conditionsAt: "2026-11-26T12:00:00Z",
    sensorCount: 2,
    ...overrides,
  };
}

test("findContiguousFreeU calculates free blocks around mounted equipment", () => {
  const ranges = findContiguousFreeU(
    10,
    [
      { equipment_id: 1, sku: "S1", name: "Switch", category: "Networking", power_draw_w: 150, rack_unit: 1, rack_unit_height: 2, rack_face: "front" },
      { equipment_id: 2, sku: "S2", name: "Server", category: "Computing", power_draw_w: 600, rack_unit: 5, rack_unit_height: 2, rack_face: "front" },
      { equipment_id: 3, sku: "S3", name: "Rear PDU", category: "Power", power_draw_w: 50, rack_unit: 3, rack_unit_height: 2, rack_face: "rear" },
    ],
    "front",
  );
  assert.deepEqual(ranges, [
    { startU: 3, endU: 4, sizeU: 2 },
    { startU: 7, endU: 10, sizeU: 4 },
  ]);
});

test("computeRoomRollup aggregates power, rack U, thermal min/avg/max and sensors", () => {
  const rollup = computeRoomRollup([
    makeRack({ id: 1, temperature: 22, humidity: 40, powerUsage: 2.5 }),
    makeRack({
      id: 2,
      name: "Rack A2",
      temperature: 34,
      humidity: 50,
      powerUsage: 4.5,
      capacity: makeCapacity({
        rack_units: 42,
        rack_units_used: 32,
        power_capacity_w: 10000,
        power_installed_w: 7000,
        power_reserved_w: 0,
        max_load_kg: 1000,
        load_installed_kg: 600,
      }),
      sensorCount: 3,
    }),
  ]);
  assert.equal(rollup.stationCount, 2);
  assert.equal(rollup.rackCount, 2);
  assert.equal(rollup.totalRackUnits, 84);
  assert.equal(rollup.usedRackUnits, 42);
  assert.equal(rollup.freeRackUnits, 42);
  assert.equal(rollup.rackUtilization, 0.5);
  assert.equal(rollup.totalPowerCapacityW, 20000);
  assert.equal(rollup.totalPowerAllocatedW, 12000);
  assert.equal(rollup.powerUtilization, 0.6);
  assert.equal(rollup.livePowerKw, 7);
  assert.equal(rollup.tempMin, 22);
  assert.equal(rollup.tempAvg, 28);
  assert.equal(rollup.tempMax, 34);
  assert.equal(rollup.humidityAvg, 45);
  assert.equal(rollup.totalSensors, 5);
});

test("matchCapacityPlan evaluates contiguous U, power headroom and weight headroom", () => {
  const spacious = makeRack({ id: 1, name: "Spacious" });
  const lowPower = makeRack({
    id: 2,
    name: "Low Power",
    capacity: makeCapacity({
      rack_units: 42,
      rack_units_used: 10,
      power_capacity_w: 5000,
      power_installed_w: 4500,
      power_reserved_w: 0,
      max_load_kg: 1000,
      load_installed_kg: 200,
    }),
  });
  const results = matchCapacityPlan([lowPower, spacious], {
    requiredU: 4,
    requiredPowerW: 1500,
    requiredWeightKg: 80,
    requiredBenches: 0,
    face: "front",
  });
  assert.equal(results[0].rack.name, "Spacious");
  assert.equal(results[0].fits, true);
  assert.equal(results[0].maxContiguousU, 42);
  assert.equal(results[1].rack.name, "Low Power");
  assert.equal(results[1].fits, false);
  assert.ok(results[1].reasons.some((r) => r.includes("1500 W")));
});

test("deriveStationAlerts orders critical alerts before warnings", () => {
  const alerts = deriveStationAlerts([
    makeRack({ id: 1, name: "Warm Bench", temperature: 35, humidity: 45 }),
    makeRack({
      id: 2,
      name: "Hot Rack",
      temperature: 54,
      humidity: 78,
      capacity: makeCapacity({
        rack_units: 42,
        rack_units_used: 41,
        power_capacity_w: 5000,
        power_installed_w: 4900,
        power_reserved_w: 0,
      }),
    }),
  ]);
  assert.ok(alerts.length >= 4);
  assert.equal(alerts[0].severity, "critical");
  assert.equal(alerts[alerts.length - 1].severity, "warning");
});
