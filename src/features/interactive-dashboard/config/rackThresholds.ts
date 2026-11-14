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

export type RackStatus = 'ok' | 'warning' | 'critical';

export function getRackStatus(
  temperature: number,
  powerUsage: number,
  humidity: number,
): RackStatus {
  const t = RACK_THRESHOLDS.temperature;
  const p = RACK_THRESHOLDS.power;
  const h = RACK_THRESHOLDS.humidity;

  if (
    temperature > t.critical ||
    powerUsage > p.critical ||
    humidity > h.critical
  ) return 'critical';

  if (
    temperature > t.warning ||
    powerUsage > p.warning ||
    humidity > h.warning
  ) return 'warning';

  return 'ok';
}
