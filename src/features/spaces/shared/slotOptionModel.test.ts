import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  classifyRoomSlots,
  classifyStationSlots,
  getRoomSlotsHint,
  getStationSlotsHint,
  type RoomSlotLike,
  type StationSlotLike,
} from "./slotOptionModel.ts";

describe("classifyStationSlots", () => {
  const sampleSlots: StationSlotLike[] = [
    { id: 101, slot_code: "S1", label: "Top", is_occupied: true, service_status: { value: "in_service", label: "In service" } },
    { id: 102, slot_code: "S2", label: "", is_occupied: true, service_status: { value: "in_service", label: "In service" } },
    { id: 103, slot_code: "S3", label: "Middle", is_occupied: false, service_status: { value: "in_service", label: "In service" } },
    { id: 104, slot_code: "S4", label: "", is_occupied: false, service_status: { value: "out_of_service", label: "Out of service" } },
    { id: 105, slot_code: "S5", label: "", is_occupied: false, service_status: { value: "retired", label: "Retired" } },
  ];

  it("disables occupied and out-of-service slots, hides retired slots, and keeps current slot selectable", () => {
    const result = classifyStationSlots(sampleSlots, { currentSlotId: 101, currentSlotLabel: "S1" });

    assert.deepEqual(
      result.map((o) => ({ id: o.id, code: o.code, disabled: o.disabled, tone: o.tone, tag: o.statusTag })),
      [
        { id: 101, code: "S1", disabled: false, tone: "current", tag: "Current" },
        { id: 102, code: "S2", disabled: true, tone: "occupied", tag: "Occupied" },
        { id: 103, code: "S3", disabled: false, tone: "available", tag: null },
        { id: 104, code: "S4", disabled: true, tone: "unavailable", tag: "Out of service" },
      ],
    );
  });

  it("disables all occupied slots when creating a new bench", () => {
    const result = classifyStationSlots(sampleSlots);
    const s1 = result.find((o) => o.id === 101);
    const s2 = result.find((o) => o.id === 102);
    const s3 = result.find((o) => o.id === 103);
    assert.equal(s1?.disabled, true);
    assert.equal(s2?.disabled, true);
    assert.equal(s3?.disabled, false);
  });

  it("adds a fallback option for currentSlotId while slots are still loading", () => {
    const result = classifyStationSlots([], { currentSlotId: 118, currentSlotLabel: "S2" });
    assert.deepEqual(result, [
      { id: 118, code: "S2", label: null, disabled: false, tone: "current", statusTag: "Current" },
    ]);
  });

  it("reports actionable hints when no slots exist or all slots are occupied", () => {
    assert.match(
      getStationSlotsHint(true, true, [], []) ?? "",
      /no bench slots yet/i,
    );
    const occupiedOnly: StationSlotLike[] = [
      { id: 1, slot_code: "S1", is_occupied: true, service_status: { value: "in_service" } },
    ];
    const classified = classifyStationSlots(occupiedOnly);
    assert.match(
      getStationSlotsHint(true, true, occupiedOnly, classified) ?? "",
      /occupied/i,
    );
  });
});

describe("classifyRoomSlots", () => {
  const sampleRoomSlots: RoomSlotLike[] = [
    { id: 4171, slot_code: "R1C1", slot_type: { value: "station" }, is_occupied: true, service_status: { value: "usable" } },
    { id: 4172, slot_code: "R1C2", slot_type: { value: "station" }, is_occupied: true, service_status: { value: "usable" } },
    { id: 4173, slot_code: "R1C3", slot_type: { value: "station" }, is_occupied: false, service_status: { value: "usable" } },
    { id: 4174, slot_code: "R1C4", slot_type: { value: "station" }, is_occupied: false, service_status: { value: "blocked" } },
    { id: 4175, slot_code: "R2C1", slot_type: { value: "aisle" }, is_occupied: false, service_status: { value: "usable" } },
    { id: 4176, slot_code: "R2C2", slot_type: { value: "station" }, is_occupied: false, service_status: { value: "retired" } },
  ];

  it("excludes non-station and retired cells, disables occupied and blocked slots, and preserves current slot", () => {
    const result = classifyRoomSlots(sampleRoomSlots, { currentSlotId: 4171, currentSlotLabel: "R1C1" });

    assert.deepEqual(
      result.map((o) => ({ id: o.id, code: o.code, disabled: o.disabled, tone: o.tone, tag: o.statusTag })),
      [
        { id: 4171, code: "R1C1", disabled: false, tone: "current", tag: "Current" },
        { id: 4172, code: "R1C2", disabled: true, tone: "occupied", tag: "Occupied" },
        { id: 4173, code: "R1C3", disabled: false, tone: "available", tag: null },
        { id: 4174, code: "R1C4", disabled: true, tone: "unavailable", tag: "Blocked" },
      ],
    );
  });

  it("reports actionable hint when every station slot in the room is occupied", () => {
    const occupiedOnly: RoomSlotLike[] = [
      { id: 1, slot_code: "R1C1", slot_type: { value: "station" }, is_occupied: true, service_status: { value: "usable" } },
    ];
    const classified = classifyRoomSlots(occupiedOnly);
    assert.match(
      getRoomSlotsHint(true, true, occupiedOnly, classified) ?? "",
      /occupied/i,
    );
  });
});
