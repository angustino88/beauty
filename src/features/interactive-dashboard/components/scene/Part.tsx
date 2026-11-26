import { BoxGeometry, MeshStandardMaterial } from "three";

type Vector = [number, number, number];

// Every schematic part is a scaled unit box. Sharing one geometry and one material per colour keeps GPU memory
// and shader programs constant however many stations, benches and devices a room shows.
const UNIT_BOX = new BoxGeometry(1, 1, 1);
const materials = new Map<string, MeshStandardMaterial>();

function material(color: string, glow: boolean) {
  const key = `${color}:${glow ? 1 : 0}`;
  let cached = materials.get(key);
  if (!cached) {
    cached = new MeshStandardMaterial({
      color,
      roughness: 0.58,
      metalness: 0.35,
      emissive: glow ? color : "#000000",
      // Above the bloom threshold, so status strips glow softly.
      emissiveIntensity: glow ? 1.6 : 0,
      toneMapped: !glow,
    });
    materials.set(key, cached);
  }
  return cached;
}

export function Part({
  position,
  size,
  color,
  glow = false,
}: {
  position: Vector;
  size: Vector;
  color: string;
  glow?: boolean;
}) {
  return (
    <mesh
      position={position}
      scale={size}
      geometry={UNIT_BOX}
      material={material(color, glow)}
      castShadow
      receiveShadow
    />
  );
}
