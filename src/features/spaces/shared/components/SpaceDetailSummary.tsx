import React from 'react';
import { Link } from 'react-router-dom';
import { Spin } from 'antd';
import { Activity, Boxes, Building2, Cpu, Gauge, Info, Lock, LockOpen, Server, Wrench } from 'lucide-react';
import {
  Code, DetailSection, FacetGrid, LinkedEmpty, LinkedList, MeterStat, NoteBox, PropertyList, StatGrid, StatTile, StatusHero,
  type Facet, type HeroFact, type LinkedListBadge,
} from '@/shared/components/detail/DetailPrimitives';
import { refLabel } from '@/shared/utils/refLabel';
import type { StatusTone } from '@/shared/status/statusTone';
import type { LocationState, ResourceState } from '../resourceStatus';
import { BENCH_DETAILS, ROOM_DETAILS, STATION_DETAILS } from '../resourceForm';
import { explainSpaceStatus } from '../spaceStatusExplanation';
import type { ResourceMappingRow } from '@/features/spaces/mapping/types';
import type { RoomAssignedStationItem } from '@/features/spaces/mapping/mapper';
import { categoryPath } from '@/features/spaces/mapping/columns/mappingColumnRenderers';
import { useCategoryKeyById } from '@/features/spaces/mapping/hooks/useCategoryKeyById';
import { resolveCategoryKey } from '@/features/spaces/mapping/utils/categoryKey';

type SpaceKind = 'room' | 'station' | 'bench';

interface SpaceDetailSummaryProps {
  spaceKind: SpaceKind;
  record: Record<string, unknown>;
  connectedRows?: ResourceMappingRow[];
  roomStations?: RoomAssignedStationItem[];
  connectedLoading?: boolean;
  onNavigate?: () => void;
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
  const slot = text(record, 'station_slot_name', 'station_slot.slot_code', 'station_slot_id');
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
      ['Department', text(record, 'department')],
      ['Owning group', text(record, 'group')],
    ] as const;
  }
  if (kind === 'station') {
    const h = num(record, 'height_mm');
    const w = num(record, 'width_mm');
    const d = num(record, 'depth_mm');
    return [
      ['SKU', sku && <Code>{sku}</Code>],
      ['Label', label],
      ['Station type', text(record, 'station_type', 'type')],
      ['Room', text(record, 'room_name', 'room')],
      ['Slot', text(record, 'slot_code', 'slot_id')],
      ['Dimensions (H × W × D)', h && w && d ? `${h} × ${w} × ${d} mm` : null],
      ['Owner', text(record, 'primary_owner')],
      ['Department', text(record, 'department')],
      ['Owning group', text(record, 'group')],
    ] as const;
  }
  return [
    ['SKU', sku && <Code>{sku}</Code>],
    ['Bench group', text(record, 'bench_group', 'group_name')],
    ['Bench type', text(record, 'bench_type', 'type', 'type_name')],
    ['Owning group', text(record, 'group')],
    ['Owner', text(record, 'primary_owner', 'owner')],
    ['Department', text(record, 'department')],
    ['Location note', text(record, 'location_name')],
  ] as const;
}

const SPECIFICATION_FIELDS = {
  bench: BENCH_DETAILS.filter(({ name }) => !name.startsWith('requested_')),
  room: ROOM_DETAILS,
  station: STATION_DETAILS,
};

function specificationProperties(kind: SpaceKind, record: Record<string, unknown>) {
  return SPECIFICATION_FIELDS[kind].flatMap(({ name, label, type }) => {
    const value = record[name];
    if (value == null || value === '') return [];
    if (type === 'json-object') {
      return typeof value === 'object' && Object.keys(value).length
        ? [[label, JSON.stringify(value)] as const]
        : [];
    }
    return [[label, String(value)] as const];
  });
}

function fallbackRoomStations(record: Record<string, unknown>): RoomAssignedStationItem[] {
  const rawList = record.rack_list;
  if (!Array.isArray(rawList)) return [];
  return rawList
    .filter((item): item is Record<string, unknown> => Boolean(item && typeof item === 'object' && 'id' in item))
    .map((item) => ({
      id: Number(item.id),
      sku: typeof item.sku === 'string' ? item.sku : '',
      name: typeof item.name === 'string' ? item.name : '',
      slotCode: typeof item.slot_code === 'string' && item.slot_code ? item.slot_code : null,
      benchCount: typeof item.bench_count === 'number' ? item.bench_count : 0,
      equipmentCount: 0,
    }))
    .filter((item) => Number.isFinite(item.id) && item.id > 0);
}

