import type { RackData } from "../types.ts";
import { RACK_THRESHOLDS } from "../config/rackThresholds.ts";

export type Overlay = "none" | "temperature" | "humidity" | "power" | "capacity";

export const OVERLAY_LABELS: Record<Overlay, string> = {
  none: "No overlay",
  temperature: "Temperature",
  humidity: "Relative humidity",
  power: "Power draw",
  capacity: "Capacity used",
};

export interface CapacityUse {
  power: number | null;
  load: number | null;
  rackUnits: number | null;
  benches: number | null;
}

/** Share of each rated capacity in use (0–1, may exceed 1); null where the station has no rating. */
export function capacityUse(rack: RackData): CapacityUse {
  const capacity = rack.capacity;
  const ratio = (used: number | null | undefined, rated: number | null | undefined) =>
    used != null && rated ? used / rated : null;
  return {
    power: ratio(
      (capacity?.power_installed_w ?? 0) + (capacity?.power_reserved_w ?? 0) || null,
      capacity?.power_capacity_w,
    ),
    load: ratio(capacity?.load_installed_kg, capacity?.max_load_kg),
    rackUnits: ratio(capacity?.rack_units_used, capacity?.rack_units),
    benches: ratio(rack.benchCount, rack.benchCapacity),
  };
}

/** The tightest constraint: the highest share in use across power, weight, rack units and benches. */
export function capacityPeak(rack: RackData): number | null {
  const values = Object.values(capacityUse(rack)).filter((value): value is number => value != null);
  return values.length ? Math.max(...values) : null;
}

/** Colour ramp used by the heatmap, the metric bars and their legend (cool → hot). */
export const HEAT_STOPS = ["#2563eb", "#06b6d4", "#22c55e", "#eab308", "#f97316", "#dc2626"];

export function overlayValue(rack: RackData, overlay: Overlay): number | null {
  if (overlay === "temperature") return rack.temperature;
  if (overlay === "humidity") return rack.humidity;
  if (overlay === "power") return rack.powerUsage;
  if (overlay === "capacity") return capacityPeak(rack);
  return null;
}

/**
 * Value range of the overlay. Temperature and humidity use fixed operating bands up to their critical
 * thresholds so colours mean the same in every room; power scales to the busiest station in the room.
 */
export function overlayDomain(racks: RackData[], overlay: Overlay): [number, number] {
  if (overlay === "temperature") return [18, RACK_THRESHOLDS.temperature.critical];
  if (overlay === "humidity") return [20, RACK_THRESHOLDS.humidity.critical];
  if (overlay === "capacity") return [0, 1];
  const values = racks.map((rack) => overlayValue(rack, overlay)).filter((value): value is number => value != null);
  return [0, Math.max(1, ...values)];
}

export function normalise(value: number, [min, max]: [number, number]) {
  return Math.min(1, Math.max(0, (value - min) / (max - min || 1)));
}

function hexToRgb(hex: string): [number, number, number] {
  const value = parseInt(hex.slice(1), 16);
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
}

/** Colour of a 0–1 value on the heat ramp. */
export function heatColor(t: number): [number, number, number] {
  const scaled = Math.min(1, Math.max(0, t)) * (HEAT_STOPS.length - 1);
  const index = Math.min(HEAT_STOPS.length - 2, Math.floor(scaled));
  const local = scaled - index;
  const [a, b] = [hexToRgb(HEAT_STOPS[index]), hexToRgb(HEAT_STOPS[index + 1])];
  return [0, 1, 2].map((i) => Math.round(a[i] + (b[i] - a[i]) * local)) as [number, number, number];
}

export function heatHex(t: number) {
  const [r, g, b] = heatColor(t);
  return `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)}`;
}

export function formatMetric(value: number | null, overlay: Overlay) {
  if (value == null) return "—";
  if (overlay === "capacity") return `${Math.round(value * 100)} %`;
  if (overlay === "humidity") return `${Math.round(value)} %`;
  return overlay === "temperature" ? `${value.toFixed(1)} °C` : `${value.toFixed(1)} kW`;
}
