import { SceneText as Text } from './SceneText';
import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import type { RackData, SlotAnchor } from '../../types';

const ROTATION: [number, number, number] = [-Math.PI / 2, 0, 0];
// Unit geometries scaled per slot, so slots of any size share GPU buffers.
const UNIT_PLANE = new THREE.PlaneGeometry(1, 1);
const UNIT_EDGES = new THREE.EdgesGeometry(new THREE.PlaneGeometry(1.05, 1.05));

function PulsingSlotFill({ color, size }: { color: string; size: [number, number] }) {
    const matRef = useRef<THREE.MeshBasicMaterial>(null!);
    useFrame(({ clock }) => {
        if (matRef.current) {
            matRef.current.opacity = 0.32 + Math.sin(clock.getElapsedTime() * 5) * 0.18;
        }
    });
    return (
        <mesh geometry={UNIT_PLANE} rotation={ROTATION} scale={[size[0], size[1], 1]} position={[0, -1.04, 0]}>
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
}

/** Edit-mode slot targets: free, occupied and the nearest drop target, each at its real footprint. */
export function SlotGridOverlay({
    slots, isEditMode, isDragging,
    nearestSlotCode = null, draggingRackId = null,
    racks = [],
}: SlotGridOverlayProps) {
    const rackNameBySlot = useMemo(() => {
        const map: Record<string, string> = {};
        racks.forEach((r) => { if (r.slotCode) map[r.slotCode] = r.name; });
        return map;
    }, [racks]);

    if (slots.length === 0 || !isEditMode) return null;

    return (
        <group>
            {slots
                .filter((slot) => slot.slotType === 'station' && slot.status === 'usable')
                .map((slot) => {
                    const isNearest  = isDragging && slot.slotCode === nearestSlotCode;
                    const isOccupied = slot.occupiedRackId !== null && slot.occupiedRackId !== draggingRackId;
                    const rackName   = rackNameBySlot[slot.slotCode];
                    const [w, d]     = slot.size;
                    const textSize   = Math.max(0.07, Math.min(w, d) * 0.11);

                    const color         = isNearest ? '#fbbf24' : isOccupied ? '#60a5fa' : '#34d399';
                    const fillOpacity   = isOccupied ? 0.22 : 0.18;
                    const borderOpacity = isNearest ? 1.0 : isOccupied ? 0.75 : 0.6;
                    const corners: [number, number][] = [
                        [-w * 0.46, -d * 0.46], [w * 0.46, -d * 0.46], [-w * 0.46, d * 0.46], [w * 0.46, d * 0.46],
                    ];

                    return (
                        <group key={slot.id} position={[slot.position[0], 0, slot.position[2]]} rotation={[0, slot.rotation, 0]}>
                            {isNearest ? (
                                <PulsingSlotFill color={color} size={slot.size} />
                            ) : (
                                <mesh geometry={UNIT_PLANE} rotation={ROTATION} scale={[w, d, 1]} position={[0, -1.04, 0]}>
                                    <meshBasicMaterial color={color} transparent opacity={fillOpacity} />
                                </mesh>
                            )}
                            <lineSegments geometry={UNIT_EDGES} rotation={ROTATION} scale={[w, d, 1]} position={[0, -1.02, 0]}>
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
                                    fontSize={textSize * 0.7}
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
