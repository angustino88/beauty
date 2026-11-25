import type { IStation } from '@/features/spaces/station/types';
import { getRackStatus, type RackStatus } from '../config/rackThresholds.ts';
import { stationVisual } from './stationVisual.ts';
import type { RackData, NotificationCounts } from '../types';

export function toRoomSlug(name: string): string {
    return name.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
}

export function metricStatus(
    value: number | null,
    thresholds: { warning: number; critical: number },
): RackStatus {
    if (value == null) return 'unknown';
    if (value > thresholds.critical) return 'critical';
    if (value > thresholds.warning) return 'warning';
    return 'ok';
}

export function toRackData(
    rack: IStation,
    position: [number, number, number] | null,
    slotCode: string | null,
): RackData {
    const temperature = rack.temperature ?? null;
    const humidity = rack.humidity ?? null;
    const powerUsage = rack.power_usage ?? null;
    return {
        ...stationVisual(rack),
        benchCount: rack.active_bench_count ?? rack.bench_count ?? null,
        benchCapacity: rack.bench_capacity ?? null,
        id: rack.id,
        name: rack.name,
        temperature,
        humidity,
        powerUsage,
        status: getRackStatus(temperature, powerUsage, humidity),
        position,
        slotCode,
        manufacturer: rack.rack_manufacturer?.manufacturer_name ?? null,
        model: rack.rack_model?.model_name ?? null,
    };
}

export function deriveNotifications(racks: RackData[]): NotificationCounts {
    const counts: NotificationCounts = { ok: 0, warning: 0, critical: 0, unknown: 0 };
    racks.forEach(r => { counts[r.status]++; });
    return counts;
}
