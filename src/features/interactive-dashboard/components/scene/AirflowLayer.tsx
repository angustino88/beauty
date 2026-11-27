import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { RackData } from "../../types";
import { RACK_THRESHOLDS } from "../../config/rackThresholds";
import { heatColor, normalise } from "../../utils/overlays";

const FLOOR_Y = -1.4;
const PARTICLES_PER_STATION = 14;

interface ParticleSeed {
  stationPos: [number, number, number];
  rotation: number;
  width: number;
  height: number;
  depth: number;
  kind: "intake" | "exhaust";
  phase: number;
  laneX: number;
  laneY: number;
  speed: number;
  tempNorm: number;
}

/**
 * Animated 3D DCIM thermal airflow visualization using a single instanced draw call:
 * cool blue intake streams enter the front (+Z) of each station, and warm-to-hot exhaust
 * plumes rise from the rear/top scaled by live temperature.
 */
export function AirflowLayer({ racks }: { racks: RackData[] }) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  const seeds = useMemo<ParticleSeed[]>(() => {
    const list: ParticleSeed[] = [];
    for (const rack of racks) {
      if (!rack.position) continue;
      // Show airflow primarily on racks and active stations with power/temp telemetry.
      const isThermalRelevant =
        rack.modelKind === "rack" ||
        rack.temperature != null ||
        (rack.powerUsage != null && rack.powerUsage > 0);
      if (!isThermalRelevant) continue;

      const tempNorm =
        rack.temperature != null
          ? normalise(rack.temperature, [18, RACK_THRESHOLDS.temperature.critical])
          : 0.35;
      const [w, h, d] = rack.dimensions;

      for (let i = 0; i < PARTICLES_PER_STATION; i++) {
        const intake = i < PARTICLES_PER_STATION / 2;
        const idx = intake ? i : i - PARTICLES_PER_STATION / 2;
        const half = PARTICLES_PER_STATION / 2;
        list.push({
          stationPos: rack.position,
          rotation: rack.rotation,
          width: w,
          height: h,
          depth: d,
          kind: intake ? "intake" : "exhaust",
          phase: (idx / half) + ((rack.id * 0.17) % 1),
          laneX: (((idx * 37) % 11) / 10 - 0.5) * Math.min(w * 0.68, 0.7),
          laneY: 0.18 + (((idx * 53) % 10) / 10) * Math.max(0.4, h * 0.62),
          speed: intake ? 0.42 : 0.48 + tempNorm * 0.35,
          tempNorm,
        });
      }
    }
    return list;
  }, [racks]);

  useEffect(() => {
    const mesh = meshRef.current;
    if (!mesh || !seeds.length) return;
    const color = new THREE.Color();
    seeds.forEach((seed, index) => {
      if (seed.kind === "intake") {
        color.set("#38bdf8");
      } else {
        const [r, g, b] = heatColor(Math.max(0.45, seed.tempNorm));
        color.setRGB(r / 255, g / 255, b / 255);
      }
      mesh.setColorAt(index, color);
    });
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }, [seeds]);

  useFrame(({ clock }) => {
    const mesh = meshRef.current;
    if (!mesh || !seeds.length) return;
    const t = clock.elapsedTime;
    for (let i = 0; i < seeds.length; i++) {
      const s = seeds[i];
      const u = (t * s.speed + s.phase) % 1;
      let lx = s.laneX;
      let ly: number;
      let lz: number;
      let scaleY: number;

      if (s.kind === "intake") {
        // Horizontal cool air drawn into front (+Z) of station.
        lz = s.depth * 0.5 + 0.78 * (1 - u);
        ly = s.laneY;
        scaleY = 0.05 + Math.sin(u * Math.PI) * 0.06;
      } else {
        // Warm/hot exhaust exiting rear (-Z) and buoyantly rising upward.
        lz = -(s.depth * 0.5 + 0.14 + u * 0.52);
        ly = s.laneY + u * (0.75 + s.tempNorm * 0.65);
        lx += Math.sin(u * Math.PI * 2 + s.phase * 6) * 0.04;
        scaleY = 0.07 + Math.sin(u * Math.PI) * 0.12;
      }

      const cos = Math.cos(s.rotation);
      const sin = Math.sin(s.rotation);
      const wx = s.stationPos[0] + lx * cos + lz * sin;
      const wz = s.stationPos[2] - lx * sin + lz * cos;
      const wy = FLOOR_Y + ly;

      dummy.position.set(wx, wy, wz);
      if (s.kind === "intake") {
        dummy.rotation.set(Math.PI / 2, s.rotation, 0);
        dummy.scale.set(0.035, 0.24 * Math.sin(u * Math.PI) + 0.04, 0.035);
      } else {
        dummy.rotation.set(0, 0, 0);
        dummy.scale.set(0.048, scaleY * 2.2, 0.048);
      }
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
  });

  if (!seeds.length) return null;

  return (
    <instancedMesh
      ref={meshRef}
      args={[undefined, undefined, seeds.length]}
      frustumCulled={false}
      renderOrder={2}
    >
      <coneGeometry args={[0.7, 1.8, 6]} />
      <meshBasicMaterial transparent opacity={0.72} depthWrite={false} toneMapped={false} />
    </instancedMesh>
  );
}
