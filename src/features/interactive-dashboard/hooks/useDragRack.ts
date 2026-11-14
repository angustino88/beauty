import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import type { ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';
import type { RackData, SlotAnchor } from '../types';
import { nearestAvailableSlot } from '../utils/slotGrid';

const DRAG_FLOAT_Y   = 0.35;
const LERP_SPEED     = 0.18;
const LERP_THRESHOLD = 0.005;

interface UseDragRackOptions {
    rack: RackData;
    slots: SlotAnchor[];
    isEditMode: boolean;
    isDeleteMode: boolean;
    pendingPosition: [number, number, number] | null;
    onDragStateChange?: (id: number, dragging: boolean) => void;
    onNearestSlotChange?: (slotCode: string | null) => void;
    onDropped: (finalPos: [number, number, number]) => void;
}

export interface UseDragRackResult {
    outerGroupRef: React.RefObject<THREE.Group>;
    isDragging: boolean;
    isDraggingRef: React.MutableRefObject<boolean>;
    lerpTarget: React.MutableRefObject<THREE.Vector3 | null>;
    handlePointerDown: (e: ThreeEvent<PointerEvent>) => void;
    lerpTo: (pos: [number, number, number]) => void;
}

export function useDragRack({
    rack, slots, isEditMode, isDeleteMode, pendingPosition,
    onDragStateChange, onNearestSlotChange, onDropped,
}: UseDragRackOptions): UseDragRackResult {
    const { camera, gl } = useThree();
    const outerGroupRef = useRef<THREE.Group>(null!);
    const isDraggingRef = useRef(false);
    const dragOffset    = useRef({ x: 0, z: 0 });
    const lerpTarget    = useRef<THREE.Vector3 | null>(null);

    const [isDragging, setIsDragging] = useState(false);

    const floorPlane = useMemo(() => new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), []);
    const raycaster  = useMemo(() => new THREE.Raycaster(), []);

    useFrame(() => {
        if (!lerpTarget.current || !outerGroupRef.current) return;
        outerGroupRef.current.position.lerp(lerpTarget.current, LERP_SPEED);
        if (outerGroupRef.current.position.distanceTo(lerpTarget.current) < LERP_THRESHOLD) {
            outerGroupRef.current.position.copy(lerpTarget.current);
            lerpTarget.current = null;
        }
    });

    const getFloorPos = useCallback(
        (clientX: number, clientY: number): THREE.Vector3 | null => {
            const rect = gl.domElement.getBoundingClientRect();
            const ndc = new THREE.Vector2(
                ((clientX - rect.left) / rect.width) * 2 - 1,
                -((clientY - rect.top) / rect.height) * 2 + 1,
            );
            raycaster.setFromCamera(ndc, camera);
            const point = new THREE.Vector3();
            return raycaster.ray.intersectPlane(floorPlane, point) ? point : null;
        },
        [camera, gl, floorPlane, raycaster],
    );

    const handlePointerDown = useCallback(
        (e: ThreeEvent<PointerEvent>) => {
            if (!isEditMode || isDeleteMode || pendingPosition) return;
            e.stopPropagation();
            const floorPos = getFloorPos(e.clientX, e.clientY);
            if (!floorPos) return;
            dragOffset.current = {
                x: floorPos.x - outerGroupRef.current.position.x,
                z: floorPos.z - outerGroupRef.current.position.z,
            };
            lerpTarget.current    = null;
            isDraggingRef.current = true;
            setIsDragging(true);
            onDragStateChange?.(rack.id, true);
        },
        [isEditMode, isDeleteMode, pendingPosition, getFloorPos, onDragStateChange, rack.id],
    );

    useEffect(() => {
        if (!isDragging) return;

        const handleMove = (e: PointerEvent) => {
            const floorPos = getFloorPos(e.clientX, e.clientY);
            if (!floorPos || !outerGroupRef.current) return;
            const newX = floorPos.x - dragOffset.current.x;
            const newZ = floorPos.z - dragOffset.current.z;
            outerGroupRef.current.position.set(newX, DRAG_FLOAT_Y, newZ);
            const nearest = nearestAvailableSlot([newX, 0, newZ], slots, rack.id);
            onNearestSlotChange?.(nearest?.slotCode ?? null);
        };

        const handleUp = () => {
            if (!outerGroupRef.current) return;
            const x = outerGroupRef.current.position.x;
            const z = outerGroupRef.current.position.z;
            const nearest   = nearestAvailableSlot([x, 0, z], slots, rack.id);
            const finalPos: [number, number, number] = nearest
                ? nearest.position
                : [Math.round(x), 0, Math.round(z)];

            const original   = rack.position ?? [0, 0, 0];
            const isSameSlot =
                Math.abs(finalPos[0] - original[0]) < 0.01 &&
                Math.abs(finalPos[2] - original[2]) < 0.01;

            lerpTarget.current    = new THREE.Vector3(...(isSameSlot ? original : finalPos));
            isDraggingRef.current = false;
            setIsDragging(false);
            onNearestSlotChange?.(null);
            onDragStateChange?.(rack.id, false);
            if (!isSameSlot) onDropped(finalPos);
        };

        window.addEventListener('pointermove', handleMove);
        window.addEventListener('pointerup',   handleUp);
        return () => {
            window.removeEventListener('pointermove', handleMove);
            window.removeEventListener('pointerup',   handleUp);
        };
    }, [isDragging, getFloorPos, slots, rack.id, rack.position, onNearestSlotChange, onDragStateChange, onDropped]);

    const lerpTo = useCallback((pos: [number, number, number]) => {
        lerpTarget.current = new THREE.Vector3(...pos);
    }, []);

    return { outerGroupRef, isDragging, isDraggingRef, lerpTarget, handlePointerDown, lerpTo };
}