import * as THREE from 'three';
import { useEffect, useMemo } from 'react';
import type { FloorSpec } from '../../types';

interface RoomFloorProps {
    floor: FloorSpec;
}

const FLOOR_Y        = -1.4;
const THICKNESS      = 0.3;
const WALL_H         = 0.5;
const FLOOR_Z_OFFSET = 0.5;

export function RoomFloor({ floor }: RoomFloorProps) {
    const { floorWidth, floorDepth } = floor;

    const HALF_W       = floorWidth  / 2;
    const HALF_D       = floorDepth  / 2;
    const SLAB_Y       = FLOOR_Y - THICKNESS / 2;
    const WALL_CENTER_Y = FLOOR_Y + WALL_H / 2;

    const tileTexture = useMemo(() => {
        const size = 256;
        const canvas = document.createElement('canvas');
        canvas.width  = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d')!;

        ctx.fillStyle = '#1c2c40';
        ctx.fillRect(0, 0, size, size);

        ctx.strokeStyle = '#30445b';
        ctx.lineWidth = size * 0.018;
        ctx.strokeRect(size * 0.012, size * 0.012, size - size * 0.024, size - size * 0.024);

        ctx.fillStyle = 'rgba(255,255,255,0.015)';
        ctx.fillRect(size * 0.06, size * 0.06, size * 0.88, size * 0.88);

        const tex = new THREE.CanvasTexture(canvas);
        tex.wrapS = THREE.RepeatWrapping;
        tex.wrapT = THREE.RepeatWrapping;
        // One tile per unit; on a measured plan that is a standard 600 mm raised-floor tile pattern per metre.
        tex.repeat.set(floor.measured ? floorWidth / 0.6 : floorWidth, floor.measured ? floorDepth / 0.6 : floorDepth);
        return tex;
    }, [floorWidth, floorDepth, floor.measured]);

    useEffect(() => () => tileTexture.dispose(), [tileTexture]);

    return (
        <group position={[0, 0, FLOOR_Z_OFFSET]}>
            {/* Floor slab */}
            <mesh position={[0, SLAB_Y, 0]} receiveShadow>
                <boxGeometry args={[floorWidth, THICKNESS, floorDepth]} />
                <meshStandardMaterial map={tileTexture} roughness={0.85} metalness={0.05} />
            </mesh>

            {/* Baseboards */}
            <Baseboard position={[0,      FLOOR_Y, -HALF_D]} size={[floorWidth, 0.25, 0.08]} />
            <Baseboard position={[0,      FLOOR_Y,  HALF_D]} size={[floorWidth, 0.25, 0.08]} />
            <Baseboard position={[-HALF_W, FLOOR_Y, 0]}      size={[0.08, 0.25, floorDepth]} />
            <Baseboard position={[ HALF_W, FLOOR_Y, 0]}      size={[0.08, 0.25, floorDepth]} />

            {/* Glass walls — back, left, right (front open) */}
            <GlassWall position={[0,      WALL_CENTER_Y, -HALF_D]} size={[floorWidth, WALL_H, 0.08]} />
            <GlassWall position={[-HALF_W, WALL_CENTER_Y, 0]}      size={[0.08, WALL_H, floorDepth]} />
            <GlassWall position={[ HALF_W, WALL_CENTER_Y, 0]}      size={[0.08, WALL_H, floorDepth]} />
        </group>
    );
}

function Baseboard({ position, size }: {
    position: [number, number, number];
    size:     [number, number, number];
}) {
    return (
        <mesh position={position} receiveShadow castShadow>
            <boxGeometry args={size} />
            <meshStandardMaterial color="#48647b" roughness={0.9} />
        </mesh>
    );
}

function GlassWall({ position, size }: {
    position: [number, number, number];
    size:     [number, number, number];
}) {
    return (
        <mesh position={position} castShadow receiveShadow>
            <boxGeometry args={size} />
            <meshPhysicalMaterial
                color="#c8e8f4"
                transparent opacity={0.22} roughness={0.04} metalness={0.1}
                transmission={0.75} thickness={0.3} ior={1.5} depthWrite={false}
            />
        </mesh>
    );
}