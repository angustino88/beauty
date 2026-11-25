import type { RackData } from "../../types";
import { STATUS_COLORS, TYPE_LABELS } from "../../utils/stationVisual";

export function RackCard({
  rack,
  selected,
  onSelect,
}: {
  rack: RackData;
  selected?: boolean;
  onSelect?: () => void;
}) {
  return (
    <button
      className={`dcim-station-card ${selected ? "is-selected" : ""}`}
      onClick={onSelect}
      aria-pressed={selected}
    >
      <span className="dcim-station-card-heading">
        <strong>{rack.name}</strong>
        <i style={{ background: STATUS_COLORS[rack.status] }} />
      </span>
      <span>
        {rack.stationType ?? TYPE_LABELS[rack.modelKind]} <b>·</b>{" "}
        {rack.slotCode ?? "Unplaced"}
      </span>
      <span className="dcim-station-metrics">
        <span>
          {rack.temperature == null
            ? "— °C"
            : `${rack.temperature.toFixed(1)} °C`}
        </span>
        <span>
          {rack.powerUsage == null
            ? "— kW"
            : `${rack.powerUsage.toFixed(1)} kW`}
        </span>
        <span>
          {rack.status === "unknown" ? "No / partial data" : rack.status}
        </span>
      </span>
    </button>
  );
}
