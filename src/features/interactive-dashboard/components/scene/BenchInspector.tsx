import { ImportedModel } from "../../models/ImportedModel";
import { useVisualModel } from "../../models/useVisualModel";
import { useEffect, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { ContactShadows, Environment, Lightformer, OrbitControls } from "@react-three/drei";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import * as THREE from "three";
import { BenchAssembly, type Bench } from "./BenchAssembly";
import { Part } from "./Part";

type BenchView = "iso" | "top" | "front";

function BenchCamera({ view, targetY }: { view: BenchView; targetY: number }) {
  const controls = useRef<OrbitControlsImpl>(null);
  const goal = useRef<THREE.Vector3 | null>(null);

  useEffect(() => {
    goal.current =
      view === "top"
        ? new THREE.Vector3(0, targetY + 3.8, 0.01)
        : view === "front"
          ? new THREE.Vector3(0, targetY + 0.55, 3.6)
          : new THREE.Vector3(2.8, targetY + 2.0, 3.4);
  }, [view, targetY]);

  useFrame((state, delta) => {
    if (!goal.current || !controls.current) return;
    const t = 1 - Math.exp(-delta * 6);
    state.camera.position.lerp(goal.current, t);
    controls.current.target.lerp(new THREE.Vector3(0, targetY, 0), t);
    controls.current.update();
    if (state.camera.position.distanceToSquared(goal.current) < 1e-4) {
      goal.current = null;
    }
  });

  return (
    <OrbitControls
      ref={controls}
      makeDefault
      target={[0, targetY, 0]}
      minDistance={0.6}
      maxDistance={9}
      maxPolarAngle={Math.PI * 0.5}
      onStart={() => {
        goal.current = null;
      }}
    />
  );
}

export function BenchInspector({
  bench,
  location,
  onClose,
  stationModelId,
}: {
  bench: Bench;
  location: string;
  onClose: () => void;
  /** The station's model, reused as the work surface when the bench has none of its own. */
  stationModelId?: number | null;
}) {
  const custom = useVisualModel(bench.visual_model_id);
  const stationModel = useVisualModel(stationModelId);
  const ref = useRef<HTMLDialogElement>(null);
  const [id, setId] = useState<number>();
  const [view, setView] = useState<BenchView>("iso");
  const device = bench.equipment.find((item) => item.id === id);
  useEffect(() => {
    const dialog = ref.current;
    dialog?.showModal();
    return () => dialog?.close();
  }, []);
  const fallback = (
    <>
      <BenchAssembly
        bench={bench}
        width={3}
        depth={1.7}
        selected={id}
        onInspect={setId}
      />
      {!custom &&
        [-1.38, 1.38].flatMap((x) =>
          [-0.74, 0.74].map((z) => (
            <Part
              key={x + "," + z}
              position={[x, -0.48, z]}
              size={[0.09, 0.96, 0.09]}
              color="#708596"
            />
          )),
        )}
    </>
  );
  const targetY = stationModel || custom ? 0.65 : 0;

  return (
    <dialog
      ref={ref}
      className="dcim-bench-dialog"
      aria-label={bench.name}
      onCancel={onClose}
    >
      <header>
        <div>
          <small>{location}</small>
          <h2>{bench.name}</h2>
        </div>
        <div className="dcim-inspector-controls">
          {(["iso", "top", "front"] as const).map((v) => (
            <button key={v} aria-pressed={view === v} onClick={() => setView(v)}>
              {v === "iso" ? "3D" : v === "top" ? "Top" : "Front"}
            </button>
          ))}
          <button autoFocus onClick={onClose}>
            Back to room
          </button>
        </div>
      </header>
      <div className="dcim-bench-canvas">
        <Canvas camera={{ position: [2.8, 2.2, 3.6], fov: 42 }} shadows dpr={[1, 2]}>
          <color attach="background" args={["#0d1929"]} />
          <Environment resolution={256} frames={1}>
            <Lightformer form="rect" intensity={2.2} color="#dceeff" position={[0, 5, 2]} rotation-x={Math.PI / 2} scale={[8, 8, 1]} />
            <Lightformer form="rect" intensity={1.1} color="#7dd3fc" position={[-4, 2, 0]} rotation-y={Math.PI / 2} scale={[6, 3, 1]} />
          </Environment>
          <ambientLight intensity={0.75} />
          <directionalLight position={[3, 6, 4]} intensity={1.8} castShadow />
          {stationModel && !custom ? (
            <ImportedModel
              model={stationModel}
              dimensions={[3, 1.5, 1.7]}
              fallback={fallback}
            >
              {(height, footprint) => (
                <group position={[0, height + 0.01, 0]}>
                  <BenchAssembly
                    bench={bench}
                    width={footprint[0]}
                    depth={footprint[1]}
                    selected={id}
                    onInspect={setId}
                  />
                </group>
              )}
            </ImportedModel>
          ) : (
            fallback
          )}
          <ContactShadows position={[0, stationModel || custom ? 0.002 : -0.96, 0]} scale={6} blur={2.2} opacity={0.55} color="#020617" />
          <BenchCamera view={view} targetY={targetY} />
        </Canvas>
      </div>
      <footer>
        <label>
          Equipment{" "}
          <select
            value={id ?? ""}
            onChange={(e) => setId(e.target.value ? Number(e.target.value) : undefined)}
          >
            <option value="">
              {bench.equipment.length
                ? "Select a device"
                : "No equipment assigned"}
            </option>
            {bench.equipment.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name || item.sku}
              </option>
            ))}
          </select>
        </label>
        {device && (
          <p>
            {device.category?.name || "Uncategorized"} · {device.sku}
            {device.bench_assignment?.role &&
              " · " + device.bench_assignment.role}
          </p>
        )}
      </footer>
    </dialog>
  );
}
