import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import type { RackData } from "../types";
import {
  DEFAULT_FIT,
  assetCacheKey,
  resolveModel,
  useAssignVisualModelMutation,
  useDeleteVisualModelAssetMutation,
  useUnassignVisualModelMutation,
  useUpdateVisualModelAssetMutation,
  useUploadVisualModelAssetMutation,
  useVisualCatalogTargetsQuery,
  useVisualModelAssetsQuery,
  useVisualModelAssignmentsQuery,
  type AssetDetails,
  type ModelScope,
  type VisualModel,
  type VisualModelAsset,
  type VisualModelAssignment,
} from "./api";
import { ImportedModel } from "./ImportedModel";
import { validateGlb } from "./validateGlb";
import { targetId } from "./useVisualModel";
import { getApiErrorMessage } from "@/shared/notifications";

interface Target {
  scope: ModelScope;
  key: string;
  label: string;
}
type Tab = "assign" | "library";

const SCOPE_LABELS: Record<ModelScope, string> = {
  station_type: "Station type",
  equipment_category: "Category",
  equipment_model: "Product model",
  equipment: "Device",
  bench: "Bench",
};
const hasSurface = (scope: ModelScope) =>
  scope === "bench" || scope === "station_type";
const megabytes = (bytes: number) =>
  bytes < 1024 * 1024
    ? Math.max(1, Math.round(bytes / 1024)) + " KB"
    : (bytes / 1024 / 1024).toFixed(1) + " MB";

function targetsFor(
  racks: RackData[],
  catalog: Target[],
  assignments: VisualModelAssignment[],
  assets: Map<number, VisualModelAsset>,
): Target[] {
  const targets: Target[] = [
    { scope: "bench", key: "*", label: "All benches (default)" },
    ...catalog,
  ];
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
  // Assigned targets outside this room stay reachable so they can be edited or removed.
  for (const assignment of assignments)
    targets.push({
      scope: assignment.scope,
      key: assignment.target_key,
      label: `${SCOPE_LABELS[assignment.scope]} #${assignment.target_key} · ${
        assets.get(assignment.asset_id)?.name ?? "model"
      }`,
    });
  const unique = new Map<string, Target>();
  for (const target of targets) {
    const id = targetId(target.scope, target.key);
    if (!unique.has(id)) unique.set(id, target);
  }
  return [...unique.values()];
}

