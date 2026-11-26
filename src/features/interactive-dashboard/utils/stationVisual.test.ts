import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { stationVisual } from "./stationVisual.ts";
import { toRackData, deriveNotifications } from "./rackMapper.ts";
import { mapStationApiItem } from "../../spaces/station/mapper.ts";

describe("station type rendering pipeline", () => {
  it("preserves API type, dimensions, and orientation through the map model", () => {
    const data = toRackData(
      mapStationApiItem({
        id: 1,
        name: "Test table",
        type: { id: 2, name: "ESD Workbench" },
        width_mm: 1600,
        depth_mm: 700,
        height_mm: 900,
        orientation_degrees: 90,
      }),
      [0, 0, 0],
      "A1",
    );
    assert.equal(data.modelKind, "table");
    assert.equal(data.stationType, "ESD Workbench");
    assert.deepEqual(data.dimensions, [1.6, 0.9, 0.7]);
    assert.equal(data.rotation, -Math.PI / 2);
    assert.equal(data.temperature, null);
    assert.equal(data.status, "unknown");
  });
  it("recognizes common station types and safely handles missing/custom types", () => {
    for (const [name, expected] of [
      ["Server Rack", "rack"],
      ["Table", "table"],
      ["Storage Cabinet", "cabinet"],
      ["Shelving", "shelf"],
      ["Custom chamber", "generic"],
    ]) {
      assert.equal(
        stationVisual({ type: { id: 1, name } }).modelKind,
        expected,
      );
    }
    assert.equal(stationVisual({ type: null }).modelKind, "generic");
  });
  it("fits large footprints without distorting proportions, ignores invalid dimensions", () => {
    const {
      dimensions: [w, h, d],
    } = stationVisual({ width_mm: 6000, height_mm: 3000, depth_mm: 2000 });
    assert.ok(Math.hypot(w, d) <= 1.850001);
    assert.equal(w / h, 2);
    assert.equal(w / d, 3);
    const invalid = stationVisual({
      width_mm: -10,
      depth_mm: NaN,
      height_mm: Infinity,
    });
    assert.ok(invalid.dimensions.every((n) => Number.isFinite(n) && n > 0));
  });
  it("keeps zero measurements and flags known alarms even with partial telemetry", () => {
    const empty = toRackData(mapStationApiItem({ id: 1 }), null, null);
    const zero = toRackData(
      mapStationApiItem({ id: 2, temperature: 0, humidity: 0, power_usage: 0 }),
      null,
      null,
    );
    const alarm = toRackData(
      mapStationApiItem({ id: 3, temperature: 60 }),
      null,
      null,
    );
    assert.equal(zero.status, "ok");
    assert.equal(alarm.status, "critical");
    assert.deepEqual(deriveNotifications([empty, zero, alarm]), {
      ok: 1,
      warning: 0,
      critical: 1,
      unknown: 1,
    });
  });
});
