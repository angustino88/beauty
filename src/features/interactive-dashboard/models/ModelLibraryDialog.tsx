import { useEffect, useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import type { RackData } from "../types";
import {
  useVisualModelsQuery,
  useVisualCatalogTargetsQuery,
  useSaveVisualModelMutation,
  useRemoveVisualModelMutation,
  type ModelScope,
  type VisualModel,
} from "./api";
import { ImportedModel } from "./ImportedModel";
import { validateGlb } from "./validateGlb";
import { getApiErrorMessage } from "@/shared/notifications";

interface Target {
  scope: ModelScope;
  key: string;
  label: string;
}
function targetsFor(
  racks: RackData[],
  models: VisualModel[],
  catalog: Target[],
): Target[] {
  const targets: Target[] = [
    { scope: "bench", key: "*", label: "All benches (default)" },
  ];
  targets.push(...catalog);
  for (const rack of racks) {
    if (rack.stationTypeId != null)
      targets.push({
        scope: "station_type",
        key: String(rack.stationTypeId),
        label: "Station type · " + rack.stationType,
      });
    for (const slot of rack.slots ?? [])
      for (const bench of slot.benches) {
        targets.push({
          scope: "bench",
          key: String(bench.id),
          label: "Bench · " + bench.name,
        });
        for (const device of bench.equipment) {
          targets.push({
            scope: "equipment",
            key: String(device.id),
            label: "Device · " + (device.name || device.sku),
          });
          if (device.product_model)
            targets.push({
              scope: "equipment_model",
              key: String(device.product_model.id),
              label: "Product model · " + device.product_model.name,
            });
          if (device.category)
            targets.push({
              scope: "equipment_category",
              key: String(device.category.id),
              label: "Category · " + device.category.name,
            });
        }
      }
  }
  for (const model of models)
    targets.push({
      scope: model.scope,
      key: model.target_key,
      label: model.scope + " · " + model.name,
    });
  return [
    ...new Map(
      targets
        .reverse()
        .map((target) => [target.scope + "/" + target.key, target]),
    ).values(),
  ].reverse();
}

export function ModelLibraryDialog({
  racks,
  onClose,
}: {
  racks: RackData[];
  onClose: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const {
    data: models = [],
    isLoading,
    isError,
    refetch,
  } = useVisualModelsQuery();
  const [save, saving] = useSaveVisualModelMutation();
  const [remove, removing] = useRemoveVisualModelMutation();
  const catalog = useVisualCatalogTargetsQuery();
  const [selection, setSelection] = useState("bench/*");
  const targets = targetsFor(racks, models, catalog.data ?? []);
  const target =
    targets.find((item) => item.scope + "/" + item.key === selection) ??
    targets[0];
  const model = models.find(
    (item) => item.scope === target.scope && item.target_key === target.key,
  );
  useEffect(() => {
    dialog.current?.showModal();
  }, []);
  return (
    <dialog
      ref={dialog}
      className="dcim-model-dialog"
      aria-label="3D model library"
      onCancel={onClose}
    >
      <header>
        <div>
          <h2>3D model library</h2>
          <p>Attach a textured GLB to a type or an individual asset.</p>
        </div>
        <button onClick={onClose}>Close</button>
      </header>
      {catalog.isError && (
        <p role="status">
          Some catalog types could not be loaded.{" "}
          <button onClick={() => catalog.refetch()}>Retry types</button>
        </p>
      )}
      {isLoading ? (
        <p>Loading library…</p>
      ) : isError ? (
        <p role="alert">
          Cannot load shared models.{" "}
          <button onClick={() => refetch()}>Retry</button>
        </p>
      ) : (
        <>
          <label className="dcim-model-target">
            Apply model to
            <select
              value={selection}
              onChange={(e) => setSelection(e.target.value)}
            >
              {targets.map((item) => (
                <option
                  key={item.scope + "/" + item.key}
                  value={item.scope + "/" + item.key}
                >
                  {item.label}
                </option>
              ))}
            </select>
          </label>
          <ModelEditor
            key={selection + ":" + (model?.version ?? 0)}
            target={target}
            model={model}
            busy={saving.isLoading || removing.isLoading}
            onSave={(body) =>
              save({
                scope: target.scope,
                key: target.key,
                body,
                version: model?.version ?? 0,
              }).unwrap()
            }
            onRemove={model ? () => remove(model).unwrap() : undefined}
          />
        </>
      )}
    </dialog>
  );
}

function ModelEditor({
  target,
  model,
  busy,
  onSave,
  onRemove,
}: {
  target: Target;
  model?: VisualModel;
  busy: boolean;
  onSave: (body: FormData) => Promise<unknown>;
  onRemove?: () => Promise<unknown>;
}) {
  const [file, setFile] = useState<File>();
  const [url, setUrl] = useState(model?.url ?? "");
  const [name, setName] = useState(model?.name ?? "");
  const [rotation, setRotation] = useState(model?.rotation ?? 0);
  const [scale, setScale] = useState(model?.scale ?? 1);
  const [surface, setSurface] = useState(model?.surface ?? 1);
  const [offsets, setOffsets] = useState([
    model?.offset_x ?? 0,
    model?.offset_y ?? 0,
    model?.offset_z ?? 0,
  ]);
  const [source, setSource] = useState(model?.source_url ?? "");
  const [license, setLicense] = useState(model?.license ?? "");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [previewError, setPreviewError] = useState(false);
  const [validating, setValidating] = useState(false);
  const request = useRef(0);
  useEffect(
    () => () => {
      request.current++;
    },
    [],
  );
  useEffect(
    () => () => {
      if (url.startsWith("blob:")) URL.revokeObjectURL(url);
    },
    [url],
  );
  const preview: VisualModel = {
    scope: target.scope,
    target_key: target.key,
    name,
    url,
    rotation,
    scale,
    surface,
    source_url: source,
    license,
    offset_x: offsets[0],
    offset_y: offsets[1],
    offset_z: offsets[2],
    version: model?.version ?? 0,
  };
  const upload = async (candidate?: File) => {
    if (!candidate) return;
    const current = ++request.current;
    setValidating(true);
    setError("");
    try {
      await validateGlb(candidate);
      if (current !== request.current) return;
      setFile(candidate);
      setUrl(URL.createObjectURL(candidate));
      setPreviewError(false);
      if (!name) setName(candidate.name.replace(/\.glb$/i, ""));
    } catch (failure) {
      if (current === request.current) {
        setError((failure as Error).message);
        setPreviewError(true);
      }
    } finally {
      if (current === request.current) setValidating(false);
    }
  };
  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        setError("");
        setMessage("");
        const body = new FormData();
        Object.entries({
          name,
          rotation,
          scale,
          surface,
          source_url: source,
          license,
          offset_x: offsets[0],
          offset_y: offsets[1],
          offset_z: offsets[2],
        }).forEach(([key, value]) => body.set(key, String(value)));
        if (file) body.set("file", file);
        try {
          await onSave(body);
          setMessage("Model saved to the shared library.");
        } catch (failure) {
          setError(getApiErrorMessage(failure, "Unable to save model."));
        }
      }}
    >
      <div className="dcim-model-editor">
        <div className="dcim-model-fields">
          <label>
            Model name
            <input
              required
              maxLength={160}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </label>
          <label>
            GLB file
            <input
              type="file"
              accept=".glb,model/gltf-binary"
              onChange={(e) => upload(e.target.files?.[0])}
            />
          </label>
          <small>
            Up to 15 MB. Use embedded PNG/JPEG textures and uncompressed
            geometry.
          </small>
          <label>
            Rotation · {rotation}°
            <input
              type="range"
              min="-180"
              max="180"
              step="1"
              value={rotation}
              onChange={(e) => setRotation(+e.target.value)}
            />
          </label>
          <label>
            Scale · {scale.toFixed(2)}×
            <input
              type="range"
              min=".01"
              max="2"
              step=".01"
              value={scale}
              onChange={(e) => setScale(+e.target.value)}
            />
          </label>
          {(target.scope === "bench" || target.scope === "station_type") && (
            <label>
              Mounting surface · {Math.round(surface * 100)}% of height
              <input
                type="range"
                min="0"
                max="1"
                step=".01"
                value={surface}
                onChange={(e) => setSurface(+e.target.value)}
              />
            </label>
          )}
          {["Horizontal", "Vertical", "Depth"].map((label, i) => (
            <label key={label}>
              {label} offset · {offsets[i].toFixed(2)}
              <input
                type="range"
                min="-1"
                max="1"
                step=".01"
                value={offsets[i]}
                onChange={(event) =>
                  setOffsets((values) =>
                    values.map((value, index) =>
                      index === i ? +event.target.value : value,
                    ),
                  )
                }
              />
            </label>
          ))}
          <label>
            Source URL
            <input
              type="url"
              value={source}
              onChange={(e) => setSource(e.target.value)}
            />
          </label>
          <label>
            License / attribution
            <input
              maxLength={255}
              value={license}
              onChange={(e) => setLicense(e.target.value)}
            />
          </label>
        </div>
        <div className="dcim-model-preview">
          {url ? (
            <Canvas camera={{ position: [3, 2.3, 4], fov: 40 }}>
              <color attach="background" args={["#102235"]} />
              <ambientLight intensity={1.3} />
              <directionalLight position={[4, 6, 4]} intensity={2} />
              <ImportedModel
                model={preview}
                dimensions={[2, 1.5, 1.5]}
                fallback={null}
                onError={() => setPreviewError(true)}
              >
                {(height) =>
                  (target.scope === "bench" ||
                    target.scope === "station_type") && (
                    <mesh
                      rotation={[-Math.PI / 2, 0, 0]}
                      position={[0, height + 0.005, 0]}
                    >
                      <planeGeometry args={[2, 1.5]} />
                      <meshBasicMaterial
                        color="#64d4d5"
                        transparent
                        opacity={0.2}
                        depthWrite={false}
                      />
                    </mesh>
                  )
                }
              </ImportedModel>
              <gridHelper args={[5, 10, "#42647b", "#264158"]} />
              <OrbitControls makeDefault target={[0, 0.6, 0]} />
            </Canvas>
          ) : (
            <p>Choose a GLB file to preview it.</p>
          )}
        </div>
      </div>
      {(error || previewError) && (
        <p role="alert">
          {error ||
            "The model could not render. Re-export a self-contained GLB with embedded textures."}
        </p>
      )}
      {message && <p role="status">{message}</p>}
      <footer>
        <button
          disabled={busy || validating || !url || previewError}
          type="submit"
        >
          {busy ? "Saving…" : "Save model"}
        </button>
        {onRemove && (
          <button
            type="button"
            disabled={busy}
            onClick={async () => {
              try {
                await onRemove();
              } catch (failure) {
                setError(
                  getApiErrorMessage(failure, "Unable to remove model."),
                );
              }
            }}
          >
            Remove assignment
          </button>
        )}
        <span>
          Device models override product models and categories. Bench
          assignments override the bench default.
        </span>
      </footer>
    </form>
  );
}
