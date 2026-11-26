import { Thermometer, Zap, LayoutGrid } from "lucide-react";
import type { RackData } from "../../types";
import { STATUS_COLORS, TYPE_COLORS, TYPE_LABELS } from "../../utils/stationVisual";

const STATUS_TEXT = { ok: "Healthy", warning: "Warning", critical: "Critical", unknown: "No data" } as const;

export function RackCard({
  rack,
  selected,
  onSelect,
}: {
  rack: RackData;
  selected?: boolean;
  onSelect?: () => void;
}) {
  const benches = rack.slots?.reduce((total, slot) => total + slot.benches.length, 0) ?? rack.benchCount;
  return (
    <button
      className={`dcim-station-card is-${rack.status} ${selected ? "is-selected" : ""}`}
      onClick={onSelect}
      aria-pressed={selected}
      style={{ "--status": STATUS_COLORS[rack.status] } as React.CSSProperties}
    >
      <span className="dcim-station-card-heading">
        <strong>{rack.name}</strong>
        <span className={`dcim-status-pill is-${rack.status}`}>
          <i style={{ background: STATUS_COLORS[rack.status] }} />
          {STATUS_TEXT[rack.status]}
        </span>
      </span>
      <span className="dcim-station-card-sub">
        <span className="dcim-type-dot" style={{ background: TYPE_COLORS[rack.modelKind] }} />
        {rack.stationType ?? TYPE_LABELS[rack.modelKind]}
        <span className="dcim-sep">·</span>
        {rack.slotCode ?? "Unplaced"}
      </span>
      <span className="dcim-station-metrics">
        <span title="Temperature">
          <Thermometer size={12} />
          {rack.temperature == null ? "—" : `${rack.temperature.toFixed(1)} °C`}
        </span>
        <span title="Power draw">
          <Zap size={12} />
          {rack.powerUsage == null ? "—" : `${rack.powerUsage.toFixed(1)} kW`}
        </span>
        <span title="Benches">
          <LayoutGrid size={12} />
          {benches ?? "—"}
          {rack.benchCapacity ? ` / ${rack.benchCapacity}` : ""}
        </span>
      </span>
    </button>
  );
}