export function ModelLibraryDialog({
  racks,
  onClose,
}: {
  racks: RackData[];
  onClose: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const assetsQuery = useVisualModelAssetsQuery();
  const assignmentsQuery = useVisualModelAssignmentsQuery();
  const catalog = useVisualCatalogTargetsQuery();
  const [tab, setTab] = useState<Tab>("assign");
  const [selection, setSelection] = useState(targetId("bench", "*"));
  // Asset chosen in the library to apply to the selected target.
  const [proposedAsset, setProposedAsset] = useState<number>();
  const [libraryAsset, setLibraryAsset] = useState<number | null>(null);

  const assets = useMemo(() => assetsQuery.data ?? [], [assetsQuery.data]);
  const assignments = useMemo(
    () => assignmentsQuery.data ?? [],
    [assignmentsQuery.data],
  );
  const assetsById = useMemo(
    () => new Map(assets.map((asset) => [asset.id, asset])),
    [assets],
  );
  const targets = useMemo(
    () => targetsFor(racks, catalog.data ?? [], assignments, assetsById),
    [racks, catalog.data, assignments, assetsById],
  );
  const target =
    targets.find((item) => targetId(item.scope, item.key) === selection) ??
    targets[0];
  const assignment = assignments.find(
    (item) => item.scope === target.scope && item.target_key === target.key,
  );

  useEffect(() => {
    dialog.current?.showModal();
  }, []);

  const loading = assetsQuery.isLoading || assignmentsQuery.isLoading;
  const failed = assetsQuery.isError || assignmentsQuery.isError;

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
          <p>
            Upload a GLB once, then map station types, categories, product
            models, devices and benches to it.
          </p>
        </div>
        <button onClick={onClose}>Close</button>
      </header>
      <div className="dcim-model-tabs" role="tablist">
        {(
          [
            ["assign", "Assign to resources"],
            ["library", `Library (${assets.length})`],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            role="tab"
            aria-selected={tab === id}
            onClick={() => setTab(id)}
          >
            {label}
          </button>
        ))}
      </div>
      {catalog.isError && (
        <p role="status">
          Some catalog types could not be loaded.{" "}
          <button onClick={() => catalog.refetch()}>Retry types</button>
        </p>
      )}
      {loading ? (
        <p>Loading library…</p>
      ) : failed ? (
        <p role="alert">
          Cannot load shared models.{" "}
          <button
            onClick={() => {
              void assetsQuery.refetch();
              void assignmentsQuery.refetch();
            }}
          >
            Retry
          </button>
        </p>
      ) : tab === "assign" ? (
        <>
          <label className="dcim-model-target">
            Resource or type
            <select
              value={targetId(target.scope, target.key)}
              onChange={(e) => {
                setSelection(e.target.value);
                setProposedAsset(undefined);
              }}
            >
              {targets.map((item) => (
                <option
                  key={targetId(item.scope, item.key)}
                  value={targetId(item.scope, item.key)}
                >
                  {item.label}
                </option>
              ))}
            </select>
          </label>
          <AssignmentEditor
            key={selection + ":" + (proposedAsset ?? "")}
            target={target}
            assignment={assignment}
            assets={assets}
            initialAsset={proposedAsset}
            onOpenLibrary={(assetId) => {
              setLibraryAsset(assetId);
              setTab("library");
            }}
          />
        </>
      ) : (
        <LibraryPanel
          assets={assets}
          selected={libraryAsset}
          onSelect={setLibraryAsset}
          onAssign={(assetId) => {
            setProposedAsset(assetId);
            setTab("assign");
          }}
        />
      )}
    </dialog>
  );
}

