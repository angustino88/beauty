import { Text } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import type { RackData, SlotAnchor } from '../../types';
import { computeFloorDimensions } from '../../utils/slotGrid';

const ROTATION: [number, number, number] = [-Math.PI / 2, 0, 0];

// Max slot size — prevents slots from becoming huge in small grids
const MAX_SLOT_W = 1.8;
const MAX_SLOT_D = 1.2;
// Gap ratio — slots occupy this fraction of their cell
const GAP = 0.76;

function PulsingSlotFill({
    color, geom,
}: { color: string; geom: THREE.PlaneGeometry }) {
    const matRef = useRef<THREE.MeshBasicMaterial>(null!);
    useFrame(({ clock }) => {
        if (matRef.current) {
            matRef.current.opacity = 0.32 + Math.sin(clock.getElapsedTime() * 5) * 0.18;
        }
    });
    return (
        <mesh geometry={geom} rotation={ROTATION} position={[0, -1.04, 0]}>
            <meshBasicMaterial ref={matRef} color={color} transparent />
        </mesh>
    );
}

interface SlotGridOverlayProps {
    slots:           SlotAnchor[];
    isEditMode:      boolean;
    isDragging:      boolean;
    nearestSlotCode?: string | null;
    draggingRackId?:  number | null;
    racks?:           RackData[];
    rows?:            number | null;  // from currentRoom
    cols?:            number | null;
}

export function SlotGridOverlay({
    slots, isEditMode, isDragging,
    nearestSlotCode = null, draggingRackId = null,
    racks = [], rows, cols,
}: SlotGridOverlayProps) {
    // Hooks before early return
    const rackNameBySlot = useMemo(() => {
        const map: Record<string, string> = {};
        racks.forEach((r) => { if (r.slotCode) map[r.slotCode] = r.name; });
        return map;
    }, [racks]);

    // Compute cell size from room grid — same formula as slotGrid.ts
    const { floorWidth, floorDepth } = computeFloorDimensions(rows, cols);
    const safeRows = Math.max(rows ?? 4, 1);
    const safeCols = Math.max(cols ?? 4, 1);
    const cellW = floorWidth  / safeCols;
    const cellD = floorDepth  / safeRows;

    // Slot visual = min(cell*GAP, MAX_SIZE) — fills cell proportionally, never too big
    const slotW = Math.min(cellW * GAP, MAX_SLOT_W);
    const slotD = Math.min(cellD * GAP, MAX_SLOT_D);

    const fillGeom   = useMemo(() => new THREE.PlaneGeometry(slotW, slotD),                                        [slotW, slotD]);
    const borderGeom = useMemo(() => new THREE.EdgesGeometry(new THREE.PlaneGeometry(slotW * 1.05, slotD * 1.05)), [slotW, slotD]);
    const corners    = useMemo<[number, number][]>(() => {
        const cx = (slotW / 2) * 0.92;
        const cz = (slotD / 2) * 0.92;
        return [[-cx, -cz], [cx, -cz], [-cx, cz], [cx, cz]];
    }, [slotW, slotD]);

    // Text scales with slot — readable but not overwhelming
    const textSize     = Math.max(0.07, Math.min(slotW, slotD) * 0.11);
    const subTextSize  = textSize * 0.70;

    if (slots.length === 0) return null;

    return (
        <group>
            {slots.map((slot) => {
                const isNearest  = isEditMode && isDragging && slot.slotCode === nearestSlotCode;
                const isOccupied = slot.occupiedRackId !== null && slot.occupiedRackId !== draggingRackId;
                const rackName   = rackNameBySlot[slot.slotCode];

                const color         = isNearest  ? '#fbbf24' : isOccupied ? '#60a5fa' : '#34d399';
                const fillOpacity   = isOccupied ? 0.22 : 0.18;
                const borderOpacity = isNearest ? 1.0 : isOccupied ? 0.75 : 0.6;

                return (
                    <group key={slot.id} position={[slot.position[0], 0, slot.position[2]]}>
                        {isNearest ? (
                            <PulsingSlotFill color={color} geom={fillGeom} />
                        ) : (
                            <mesh geometry={fillGeom} rotation={ROTATION} position={[0, -1.04, 0]}>
                                <meshBasicMaterial color={color} transparent opacity={fillOpacity} />
                            </mesh>
                        )}

                        <lineSegments geometry={borderGeom} rotation={ROTATION} position={[0, -1.02, 0]}>
                            <lineBasicMaterial color={color} transparent opacity={borderOpacity} />
                        </lineSegments>

                        {corners.map(([cx, cz], i) => (
                            <mesh key={i} position={[cx, -0.96, cz]}>
                                <cylinderGeometry args={[0.025, 0.025, 0.1, 6]} />
                                <meshBasicMaterial color={color} transparent opacity={borderOpacity} />
                            </mesh>
                        ))}

                        <Text
                            position={[0, -0.88, 0]}
                            fontSize={isNearest ? textSize * 1.15 : textSize}
                            color={color}
                            anchorX="center"
                            anchorY="middle"
                            renderOrder={1}
                        >
                            {slot.slotCode}
                        </Text>

                        {isOccupied && rackName && !isDragging && (
                            <Text
                                position={[0, -0.72, 0]}
                                fontSize={subTextSize}
                                color="#94a3b8"
                                anchorX="center"
                                anchorY="middle"
                                renderOrder={1}
                            >
                                {rackName}
                            </Text>
                        )}
                    </group>
                );
            })}
        </group>
    );
}