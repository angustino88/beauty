import type { IRoomDashboardSlot } from '@/features/spaces/room/types';
import type { FloorSpec, SlotAnchor } from '../types';

// Minimum cell size in 3D units — ensures slots are always visible
const MIN_CELL_W = 2.8;
const MIN_CELL_D = 2.0;
const DEFAULT_FLOOR_W = 20;
const DEFAULT_FLOOR_D = 10;
export const FLOOR_Z_OFFSET = 0.5;
// Grid slot footprint: a fraction of the cell, capped so small grids stay readable.
const GRID_GAP = 0.76;
const MAX_GRID_SLOT: [number, number] = [1.8, 1.2];
// Measured slot without a recorded size.
const DEFAULT_SLOT_M: [number, number] = [1.2, 0.8];

// Bug 2: exported so RoomFloor uses the SAME dimensions as the slot grid
export const computeFloorDimensions = (
    rows: number | null | undefined,
    cols: number | null | undefined,
): { floorWidth: number; floorDepth: number } => {
    const safeRows = Math.max(rows ?? 1, 1);
    const safeCols = Math.max(cols ?? 1, 1);
    return {
        floorWidth: Math.max(DEFAULT_FLOOR_W, safeCols * MIN_CELL_W),
        floorDepth: Math.max(DEFAULT_FLOOR_D, safeRows * MIN_CELL_D),
    };
};

/**
 * Measured plan when the room has a size and every slot has coordinates (slot centre from the room's back-left
 * corner, in mm); otherwise the row/column grid. Scene units are metres on a measured plan.
 */
export const floorSpec = (
    room: { rows?: number | null; cols?: number | null; width_m?: number | null; length_m?: number | null } | null | undefined,
    slots: IRoomDashboardSlot[],
): FloorSpec => {
    const rows = Math.max(room?.rows ?? 1, 1);
    const cols = Math.max(room?.cols ?? 1, 1);
    const width = Number(room?.width_m);
    const length = Number(room?.length_m);
    const measured =
        width > 0 && length > 0 && slots.length > 0 && slots.every((slot) => slot.x_mm != null && slot.y_mm != null);
    if (measured) return { measured, floorWidth: width, floorDepth: length, rows, cols };
    return { measured: false, ...computeFloorDimensions(rows, cols), rows, cols };
};

const distanceSquared = (a: [number, number, number], b: [number, number, number]) => {
    const dx = a[0] - b[0];
    const dz = a[2] - b[2];
    return dx * dx + dz * dz;
};

export const getSlotAnchorPosition = (
    rowIndex: number,
    colIndex: number,
    rows: number,
    cols: number,
): [number, number, number] => {
    const safeRows = Math.max(rows, 1);
    const safeCols = Math.max(cols, 1);
    const { floorWidth, floorDepth } = computeFloorDimensions(safeRows, safeCols);
    const cellW = floorWidth / safeCols;
    const cellD = floorDepth / safeRows;
    // RoomSlot row_index and col_index are 0-based (0..rows-1, 0..cols-1).
    const x = -floorWidth / 2 + cellW * (colIndex + 0.5);
    const z = FLOOR_Z_OFFSET + (-floorDepth / 2 + cellD * (rowIndex + 0.5));
    return [x, 0, z];
};

export const gridSlotSize = (floor: FloorSpec): [number, number] => [
    Math.min((floor.floorWidth / floor.cols) * GRID_GAP, MAX_GRID_SLOT[0]),
    Math.min((floor.floorDepth / floor.rows) * GRID_GAP, MAX_GRID_SLOT[1]),
];

export const toSlotAnchors = (slots: IRoomDashboardSlot[], floor: FloorSpec): SlotAnchor[] =>
    slots.map((slot) => {
        const measured = floor.measured && slot.x_mm != null && slot.y_mm != null;
        const position: [number, number, number] = measured
            ? [
                  -floor.floorWidth / 2 + slot.x_mm! / 1000,
                  0,
                  FLOOR_Z_OFFSET - floor.floorDepth / 2 + slot.y_mm! / 1000,
              ]
            : getSlotAnchorPosition(slot.row_index, slot.col_index, floor.rows, floor.cols);
        const size: [number, number] = measured
            ? [
                  slot.width_mm ? slot.width_mm / 1000 : DEFAULT_SLOT_M[0],
                  slot.depth_mm ? slot.depth_mm / 1000 : DEFAULT_SLOT_M[1],
              ]
            : gridSlotSize(floor);
        return {
            id: slot.id,
            rowIndex: slot.row_index,
            colIndex: slot.col_index,
            slotCode: slot.slot_code,
            position,
            occupiedRackId: slot.rack?.id ?? null,
            size,
            rotation: measured && slot.orientation_degrees ? -((slot.orientation_degrees * Math.PI) / 180) : 0,
            slotType: slot.slot_type ?? 'station',
            status: slot.service_status ?? 'usable',
        };
    });

export const nearestAvailableSlot = (
    pos: [number, number, number],
    slots: SlotAnchor[],
    rackId: number,
): SlotAnchor | null => {
    let best: SlotAnchor | null = null;
    let bestDist = Number.POSITIVE_INFINITY;
    for (const slot of slots) {
        if (slot.occupiedRackId !== null && slot.occupiedRackId !== rackId) continue;
        // Only usable station slots take a station.
        if (slot.slotType !== 'station' || slot.status !== 'usable') continue;
        const d2 = distanceSquared(pos, slot.position);
        if (d2 < bestDist) { bestDist = d2; best = slot; }
    }
    return best;
};

/** Spreadsheet-style row label: 0 → A, 25 → Z, 26 → AA. */
export const rowLabel = (index: number): string => {
    let label = '';
    let value = index + 1;
    while (value > 0) {
        const remainder = (value - 1) % 26;
        label = String.fromCharCode(65 + remainder) + label;
        value = Math.floor((value - 1) / 26);
    }
    return label;
};
