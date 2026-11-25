/**
 * Rack status thresholds — edit here to tune warning/critical levels.
 * All values are inclusive upper bounds (value > threshold → next level).
 */
const LAB_TOTAL_POWER_CAPACITY_KW = 200;

export const RACK_THRESHOLDS = {
  temperature: {
    warning: 30,
    critical: 50,
  },
  power: {
    warning: 0.8 * LAB_TOTAL_POWER_CAPACITY_KW,
    critical: 0.95 * LAB_TOTAL_POWER_CAPACITY_KW,
  },
  humidity: {
    warning: 65,
    critical: 75,
  },
} as const;

export type RackStatus = 'ok' | 'warning' | 'critical' | 'unknown';

export function getRackStatus(
  temperature: number | null,
  powerUsage: number | null,
  humidity: number | null,
): RackStatus {
  const t = RACK_THRESHOLDS.temperature;
  const p = RACK_THRESHOLDS.power;
  const h = RACK_THRESHOLDS.humidity;

  if (
    (temperature != null && temperature > t.critical) ||
    (powerUsage != null && powerUsage > p.critical) ||
    (humidity != null && humidity > h.critical)
  ) return 'critical';

  if (
    (temperature != null && temperature > t.warning) ||
    (powerUsage != null && powerUsage > p.warning) ||
    (humidity != null && humidity > h.warning)
  ) return 'warning';

  return temperature == null || powerUsage == null || humidity == null ? 'unknown' : 'ok';
}
