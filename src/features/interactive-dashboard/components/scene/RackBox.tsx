import { Html, useGLTF } from '@react-three/drei';
import { memo, useEffect, useMemo, useRef } from 'react';
import rackModelUrl from '../../../../assets/rack.glb?url';
import type { RackBoxProps } from '../../types';
import { useDragRack } from '../../hooks/useDragRack';
import { RackStatus } from '../hud/RackStatus';
import { RackDragHint } from '../hud/RackDragHint';

const RACK_MODEL_SCALE = 0.0014;

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
    pinned, onTogglePin,
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
    }, [rack.position, rack.id]);

    const { scene } = useGLTF(rackModelUrl);
    const model = useMemo(() => scene.clone(), [scene]);

    return (
        <group ref={outerGroupRef} position={rack.position ?? [0, 0, 0]}>
            {isEditMode && !isDeleteMode && (
                <mesh position={[0, 1.2, 0]} onPointerDown={handlePointerDown}>
                    <boxGeometry args={[1.5, 2.5, 1]} />
                    <meshBasicMaterial transparent opacity={0} />
                </mesh>
            )}

            <primitive object={model} castShadow receiveShadow scale={RACK_MODEL_SCALE} />

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

            {!isEditMode && (
                <Html position={[1.2, 1.5, 0]} style={{ pointerEvents: 'none' }} distanceFactor={0.01}>
                    <RackStatus
                        name={rack.name} temperature={rack.temperature}
                        humidity={rack.humidity} powerUsage={rack.powerUsage}
                        status={rack.status} pinned={pinned}
                        onTogglePin={() => onTogglePin(rack.id)}
                    />
                </Html>
            )}
        </group>
    );
}

export const RackBox = memo(RackBoxComponent);