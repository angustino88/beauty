import React from 'react';
import { Link } from 'react-router-dom';
import { Activity, Boxes, Building2, Cpu, Gauge, Info, Lock, LockOpen, Server, Wrench } from 'lucide-react';
import {
  Code, DetailSection, FacetGrid, LinkedList, MeterStat, NoteBox, PropertyList, StatGrid, StatTile, StatusHero,
  type Facet, type HeroFact,
} from '@/shared/components/detail/DetailPrimitives';
import { refLabel } from '@/shared/utils/refLabel';
import type { StatusTone } from '@/shared/status/statusTone';
import type { LocationState, ResourceState } from '../resourceStatus';
import { explainSpaceStatus } from '../spaceStatusExplanation';
import type { ResourceMappingRow } from '@/features/spaces/mapping/types';

type SpaceKind = 'room' | 'station' | 'bench';

interface SpaceDetailSummaryProps {
  spaceKind: SpaceKind;
  record: Record<string, unknown>;
  connectedRows?: ResourceMappingRow[];
  onOpenMapping?: () => void;
}

/** Reads a dotted path from the record ("location_info.building"). */
const read = (record: Record<string, unknown>, path: string): unknown =>
  path.split('.').reduce<unknown>((value, key) => (
    value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>)[key] : undefined
  ), record);

/** First non-empty label among candidate fields (API field names vary between list and detail reads). */
const text = (record: Record<string, unknown>, ...paths: string[]): string | null => {
  for (const path of paths) {
    const label = refLabel(read(record, path));
    if (label) return label;
  }
  return null;
};

