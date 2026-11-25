import { Html } from '@react-three/drei';
import { memo, Suspense, useEffect, useRef, useState } from 'react';
import { StationBeacon } from './StationBeacon';
import { MetricColumn } from './MetricColumn';
import { StationModel } from './StationModel';
import { STATUS_COLORS, TYPE_COLORS } from '../../utils/stationVisual';
import type { RackBoxProps } from '../../types';
import { useDragRack } from '../../hooks/useDragRack';
import { RackStatus } from '../hud/RackStatus';
import { RackDragHint } from '../hud/RackDragHint';



const deleteBtnStyle: React.CSSProperties = {
    width: 36, height: 36, borderRadius: '50%',
    background: '#dc2626', color: 'white', fontSize: 18, fontWeight: 'bold',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.5)',
    border: '2px solid white', userSelect: 'none',
};

function RackBoxComponent({
    rack, slots, isEditMode, isDeleteMode,
    onMove, onDelete, onDragStateChange, onNearestSlotChange,
    pinned, onTogglePin, selected, onSelect, showLabels, colorMode,
    overlayLevel = null, dimmed = false,
}: RackBoxProps) {
    const [hovered, setHovered] = useState(false);
    useEffect(() => {
        if (!hovered || isEditMode) return;
        document.body.style.cursor = 'pointer';
        return () => { document.body.style.cursor = ''; };
    }, [hovered, isEditMode]);
    // Holds the locally-moved position until server confirms — prevents sync reset
    const confirmedPositionRef = useRef<[number, number, number] | null>(null);

    const handleDropped = (finalPos: [number, number, number]) => {
        confirmedPositionRef.current = finalPos;
        onMove(rack.id, finalPos);
    };

    const {
        outerGroupRef, isDragging, isDraggingRef, lerpTarget,
        handlePointerDown,
    } = useDragRack({
        rack, slots, isEditMode, isDeleteMode,
        pendingPosition: null,
        onDragStateChange,
        onNearestSlotChange,
        onDropped: handleDropped,
    });

    // Clear confirmed ref once server acknowledges the new position
    useEffect(() => {
        confirmedPositionRef.current = null;
    }, [rack.position]);

    // Sync 3D position from server — refs are stable, intentionally excluded
    useEffect(() => {
        if (isDraggingRef.current)       return;
        if (lerpTarget.current !== null) return;
        const pos = confirmedPositionRef.current ?? rack.position ?? [0, 0, 0];
        outerGroupRef.current?.position.set(...pos);
    }, [rack.position, rack.id, isDraggingRef, lerpTarget, outerGroupRef]);

    const color = colorMode === 'type' ? TYPE_COLORS[rack.modelKind] : STATUS_COLORS[rack.status];

    return (
        <group ref={outerGroupRef} position={rack.position ?? [0, 0, 0]}
            onClick={event => { if (!isEditMode && event.delta < 5) { event.stopPropagation(); onSelect(rack.id); } }}
            onPointerOver={event => { event.stopPropagation(); setHovered(true); }}
            onPointerOut={() => setHovered(false)}>
            {/* Footprint: status colour, brighter on hover, a glowing outline when selected. */}
            <mesh position={[0, -1.385, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[2.05, 1.85]} />
                <meshBasicMaterial color={selected ? '#38bdf8' : color} transparent
                    opacity={dimmed ? 0.04 : selected ? 0.32 : hovered ? 0.26 : 0.12} depthWrite={false} />
            </mesh>
            {(selected || hovered) && (
                <mesh position={[0, -1.38, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                    <ringGeometry args={[1.18, 1.26, 48]} />
                    <meshBasicMaterial color={selected ? '#7dd3fc' : '#cbd5e1'} toneMapped={false}
                        transparent opacity={selected ? 1 : 0.6} depthWrite={false} />
                </mesh>
            )}
            <StationBeacon status={rack.status} height={rack.dimensions[1] - 1.4} />
            {overlayLevel != null && <MetricColumn level={overlayLevel} offset={[1.05, 0.75]} />}
            {isEditMode && !isDeleteMode && (
                <mesh position={[0, -1.4 + rack.dimensions[1] / 2, 0]} onPointerDown={handlePointerDown}>
                    <boxGeometry args={[1.95, rack.dimensions[1] + 0.15, 1.95]} />
                    <meshBasicMaterial transparent opacity={0} />
                </mesh>
            )}

            {/* Its own boundary: a model still loading must not unmount this station's label and beacon. */}
            <Suspense fallback={null}>
                <StationModel rack={rack} color={color} />
            </Suspense>

            {isEditMode && !isDragging && !isDeleteMode && (
                <RackDragHint name={rack.name} />
            )}

            {isDeleteMode && (
                <Html position={[0, 1.8, 0]} center style={{ pointerEvents: 'all' }}>
                    <div onClick={() => onDelete(rack.id)} title={`Delete ${rack.name}`} style={deleteBtnStyle}>
                        ✕
                    </div>
                </Html>
            )}

            {!isEditMode && (showLabels || selected || pinned || hovered) && !dimmed && (
                <Html position={[0, rack.dimensions[1] - 1.1, 0]} center style={{ pointerEvents: 'none' }} zIndexRange={[10, 0]}>
                    <RackStatus
                        name={rack.name} temperature={rack.temperature}
                        humidity={rack.humidity} powerUsage={rack.powerUsage}
                        status={rack.status} pinned={pinned || selected}
                        onTogglePin={() => onTogglePin(rack.id)}
                    />
                </Html>
            )}
        </group>
    );
}

export const RackBox = memo(RackBoxComponent);