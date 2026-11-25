import type { RackData } from "../../types";

type Vector = [number, number, number];
function Part({
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

/** Procedural silhouettes; decorative rack panels do not represent installed equipment. */
export function StationModel({
  rack,
  color,
}: {
  rack: RackData;
  color: string;
}) {
  const [w, h, d] = rack.dimensions;
  const kind = rack.modelKind;
  return (
    <group position={[0, -1.4, 0]} rotation={[0, rack.rotation, 0]}>
      <Part
        position={[0, 0.035, 0]}
        size={[w + 0.08, 0.07, d + 0.08]}
        color="#172638"
      />
      {kind === "table" || kind === "shelf" ? (
        <>
          {[-1, 1].flatMap((x) =>
            [-1, 1].map((z) => (
              <Part
                key={`${x}-${z}`}
                position={[x * (w / 2 - 0.06), h / 2, z * (d / 2 - 0.06)]}
                size={[0.07, h, 0.07]}
                color="#64748b"
              />
            )),
          )}
          {(kind === "table" ? [h] : [0.15, h * 0.36, h * 0.68, h]).map((y) => (
            <Part
              key={y}
              position={[0, y, 0]}
              size={[w, 0.07, d]}
              color={kind === "table" ? "#b6a589" : "#71879a"}
            />
          ))}
          <Part
            position={[0, h - 0.09, d / 2]}
            size={[w, 0.06, 0.035]}
            color={color}
            glow
          />
          {kind === "table" && (
            <Part
              position={[0, h * 0.25, -d / 2 + 0.06]}
              size={[w, 0.08, 0.06]}
              color="#64748b"
            />
          )}
        </>
      ) : (
        <>
          <Part
            position={[0, h / 2, 0]}
            size={[w, h, d]}
            color={kind === "generic" ? "#66788a" : "#253549"}
          />
          <Part
            position={[0, h / 2, d / 2 + 0.012]}
            size={[w * 0.85, h * 0.87, 0.025]}
            color="#122031"
          />
          {kind === "rack" &&
            Array.from({ length: 12 }, (_, i) => (
              <Part
                key={i}
                position={[0, h * (0.12 + i * 0.065), d / 2 + 0.03]}
                size={[w * 0.74, h * 0.038, 0.025]}
                color="#3b5066"
              />
            ))}
          {kind === "cabinet" && (
            <Part
              position={[w * 0.28, h * 0.52, d / 2 + 0.04]}
              size={[0.035, h * 0.15, 0.04]}
              color="#9bafc2"
            />
          )}
          <Part
            position={[0, h - 0.07, d / 2 + 0.03]}
            size={[w * 0.85, 0.045, 0.04]}
            color={color}
            glow
          />
          <Part
            position={[0, h + 0.025, 0]}
            size={[w + 0.04, 0.05, d + 0.04]}
            color="#42566c"
          />
        </>
      )}
    </group>
  );
}