const num = (record: Record<string, unknown>, ...paths: string[]): number | null => {
  for (const path of paths) {
    const value = read(record, path);
    if (value === null || value === undefined || value === '') continue;
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
};

const ICONS: Record<SpaceKind, React.ReactNode> = { room: <Building2 />, station: <Server />, bench: <Cpu /> };

function locationOf(kind: SpaceKind, record: Record<string, unknown>): string {
  if (kind === 'room') {
    const building = text(record, 'location_info.building', 'building', 'building_name');
    const floor = text(record, 'floor', 'location_info.floor');
    const city = text(record, 'location_info.city', 'city');
    const country = text(record, 'country', 'location_info.country');
    const parts = [building && `Building ${building}`, floor && `Floor ${floor}`, city, country].filter(Boolean);
    return parts.length ? parts.join(' · ') : text(record, 'location', 'location_info.location_string') ?? 'Location not set';
  }
  const room = text(record, 'room_name', 'room', 'room_id');
  if (kind === 'station') {
    const slot = text(record, 'slot_code', 'slot_id');
    return room ? `${room}${slot ? ` › Slot ${slot}` : ''}` : 'Not placed in a room';
  }
  const station = text(record, 'station_name', 'station', 'setup_location_id');
  const slot = text(record, 'station_slot.slot_code', 'station_slot_id');
  if (!station) return 'Not placed on a station';
  return [room, `${station}${slot ? ` › Slot ${slot}` : ''}`].filter(Boolean).join(' › ');
}

function facetsOf(kind: SpaceKind, state: Partial<ResourceState & LocationState>): Facet[] {
  const facets: Facet[] = [];
  const lifecycle = state.lifecycle_status;
  if (lifecycle) {
    const tone: StatusTone = lifecycle.value === 'in_service' ? 'success' : lifecycle.value === 'planned' ? 'info' : 'neutral';
    facets.push({ label: 'Lifecycle', value: lifecycle.label || lifecycle.value, tone });
  }
  const condition = state.condition;
  if (condition) {
    const tone: StatusTone = condition.value === 'operational' ? 'success' : condition.value === 'in_maintenance' ? 'warning' : 'danger';
    facets.push({ label: 'Condition', value: condition.label || condition.value, tone, icon: condition.value === 'operational' ? undefined : <Wrench /> });
  }
  const access = state.access_policy;
  if (access) {
    const restricted = (typeof access === 'string' ? access : access.value) === 'restricted';
    facets.push({
      label: 'Access', value: restricted ? 'Restricted' : 'Open', tone: restricted ? 'reserved' : 'success',
      icon: restricted ? <Lock /> : <LockOpen />,
    });
  }
  if (kind === 'bench' && state.activity_status) {
    const activity = state.activity_status.value;
    facets.push({
      label: 'Booking activity',
      value: activity === 'active' ? 'In use now' : activity === 'scheduled' ? 'Booked later today' : 'Idle',
      tone: activity === 'active' ? 'info' : activity === 'scheduled' ? 'reserved' : 'neutral',
      icon: <Activity />,
    });
  }
  return facets;
}

function CapacityStats({ kind, record, equipmentCount }: { kind: SpaceKind; record: Record<string, unknown>; equipmentCount: number | null }) {
  const tiles: React.ReactNode[] = [];
  if (kind === 'room') {
    const occupied = num(record, 'slot_summary.occupied_slots');
    const rows = num(record, 'rows', 'layout_rows');
    const cols = num(record, 'cols', 'layout_columns');
    const slots = num(record, 'slot_summary.total_slots') ?? (rows && cols ? rows * cols : null);
    if (slots && occupied !== null) tiles.push(<MeterStat key="slots" label="Station slots used" used={occupied} total={slots} detail={rows && cols ? `${rows} × ${cols} grid` : undefined} />);
    else if (slots) tiles.push(<StatTile key="slots" label="Station slots" value={`${slots}`} detail={rows && cols ? `${rows} × ${cols} grid` : undefined} />);
    const used = num(record, 'power_usage');
    const max = num(record, 'max_power', 'max_power_w');
    if (max && used !== null) tiles.push(<MeterStat key="power" label="Power draw" used={used} total={max} unit="W" detail={`${(max - used).toLocaleString()} W headroom`} />);
    else if (max) tiles.push(<StatTile key="power" label="Power limit" value={`${max.toLocaleString()} W`} />);
    const temp = num(record, 'temperature');
    const humidity = num(record, 'humidity');
    if (temp || humidity) tiles.push(<StatTile key="env" label="Environment" value={temp ? `${temp} °C` : `${humidity}% RH`} detail={temp && humidity ? `${humidity}% relative humidity` : undefined} />);
  }
  if (kind === 'station') {
    const active = num(record, 'active_bench_count', 'bench_count');
    const capacity = num(record, 'bench_capacity');
    if (capacity && active !== null) tiles.push(<MeterStat key="benches" label="Bench slots used" used={active} total={capacity} />);
    const allocated = num(record, 'allocated_power_w');
    const power = num(record, 'power_capacity_w');
    const available = num(record, 'available_power_w') ?? (power !== null && allocated !== null ? power - allocated : null);
    if (power && allocated !== null) tiles.push(<MeterStat key="power" label="Power allocated" used={allocated} total={power} unit="W" detail={available !== null ? `${available.toLocaleString()} W available` : undefined} />);
    else if (power) tiles.push(<StatTile key="power" label="Power capacity" value={`${power.toLocaleString()} W`} />);
    const ports = num(record, 'network_port_capacity', 'network_port_count');
    if (ports !== null) tiles.push(<StatTile key="ports" label="Network ports" value={ports} />);
    const load = num(record, 'max_load_kg');
    if (load !== null) tiles.push(<StatTile key="load" label="Max load" value={`${load} kg`} />);
  }
  if (kind === 'bench') {
    if (equipmentCount !== null) tiles.push(<StatTile key="eq" label="Assigned equipment" value={`${equipmentCount} ${equipmentCount === 1 ? 'device' : 'devices'}`} />);
    const power = num(record, 'requested_power_w');
    if (power !== null) tiles.push(<StatTile key="power" label="Requested power" value={`${power.toLocaleString()} W`} />);
    const cooling = num(record, 'requested_cooling_w');
    if (cooling !== null) tiles.push(<StatTile key="cooling" label="Cooling need" value={`${cooling.toLocaleString()} W`} />);
    const load = num(record, 'requested_load_kg');
    if (load !== null) tiles.push(<StatTile key="load" label="Requested load" value={`${load} kg`} />);
  }
  if (!tiles.length) return null;
  return (
    <DetailSection title={kind === 'bench' ? 'Requirements' : 'Capacity & utilisation'} icon={<Gauge />}>
      <StatGrid>{tiles}</StatGrid>
    </DetailSection>
  );
}

function properties(kind: SpaceKind, record: Record<string, unknown>) {
  const sku = text(record, 'sku');
  const label = text(record, 'label');
  if (kind === 'room') {
    const length = num(record, 'length');
    const width = num(record, 'width');
    return [
      ['SKU', sku && <Code>{sku}</Code>],
      ['Room label', label],
      ['Building', text(record, 'location_info.building', 'building')],
      ['Floor', text(record, 'floor', 'location_info.floor')],
      ['City', text(record, 'location_info.city', 'city')],
      ['Country', text(record, 'country', 'location_info.country')],
      ['Floor area', length && width ? `${length} × ${width} m` : text(record, 'size')],
      ['Owner', text(record, 'primary_owner')],
    ] as const;
  }
  if (kind === 'station') {
    const h = num(record, 'height_mm');
    const w = num(record, 'width_mm');
    const d = num(record, 'depth_mm');
    return [
      ['SKU', sku && <Code>{sku}</Code>],
      ['Label', label],
      ['Room', text(record, 'room_name', 'room')],
      ['Slot', text(record, 'slot_code', 'slot_id')],
      ['Dimensions (H × W × D)', h && w && d ? `${h} × ${w} × ${d} mm` : null],
      ['Owner', text(record, 'primary_owner')],
    ] as const;
  }
  return [
    ['SKU', sku && <Code>{sku}</Code>],
    ['Group', text(record, 'group_name', 'bench_group')],
    ['Type', text(record, 'type_name', 'bench_type')],
    ['Owner', text(record, 'primary_owner', 'owner')],
    ['Department', text(record, 'department')],
    ['Location note', text(record, 'location_name')],
  ] as const;
}

function Connected({ kind, record, rows }: { kind: SpaceKind; record: Record<string, unknown>; rows: ResourceMappingRow[] }) {
  const mappingLink = <Link to="/spaces/mapping">Open mapping →</Link>;
  if (kind === 'bench') {
    const row = rows.find((r) => r.bench.id === Number(record.id)) ?? rows[0];
    const equipment = row?.equipment ?? [];
    if (!equipment.length) return null;
    return (
      <DetailSection title={`Assigned equipment (${equipment.length})`} icon={<Boxes />} action={mappingLink}>
        <LinkedList items={equipment.map((eq) => ({
          key: eq.id, code: eq.sku, title: eq.name,
          meta: [refLabel(eq.category), eq.role].filter(Boolean).join(' · '),
        }))} />
      </DetailSection>
    );
  }
  if (kind === 'station') {
    const stationId = Number(record.id);
    const hosted = rows.filter((r) => r.station?.id === stationId || r.bench.setup_location_id === stationId);
    if (!hosted.length) return null;
    return (
      <DetailSection title={`Hosted benches (${hosted.length})`} icon={<Boxes />} action={mappingLink}>
        <LinkedList items={hosted.map((r) => ({
          key: r.id, code: r.bench.sku, title: r.bench.name,
          meta: [r.station_slot && `Slot ${r.station_slot.slot_code}`, `${r.equipment.length} equipment`].filter(Boolean).join(' · '),
        }))} />
      </DetailSection>
    );
  }
  return null;
}

export const SpaceDetailSummary: React.FC<SpaceDetailSummaryProps> = ({ spaceKind, record, connectedRows = [] }) => {
  const state = record as unknown as Partial<LocationState & ResourceState>;
  const status = explainSpaceStatus(state, spaceKind);
  const access = state.access_policy;
  const restricted = (typeof access === 'string' ? access : access?.value) === 'restricted';
  const benchRow = connectedRows.find((r) => r.bench.id === Number(record.id)) ?? connectedRows[0];
  const equipmentCount = spaceKind !== 'bench' ? null
    : benchRow?.equipment?.length ?? (Array.isArray(record.equipment) ? record.equipment.length : num(record, 'equipment_count'));

  const facts: HeroFact[] = [{ label: 'Location', value: locationOf(spaceKind, record) }];
  if (state.availability?.blocked_by) {
    const blocker = state.availability.blocked_by;
    facts.push({ label: 'Blocked by', value: `${blocker.type.charAt(0).toUpperCase()}${blocker.type.slice(1)} ${blocker.name}`, tone: 'warning' });
  }
  if (restricted) facts.push({ label: 'Access', value: 'Restricted — approval needed', tone: 'reserved' });

  const remark = text(record, 'remark');

  return (
    <div className="tw:flex tw:min-w-0 tw:flex-col tw:gap-5">
      <StatusHero tone={status.tone} title={status.title} description={status.description} icon={ICONS[spaceKind]} facts={facts} />
      <FacetGrid items={facetsOf(spaceKind, state)} />
      <CapacityStats kind={spaceKind} record={record} equipmentCount={equipmentCount} />
      <Connected kind={spaceKind} record={record} rows={connectedRows} />
      {(() => {
        const items = properties(spaceKind, record);
        return items.some(([, value]) => value) ? (
          <DetailSection title="Details" icon={<Info />}><PropertyList items={[...items]} /></DetailSection>
        ) : null;
      })()}
      {remark && <NoteBox>{remark}</NoteBox>}
    </div>
  );
};

export default SpaceDetailSummary;