function Connected({
  kind,
  record,
  rows,
  roomStations,
  loading,
  onNavigate,
}: {
  kind: SpaceKind;
  record: Record<string, unknown>;
  rows: ResourceMappingRow[];
  roomStations?: RoomAssignedStationItem[];
  loading?: boolean;
  onNavigate?: () => void;
}) {
  const keyById = useCategoryKeyById();
  const recordToken = text(record, 'sku', 'name');
  const mappingTo = recordToken ? `/spaces/mapping?q=${encodeURIComponent(recordToken)}` : '/spaces/mapping';
  const mappingLink = (
    <Link to={mappingTo} onClick={onNavigate}>
      Open in Mapping →
    </Link>
  );

  if (kind === 'bench') {
    const row = rows.find((r) => r.bench.id === Number(record.id)) ?? rows[0];
    const equipment = row?.equipment ?? [];
    const headerTitle = loading && equipment.length === 0
      ? 'Assigned equipment'
      : `Assigned equipment (${equipment.length})`;
    return (
      <DetailSection title={headerTitle} icon={<Boxes />} action={mappingLink}>
        {loading && equipment.length === 0 ? (
          <LinkedEmpty>
            <Spin size="small" />
            <span>Loading assigned equipment…</span>
          </LinkedEmpty>
        ) : equipment.length === 0 ? (
          <LinkedEmpty>No equipment assigned to this bench yet.</LinkedEmpty>
        ) : (
          <LinkedList
            onItemClick={onNavigate}
            items={equipment.map((eq) => {
              const categoryKey = resolveCategoryKey(eq.category, keyById);
              const basePath = categoryPath(categoryKey);
              const token = eq.sku || eq.name || '';
              const to = basePath
                ? `${basePath}?q=${encodeURIComponent(token)}`
                : `/spaces/mapping?q=${encodeURIComponent(token)}`;
              const badges: LinkedListBadge[] = [];
              const categoryName = refLabel(eq.category);
              if (categoryName) badges.push({ label: categoryName, accent: true });
              if (eq.role && eq.role !== 'default') badges.push({ label: eq.role });
              return {
                key: eq.id,
                code: eq.sku,
                title: eq.name || eq.sku,
                badges,
                to,
              };
            })}
          />
        )}
      </DetailSection>
    );
  }

  if (kind === 'station') {
    const stationId = Number(record.id);
    const hosted = rows
      .filter((r) => r.station?.id === stationId || r.bench.setup_location_id === stationId)
      .slice()
      .sort((a, b) => {
        const slotA = a.station_slot?.slot_code ?? '';
        const slotB = b.station_slot?.slot_code ?? '';
        if (slotA && !slotB) return -1;
        if (!slotA && slotB) return 1;
        if (slotA !== slotB) return slotA.localeCompare(slotB, undefined, { numeric: true });
        return (a.bench.sku || a.bench.name).localeCompare(b.bench.sku || b.bench.name, undefined, { numeric: true });
      });
    const headerTitle = loading && hosted.length === 0
      ? 'Assigned benches'
      : `Assigned benches (${hosted.length})`;
    return (
      <DetailSection title={headerTitle} icon={<Cpu />} action={mappingLink}>
        {loading && hosted.length === 0 ? (
          <LinkedEmpty>
            <Spin size="small" />
            <span>Loading assigned benches…</span>
          </LinkedEmpty>
        ) : hosted.length === 0 ? (
          <LinkedEmpty>No benches assigned to this station yet.</LinkedEmpty>
        ) : (
          <LinkedList
            onItemClick={onNavigate}
            items={hosted.map((r) => {
              const badges: LinkedListBadge[] = [];
              if (r.station_slot?.slot_code) {
                badges.push({ label: `Slot ${r.station_slot.slot_code}`, accent: true });
              }
              const eqCount = r.equipment.length;
              badges.push({ label: `${eqCount} ${eqCount === 1 ? 'device' : 'devices'}` });
              return {
                key: r.bench.id,
                code: r.bench.sku,
                title: r.bench.name || r.bench.sku,
                badges,
                to: `/spaces/bench?q=${encodeURIComponent(r.bench.sku || r.bench.name || '')}`,
              };
            })}
          />
        )}
      </DetailSection>
    );
  }

  if (kind === 'room') {
    const stations =
      roomStations !== undefined
        ? roomStations
        : fallbackRoomStations(record);
    const headerTitle = loading && stations.length === 0
      ? 'Assigned stations'
      : `Assigned stations (${stations.length})`;
    return (
      <DetailSection title={headerTitle} icon={<Server />} action={mappingLink}>
        {loading && stations.length === 0 ? (
          <LinkedEmpty>
            <Spin size="small" />
            <span>Loading assigned stations…</span>
          </LinkedEmpty>
        ) : stations.length === 0 ? (
          <LinkedEmpty>No stations assigned to this room yet.</LinkedEmpty>
        ) : (
          <LinkedList
            onItemClick={onNavigate}
            items={stations.map((st) => {
              const badges: LinkedListBadge[] = [];
              if (st.slotCode) {
                badges.push({ label: `Slot ${st.slotCode}`, accent: true });
              }
              badges.push({ label: `${st.benchCount} ${st.benchCount === 1 ? 'bench' : 'benches'}` });
              if (st.equipmentCount > 0) {
                badges.push({ label: `${st.equipmentCount} ${st.equipmentCount === 1 ? 'device' : 'devices'}` });
              }
              return {
                key: st.id,
                code: st.sku,
                title: st.name || st.sku || `Station #${st.id}`,
                badges,
                to: `/spaces/station?q=${encodeURIComponent(st.sku || st.name || '')}`,
              };
            })}
          />
        )}
      </DetailSection>
    );
  }

  return null;
}

export const SpaceDetailSummary: React.FC<SpaceDetailSummaryProps> = ({
  spaceKind,
  record,
  connectedRows = [],
  roomStations,
  connectedLoading = false,
  onNavigate,
}) => {
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
      <Connected
        kind={spaceKind}
        record={record}
        rows={connectedRows}
        roomStations={roomStations}
        loading={connectedLoading}
        onNavigate={onNavigate}
      />
      {(() => {
        const items = [...properties(spaceKind, record), ...specificationProperties(spaceKind, record)];
        return items.some(([, value]) => value) ? (
          <DetailSection title="Details" icon={<Info />}><PropertyList items={[...items]} /></DetailSection>
        ) : null;
      })()}
      {remark && <NoteBox>{remark}</NoteBox>}
    </div>
  );
};

export default SpaceDetailSummary;
