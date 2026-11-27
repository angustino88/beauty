import type { RackData } from "../types.ts";
import { RACK_THRESHOLDS } from "../config/rackThresholds.ts";
import { capacityUse } from "./overlays.ts";

export interface FreeURange {
  startU: number;
  endU: number;
  sizeU: number;
}

export interface RoomRollup {
  stationCount: number;
  rackCount: number;
  totalPowerCapacityW: number;
  totalPowerAllocatedW: number;
  powerUtilization: number | null;
  livePowerKw: number | null;
  totalRackUnits: number;
  usedRackUnits: number;
  freeRackUnits: number;
  rackUtilization: number | null;
  totalBenches: number;
  totalBenchCapacity: number;
  totalDevices: number;
  tempMin: number | null;
  tempAvg: number | null;
  tempMax: number | null;
  humidityAvg: number | null;
  liveStationCount: number;
  totalSensors: number;
}

export interface CapacityRequirement {
  requiredU: number;
  requiredPowerW: number;
  requiredWeightKg: number;
  requiredBenches: number;
  face: "front" | "rear";
}

export interface CapacityMatch {
  rack: RackData;
  fits: boolean;
  reasons: string[];
  freeRanges: FreeURange[];
  maxContiguousU: number;
  freePowerW: number | null;
  freeWeightKg: number | null;
  freeBenches: number | null;
  score: number;
}

export interface StationAlert {
  id: string;
  stationId: number;
  stationName: string;
  slotCode: string | null;
  severity: "critical" | "warning";
  category: "temperature" | "humidity" | "power" | "capacity";
  title: string;
  detail: string;
}

/** Compute contiguous free U blocks for a rack face (1-indexed, bottom U = 1). */
export function findContiguousFreeU(
  totalU: number,
  items: NonNullable<RackData["rackItems"]> = [],
  face: "front" | "rear" = "front",
): FreeURange[] {
  if (totalU <= 0) return [];
  const occupied = new Uint8Array(totalU + 1);
  for (const item of items) {
    const itemFace = (item.rack_face || "front").toLowerCase();
    if (itemFace !== face && itemFace !== "both") continue;
    const start = Math.max(1, item.rack_unit);
    const end = Math.min(totalU, item.rack_unit + Math.max(1, item.rack_unit_height) - 1);
    for (let u = start; u <= end; u++) occupied[u] = 1;
  }
  const ranges: FreeURange[] = [];
  let start: number | null = null;
  for (let u = 1; u <= totalU; u++) {
    if (!occupied[u]) {
      if (start === null) start = u;
    } else if (start !== null) {
      ranges.push({ startU: start, endU: u - 1, sizeU: u - start });
      start = null;
    }
  }
  if (start !== null) {
    ranges.push({ startU: start, endU: totalU, sizeU: totalU - start + 1 });
  }
  return ranges;
}

