import * as THREE from 'three';
import { useEffect, useMemo } from 'react';
import type { FloorSpec } from '../../types';

interface RoomFloorProps {
    floor: FloorSpec;
}

const FLOOR_Y        = -1.4;
const THICKNESS      = 0.3;
const WALL_H         = 0.62;
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

        ctx.fillStyle = '#182739';
        ctx.fillRect(0, 0, size, size);

        // Subtle inner brushed tile bevel
        ctx.fillStyle = 'rgba(255,255,255,0.018)';
        ctx.fillRect(size * 0.05, size * 0.05, size * 0.90, size * 0.90);

        // Raised-floor tile seam & corner fasteners
        ctx.strokeStyle = '#2d435b';
        ctx.lineWidth = size * 0.018;
        ctx.strokeRect(size * 0.012, size * 0.012, size - size * 0.024, size - size * 0.024);

        ctx.fillStyle = '#3b5573';
        const dot = size * 0.055;
        for (const [dx, dy] of [[dot, dot], [size - dot, dot], [dot, size - dot], [size - dot, size - dot]]) {
            ctx.beginPath();
            ctx.arc(dx, dy, size * 0.012, 0, Math.PI * 2);
            ctx.fill();
        }

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
            {/* Floor slab + lower structural plinth trim */}
            <mesh position={[0, SLAB_Y, 0]} receiveShadow>
                <boxGeometry args={[floorWidth, THICKNESS, floorDepth]} />
                <meshStandardMaterial map={tileTexture} roughness={0.78} metalness={0.12} />
            </mesh>
            <mesh position={[0, SLAB_Y - THICKNESS / 2 - 0.03, 0]}>
                <boxGeometry args={[floorWidth + 0.16, 0.06, floorDepth + 0.16]} />
                <meshStandardMaterial color="#0d1827" roughness={0.85} metalness={0.35} />
            </mesh>

            {/* Baseboards */}
            <Baseboard position={[0,      FLOOR_Y + 0.06, -HALF_D]} size={[floorWidth, 0.18, 0.08]} />
            <Baseboard position={[0,      FLOOR_Y + 0.04,  HALF_D]} size={[floorWidth, 0.12, 0.08]} />
            <Baseboard position={[-HALF_W, FLOOR_Y + 0.06, 0]}      size={[0.08, 0.18, floorDepth]} />
            <Baseboard position={[ HALF_W, FLOOR_Y + 0.06, 0]}      size={[0.08, 0.18, floorDepth]} />

            {/* Front entrance threshold accent bar (+Z side) */}
            <mesh position={[0, FLOOR_Y + 0.015, HALF_D + 0.045]}>
                <boxGeometry args={[Math.min(2.6, floorWidth * 0.28), 0.03, 0.04]} />
                <meshStandardMaterial color="#38bdf8" emissive="#38bdf8" emissiveIntensity={1.1} toneMapped={false} />
            </mesh>

            {/* Corner architectural columns */}
            {([-HALF_W, HALF_W] as const).flatMap((x) =>
                ([-HALF_D, HALF_D] as const).map((z) => (
                    <mesh key={`col-${x}-${z}`} position={[x, FLOOR_Y + (z < 0 ? WALL_H / 2 + 0.04 : 0.12), z]} castShadow>
                        <boxGeometry args={[0.14, z < 0 ? WALL_H + 0.08 : 0.24, 0.14]} />
                        <meshStandardMaterial color="#334a63" metalness={0.65} roughness={0.35} />
                    </mesh>
                )),
            )}

            {/* Glass partition walls — back, left, right (front open) with brushed aluminum top rail */}
            <GlassWall position={[0,      WALL_CENTER_Y, -HALF_D]} size={[floorWidth, WALL_H, 0.06]} />
            <GlassWall position={[-HALF_W, WALL_CENTER_Y, 0]}      size={[0.06, WALL_H, floorDepth]} />
            <GlassWall position={[ HALF_W, WALL_CENTER_Y, 0]}      size={[0.06, WALL_H, floorDepth]} />

            <WallRail position={[0,       FLOOR_Y + WALL_H + 0.02, -HALF_D]} size={[floorWidth + 0.08, 0.04, 0.09]} />
            <WallRail position={[-HALF_W, FLOOR_Y + WALL_H + 0.02, 0]}       size={[0.09, 0.04, floorDepth + 0.08]} />
            <WallRail position={[ HALF_W, FLOOR_Y + WALL_H + 0.02, 0]}       size={[0.09, 0.04, floorDepth + 0.08]} />
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
            <meshStandardMaterial color="#364e67" roughness={0.7} metalness={0.35} />
        </mesh>
    );
}

function WallRail({ position, size }: {
    position: [number, number, number];
    size:     [number, number, number];
}) {
    return (
        <mesh position={position} castShadow>
            <boxGeometry args={size} />
            <meshStandardMaterial color="#4e6b88" roughness={0.35} metalness={0.75} />
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
                color="#9cd8f0"
                transparent opacity={0.18} roughness={0.06} metalness={0.1}
                transmission={0.7} thickness={0.25} ior={1.5} depthWrite={false}
            />
        </mesh>
    );
}