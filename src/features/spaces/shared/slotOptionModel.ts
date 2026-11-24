/**
 * Pure classification and hint logic for station slots (bench placement) and room slots (station placement).
 *
 * Kept free of JSX/React so it can be unit-tested directly with Node and shared identically by
 * Bench form, BenchPlacementModal, and Station form.
 */

export interface ChoiceLike {
  value?: string | null;
  label?: string | null;
}

export interface StationSlotLike {
  id: number;
  slot_code: string;
  label?: string | null;
  is_occupied?: boolean | null;
  service_status?: ChoiceLike | string | null;
}

export interface RoomSlotLike {
  id: number;
  slot_code: string;
  slot_type?: ChoiceLike | string | null;
  is_occupied?: boolean | null;
  service_status?: ChoiceLike | string | null;
}

export type SlotOptionTone = "current" | "available" | "occupied" | "unavailable";

export interface ClassifiedSlotOption {
  id: number;
  code: string;
  label: string | null;
  disabled: boolean;
  tone: SlotOptionTone;
  statusTag: string | null;
}

function readChoiceValue(field: ChoiceLike | string | null | undefined): string | null {
  if (typeof field === "string") return field;
  if (field && typeof field === "object" && typeof field.value === "string") return field.value;
  return null;
}

function stationSlotServiceStatus(slot: StationSlotLike): string {
  return readChoiceValue(slot.service_status) ?? "in_service";
}

function roomSlotServiceStatus(slot: RoomSlotLike): string {
  return readChoiceValue(slot.service_status) ?? "usable";
}

function roomSlotType(slot: RoomSlotLike): string {
  return readChoiceValue(slot.slot_type) ?? "station";
}

export interface ClassifySlotsParams {
  /** Slot currently held by the record being edited (remains selectable even though occupied). */
  currentSlotId?: number | null;
  /** Known display code for `currentSlotId`, used as a fallback option while slots are loading. */
  currentSlotLabel?: string | null;
}

/**
 * Classify station slots for bench placement:
 * - Current slot is selectable and badged "Current".
 * - Free `in_service` slots are selectable.
 * - Occupied or `out_of_service` slots stay visible but disabled with a clear status tag.
 * - `retired` slots are hidden unless currently held by this bench.
 */
export function classifyStationSlots(
  slots: readonly StationSlotLike[],
  { currentSlotId = null, currentSlotLabel = null }: ClassifySlotsParams = {},
): ClassifiedSlotOption[] {
  const options: ClassifiedSlotOption[] = [];
  let hasCurrent = false;

  for (const slot of slots) {
    const isCurrent = currentSlotId != null && slot.id === currentSlotId;
    const serviceStatus = stationSlotServiceStatus(slot);

    if (serviceStatus === "retired" && !isCurrent) continue;

    if (isCurrent) {
      hasCurrent = true;
      options.push({
        id: slot.id,
        code: slot.slot_code,
        label: slot.label?.trim() || null,
        disabled: false,
        tone: "current",
        statusTag: "Current",
      });
      continue;
    }

    if (slot.is_occupied) {
      options.push({
        id: slot.id,
        code: slot.slot_code,
        label: slot.label?.trim() || null,
        disabled: true,
        tone: "occupied",
        statusTag: "Occupied",
      });
      continue;
    }

    if (serviceStatus !== "in_service") {
      options.push({
        id: slot.id,
        code: slot.slot_code,
        label: slot.label?.trim() || null,
        disabled: true,
        tone: "unavailable",
        statusTag: "Out of service",
      });
      continue;
    }

    options.push({
      id: slot.id,
      code: slot.slot_code,
      label: slot.label?.trim() || null,
      disabled: false,
      tone: "available",
      statusTag: null,
    });
  }

  if (currentSlotId != null && !hasCurrent && currentSlotLabel?.trim()) {
    options.unshift({
      id: currentSlotId,
      code: currentSlotLabel.trim(),
      label: null,
      disabled: false,
      tone: "current",
      statusTag: "Current",
    });
  }

  return options;
}

/**
 * Classify room slots for station placement:
 * - Non-station cells (`aisle`, `storage`, `safety`, `utility`, `reserved`) are hidden unless currently held.
 * - `retired` slots are hidden unless currently held.
 * - Current slot is selectable and badged "Current".
 * - Free `usable` station slots are selectable.
 * - Occupied or `blocked` station slots stay visible but disabled with a clear status tag.
 */
export function classifyRoomSlots(
  slots: readonly RoomSlotLike[],
  { currentSlotId = null, currentSlotLabel = null }: ClassifySlotsParams = {},
): ClassifiedSlotOption[] {
  const options: ClassifiedSlotOption[] = [];
  let hasCurrent = false;

  for (const slot of slots) {
    const isCurrent = currentSlotId != null && slot.id === currentSlotId;
    const serviceStatus = roomSlotServiceStatus(slot);
    const slotType = roomSlotType(slot);

    if (!isCurrent && (slotType !== "station" || serviceStatus === "retired")) continue;

    if (isCurrent) {
      hasCurrent = true;
      options.push({
        id: slot.id,
        code: slot.slot_code,
        label: null,
        disabled: false,
        tone: "current",
        statusTag: "Current",
      });
      continue;
    }

    if (slot.is_occupied) {
      options.push({
        id: slot.id,
        code: slot.slot_code,
        label: null,
        disabled: true,
        tone: "occupied",
        statusTag: "Occupied",
      });
      continue;
    }

    if (serviceStatus !== "usable") {
      options.push({
        id: slot.id,
        code: slot.slot_code,
        label: null,
        disabled: true,
        tone: "unavailable",
        statusTag: "Blocked",
      });
      continue;
    }

    options.push({
      id: slot.id,
      code: slot.slot_code,
      label: null,
      disabled: false,
      tone: "available",
      statusTag: null,
    });
  }

  if (currentSlotId != null && !hasCurrent && currentSlotLabel?.trim()) {
    options.unshift({
      id: currentSlotId,
      code: currentSlotLabel.trim(),
      label: null,
      disabled: false,
      tone: "current",
      statusTag: "Current",
    });
  }

  return options;
}

export function getStationSlotsHint(
  stationSelected: boolean,
  loaded: boolean,
  rawSlots: readonly StationSlotLike[],
  classified: readonly ClassifiedSlotOption[],
): string | undefined {
  if (!stationSelected || !loaded) return undefined;
  if (rawSlots.length === 0) {
    return "This station has no bench slots yet. Edit the station, set its Bench Capacity and save: slots S1, S2, … are created.";
  }
  const hasSelectable = classified.some((opt) => !opt.disabled);
  if (!hasSelectable) {
    const hasOccupied = classified.some((opt) => opt.tone === "occupied");
    return hasOccupied
      ? "All slots on this station are currently occupied or out of service."
      : "All slots on this station are out of service or retired.";
  }
  return undefined;
}

export function getRoomSlotsHint(
  roomSelected: boolean,
  loaded: boolean,
  rawSlots: readonly RoomSlotLike[],
  classified: readonly ClassifiedSlotOption[],
): string | undefined {
  if (!roomSelected || !loaded) return undefined;
  if (rawSlots.length === 0) {
    return "This room has no slots yet. Edit the room, set its layout (rows × columns) and save: one slot is created per cell.";
  }
  const hasSelectable = classified.some((opt) => !opt.disabled);
  if (!hasSelectable) {
    const hasOccupied = classified.some((opt) => opt.tone === "occupied");
    return hasOccupied
      ? "Every station slot in this room is currently occupied or blocked. Enlarge the room layout or move a station."
      : "No usable station slots are available in this room.";
  }
  return undefined;
}