/** Room-wide DCIM facility rollup across all placed stations. */
export function computeRoomRollup(racks: RackData[]): RoomRollup {
  let rackCount = 0;
  let totalPowerCapacityW = 0;
  let totalPowerAllocatedW = 0;
  let livePowerSum = 0;
  let livePowerReadings = 0;
  let totalRackUnits = 0;
  let usedRackUnits = 0;
  let totalBenches = 0;
  let totalBenchCapacity = 0;
  let totalDevices = 0;
  const temps: number[] = [];
  const humidities: number[] = [];
  let liveStationCount = 0;
  let totalSensors = 0;

  for (const rack of racks) {
    if (rack.capacity?.rack_units) {
      rackCount += 1;
      totalRackUnits += rack.capacity.rack_units;
      usedRackUnits += rack.capacity.rack_units_used ?? 0;
    }
    if (rack.capacity?.power_capacity_w) {
      totalPowerCapacityW += rack.capacity.power_capacity_w;
      totalPowerAllocatedW +=
        (rack.capacity.power_installed_w ?? 0) + (rack.capacity.power_reserved_w ?? 0);
    }
    if (rack.powerUsage != null) {
      livePowerSum += rack.powerUsage;
      livePowerReadings += 1;
    }
    const benches = (rack.slots ?? []).flatMap((slot) => slot.benches);
    totalBenches += rack.benchCount ?? benches.length;
    totalBenchCapacity += rack.benchCapacity ?? 0;
    for (const bench of benches) totalDevices += bench.equipment.length;
    if (!benches.length && rack.rackItems?.length) {
      totalDevices += rack.rackItems.length;
    }
    if (rack.temperature != null) temps.push(rack.temperature);
    if (rack.humidity != null) humidities.push(rack.humidity);
    if (rack.conditionsAt) {
      liveStationCount += 1;
      totalSensors += rack.sensorCount ?? 0;
    }
  }

  return {
    stationCount: racks.length,
    rackCount,
    totalPowerCapacityW,
    totalPowerAllocatedW,
    powerUtilization: totalPowerCapacityW > 0 ? totalPowerAllocatedW / totalPowerCapacityW : null,
    livePowerKw: livePowerReadings > 0 ? livePowerSum : null,
    totalRackUnits,
    usedRackUnits,
    freeRackUnits: Math.max(0, totalRackUnits - usedRackUnits),
    rackUtilization: totalRackUnits > 0 ? usedRackUnits / totalRackUnits : null,
    totalBenches,
    totalBenchCapacity,
    totalDevices,
    tempMin: temps.length ? Math.min(...temps) : null,
    tempAvg: temps.length ? temps.reduce((a, b) => a + b, 0) / temps.length : null,
    tempMax: temps.length ? Math.max(...temps) : null,
    humidityAvg: humidities.length ? humidities.reduce((a, b) => a + b, 0) / humidities.length : null,
    liveStationCount,
    totalSensors,
  };
}

/** Check whether a requirement has any active constraint. */
export function hasCapacityRequirement(req: CapacityRequirement): boolean {
  return (
    req.requiredU > 0 ||
    req.requiredPowerW > 0 ||
    req.requiredWeightKg > 0 ||
    req.requiredBenches > 0
  );
}

/** Evaluate every station against a What-If DCIM deployment requirement. */
export function matchCapacityPlan(
  racks: RackData[],
  req: CapacityRequirement,
): CapacityMatch[] {
  return racks
    .map((rack) => {
      const reasons: string[] = [];
      const totalU = rack.capacity?.rack_units ?? 0;
      const freeRanges = findContiguousFreeU(totalU, rack.rackItems ?? [], req.face);
      const maxContiguousU = freeRanges.reduce((best, r) => Math.max(best, r.sizeU), 0);

      const powerRated = rack.capacity?.power_capacity_w ?? null;
      const powerUsed =
        (rack.capacity?.power_installed_w ?? 0) + (rack.capacity?.power_reserved_w ?? 0);
      const freePowerW = powerRated != null ? Math.max(0, powerRated - powerUsed) : null;

      const weightRated = rack.capacity?.max_load_kg ?? null;
      const weightUsed = rack.capacity?.load_installed_kg ?? 0;
      const freeWeightKg = weightRated != null ? Math.max(0, weightRated - weightUsed) : null;

      const benchCap = rack.benchCapacity ?? null;
      const benchUsed =
        rack.benchCount ?? (rack.slots ?? []).reduce((sum, s) => sum + s.benches.length, 0);
      const freeBenches = benchCap != null ? Math.max(0, benchCap - benchUsed) : null;

      if (req.requiredU > 0) {
        if (totalU <= 0) reasons.push("Not a rack-unit station");
        else if (maxContiguousU < req.requiredU) {
          reasons.push(`Needs ${req.requiredU}U contiguous (max ${maxContiguousU}U)`);
        }
      }
      if (req.requiredPowerW > 0) {
        if (freePowerW === null) reasons.push("No rated power capacity");
        else if (freePowerW < req.requiredPowerW) {
          reasons.push(`Needs ${req.requiredPowerW} W (${Math.round(freePowerW)} W free)`);
        }
      }
      if (req.requiredWeightKg > 0) {
        if (freeWeightKg === null) reasons.push("No rated weight limit");
        else if (freeWeightKg < req.requiredWeightKg) {
          reasons.push(`Needs ${req.requiredWeightKg} kg (${Math.round(freeWeightKg)} kg free)`);
        }
      }
      if (req.requiredBenches > 0) {
        if (freeBenches === null) reasons.push("No bench capacity configured");
        else if (freeBenches < req.requiredBenches) {
          reasons.push(`Needs ${req.requiredBenches} bench slot(s) (${freeBenches} free)`);
        }
      }

      // Rank matching stations by balanced headroom (cooler + more power/U margin).
      const uMargin = totalU > 0 ? maxContiguousU / totalU : 0;
      const pMargin = powerRated ? (freePowerW ?? 0) / powerRated : 0.5;
      const tempBonus = rack.temperature != null ? Math.max(0, (45 - rack.temperature) / 45) : 0.3;
      const fits = reasons.length === 0;
      const score = (fits ? 10 : 0) + uMargin * 2 + pMargin * 2 + tempBonus;

      return {
        rack,
        fits,
        reasons,
        freeRanges,
        maxContiguousU,
        freePowerW,
        freeWeightKg,
        freeBenches,
        score,
      };
    })
    .sort((a, b) => Number(b.fits) - Number(a.fits) || b.score - a.score);
}

