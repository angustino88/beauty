import { ImportedModel } from "../../models/ImportedModel";
import { useVisualModel } from "../../models/useVisualModel";
import { useEffect, useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { BenchAssembly, type Bench } from "./BenchAssembly";
import { Part } from "./Part";

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
        <button autoFocus onClick={onClose}>
          Back to room
        </button>
      </header>
      <div className="dcim-bench-canvas">
        <Canvas camera={{ position: [2.8, 2.2, 3.6], fov: 42 }}>
          <color attach="background" args={["#101d2c"]} />
          <ambientLight intensity={1.5} />
          <directionalLight position={[3, 6, 4]} intensity={2} />
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
          <OrbitControls
            makeDefault
            target={[0, stationModel || custom ? 0.65 : 0, 0]}
            minDistance={0.6}
            maxDistance={9}
            maxPolarAngle={Math.PI * 0.5}
          />
        </Canvas>
      </div>
      <footer>
        <label>
          Equipment{" "}
          <select
            value={id ?? ""}
            onChange={(e) => setId(Number(e.target.value))}
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
