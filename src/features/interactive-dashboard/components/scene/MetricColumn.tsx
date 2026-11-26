import { heatHex } from "../../utils/overlays";

/** Glowing column beside a station whose height and colour show the selected metric (0–1). */
export function MetricColumn({ level, offset }: { level: number; offset: [number, number] }) {
  const height = 0.25 + level * 2.6;
  const color = heatHex(level);
  return (
    <group position={[offset[0], -1.4, offset[1]]}>
      <mesh position={[0, 0.02, 0]}>
        <cylinderGeometry args={[0.2, 0.2, 0.04, 24]} />
        <meshStandardMaterial color="#1e293b" metalness={0.6} roughness={0.3} />
      </mesh>
      <mesh position={[0, height / 2 + 0.04, 0]}>
        <cylinderGeometry args={[0.11, 0.11, height, 24]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={1.4} transparent opacity={0.9} toneMapped={false} />
      </mesh>
    </group>
  );
}
