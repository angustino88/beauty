import type { ResourceMappingData, MappingEquipment } from '@/shared/api/generated/api';

export interface StationPosition {
  id: number;
  label: string;
  benches: { id: number; name: string; equipment: MappingEquipment[] }[];
}

export function stationContents(data: Partial<ResourceMappingData>) {
  if (!Array.isArray(data.station_slots) || !Array.isArray(data.benches) || !Array.isArray(data.equipment)) return undefined;
  const result: Record<number, StationPosition[]> = {};
  const slots = new Map<number, StationPosition>();
  for (const slot of [...data.station_slots].sort((a, b) => a.position_index - b.position_index)) {
    const position: StationPosition = { id: slot.id, label: [slot.slot_code, slot.label].filter(Boolean).join(' · '), benches: [] };
    slots.set(slot.id, position);
    (result[slot.station_id] ??= []).push(position);
  }
  const devices = new Map<number, MappingEquipment[]>();
  for (const bench of data.benches) {
    let slot = slots.get(bench.station_slot_id ?? -1);
    if (!slot && bench.setup_location_id != null) {
      const positions = result[bench.setup_location_id] ??= [];
      slot = positions.find(p => p.id === -1);
      if (!slot) positions.push(slot = { id: -1, label: 'No assigned slot', benches: [] });
    }
    if (!slot) continue;
    const equipment: MappingEquipment[] = [];
    slot.benches.push({ id: bench.id, name: bench.name || bench.sku, equipment });
    devices.set(bench.id, equipment);
  }
  for (const device of data.equipment) devices.get(device.bench_id ?? -1)?.push(device);
  return result;
}