function ModelPreview({
  model,
  surface,
  onError,
}: {
  model?: VisualModel;
  surface: boolean;
  onError: () => void;
}) {
  return (
    <div className="dcim-model-preview">
      {model ? (
        <Canvas camera={{ position: [3, 2.3, 4], fov: 40 }}>
          <color attach="background" args={["#102235"]} />
          <ambientLight intensity={1.3} />
          <directionalLight position={[4, 6, 4]} intensity={2} />
          <ImportedModel
            model={model}
            dimensions={[2, 1.5, 1.5]}
            fallback={null}
            onError={onError}
          >
            {(height) =>
              surface && (
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
        <p>Choose a model to preview it.</p>
      )}
    </div>
  );
}

function Slider({
  label,
  value,
  min,
  max,
  step,
  onChange,
}: {
  label: ReactNode;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
}) {
  return (
    <label>
      {label}
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(+e.target.value)}
      />
    </label>
  );
}

function Feedback({ error, message }: { error: string; message: string }) {
  return (
    <>
      {error && <p role="alert">{error}</p>}
      {message && <p role="status">{message}</p>}
    </>
  );
}

function AssignmentEditor({
  target,
  assignment,
  assets,
  initialAsset,
  onOpenLibrary,
}: {
  target: Target;
  assignment?: VisualModelAssignment;
  assets: VisualModelAsset[];
  initialAsset?: number;
  onOpenLibrary: (assetId: number | null) => void;
}) {
  const [assign, assigning] = useAssignVisualModelMutation();
  const [unassign, unassigning] = useUnassignVisualModelMutation();
  const start = assignment ?? DEFAULT_FIT;
  const [assetId, setAssetId] = useState(
    initialAsset ?? assignment?.asset_id ?? assets[0]?.id,
  );
  const [rotation, setRotation] = useState(start.rotation);
  const [scale, setScale] = useState(start.scale);
  const [offsets, setOffsets] = useState([
    start.offset_x,
    start.offset_y,
    start.offset_z,
  ]);
  // The version this form was loaded from, so a concurrent edit is reported instead of overwritten.
  const [baseVersion, setBaseVersion] = useState(assignment?.version ?? 0);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [failedPreview, setFailedPreview] = useState<string>();

  const asset = assets.find((item) => item.id === assetId);
  const fit = {
    rotation,
    scale,
    offset_x: offsets[0],
    offset_y: offsets[1],
    offset_z: offsets[2],
  };
  const preview = asset ? resolveModel(asset, fit) : undefined;
  const previewFailed = !!asset && failedPreview === assetCacheKey(asset);
  const busy = assigning.isLoading || unassigning.isLoading;

  if (!assets.length)
    return (
      <div className="dcim-model-empty">
        <p>The library is empty. Upload a GLB before assigning it.</p>
        <button onClick={() => onOpenLibrary(null)}>Upload a model</button>
      </div>
    );

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        if (!asset) return;
        setError("");
        setMessage("");
        try {
          const saved = await assign({
            scope: target.scope,
            key: target.key,
            fit: { asset_id: asset.id, ...fit },
            version: baseVersion,
          }).unwrap();
          setBaseVersion(saved.version);
          setMessage(`${target.label} now uses “${asset.name}”.`);
        } catch (failure) {
          setError(getApiErrorMessage(failure, "Unable to save assignment."));
        }
      }}
    >
      <div className="dcim-model-editor">
        <div className="dcim-model-fields">
          <label>
            Library model
            <select
              value={assetId ?? ""}
              onChange={(e) => setAssetId(Number(e.target.value))}
            >
              {assets.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name} · used by {item.usage_count}
                </option>
              ))}
            </select>
          </label>
          <button type="button" onClick={() => onOpenLibrary(assetId ?? null)}>
            Manage library…
          </button>
          <Slider
            label={`Rotation · ${rotation}°`}
            value={rotation}
            min={-180}
            max={180}
            step={1}
            onChange={setRotation}
          />
          <Slider
            label={`Scale · ${scale.toFixed(2)}×`}
            value={scale}
            min={0.01}
            max={2}
            step={0.01}
            onChange={setScale}
          />
          {["Horizontal", "Vertical", "Depth"].map((label, i) => (
            <Slider
              key={label}
              label={`${label} offset · ${offsets[i].toFixed(2)}`}
              value={offsets[i]}
              min={-1}
              max={1}
              step={0.01}
              onChange={(next) =>
                setOffsets((values) =>
                  values.map((value, index) => (index === i ? next : value)),
                )
              }
            />
          ))}
          <small>
            Rotation adds to the model’s own rotation set in the library.
          </small>
        </div>
        <ModelPreview
          model={preview}
          surface={hasSurface(target.scope)}
          onError={() => asset && setFailedPreview(assetCacheKey(asset))}
        />
      </div>
      {previewFailed && (
        <p role="alert">
          This model could not render. Re-export a self-contained GLB with
          embedded textures.
        </p>
      )}
      <Feedback error={error} message={message} />
      <footer>
        <button disabled={busy || !asset || previewFailed} type="submit">
          {assigning.isLoading
            ? "Saving…"
            : baseVersion
              ? "Save assignment"
              : "Assign model"}
        </button>
        {assignment && baseVersion > 0 && (
          <button
            type="button"
            disabled={busy}
            onClick={async () => {
              setError("");
              setMessage("");
              try {
                await unassign({
                  ...assignment,
                  version: baseVersion,
                }).unwrap();
                setBaseVersion(0);
                setMessage(
                  "Assignment removed. The model stays in the library.",
                );
              } catch (failure) {
                setError(
                  getApiErrorMessage(failure, "Unable to remove assignment."),
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

function LibraryPanel({
  assets,
  selected,
  onSelect,
  onAssign,
}: {
  assets: VisualModelAsset[];
  selected: number | null;
  onSelect: (id: number | null) => void;
  onAssign: (id: number) => void;
}) {
  const asset = assets.find((item) => item.id === selected);
  return (
    <div className="dcim-library">
      <ul className="dcim-asset-list" aria-label="Library models">
        <li>
          <button aria-pressed={!asset} onClick={() => onSelect(null)}>
            <strong>+ Upload a model</strong>
            <small>GLB up to 15 MB</small>
          </button>
        </li>
        {assets.map((item) => (
          <li key={item.id}>
            <button
              aria-pressed={item.id === asset?.id}
              onClick={() => onSelect(item.id)}
            >
              <strong>{item.name}</strong>
              <small>
                {megabytes(item.size)} · used by {item.usage_count}
              </small>
            </button>
          </li>
        ))}
      </ul>
      {asset ? (
        <AssetEditor
          key={asset.id}
          asset={asset}
          onAssign={() => onAssign(asset.id)}
          onDeleted={() => onSelect(null)}
        />
      ) : (
        <UploadForm onUploaded={onSelect} />
      )}
    </div>
  );
}

function DetailsFields({
  details,
  onChange,
}: {
  details: AssetDetails;
  onChange: (details: AssetDetails) => void;
}) {
  const set = (patch: Partial<AssetDetails>) =>
    onChange({ ...details, ...patch });
  return (
    <>
      <label>
        Model name
        <input
          required
          maxLength={160}
          value={details.name}
          onChange={(e) => set({ name: e.target.value })}
        />
      </label>
      <Slider
        label={`Facing rotation · ${details.rotation}°`}
        value={details.rotation}
        min={-180}
        max={180}
        step={1}
        onChange={(rotation) => set({ rotation })}
      />
      <Slider
        label={`Work surface · ${Math.round(details.surface * 100)}% of height`}
        value={details.surface}
        min={0}
        max={1}
        step={0.01}
        onChange={(surface) => set({ surface })}
      />
      <small>
        The work surface is where benches and instruments sit when this model is
        used for a station type or bench.
      </small>
      <label>
        Source URL
        <input
          type="url"
          value={details.source_url}
          onChange={(e) => set({ source_url: e.target.value })}
        />
      </label>
      <label>
        License / attribution
        <input
          maxLength={255}
          value={details.license}
          onChange={(e) => set({ license: e.target.value })}
        />
      </label>
    </>
  );
}

function UploadForm({ onUploaded }: { onUploaded: (id: number) => void }) {
  const [upload, uploading] = useUploadVisualModelAssetMutation();
  const [file, setFile] = useState<File>();
  const [url, setUrl] = useState("");
  const [details, setDetails] = useState<AssetDetails>({
    name: "",
    source_url: "",
    license: "",
    rotation: 0,
    surface: 1,
  });
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [previewFailed, setPreviewFailed] = useState(false);
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
      if (url) URL.revokeObjectURL(url);
    },
    [url],
  );

  const choose = async (candidate?: File) => {
    if (!candidate) return;
    const current = ++request.current;
    setValidating(true);
    setError("");
    setMessage("");
    try {
      await validateGlb(candidate);
      if (current !== request.current) return;
      setFile(candidate);
      setUrl(URL.createObjectURL(candidate));
      setPreviewFailed(false);
      setDetails((value) =>
        value.name
          ? value
          : { ...value, name: candidate.name.replace(/\.glb$/i, "") },
      );
    } catch (failure) {
      // Keep any previously chosen valid file; only report the rejected one.
      if (current === request.current) setError((failure as Error).message);
    } finally {
      if (current === request.current) setValidating(false);
    }
  };

  const preview: VisualModel | undefined = url
    ? {
        ...DEFAULT_FIT,
        cacheKey: url,
        url,
        rotation: details.rotation,
        surface: details.surface,
      }
    : undefined;

  return (
    <form
      className="dcim-library-detail"
      onSubmit={async (e) => {
        e.preventDefault();
        if (!file) return;
        setError("");
        setMessage("");
        const body = new FormData();
        Object.entries(details).forEach(([key, value]) =>
          body.set(key, String(value)),
        );
        body.set("file", file);
        try {
          const { asset, created } = await upload(body).unwrap();
          if (!created)
            setMessage(
              `This file is already in the library as “${asset.name}”.`,
            );
          onUploaded(asset.id);
        } catch (failure) {
          setError(getApiErrorMessage(failure, "Unable to upload model."));
        }
      }}
    >
      <div className="dcim-model-editor">
        <div className="dcim-model-fields">
          <label>
            GLB file
            <input
              type="file"
              accept=".glb,model/gltf-binary"
              onChange={(e) => choose(e.target.files?.[0])}
            />
          </label>
          <small>
            Up to 15 MB. Use embedded PNG/JPEG textures and uncompressed
            geometry.
          </small>
          <DetailsFields details={details} onChange={setDetails} />
        </div>
        <ModelPreview
          model={preview}
          surface
          onError={() => setPreviewFailed(true)}
        />
      </div>
      {previewFailed && (
        <p role="alert">
          The model could not render. Re-export a self-contained GLB with
          embedded textures.
        </p>
      )}
      <Feedback error={error} message={message} />
      <footer>
        <button
          type="submit"
          disabled={!file || validating || previewFailed || uploading.isLoading}
        >
          {uploading.isLoading ? "Uploading…" : "Add to library"}
        </button>
      </footer>
    </form>
  );
}

function AssetEditor({
  asset,
  onAssign,
  onDeleted,
}: {
  asset: VisualModelAsset;
  onAssign: () => void;
  onDeleted: () => void;
}) {
  const [update, updating] = useUpdateVisualModelAssetMutation();
  const [remove, removing] = useDeleteVisualModelAssetMutation();
  const [details, setDetails] = useState<AssetDetails>({
    name: asset.name,
    source_url: asset.source_url,
    license: asset.license,
    rotation: asset.rotation,
    surface: asset.surface,
  });
  // Version this form was loaded from; the server rejects saves over someone else's edit.
  const [baseVersion, setBaseVersion] = useState(asset.version);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [previewFailed, setPreviewFailed] = useState(false);
  const busy = updating.isLoading || removing.isLoading;
  const current = { ...asset, version: baseVersion };

  return (
    <form
      className="dcim-library-detail"
      onSubmit={async (e) => {
        e.preventDefault();
        setError("");
        setMessage("");
        try {
          const saved = await update({ asset: current, details }).unwrap();
          setBaseVersion(saved.version);
          setMessage(
            asset.usage_count
              ? `Saved. Updates ${asset.usage_count} assigned resource(s).`
              : "Saved.",
          );
        } catch (failure) {
          setError(getApiErrorMessage(failure, "Unable to save model."));
        }
      }}
    >
      <div className="dcim-model-editor">
        <div className="dcim-model-fields">
          <small>
            {megabytes(asset.size)} · used by {asset.usage_count} resource(s)
          </small>
          <DetailsFields details={details} onChange={setDetails} />
        </div>
        <ModelPreview
          model={resolveModel({ ...asset, ...details }, DEFAULT_FIT)}
          surface
          onError={() => setPreviewFailed(true)}
        />
      </div>
      {previewFailed && (
        <p role="alert">
          This model could not render. Upload a corrected GLB and reassign it.
        </p>
      )}
      <Feedback error={error} message={message} />
      <footer>
        <button type="submit" disabled={busy}>
          {updating.isLoading ? "Saving…" : "Save details"}
        </button>
        <button
          type="button"
          disabled={busy || previewFailed}
          onClick={onAssign}
        >
          Assign to a resource…
        </button>
        <button
          type="button"
          disabled={busy || asset.usage_count > 0}
          title={
            asset.usage_count
              ? "Remove its assignments before deleting this model."
              : undefined
          }
          onClick={async () => {
            setError("");
            try {
              await remove(current).unwrap();
              onDeleted();
            } catch (failure) {
              setError(getApiErrorMessage(failure, "Unable to delete model."));
            }
          }}
        >
          Delete from library
        </button>
        {asset.usage_count > 0 && (
          <span>In use — remove its assignments before deleting.</span>
        )}
      </footer>
    </form>
  );
}
