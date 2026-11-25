type Vector = [number, number, number];
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
    <mesh position={position} castShadow receiveShadow>
      <boxGeometry args={size} />
      <meshStandardMaterial
        color={color}
        roughness={0.65}
        metalness={0.3}
        emissive={glow ? color : "#000000"}
        emissiveIntensity={glow ? 0.5 : 0}
      />
    </mesh>
  );
}
