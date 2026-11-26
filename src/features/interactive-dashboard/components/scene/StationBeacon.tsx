import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import type { Mesh, MeshStandardMaterial } from "three";
import type { RackStatus } from "../../config/rackThresholds";
import { STATUS_COLORS } from "../../utils/stationVisual";

/** Status light above a station. Warnings pulse slowly and critical states fast; both glow through bloom. */
export function StationBeacon({ status, height }: { status: RackStatus; height: number }) {
  const halo = useRef<Mesh>(null);
  const core = useRef<MeshStandardMaterial>(null);
  const alert = status === "warning" || status === "critical";
  useFrame(({ clock }) => {
    if (!alert || !halo.current || !core.current) return;
    const speed = status === "critical" ? 5 : 2.4;
    const wave = (Math.sin(clock.elapsedTime * speed) + 1) / 2;
    halo.current.scale.setScalar(1 + wave * 1.4);
    (halo.current.material as MeshStandardMaterial).opacity = 0.45 * (1 - wave);
    core.current.emissiveIntensity = 2 + wave * 2.5;
  });
  const color = STATUS_COLORS[status];
  return (
    <group position={[0, height + 0.22, 0]}>
      <mesh>
        <sphereGeometry args={[0.09, 20, 16]} />
        <meshStandardMaterial
          ref={core}
          color={color}
          emissive={color}
          emissiveIntensity={status === "unknown" ? 0.4 : 2}
          toneMapped={false}
        />
      </mesh>
      {alert && (
        <mesh ref={halo}>
          <sphereGeometry args={[0.13, 20, 16]} />
          <meshStandardMaterial color={color} emissive={color} transparent opacity={0.4} depthWrite={false} toneMapped={false} />
        </mesh>
      )}
    </group>
  );
}
