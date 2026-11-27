import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { ContactShadows, Environment, Lightformer, OrbitControls } from "@react-three/drei";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import * as THREE from "three";
import type { RackData } from "../../types";
import { categoryColor } from "../../utils/categoryColor";
import { findContiguousFreeU } from "../../utils/dcimMetrics";
import { SceneText } from "./SceneText";

type RackView = "iso" | "front" | "rear";

const RACK_W = 0.64;
const RACK_H = 2.04;
const RACK_D = 1.02;

function InspectorCamera({ view }: { view: RackView }) {
  const controls = useRef<OrbitControlsImpl>(null);
  const goal = useRef<THREE.Vector3 | null>(null);

  useEffect(() => {
    goal.current =
      view === "front"
        ? new THREE.Vector3(0, RACK_H * 0.5, 3.25)
        : view === "rear"
          ? new THREE.Vector3(0, RACK_H * 0.5, -3.25)
          : new THREE.Vector3(2.2, RACK_H * 0.62, 2.85);
  }, [view]);

  useFrame((state, delta) => {
    if (!goal.current || !controls.current) return;
    const t = 1 - Math.exp(-delta * 6);
    state.camera.position.lerp(goal.current, t);
    controls.current.target.lerp(new THREE.Vector3(0, RACK_H * 0.5, 0), t);
    controls.current.update();
    if (state.camera.position.distanceToSquared(goal.current) < 1e-4) {
      goal.current = null;
    }
  });

  return (
    <OrbitControls
      ref={controls}
      makeDefault
      target={[0, RACK_H * 0.5, 0]}
      minDistance={1.2}
      maxDistance={7.5}
      maxPolarAngle={Math.PI * 0.54}
      onStart={() => {
        goal.current = null;
      }}
    />
  );
}

