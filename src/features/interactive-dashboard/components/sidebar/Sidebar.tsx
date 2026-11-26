import { BenchInspector } from "../scene/BenchInspector";
import { useMemo, useState } from "react";
import {
  ArrowLeft,
  Box,
  Check,
  Crosshair,
  Droplets,
  LayoutGrid,
  Pencil,
  Pin,
  Plus,
  Search,
  Thermometer,
  Trash2,
  X,
  Zap,
} from "lucide-react";
import type { RackData, SidebarProps } from "../../types";
import type { RackStatus } from "../../config/rackThresholds";
import { RACK_THRESHOLDS } from "../../config/rackThresholds";
import { STATUS_COLORS, TYPE_COLORS, TYPE_LABELS } from "../../utils/stationVisual";
import { RackCard } from "./RackCard";
import { categoryColor } from "../../utils/categoryColor";

const STATUS_LABELS: Record<RackStatus, string> = {
  ok: "Healthy",
  warning: "Warning",
  critical: "Critical",
  unknown: "No data",
};

function MetricTile({
  icon,
  label,
  value,
  unit,
  digits,
  thresholds,
  max,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | null;
  unit: string;
  digits: number;
  thresholds?: { warning: number; critical: number };
  max: number;
}) {
  const level =
    value == null || !thresholds
      ? "unknown"
      : value > thresholds.critical
        ? "critical"
        : value > thresholds.warning
          ? "warning"
          : "ok";
  return (
    <div className={`dcim-metric is-${level}`}>
      <span className="dcim-metric-label">
        {icon}
        {label}
      </span>
      {value == null ? (
        <span className="dcim-metric-value is-empty" title="No telemetry reported for this station">
          No data
        </span>
      ) : (
        <span className="dcim-metric-value">
          {value.toFixed(digits)}
          <small>{unit}</small>
        </span>
      )}
      <span className="dcim-meter" aria-hidden="true">
        <i style={{ width: `${value == null ? 0 : Math.min(100, (value / max) * 100)}%` }} />
        {thresholds && <b style={{ left: `${(thresholds.warning / max) * 100}%` }} />}
      </span>
    </div>
  );
}

function timeAgo(iso: string) {
  const seconds = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 1000));
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.round(seconds / 60);
  return minutes < 60 ? `${minutes} min ago` : `${Math.round(minutes / 60)} h ago`;
}

function CapacityRow({
  label,
  used,
  rated,
  format,
  hint,
}: {
  label: string;
  used: number;
  rated: number | null | undefined;
  format: (value: number) => string;
  hint?: string;
}) {
  const share = rated ? used / rated : null;
  const level = share == null ? "unknown" : share > 0.95 ? "critical" : share > 0.8 ? "warning" : "ok";
  return (
    <div className={`dcim-capacity-row is-${level}`} title={hint}>
      <span>
        {label}
        <b>
          {format(used)}
          {rated ? ` / ${format(rated)}` : ""}
          {share != null && <em>{Math.round(share * 100)}%</em>}
        </b>
      </span>
      {rated ? (
        <span className="dcim-meter" aria-hidden="true">
          <i style={{ width: `${Math.min(100, (share ?? 0) * 100)}%` }} />
        </span>
      ) : (
        <small className="dcim-muted">No rated capacity</small>
      )}
    </div>
  );
}

