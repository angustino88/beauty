import { Html } from '@react-three/drei';
import { memo, Suspense, useEffect, useRef, useState } from 'react';
import { StationBeacon } from './StationBeacon';
import { MetricColumn } from './MetricColumn';
import { StationModel } from './StationModel';
import { STATUS_COLORS, TYPE_COLORS } from '../../utils/stationVisual';
import { heatHex } from '../../utils/overlays';
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
    overlayLevel = null, xrayMode = false, planMatch = null, dimmed = false,
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
    const [footW, footH, footD] = rack.dimensions;
    const footprint: [number, number] = [Math.max(footW + 0.3, 1.2), Math.max(footD + 0.3, 0.9)];
    const ringRadius = Math.hypot(footprint[0], footprint[1]) / 2 + 0.08;
    const effectiveDimmed = dimmed || planMatch === 'excluded';
    const xrayColor =
        planMatch === 'match'
            ? '#10b981'
            : overlayLevel != null
              ? heatHex(overlayLevel)
              : color;

    return (
        <group ref={outerGroupRef} position={rack.position ?? [0, 0, 0]}
            onClick={event => { if (!isEditMode && event.delta < 5) { event.stopPropagation(); onSelect(rack.id); } }}
            onPointerOver={event => { event.stopPropagation(); setHovered(true); }}
            onPointerOut={() => setHovered(false)}>
            {/* Footprint: status colour, brighter on hover, glowing outline when selected or planner-matched. */}
            <mesh position={[0, -1.385, 0]} rotation={[-Math.PI / 2, 0, rack.rotation]}>
                <planeGeometry args={footprint} />
                <meshBasicMaterial
                    color={planMatch === 'match' ? '#10b981' : selected ? '#38bdf8' : color}
                    transparent
                    opacity={effectiveDimmed ? 0.04 : planMatch === 'match' ? 0.38 : selected ? 0.32 : hovered ? 0.26 : 0.12}
                    depthWrite={false}
                />
            </mesh>
            {(selected || hovered || planMatch === 'match') && (
                <mesh position={[0, -1.38, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                    <ringGeometry args={[ringRadius, ringRadius + 0.09, 64]} />
                    <meshBasicMaterial
                        color={planMatch === 'match' ? '#34d399' : selected ? '#7dd3fc' : '#cbd5e1'}
                        toneMapped={false}
                        transparent
                        opacity={selected || planMatch === 'match' ? 1 : 0.6}
                        depthWrite={false}
                    />
                </mesh>
            )}
            {/* DCIM Analytical / X-Ray Choropleth Shell */}
            {xrayMode && !isEditMode && (
                <group position={[0, -1.4 + footH / 2, 0]} rotation={[0, rack.rotation, 0]}>
                    <mesh>
                        <boxGeometry args={[footW + 0.06, footH + 0.04, footD + 0.06]} />
                        <meshStandardMaterial
                            color={xrayColor}
                            emissive={xrayColor}
                            emissiveIntensity={effectiveDimmed ? 0.15 : 0.75}
                            transparent
                            opacity={effectiveDimmed ? 0.06 : 0.28}
                            depthWrite={false}
                            toneMapped={false}
                        />
                    </mesh>
                    <mesh>
                        <boxGeometry args={[footW + 0.07, footH + 0.05, footD + 0.07]} />
                        <meshBasicMaterial
                            color={xrayColor}
                            wireframe
                            transparent
                            opacity={effectiveDimmed ? 0.12 : 0.55}
                            toneMapped={false}
                        />
                    </mesh>
                </group>
            )}
            <StationBeacon status={rack.status} height={rack.dimensions[1] - 1.4} />
            {overlayLevel != null && (
                <MetricColumn level={overlayLevel} offset={[footprint[0] / 2 + 0.15, footprint[1] / 2 - 0.1]} />
            )}
            {isEditMode && !isDeleteMode && (
                <mesh position={[0, -1.4 + rack.dimensions[1] / 2, 0]} onPointerDown={handlePointerDown}>
                    <boxGeometry args={[Math.max(footprint[0], 1.95), rack.dimensions[1] + 0.15, Math.max(footprint[1], 1.95)]} />
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

            {!isEditMode && (showLabels || selected || pinned || hovered || planMatch === 'match') && !effectiveDimmed && (
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