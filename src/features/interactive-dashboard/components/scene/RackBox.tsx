import { Html } from '@react-three/drei';
import { memo, useEffect, useRef } from 'react';
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
}: RackBoxProps) {
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
            onClick={event => { if (!isEditMode && event.delta < 5) { event.stopPropagation(); onSelect(rack.id); } }}>
            <mesh position={[0, -1.385, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[2.05, 1.85]} />
                <meshBasicMaterial color={selected ? '#38bdf8' : color} transparent opacity={selected ? 0.4 : 0.1} depthWrite={false} />
            </mesh>
            {isEditMode && !isDeleteMode && (
                <mesh position={[0, -1.4 + rack.dimensions[1] / 2, 0]} onPointerDown={handlePointerDown}>
                    <boxGeometry args={[1.95, rack.dimensions[1] + 0.15, 1.95]} />
                    <meshBasicMaterial transparent opacity={0} />
                </mesh>
            )}

            <StationModel rack={rack} color={color} />

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

            {!isEditMode && (showLabels || selected || pinned) && (
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