/** Front/rear rack elevation: one row per unit, top unit first, mounted equipment spanning its units. */
function RackElevation({ units, items }: { units: number; items: NonNullable<RackData["rackItems"]> }) {
  const faces: { key: string; label: string }[] = [
    { key: "front", label: "Front" },
    { key: "rear", label: "Rear" },
  ];
  const free = units - items.reduce((total, item) => total + item.rack_unit_height, 0);
  return (
    <div className="dcim-rack">
      <h4 className="dcim-section-title">
        Rack elevation <span>{free} U free</span>
      </h4>
      <div className="dcim-rack-faces">
        {faces.map((face) => (
          <div key={face.key} className="dcim-rack-face" aria-label={`${face.label} of rack`}>
            <small>{face.label}</small>
            <div className="dcim-rack-grid" style={{ gridTemplateRows: `repeat(${units}, 1fr)` }}>
              {Array.from({ length: units }, (_, index) => units - index).map((unit) => (
                <span
                  key={unit}
                  className="dcim-rack-u"
                  style={{ gridRow: units - unit + 1 }}
                  aria-hidden="true"
                >
                  {unit % 5 === 0 || unit === 1 ? unit : ""}
                </span>
              ))}
              {items
                .filter((item) => (item.rack_face || "front") === face.key)
                .map((item) => (
                  <span
                    key={item.equipment_id}
                    className="dcim-rack-item"
                    style={{
                      gridRow: `${units - (item.rack_unit + item.rack_unit_height - 1) + 1} / span ${item.rack_unit_height}`,
                      borderLeftColor: categoryColor(item.category),
                    }}
                    title={`U${item.rack_unit}${item.rack_unit_height > 1 ? `–${item.rack_unit + item.rack_unit_height - 1}` : ""} · ${item.name || item.sku}${item.category ? ` · ${item.category}` : ""}${item.power_draw_w ? ` · ${item.power_draw_w} W` : ""}`}
                  >
                    {item.name || item.sku}
                  </span>
                ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function StationDetail({
  station,
  pinned,
  onBack,
  onFocus,
  onTogglePin,
  onInspect,
}: {
  station: RackData;
  pinned: boolean;
  onBack: () => void;
  onFocus: () => void;
  onTogglePin: () => void;
  onInspect: (benchId: number) => void;
}) {
  const used = station.benchCount;
  const capacity = station.benchCapacity;
  const benches = (station.slots ?? []).flatMap((slot) => slot.benches.map((bench) => ({ slot, bench })));
  const deviceCount = benches.reduce((total, { bench }) => total + bench.equipment.length, 0);
  return (
    <section className="dcim-detail" aria-label={`${station.name} details`}>
      <button className="dcim-back" onClick={onBack}>
        <ArrowLeft size={14} />
        All stations
      </button>
      <div className="dcim-detail-hero">
        <span className={`dcim-status-pill is-${station.status}`}>
          <i style={{ background: STATUS_COLORS[station.status] }} />
          {STATUS_LABELS[station.status]}
        </span>
        <h3>{station.name}</h3>
        <p>
          <span className="dcim-type-dot" style={{ background: TYPE_COLORS[station.modelKind] }} />
          {station.stationType ?? TYPE_LABELS[station.modelKind]}
          <span className="dcim-sep">·</span>
          Slot {station.slotCode ?? "unplaced"}
        </p>
        <div className="dcim-detail-actions">
          <button onClick={onFocus}>
            <Crosshair size={14} />
            Focus
          </button>
          <button onClick={onTogglePin} aria-pressed={pinned}>
            <Pin size={14} />
            {pinned ? "Pinned" : "Pin label"}
          </button>
        </div>
      </div>

      <div className="dcim-metrics">
        <MetricTile
          icon={<Thermometer size={13} />}
          label="Temp"
          value={station.temperature}
          unit="°C"
          digits={1}
          thresholds={RACK_THRESHOLDS.temperature}
          max={60}
        />
        <MetricTile
          icon={<Droplets size={13} />}
          label="Humidity"
          value={station.humidity}
          unit="%"
          digits={0}
          thresholds={RACK_THRESHOLDS.humidity}
          max={100}
        />
        <MetricTile icon={<Zap size={13} />} label="Power" value={station.powerUsage} unit="kW" digits={1} max={Math.max(10, station.powerUsage ?? 0)} />
      </div>

      <p className="dcim-live">
        {station.conditionsAt ? (
          <>
            <i className="is-live" />
            Live · updated {timeAgo(station.conditionsAt)} · {station.sensorCount}{" "}
            {station.sensorCount === 1 ? "sensor" : "sensors"}
          </>
        ) : (
          <>
            <i />
            No live telemetry for this station
          </>
        )}
      </p>

      <div className="dcim-capacity">
        <h4 className="dcim-section-title">Capacity</h4>
        <CapacityRow
          label="Power"
          used={(station.capacity?.power_installed_w ?? 0) + (station.capacity?.power_reserved_w ?? 0)}
          rated={station.capacity?.power_capacity_w}
          format={(value) => `${(value / 1000).toFixed(1)} kW`}
          hint="Installed equipment plus reserved power"
        />
        <CapacityRow
          label="Weight"
          used={station.capacity?.load_installed_kg ?? 0}
          rated={station.capacity?.max_load_kg}
          format={(value) => `${Math.round(value)} kg`}
        />
        {station.capacity?.rack_units ? (
          <CapacityRow
            label="Rack units"
            used={station.capacity.rack_units_used ?? 0}
            rated={station.capacity.rack_units}
            format={(value) => `${value} U`}
          />
        ) : null}
        {capacity || benches.length ? (
          <CapacityRow
            label="Bench positions"
            used={used ?? benches.length}
            rated={capacity}
            format={(value) => String(value)}
          />
        ) : null}
        <small>
          {benches.length} {benches.length === 1 ? "bench" : "benches"} · {deviceCount}{" "}
          {deviceCount === 1 ? "device" : "devices"}
          {station.capacity?.installed_units ? ` · ${station.capacity.installed_units} units installed` : ""}
        </small>
      </div>

      {station.capacity?.rack_units ? (
        <RackElevation units={station.capacity.rack_units} items={station.rackItems ?? []} />
      ) : null}

      <h4 className="dcim-section-title">Benches</h4>
      {!station.slots ? (
        <p className="dcim-empty">Bench inventory unavailable.</p>
      ) : !benches.length ? (
        <p className="dcim-empty">No benches at this station.</p>
      ) : (
        <ul className="dcim-bench-list">
          {benches.map(({ slot, bench }) => (
            <li key={bench.id} className="dcim-bench-card">
              <div className="dcim-bench-card-head">
                <div>
                  <strong>{bench.name}</strong>
                  <small>{slot.label}</small>
                </div>
                <button onClick={() => onInspect(bench.id)} title={`Inspect ${bench.name} in 3D`}>
                  <Box size={14} />
                  Inspect
                </button>
              </div>
              {bench.equipment.length ? (
                <ul className="dcim-device-chips">
                  {bench.equipment.map((device) => (
                    <li key={device.id} title={device.category?.name ?? "Uncategorised"}>
                      <i style={{ background: categoryColor(device.category?.name) }} />
                      {device.name || device.sku}
                    </li>
                  ))}
                </ul>
              ) : (
                <small className="dcim-muted">No equipment assigned</small>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export function Sidebar({
  racks,
  selectedId,
  onSelect,
  onClose,
  onClearSelection,
  onFocus,
  pinnedIds = [],
  onTogglePin,
  isEditMode,
  isDeleteMode,
  unplacedCount,
  onAdd,
  onToggleEdit,
  onToggleDelete,
  onSave,
  canEdit = false,
}: SidebarProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<RackStatus | null>(null);
  const [typeFilter, setTypeFilter] = useState<RackData["modelKind"] | null>(null);
  const [benchId, setBenchId] = useState<number | null>(null);
  const selected = racks.find((rack) => rack.id === selectedId);
  const slot = selected?.slots?.find((item) => item.benches.some((bench) => bench.id === benchId));
  const activeBench = slot?.benches.find((bench) => bench.id === benchId);

  const counts = useMemo(() => {
    const result: Record<RackStatus, number> = { ok: 0, warning: 0, critical: 0, unknown: 0 };
    for (const rack of racks) result[rack.status]++;
    return result;
  }, [racks]);
  const types = useMemo(
    () =>
      (Object.keys(TYPE_LABELS) as RackData["modelKind"][])
        .map((kind) => ({ kind, count: racks.filter((rack) => rack.modelKind === kind).length }))
        .filter(({ count }) => count > 0),
    [racks],
  );
  const filtered = racks.filter(
    (rack) =>
      (!statusFilter || rack.status === statusFilter) &&
      (!typeFilter || rack.modelKind === typeFilter) &&
      `${rack.name} ${rack.stationType ?? ""} ${rack.slotCode ?? ""}`.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <aside className="dcim-sidebar" aria-label="Station inventory">
      <div className="dcim-sidebar-header">
        <div>
          <span className="dcim-eyebrow">ROOM INVENTORY</span>
          <h2>
            Stations <span>{racks.length}</span>
          </h2>
        </div>
        <button className="dcim-icon-button" onClick={onClose} title="Hide panel" aria-label="Hide panel">
          <X size={17} />
        </button>
      </div>

      <div className="dcim-status-grid" role="group" aria-label="Filter by status">
        {(["ok", "warning", "critical", "unknown"] as const).map((status) => (
          <button
            key={status}
            className={`dcim-status-tile is-${status}`}
            aria-pressed={statusFilter === status}
            onClick={() => setStatusFilter((value) => (value === status ? null : status))}
            title={`Show ${STATUS_LABELS[status].toLowerCase()} stations`}
          >
            <b>{counts[status]}</b>
            <span>
              <i style={{ background: STATUS_COLORS[status] }} />
              {STATUS_LABELS[status]}
            </span>
          </button>
        ))}
      </div>

      {selected ? (
        <div className="dcim-sidebar-scroll">
          <StationDetail
            key={selected.id}
            station={selected}
            pinned={pinnedIds.includes(selected.id)}
            onBack={() => onClearSelection?.()}
            onFocus={() => onFocus?.(selected.id)}
            onTogglePin={() => onTogglePin?.(selected.id)}
            onInspect={setBenchId}
          />
        </div>
      ) : (
        <>
          <div className="dcim-filters">
            <label className="dcim-search">
              <Search size={15} />
              <input
                aria-label="Search stations"
                placeholder="Search station, type or slot"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
              {search && (
                <button className="dcim-icon-button" onClick={() => setSearch("")} aria-label="Clear search">
                  <X size={13} />
                </button>
              )}
            </label>
            {types.length > 1 && (
              <div className="dcim-type-chips" role="group" aria-label="Filter by type">
                {types.map(({ kind, count }) => (
                  <button
                    key={kind}
                    aria-pressed={typeFilter === kind}
                    onClick={() => setTypeFilter((value) => (value === kind ? null : kind))}
                  >
                    <i style={{ background: TYPE_COLORS[kind] }} />
                    {TYPE_LABELS[kind]}
                    <b>{count}</b>
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="dcim-station-list">
            {filtered.map((rack) => (
              <RackCard key={rack.id} rack={rack} selected={false} onSelect={() => onSelect(rack.id)} />
            ))}
            {!filtered.length && (
              <p className="dcim-empty">
                {racks.length ? "No stations match these filters." : "No stations placed in this room."}
              </p>
            )}
          </div>
        </>
      )}

      {activeBench && selected && slot && (
        <BenchInspector
          key={activeBench.id}
          bench={activeBench}
          stationModelId={selected.modelKind === "table" ? selected.visualModelId : undefined}
          location={[selected.name, slot.label].join(" / ")}
          onClose={() => setBenchId(null)}
        />
      )}

      <footer className="dcim-sidebar-footer">
        <span>
          <LayoutGrid size={14} />
          {unplacedCount} unplaced {unplacedCount === 1 ? "station" : "stations"}
        </span>
        {canEdit && (
          <div className="dcim-edit-actions">
            {isEditMode ? (
              <>
                <button onClick={onAdd} disabled={unplacedCount === 0} title="Place next unplaced station">
                  <Plus size={14} />
                  Place
                </button>
                <button onClick={onToggleDelete} aria-pressed={isDeleteMode}>
                  <Trash2 size={14} />
                  Remove
                </button>
                <button onClick={onSave} className="is-primary">
                  <Check size={14} />
                  Save
                </button>
                <button onClick={onToggleEdit}>Exit</button>
              </>
            ) : (
              <button onClick={onToggleEdit}>
                <Pencil size={14} />
                Edit layout
              </button>
            )}
          </div>
        )}
      </footer>
    </aside>
  );
}
