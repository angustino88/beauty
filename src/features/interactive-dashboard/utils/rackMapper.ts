import type { IStation } from '@/features/spaces/station/types';
import { getRackStatus, type RackStatus } from '../config/rackThresholds';
import type { RackData, NotificationCounts } from '../types';

export function toRoomSlug(name: string): string {
    return name.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
}

export function metricStatus(
    value: number,
    thresholds: { warning: number; critical: number },
): RackStatus {
    if (value > thresholds.critical) return 'critical';
    if (value > thresholds.warning) return 'warning';
    return 'ok';
}

export function toRackData(
    rack: IStation,
    position: [number, number, number] | null,
    slotCode: string | null,
): RackData {
    const temperature = rack.temperature ?? 0;
    const humidity = rack.humidity ?? 0;
    const powerUsage = rack.power_usage ?? 0;
    return {
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
    const counts: NotificationCounts = { ok: 0, warning: 0, critical: 0 };
    racks.forEach(r => { counts[r.status]++; });
    return counts;
}