function RackChassis3D({
  units,
  items,
  selectedId,
  onSelect,
  xray,
  showFreeBlocks,
  faceFilter,
}: {
  units: number;
  items: NonNullable<RackData["rackItems"]>;
  selectedId: number | null;
  onSelect: (id: number) => void;
  xray: boolean;
  showFreeBlocks: boolean;
  faceFilter: "front" | "rear";
}) {
  const bottom = 0.12;
  const usableH = RACK_H - 0.24;
  const unitH = usableH / units;
  const freeRanges = useMemo(
    () => findContiguousFreeU(units, items, faceFilter),
    [units, items, faceFilter],
  );

  return (
    <group>
      {/* Plinth and roof */}
      <mesh position={[0, 0.05, 0]} castShadow receiveShadow>
        <boxGeometry args={[RACK_W, 0.1, RACK_D]} />
        <meshStandardMaterial color="#1e2f44" metalness={0.5} roughness={0.45} />
      </mesh>
      <mesh position={[0, RACK_H - 0.05, 0]} castShadow>
        <boxGeometry args={[RACK_W, 0.1, RACK_D]} />
        <meshStandardMaterial color="#1e2f44" metalness={0.5} roughness={0.45} />
      </mesh>
      {/* Corner frame uprights */}
      {[-1, 1].flatMap((sx) =>
        [-1, 1].map((sz) => (
          <mesh
            key={`${sx}-${sz}`}
            position={[sx * (RACK_W / 2 - 0.025), RACK_H / 2, sz * (RACK_D / 2 - 0.025)]}
            castShadow
          >
            <boxGeometry args={[0.045, RACK_H - 0.2, 0.045]} />
            <meshStandardMaterial color="#2b3f57" metalness={0.6} roughness={0.4} />
          </mesh>
        )),
      )}
      {/* Side panels (translucent in X-Ray mode) */}
      {[-1, 1].map((sx) => (
        <mesh key={sx} position={[sx * (RACK_W / 2 - 0.008), RACK_H / 2, 0]}>
          <boxGeometry args={[0.014, RACK_H - 0.2, RACK_D - 0.1]} />
          <meshStandardMaterial
            color="#263950"
            metalness={0.45}
            roughness={0.5}
            transparent={xray}
            opacity={xray ? 0.14 : 0.92}
            depthWrite={!xray}
          />
        </mesh>
      ))}
      {/* Mounting rails (front and rear) */}
      {[-1, 1].flatMap((sx) =>
        [-1, 1].map((sz) => (
          <mesh
            key={`rail-${sx}-${sz}`}
            position={[sx * (RACK_W / 2 - 0.06), bottom + usableH / 2, sz * (RACK_D / 2 - 0.06)]}
          >
            <boxGeometry args={[0.022, usableH, 0.014]} />
            <meshStandardMaterial color="#94a3b8" metalness={0.85} roughness={0.3} />
          </mesh>
        )),
      )}
      {/* U-number ruler along front-left & rear-right rails */}
      {Array.from({ length: units }, (_, i) => i + 1)
        .filter((u) => u === 1 || u === units || u % 5 === 0)
        .map((u) => {
          const y = bottom + (u - 0.5) * unitH;
          return (
            <group key={`u-${u}`}>
              <SceneText
                position={[-RACK_W / 2 - 0.04, y, RACK_D / 2 - 0.03]}
                fontSize={0.032}
                color="#7dd3fc"
                anchorX="right"
                anchorY="middle"
              >
                {`U${u}`}
              </SceneText>
              <SceneText
                position={[RACK_W / 2 + 0.04, y, -(RACK_D / 2 - 0.03)]}
                rotation={[0, Math.PI, 0]}
                fontSize={0.032}
                color="#7dd3fc"
                anchorX="right"
                anchorY="middle"
              >
                {`U${u}`}
              </SceneText>
            </group>
          );
        })}

      {/* Free contiguous U blocks */}
      {showFreeBlocks &&
        freeRanges.map((range) => {
          const h = range.sizeU * unitH * 0.96;
          const y = bottom + (range.startU - 1) * unitH + (range.sizeU * unitH) / 2;
          const z = faceFilter === "rear" ? -(RACK_D / 2 - 0.07) : RACK_D / 2 - 0.07;
          return (
            <group key={`free-${range.startU}`} position={[0, y, z]}>
              <mesh>
                <boxGeometry args={[RACK_W - 0.14, h, 0.024]} />
                <meshBasicMaterial color="#10b981" transparent opacity={0.18} depthWrite={false} />
              </mesh>
              {range.sizeU >= 2 && (
                <SceneText
                  position={[0, 0, faceFilter === "rear" ? -0.016 : 0.016]}
                  rotation={[0, faceFilter === "rear" ? Math.PI : 0, 0]}
                  fontSize={0.036}
                  color="#6ee7b7"
                  anchorX="center"
                  anchorY="middle"
                >
                  {`${range.sizeU}U FREE (U${range.startU}–${range.endU})`}
                </SceneText>
              )}
            </group>
          );
        })}

      {/* Mounted equipment chassis */}
      {items.map((item) => {
        const isRear = (item.rack_face || "front").toLowerCase() === "rear";
        const faceSign = isRear ? -1 : 1;
        const h = Math.max(0.02, item.rack_unit_height * unitH * 0.92);
        const y = bottom + (item.rack_unit - 1) * unitH + (item.rack_unit_height * unitH) / 2;
        const depth = isRear ? RACK_D * 0.34 : RACK_D * 0.78;
        const z = faceSign * (RACK_D / 2 - depth / 2 - 0.05);
        const accent = categoryColor(item.category);
        const isSelected = selectedId === item.equipment_id;
        return (
          <group
            key={item.equipment_id}
            position={[0, y, z]}
            onClick={(e) => {
              if (e.delta < 5) {
                e.stopPropagation();
                onSelect(item.equipment_id);
              }
            }}
          >
            {/* Main chassis body */}
            <mesh castShadow receiveShadow>
              <boxGeometry args={[RACK_W - 0.14, h, depth]} />
              <meshStandardMaterial
                color={isSelected ? "#1d3a5c" : "#162436"}
                metalness={0.65}
                roughness={0.4}
                emissive={isSelected ? "#38bdf8" : "#000000"}
                emissiveIntensity={isSelected ? 0.35 : 0}
              />
            </mesh>
            {/* Front bezel & category strip */}
            <mesh position={[0, 0, faceSign * (depth / 2 + 0.004)]}>
              <boxGeometry args={[RACK_W - 0.12, h * 0.94, 0.008]} />
              <meshStandardMaterial color="#0f1b2b" metalness={0.5} roughness={0.45} />
            </mesh>
            <mesh position={[-(RACK_W - 0.16) / 2 + 0.015, 0, faceSign * (depth / 2 + 0.01)]}>
              <boxGeometry args={[0.018, h * 0.72, 0.006]} />
              <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={1.2} toneMapped={false} />
            </mesh>
            {/* Status LED */}
            <mesh position={[(RACK_W - 0.16) / 2 - 0.025, 0, faceSign * (depth / 2 + 0.01)]}>
              <boxGeometry args={[0.014, Math.min(0.014, h * 0.35), 0.006]} />
              <meshStandardMaterial color="#34d399" emissive="#34d399" emissiveIntensity={1.6} toneMapped={false} />
            </mesh>
            {/* Unit label on bezel */}
            <SceneText
              position={[0, 0, faceSign * (depth / 2 + 0.012)]}
              rotation={[0, isRear ? Math.PI : 0, 0]}
              fontSize={Math.min(0.032, h * 0.45)}
              color={isSelected ? "#e0f2fe" : "#cbd5e1"}
              anchorX="center"
              anchorY="middle"
            >
              {(item.name || item.sku).slice(0, 18)}
            </SceneText>
          </group>
        );
      })}
    </group>
  );
}

