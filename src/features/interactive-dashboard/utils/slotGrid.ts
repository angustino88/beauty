import type { IRoomDashboardSlot } from '@/features/spaces/room/types';
import type { SlotAnchor } from '../types';

// Minimum cell size in 3D units — ensures slots are always visible
const MIN_CELL_W = 2.8;
const MIN_CELL_D = 2.0;
const DEFAULT_FLOOR_W = 20;
const DEFAULT_FLOOR_D = 10;
const FLOOR_Z_OFFSET  = 0.5;

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

export const toSlotAnchors = (
    slots: IRoomDashboardSlot[],
    rows: number | null | undefined,
    cols: number | null | undefined,
): SlotAnchor[] => {
    const safeRows = rows ?? 1;
    const safeCols = cols ?? 1;
    return slots.map((slot) => ({
        id:            slot.id,
        rowIndex:      slot.row_index,
        colIndex:      slot.col_index,
        slotCode:      slot.slot_code,
        position:      getSlotAnchorPosition(slot.row_index, slot.col_index, safeRows, safeCols),
        occupiedRackId: slot.rack?.id ?? null,
    }));
};

export const nearestAvailableSlot = (
    pos: [number, number, number],
    slots: SlotAnchor[], 
    rackId: number,
): SlotAnchor | null => {
    let best: SlotAnchor | null = null;
    let bestDist = Number.POSITIVE_INFINITY;
    for (const slot of slots) {
        if (slot.occupiedRackId !== null && slot.occupiedRackId !== rackId) continue;
        const d2 = distanceSquared(pos, slot.position);
        if (d2 < bestDist) { bestDist = d2; best = slot; }
    }
    return best;
};