/** Build a prioritized list of environmental and capacity alerts across placed stations. */
export function deriveStationAlerts(racks: RackData[]): StationAlert[] {
  const alerts: StationAlert[] = [];
  for (const rack of racks) {
    if (rack.temperature != null) {
      if (rack.temperature > RACK_THRESHOLDS.temperature.critical) {
        alerts.push({
          id: `${rack.id}-temp-crit`,
          stationId: rack.id,
          stationName: rack.name,
          slotCode: rack.slotCode,
          severity: "critical",
          category: "temperature",
          title: `Thermal critical · ${rack.temperature.toFixed(1)} °C`,
          detail: `Exceeds ${RACK_THRESHOLDS.temperature.critical} °C limit`,
        });
      } else if (rack.temperature > RACK_THRESHOLDS.temperature.warning) {
        alerts.push({
          id: `${rack.id}-temp-warn`,
          stationId: rack.id,
          stationName: rack.name,
          slotCode: rack.slotCode,
          severity: "warning",
          category: "temperature",
          title: `Elevated temperature · ${rack.temperature.toFixed(1)} °C`,
          detail: `Above ${RACK_THRESHOLDS.temperature.warning} °C warning`,
        });
      }
    }

    if (rack.humidity != null) {
      if (rack.humidity > RACK_THRESHOLDS.humidity.critical) {
        alerts.push({
          id: `${rack.id}-hum-crit`,
          stationId: rack.id,
          stationName: rack.name,
          slotCode: rack.slotCode,
          severity: "critical",
          category: "humidity",
          title: `Humidity critical · ${Math.round(rack.humidity)} %`,
          detail: `Exceeds ${RACK_THRESHOLDS.humidity.critical} % RH limit`,
        });
      } else if (rack.humidity > RACK_THRESHOLDS.humidity.warning) {
        alerts.push({
          id: `${rack.id}-hum-warn`,
          stationId: rack.id,
          stationName: rack.name,
          slotCode: rack.slotCode,
          severity: "warning",
          category: "humidity",
          title: `High humidity · ${Math.round(rack.humidity)} %`,
          detail: `Above ${RACK_THRESHOLDS.humidity.warning} % RH warning`,
        });
      }
    }

    const use = capacityUse(rack);
    const capChecks: Array<[string, number | null]> = [
      ["Power budget", use.power],
      ["Rack U space", use.rackUnits],
      ["Weight load", use.load],
    ];
    for (const [label, share] of capChecks) {
      if (share == null) continue;
      if (share > 0.95) {
        alerts.push({
          id: `${rack.id}-cap-${label}`,
          stationId: rack.id,
          stationName: rack.name,
          slotCode: rack.slotCode,
          severity: "critical",
          category: label === "Power budget" ? "power" : "capacity",
          title: `${label} saturated · ${Math.round(share * 100)}%`,
          detail: "Above 95% rated station limit",
        });
      } else if (share > 0.8) {
        alerts.push({
          id: `${rack.id}-cap-${label}`,
          stationId: rack.id,
          stationName: rack.name,
          slotCode: rack.slotCode,
          severity: "warning",
          category: label === "Power budget" ? "power" : "capacity",
          title: `${label} high · ${Math.round(share * 100)}%`,
          detail: "Above 80% rated station limit",
        });
      }
    }
  }
  return alerts.sort((a, b) => {
    if (a.severity !== b.severity) return a.severity === "critical" ? -1 : 1;
    return a.stationName.localeCompare(b.stationName);
  });
}
