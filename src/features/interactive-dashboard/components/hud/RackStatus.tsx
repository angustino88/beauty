import type { RackStatusProps } from "../../types";
import { STATUS_COLORS } from "../../utils/stationVisual";

export function RackStatus({
  name,
  temperature,
  humidity,
  powerUsage,
  status,
  pinned,
  onTogglePin,
}: RackStatusProps) {
  return (
    <button
      className="dcim-station-label"
      onClick={(event) => {
        event.stopPropagation();
        onTogglePin();
      }}
      aria-pressed={pinned}
      title={`${name}: ${status === "unknown" ? "Telemetry incomplete" : status}. Click to pin details.`}
      style={{ borderLeftColor: STATUS_COLORS[status] }}
    >
      <strong>{name}</strong>
      {pinned && (
        <span>
          {temperature == null ? "—" : `${temperature.toFixed(1)} °C`} ·{" "}
          {humidity == null ? "—" : `${humidity.toFixed(0)} %`} ·{" "}
          {powerUsage == null ? "—" : `${powerUsage.toFixed(1)} kW`}
        </span>
      )}
    </button>
  );
}
