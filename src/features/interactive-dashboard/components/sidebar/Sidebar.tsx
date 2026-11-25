import { BenchInspector } from "../scene/BenchInspector";
import { useState } from "react";
import {
  Search,
  X,
  Pencil,
  Plus,
  Trash2,
  Check,
  Server,
  LayoutGrid,
} from "lucide-react";
import type { SidebarProps } from "../../types";
import { TYPE_COLORS, TYPE_LABELS } from "../../utils/stationVisual";
import { RackCard } from "./RackCard";

export function Sidebar({
  racks,
  selectedId,
  onSelect,
  onClose,
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
  const selected = racks.find((rack) => rack.id === selectedId);
  const [benchId, setBenchId] = useState<number | null>(null);
  const slot = selected?.slots?.find((item) =>
    item.benches.some((bench) => bench.id === benchId),
  );
  const activeBench = slot?.benches.find((bench) => bench.id === benchId);
  const filtered = racks.filter((rack) =>
    `${rack.name} ${rack.stationType ?? ""} ${rack.slotCode ?? ""}`
      .toLowerCase()
      .includes(search.toLowerCase()),
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
        <button
          className="dcim-icon-button"
          onClick={onClose}
          title="Hide sidebar"
        >
          <X size={17} />
        </button>
      </div>
      <div className="dcim-type-summary">
        {Object.entries(TYPE_LABELS).map(([kind, label]) => {
          const count = racks.filter((rack) => rack.modelKind === kind).length;
          return (
            count > 0 && (
              <span key={kind}>
                <i
                  style={{
                    background: TYPE_COLORS[kind as keyof typeof TYPE_COLORS],
                  }}
                />
                {label}
                <b>{count}</b>
              </span>
            )
          );
        })}
      </div>
      {selected && (
        <section className="dcim-inspector" aria-label="Selected station">
          <span className="dcim-eyebrow">SELECTED STATION</span>
          <h3>
            <Server size={16} />
            {selected.name}
          </h3>
          <dl>
            <div>
              <dt>Type</dt>
              <dd>{selected.stationType ?? "Unspecified"}</dd>
            </div>
            <div>
              <dt>Location</dt>
              <dd>{selected.slotCode}</dd>
            </div>
            <div>
              <dt>Bench positions used</dt>
              <dd>
                {selected.benchCount ?? "—"} / {selected.benchCapacity ?? "—"}
              </dd>
            </div>
            <div>
              <dt>Temperature</dt>
              <dd>
                {selected.temperature == null
                  ? "Unavailable"
                  : `${selected.temperature.toFixed(1)} °C`}
              </dd>
            </div>
            <div>
              <dt>Humidity</dt>
              <dd>
                {selected.humidity == null
                  ? "Unavailable"
                  : `${selected.humidity.toFixed(0)} %`}
              </dd>
            </div>
            <div>
              <dt>Power draw</dt>
              <dd>
                {selected.powerUsage == null
                  ? "Unavailable"
                  : `${selected.powerUsage.toFixed(1)} kW`}
              </dd>
            </div>
          </dl>
          <h4>Station slots</h4>
          {!selected.slots ? (
            <p>Slot inventory unavailable</p>
          ) : !selected.slots.length ? (
            <p>No station slots configured</p>
          ) : (
            selected.slots.map((slot) => (
              <details key={selected.id + ":" + slot.id}>
                <summary>
                  {slot.label} ·{" "}
                  {slot.benches.map((b) => b.name).join(", ") || "Empty"}
                </summary>
                {slot.benches.map((bench) => (
                  <div key={bench.id}>
                    <button
                      className="dcim-bench-open"
                      onClick={() => setBenchId(bench.id)}
                    >
                      Inspect {bench.name} in 3D
                    </button>
                    {bench.equipment.length ? (
                      <ul>
                        {bench.equipment.map((device) => (
                          <li key={device.id}>
                            {device.name || device.sku}
                            {device.category && " · " + device.category.name}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p>No equipment assigned</p>
                    )}
                  </div>
                ))}
              </details>
            ))
          )}
        </section>
      )}
      {activeBench && selected && slot && (
        <BenchInspector
          key={activeBench.id}
          bench={activeBench}
          stationModelId={
            selected.modelKind === "table" ? selected.visualModelId : undefined
          }
          location={[selected.name, slot.label].join(" / ")}
          onClose={() => setBenchId(null)}
        />
      )}
      <label className="dcim-search">
        <Search size={16} />
        <input
          aria-label="Search stations"
          placeholder="Find station, type or slot…"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
      </label>
      <div className="dcim-station-list">
        {filtered.map((rack) => (
          <RackCard
            key={rack.id}
            rack={rack}
            selected={selectedId === rack.id}
            onSelect={() => onSelect(rack.id)}
          />
        ))}
        {!filtered.length && (
          <p className="dcim-empty">
            {racks.length
              ? "No matching stations."
              : "No stations placed in this room."}
          </p>
        )}
      </div>
      <footer className="dcim-sidebar-footer">
        <span>
          <LayoutGrid size={14} />
          {unplacedCount} unplaced stations
        </span>
        {canEdit && (
          <div className="dcim-edit-actions">
            {isEditMode ? (
              <>
                <button
                  onClick={onAdd}
                  disabled={unplacedCount === 0}
                  title="Place next unplaced station"
                >
                  <Plus size={14} />
                  Place
                </button>
                <button onClick={onToggleDelete} aria-pressed={isDeleteMode}>
                  <Trash2 size={14} />
                  Remove
                </button>
                <button onClick={onSave}>
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
