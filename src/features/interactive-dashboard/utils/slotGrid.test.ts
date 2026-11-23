import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { computeFloorDimensions, getSlotAnchorPosition } from "./slotGrid.ts";

describe("getSlotAnchorPosition", () => {
  it("places 0-based grid cells symmetrically inside the room floor bounds", () => {
    const rows = 2;
    const cols = 4;
    const { floorWidth, floorDepth } = computeFloorDimensions(rows, cols);

    const first = getSlotAnchorPosition(0, 0, rows, cols);
    const last = getSlotAnchorPosition(rows - 1, cols - 1, rows, cols);

    assert.ok(first[0] > -floorWidth / 2 && first[0] < 0, `first x=${first[0]} should be inside left half`);
    assert.ok(last[0] > 0 && last[0] < floorWidth / 2, `last x=${last[0]} should be inside right half`);
    assert.equal(Number((first[0] + last[0]).toFixed(6)), 0, "columns should be centered symmetrically around x=0");

    assert.ok(first[2] > 0.5 - floorDepth / 2, `first z=${first[2]} should be inside back edge`);
    assert.ok(last[2] < 0.5 + floorDepth / 2, `last z=${last[2]} should be inside front edge`);
  });
});
