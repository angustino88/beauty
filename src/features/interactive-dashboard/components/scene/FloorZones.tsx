import { SceneText as Text } from "./SceneText";
import { useEffect, useMemo } from "react";
import { CanvasTexture, EdgesGeometry, PlaneGeometry, RepeatWrapping } from "three";
import type { FloorSpec, SlotAnchor } from "../../types";
import { FLOOR_Z_OFFSET, rowLabel } from "../../utils/slotGrid";

const FLOOR_Y = -1.392;
const FLAT: [number, number, number] = [-Math.PI / 2, 0, 0];
const UNIT_PLANE = new PlaneGeometry(1, 1);
const UNIT_EDGES = new EdgesGeometry(new PlaneGeometry(1, 1));

/** How each non-station or unusable slot is drawn on the floor. */
const ZONES: Record<string, { label: string; color: string; fill: number; hatch?: string }> = {
  aisle: { label: "AISLE", color: "#64748b", fill: 0.22 },
  safety: { label: "SAFETY", color: "#facc15", fill: 0.12, hatch: "#facc15" },
  utility: { label: "UTILITY", color: "#22d3ee", fill: 0.14 },
  reserved: { label: "RESERVED", color: "#a78bfa", fill: 0.12 },
  storage: { label: "STORAGE", color: "#94a3b8", fill: 0.18 },
  blocked: { label: "BLOCKED", color: "#f87171", fill: 0.12, hatch: "#f87171" },
  retired: { label: "RETIRED", color: "#64748b", fill: 0.1, hatch: "#64748b" },
};

function useHatch(color: string | undefined) {
  const texture = useMemo(() => {
    if (!color) return null;
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = 64;
    const context = canvas.getContext("2d")!;
    context.strokeStyle = color;
    context.globalAlpha = 0.55;
    context.lineWidth = 8;
    for (let offset = -64; offset <= 64; offset += 22) {
      context.beginPath();
      context.moveTo(offset, 64);
      context.lineTo(offset + 64, 0);
      context.stroke();
    }
    const result = new CanvasTexture(canvas);
    result.wrapS = result.wrapT = RepeatWrapping;
    return result;
  }, [color]);
  useEffect(() => () => texture?.dispose(), [texture]);
  return texture;
}

function Zone({ slot, kind }: { slot: SlotAnchor; kind: keyof typeof ZONES }) {
  const zone = ZONES[kind];
  const hatch = useHatch(zone.hatch);
  const [w, d] = slot.size;
  if (hatch) hatch.repeat.set(Math.max(1, w * 3), Math.max(1, d * 3));
  return (
    <group position={[slot.position[0], 0, slot.position[2]]} rotation={[0, slot.rotation, 0]}>
      <mesh geometry={UNIT_PLANE} rotation={FLAT} scale={[w, d, 1]} position={[0, FLOOR_Y, 0]}>
        <meshBasicMaterial color={zone.color} transparent opacity={zone.fill} depthWrite={false} />
      </mesh>
      {hatch && (
        <mesh geometry={UNIT_PLANE} rotation={FLAT} scale={[w, d, 1]} position={[0, FLOOR_Y + 0.001, 0]}>
          <meshBasicMaterial map={hatch} transparent depthWrite={false} />
        </mesh>
      )}
      <lineSegments geometry={UNIT_EDGES} rotation={FLAT} scale={[w, d, 1]} position={[0, FLOOR_Y + 0.002, 0]}>
        <lineBasicMaterial color={zone.color} transparent opacity={0.8} />
      </lineSegments>
      <Text
        position={[0, FLOOR_Y + 0.01, 0]}
        rotation={FLAT}
        fontSize={Math.max(0.12, Math.min(w, d) * 0.16)}
        color={zone.color}
        anchorX="center"
        anchorY="middle"
        letterSpacing={0.12}
      >
        {zone.label}
      </Text>
    </group>
  );
}

function FreeSlot({ slot }: { slot: SlotAnchor }) {
  const [w, d] = slot.size;
  return (
    <group position={[slot.position[0], 0, slot.position[2]]} rotation={[0, slot.rotation, 0]}>
      <lineSegments geometry={UNIT_EDGES} rotation={FLAT} scale={[w, d, 1]} position={[0, FLOOR_Y + 0.002, 0]}>
        <lineBasicMaterial color="#5b7896" transparent opacity={0.55} />
      </lineSegments>
      <Text
        position={[0, FLOOR_Y + 0.01, 0]}
        rotation={FLAT}
        fontSize={Math.max(0.1, Math.min(w, d) * 0.14)}
        color="#6f8aa8"
        anchorX="center"
        anchorY="middle"
      >
        {slot.slotCode}
      </Text>
    </group>
  );
}

/**
 * The room's floor plan outside edit mode: aisles, safety, utility, reserved and storage areas, blocked or
 * retired cells, and free station slots, each at its real footprint.
 */
export function FloorZones({ slots }: { slots: SlotAnchor[] }) {
  return (
    <group>
      {slots.map((slot) => {
        if (slot.status === "blocked" || slot.status === "retired") {
          return <Zone key={slot.id} slot={slot} kind={slot.status} />;
        }
        if (slot.slotType !== "station" && slot.slotType in ZONES) {
          return <Zone key={slot.id} slot={slot} kind={slot.slotType as keyof typeof ZONES} />;
        }
        return slot.occupiedRackId === null ? <FreeSlot key={slot.id} slot={slot} /> : null;
      })}
    </group>
  );
}

/** Edge labels: row letters and column numbers on a grid, or metre ticks on a measured plan. */
export function FloorRuler({ floor, slots }: { floor: FloorSpec; slots: SlotAnchor[] }) {
  const { floorWidth: w, floorDepth: d } = floor;
  const front = FLOOR_Z_OFFSET + d / 2 + 0.45;
  const left = -w / 2 - 0.45;
  const marks = useMemo(() => {
    if (floor.measured) {
      const step = Math.max(w, d) > 24 ? 5 : Math.max(w, d) > 12 ? 2 : 1;
      const xs = Array.from({ length: Math.floor(w / step) + 1 }, (_, i) => i * step);
      const zs = Array.from({ length: Math.floor(d / step) + 1 }, (_, i) => i * step);
      return {
        columns: xs.map((m) => ({ key: `x${m}`, x: -w / 2 + m, label: `${m} m` })),
        rows: zs.map((m) => ({ key: `z${m}`, z: FLOOR_Z_OFFSET - d / 2 + m, label: `${m} m` })),
      };
    }
    const columns = new Map<number, number>();
    const rows = new Map<number, number>();
    for (const slot of slots) {
      columns.set(slot.colIndex, slot.position[0]);
      rows.set(slot.rowIndex, slot.position[2]);
    }
    return {
      columns: [...columns].map(([index, x]) => ({ key: `c${index}`, x, label: String(index + 1).padStart(2, "0") })),
      rows: [...rows].map(([index, z]) => ({ key: `r${index}`, z, label: rowLabel(index) })),
    };
  }, [floor.measured, w, d, slots]);
  const size = floor.measured ? 0.28 : 0.34;
  return (
    <group>
      {marks.columns.map((mark) => (
        <Text key={mark.key} position={[mark.x, -1.39, front]} rotation={FLAT} fontSize={size} color="#7d93ad" anchorX="center" anchorY="middle">
          {mark.label}
        </Text>
      ))}
      {marks.rows.map((mark) => (
        <Text key={mark.key} position={[left, -1.39, mark.z]} rotation={FLAT} fontSize={size} color="#7d93ad" anchorX="center" anchorY="middle">
          {mark.label}
        </Text>
      ))}
    </group>
  );
}