export function RackInspector({
  station,
  initialEquipmentId,
  onClose,
}: {
  station: RackData;
  initialEquipmentId?: number | null;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const units = station.capacity?.rack_units ?? 42;
  const items = useMemo(() => station.rackItems ?? [], [station.rackItems]);
  const [selectedId, setSelectedId] = useState<number | null>(
    initialEquipmentId ?? items[0]?.equipment_id ?? null,
  );
  const [view, setView] = useState<RackView>("iso");
  const [xray, setXray] = useState(false);
  const [showFree, setShowFree] = useState(true);

  useEffect(() => {
    const dialog = ref.current;
    dialog?.showModal();
    return () => dialog?.close();
  }, []);

  const selectedItem = items.find((i) => i.equipment_id === selectedId) ?? null;
  const faceFilter: "front" | "rear" = view === "rear" ? "rear" : "front";
  const freeRanges = useMemo(
    () => findContiguousFreeU(units, items, faceFilter),
    [units, items, faceFilter],
  );
  const maxFreeU = freeRanges.reduce((best, r) => Math.max(best, r.sizeU), 0);
  const powerRated = station.capacity?.power_capacity_w ?? 0;

  return (
    <dialog
      ref={ref}
      className="dcim-bench-dialog dcim-rack-dialog"
      aria-label={`${station.name} 3D Rack Elevation`}
      onCancel={onClose}
    >
      <header>
        <div>
          <small>
            3D RACK ELEVATION · {units}U · SLOT {station.slotCode ?? "UNPLACED"}
          </small>
          <h2>{station.name}</h2>
        </div>
        <div className="dcim-inspector-controls">
          {(["iso", "front", "rear"] as const).map((v) => (
            <button
              key={v}
              aria-pressed={view === v}
              onClick={() => setView(v)}
            >
              {v === "iso" ? "3D" : v === "front" ? "Front" : "Rear"}
            </button>
          ))}
          <button aria-pressed={xray} onClick={() => setXray((x) => !x)}>
            X-Ray
          </button>
          <button aria-pressed={showFree} onClick={() => setShowFree((f) => !f)}>
            Free U
          </button>
          <button autoFocus onClick={onClose}>
            Close
          </button>
        </div>
      </header>

      <div className="dcim-bench-canvas">
        <Canvas camera={{ position: [2.2, 1.28, 2.85], fov: 40 }} shadows dpr={[1, 2]}>
          <color attach="background" args={["#0b1523"]} />
          <Environment resolution={256} frames={1}>
            <Lightformer form="rect" intensity={2.4} color="#dceeff" position={[0, 4, 2]} scale={[6, 6, 1]} />
            <Lightformer form="rect" intensity={1.4} color="#7dd3fc" position={[4, 2, 2]} rotation-y={-Math.PI / 2} scale={[4, 4, 1]} />
            <Lightformer form="rect" intensity={1.2} color="#6ee7f9" position={[-3, 2, -2]} rotation-y={Math.PI / 2} scale={[4, 3, 1]} />
          </Environment>
          <ambientLight intensity={0.65} />
          <hemisphereLight args={["#dbeafe", "#273b54", 1.1]} />
          <directionalLight position={[3, 5, 4]} intensity={2.0} castShadow />
          <directionalLight position={[-3, 3, -4]} intensity={1.0} color="#93c5fd" />
          <RackChassis3D
            units={units}
            items={items}
            selectedId={selectedId}
            onSelect={setSelectedId}
            xray={xray}
            showFreeBlocks={showFree}
            faceFilter={faceFilter}
          />
          <ContactShadows position={[0, 0.002, 0]} scale={4} blur={2.2} opacity={0.6} color="#020617" />
          <InspectorCamera view={view} />
        </Canvas>
      </div>

      <footer className="dcim-rack-dialog-footer">
        <label>
          Mounted unit{" "}
          <select
            value={selectedId ?? ""}
            onChange={(e) => setSelectedId(e.target.value ? Number(e.target.value) : null)}
          >
            <option value="">
              {items.length ? "Select mounted unit" : "No rack-mounted units"}
            </option>
            {items.map((item) => (
              <option key={item.equipment_id} value={item.equipment_id}>
                U{item.rack_unit}
                {item.rack_unit_height > 1 ? `–${item.rack_unit + item.rack_unit_height - 1}` : ""} ·{" "}
                {item.name || item.sku} ({item.rack_face || "front"})
              </option>
            ))}
          </select>
        </label>
        <div className="dcim-rack-dialog-meta">
          {selectedItem ? (
            <span>
              <strong>
                U{selectedItem.rack_unit}
                {selectedItem.rack_unit_height > 1
                  ? `–${selectedItem.rack_unit + selectedItem.rack_unit_height - 1}`
                  : ""}{" "}
                ({selectedItem.rack_unit_height}U · {selectedItem.rack_face || "front"})
              </strong>{" "}
              · {selectedItem.category || "Uncategorized"} · {selectedItem.sku}
              {selectedItem.power_draw_w != null && (
                <>
                  {" "}
                  · {selectedItem.power_draw_w} W
                  {powerRated > 0 ? ` (${Math.round((selectedItem.power_draw_w / powerRated) * 100)}% of rack)` : ""}
                </>
              )}
            </span>
          ) : (
            <span>Click any chassis in 3D to inspect specs.</span>
          )}
          <small>
            Max contiguous free ({faceFilter}): <strong>{maxFreeU}U</strong>
          </small>
        </div>
      </footer>
    </dialog>
  );
}
