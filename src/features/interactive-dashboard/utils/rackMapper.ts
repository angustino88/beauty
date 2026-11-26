import type { IStation } from '@/features/spaces/station/types';
import { getRackStatus, type RackStatus } from '../config/rackThresholds.ts';
import { stationVisual } from './stationVisual.ts';
import type { RackData, NotificationCounts } from '../types';
import type { IDashboardStationInfo } from '../../spaces/room/types';

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
    { trueScale = false }: { trueScale?: boolean } = {},
): RackData {
    const temperature = rack.temperature ?? null;
    const humidity = rack.humidity ?? null;
    const powerUsage = rack.power_usage ?? null;
    return {
        ...stationVisual(rack, { trueScale }),
        stationTypeId: rack.type?.id ?? null,
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

/**
 * Adds what the room mapping knows about a station: live conditions (which replace the station's own
 * fields and re-derive its status), capacity, and rack contents. `slotRotation` orients a station on a
 * measured plan when the station itself has no orientation.
 */
export function withStationInfo(
    rack: RackData,
    info: IDashboardStationInfo | undefined,
    slotRotation?: number,
): RackData {
    if (!info) return rack;
    const live = info.conditions;
    const temperature = live?.temperature_c ?? rack.temperature;
    const humidity = live?.humidity_percent ?? rack.humidity;
    const powerUsage = live?.power_w != null ? live.power_w / 1000 : rack.powerUsage;
    const ownOrientation = info.layout?.orientation_degrees;
    return {
        ...rack,
        temperature,
        humidity,
        powerUsage,
        status: getRackStatus(temperature, powerUsage, humidity),
        capacity: info.capacity,
        rackItems: info.rack ?? [],
        conditionsAt: live?.observed_at ?? null,
        sensorCount: live?.channel_count ?? 0,
        rotation: ownOrientation ? rack.rotation : (slotRotation ?? rack.rotation),
    };
}

export function deriveNotifications(racks: RackData[]): NotificationCounts {
    const counts: NotificationCounts = { ok: 0, warning: 0, critical: 0, unknown: 0 };
    racks.forEach(r => { counts[r.status]++; });
    return counts;
}
