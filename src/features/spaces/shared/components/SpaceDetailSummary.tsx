import React from 'react';
import { Alert, Descriptions, Tag } from 'antd';
import {
  AppstoreOutlined,
  HomeOutlined,
  DesktopOutlined,
  InfoCircleOutlined,
  LockOutlined,
  UnlockOutlined,
  CheckCircleFilled,
  ExclamationCircleFilled,
  CloseCircleFilled,
  ArrowRightOutlined,
} from '@ant-design/icons';
import { Link } from 'react-router-dom';
import SpaceStatusBadge from '../SpaceStatusBadge';
import type { LocationState, ResourceState } from '../resourceStatus';
import type { ResourceMappingRow } from '@/features/spaces/mapping/types';
import styles from './SpaceDetailSummary.module.css';

interface SpaceDetailSummaryProps {
  spaceKind: 'room' | 'station' | 'bench';
  record: Record<string, unknown>;
  connectedRows?: ResourceMappingRow[];
  onOpenMapping?: () => void;
}

export const SpaceDetailSummary: React.FC<SpaceDetailSummaryProps> = ({
  spaceKind,
  record,
  connectedRows = [],
}) => {
  const resourceState = record as unknown as Partial<LocationState & ResourceState>;
  const lifecycle = resourceState.lifecycle_status;
  const condition = resourceState.condition;
  const availability = resourceState.availability;
  const access = resourceState.access_policy;

  const isRestricted =
    access?.value === 'restricted' ||
    (typeof access === 'string' && (access as string).toLowerCase() === 'restricted');

  const isBlocked = availability?.value === 'unavailable';

  // Common Header Info
  const remark = record.remark ? String(record.remark) : null;

  // The Sheet already presents the canonical resource name and SKU. Use the
  // summary surface for location and state instead of repeating the title.
  const HeaderIcon =
    spaceKind === 'station'
      ? AppstoreOutlined
      : spaceKind === 'room'
      ? HomeOutlined
      : DesktopOutlined;

  // Location Crumb
  const getLocationCrumb = () => {
    if (spaceKind === 'station') {
      const room =
        record.room_name ||
        (typeof record.room === 'object' && record.room
          ? (record.room as { name?: string; sku?: string }).name ||
            (record.room as { sku?: string }).sku
          : null) ||
        (record.room_id ? `Room #${record.room_id}` : null);
      const slot = record.slot_code || record.slot_id;
      if (!room) return 'Not placed in a room';
      return `Room: ${room}${slot ? ` › Slot: ${slot}` : ''}`;
    }
    if (spaceKind === 'room') {
      const parts = [
        record.building ? `Bldg ${String(record.building)}` : null,
        record.floor ? `Floor ${String(record.floor)}` : null,
        record.city ? String(record.city) : null,
        record.country ? String(record.country) : null,
      ].filter(Boolean);
      return parts.length > 0 ? parts.join(', ') : record.location ? String(record.location) : 'Facility Room';
    }
    // bench
    const room =
      record.room_name ||
      (typeof record.room === 'object' && record.room
        ? (record.room as { name?: string }).name
        : null);
    const station =
      record.station_name ||
      (typeof record.station === 'object' && record.station
        ? (record.station as { name?: string }).name
        : null) ||
      (record.setup_location_id ? `Station #${record.setup_location_id}` : null);
    const slot =
      typeof record.station_slot === 'object' && record.station_slot
        ? (record.station_slot as { slot_code?: string }).slot_code
        : record.station_slot_id;

    if (!station) return 'Unplaced Bench';
    return `${room ? `Room: ${room} › ` : ''}Station: ${station}${slot ? ` (Slot ${slot})` : ''}`;
  };

  return (
    <div className={styles.container}>
      <div className={styles.locationCard}>
        <span className={styles.iconBox}><HeaderIcon /></span>
        <div className={styles.locationCopy}>
          <span className={styles.locationLabel}>Location</span>
          <strong>{getLocationCrumb()}</strong>
        </div>
        <SpaceStatusBadge
          spaceKind={spaceKind}
          resourceState={resourceState}
          accessPolicy={access}
        />
      </div>

      {/* Blocked / Downtime Alert */}
      {isBlocked && (
        <Alert
          type="warning"
          showIcon
          message={
            <span>
              <strong>Resource Unavailable:</strong> Blocked by{' '}
              {availability?.blocked_by ? (
                <strong>
                  {availability.blocked_by.type.toUpperCase()}{' '}
                  {availability.blocked_by.name}
                </strong>
              ) : (
                'upstream maintenance / downtime'
              )}
              {availability?.reason ? ` (${availability.reason})` : ''}
            </span>
          }
        />
      )}

      {/* 2. Top Metric Ribbon */}
      {spaceKind === 'station' && <StationMetricRibbon record={record} />}
      {spaceKind === 'room' && <RoomMetricRibbon record={record} />}
      {spaceKind === 'bench' && <BenchMetricRibbon record={record} connectedRows={connectedRows} />}

      {/* 3. Operational State & Health */}
      <section className={styles.detailSection}>
        <h4 className={styles.sectionTitle}>
          <CheckCircleFilled className={styles.sectionTitleIcon} />
          Operational status
        </h4>
        <div className={styles.stateGrid}>
          <div className={styles.stateCard}>
            <span className={styles.stateLabel}>Lifecycle</span>
            {lifecycle?.value === 'in_service' ? (
              <span className={`${styles.statePill} ${styles.good}`}>
                <CheckCircleFilled style={{ fontSize: 10 }} /> In Service
              </span>
            ) : lifecycle?.value === 'planned' ? (
              <span className={`${styles.statePill} ${styles.info}`}>Planned</span>
            ) : lifecycle?.value === 'retired' ? (
              <span className={`${styles.statePill} ${styles.neutral}`}>Retired</span>
            ) : (
              <span className={`${styles.statePill} ${styles.neutral}`}>{lifecycle?.label || lifecycle?.value || 'Not set'}</span>
            )}
          </div>

          {condition && <div className={styles.stateCard}>
            <span className={styles.stateLabel}>Condition</span>
            {condition?.value === 'operational' ? (
              <span className={`${styles.statePill} ${styles.good}`}>
                <CheckCircleFilled /> Operational
              </span>
            ) : condition?.value === 'in_maintenance' ? (
              <span className={`${styles.statePill} ${styles.warning}`}>
                <ExclamationCircleFilled /> In Maintenance
              </span>
            ) : condition?.value === 'out_of_service' ? (
              <span className={`${styles.statePill} ${styles.danger}`}>
                <CloseCircleFilled /> Out of Service
              </span>
            ) : (
              <span className={`${styles.statePill} ${styles.neutral}`}>{condition?.label || condition?.value}</span>
            )}
          </div>}

          {access && (
            <div className={styles.stateCard}>
              <span className={styles.stateLabel}>Access</span>
              {isRestricted ? (
                <span className={`${styles.statePill} ${styles.warning}`}>
                  <LockOutlined /> Restricted Access
                </span>
              ) : (
                <span className={`${styles.statePill} ${styles.good}`}>
                  <UnlockOutlined /> Open Access
                </span>
              )}
            </div>
          )}

          {spaceKind === 'bench' && resourceState.activity_status && (
            <div className={styles.stateCard}>
              <span className={styles.stateLabel}>Booking activity</span>
              {resourceState.activity_status.value === 'active' ? (
                <span className={`${styles.statePill} ${styles.good}`}>In use</span>
              ) : resourceState.activity_status.value === 'scheduled' ? (
                <span className={`${styles.statePill} ${styles.info}`}>Booked today</span>
              ) : (
                <span className={`${styles.statePill} ${styles.neutral}`}>Ready · Idle</span>
              )}
            </div>
          )}
        </div>
      </section>

      {/* 4. Structured Technical Specifications */}
      <section className={styles.detailSection}>
        <h4 className={styles.sectionTitle}>
          <InfoCircleOutlined className={styles.sectionTitleIcon} />
          Specifications & Details
        </h4>
        {spaceKind === 'station' && <StationDescriptions record={record} />}
        {spaceKind === 'room' && <RoomDescriptions record={record} />}
        {spaceKind === 'bench' && <BenchDescriptions record={record} />}
      </section>

      {/* 5. Connected Resources Quick Summary */}
      <ConnectedSummary spaceKind={spaceKind} record={record} connectedRows={connectedRows} />

      {/* 6. Remark / Note */}
      {remark && (
        <div className={styles.remarkBox}>
          <strong>Note:</strong> {remark}
        </div>
      )}
    </div>
  );
};

// --- Station Metric Ribbon ---
function StationMetricRibbon({ record }: { record: Record<string, unknown> }) {
  const activeBenches = record.active_bench_count != null ? Number(record.active_bench_count) : null;
  const totalCapacity = record.bench_capacity != null ? Number(record.bench_capacity) : null;
  const benchOccupancy = totalCapacity != null && totalCapacity > 0 && activeBenches != null ? Math.round((activeBenches / totalCapacity) * 100) : null;

  const allocatedPower = record.allocated_power_w != null ? Number(record.allocated_power_w) : null;
  const totalPower = record.power_capacity_w != null ? Number(record.power_capacity_w) : null;
  const powerUtilization = totalPower != null && totalPower > 0 && allocatedPower != null ? Math.round((allocatedPower / totalPower) * 100) : null;
  const availablePower = record.available_power_w != null ? Number(record.available_power_w)
    : totalPower != null && allocatedPower != null ? totalPower - allocatedPower : null;

  const ports = record.network_port_capacity != null ? Number(record.network_port_capacity) : null;
  const maxLoad = record.max_load_kg != null ? Number(record.max_load_kg) : null;

  return (
    <MetricGrid metrics={[
      totalCapacity != null || activeBenches != null ? { label: 'Bench capacity', value: totalCapacity != null ? `${activeBenches ?? '—'} / ${totalCapacity}` : `${activeBenches} active`, detail: benchOccupancy != null ? `${benchOccupancy}% occupied` : undefined } : null,
      allocatedPower != null || totalPower != null ? { label: 'Power allocation', value: totalPower != null && allocatedPower != null ? `${allocatedPower} / ${totalPower} W` : `${allocatedPower ?? totalPower} W`, detail: powerUtilization != null ? `${powerUtilization}% utilized` : undefined } : null,
      availablePower != null ? { label: 'Power available', value: `${availablePower} W` } : null,
      ports != null ? { label: 'Network ports', value: String(ports) } : null,
      maxLoad != null ? { label: 'Max load', value: `${maxLoad} kg` } : null,
    ]} />
  );
}

// --- Room Metric Ribbon ---
function RoomMetricRibbon({ record }: { record: Record<string, unknown> }) {
  const rows = record.layout_rows != null ? Number(record.layout_rows) : null;
  const cols = record.layout_columns != null ? Number(record.layout_columns) : null;
  const totalSlots = rows && cols ? rows * cols : record.setup_capacity != null ? Number(record.setup_capacity) : null;

  const temp = record.temperature != null ? Number(record.temperature) : null;
  const humidity = record.humidity != null ? Number(record.humidity) : null;
  const maxPower = record.max_power_w != null ? Number(record.max_power_w) : null;

  const facility = [record.building ? `Building ${String(record.building)}` : null, record.floor ? `Floor ${String(record.floor)}` : null]
    .filter(Boolean).join(' · ');
  return <MetricGrid metrics={[
    totalSlots != null ? { label: 'Grid capacity', value: `${totalSlots} slots`, detail: rows && cols ? `${rows} rows × ${cols} columns` : undefined } : null,
    temp != null || humidity != null ? { label: 'Environment', value: temp != null ? `${temp} °C` : `${humidity}% humidity`, detail: temp != null && humidity != null ? `${humidity}% humidity` : undefined } : null,
    maxPower != null ? { label: 'Power limit', value: `${maxPower} W` } : null,
    facility ? { label: 'Facility', value: facility, detail: [record.city, record.country].filter(Boolean).join(', ') || undefined } : null,
  ]} />;
}

// --- Bench Metric Ribbon ---
function BenchMetricRibbon({
  record,
  connectedRows,
}: {
  record: Record<string, unknown>;
  connectedRows: ResourceMappingRow[];
}) {
  const benchRow = connectedRows.find((r) => r.bench.id === Number(record.id)) ?? connectedRows[0];
  const equipmentCount = benchRow?.equipment?.length ??
    (Array.isArray(record.equipment) ? record.equipment.length : record.equipment_count != null ? Number(record.equipment_count) : null);

  const groupName =
    record.group_name ||
    (typeof record.bench_group === 'object' && record.bench_group
      ? (record.bench_group as { name?: string }).name
      : null);

  const typeName =
    record.type_name ||
    (typeof record.bench_type === 'object' && record.bench_type
      ? (record.bench_type as { name?: string }).name
      : null);

  const power = record.requested_power_w != null ? Number(record.requested_power_w) : null;
  const load = record.requested_load_kg != null ? Number(record.requested_load_kg) : null;

  return <MetricGrid metrics={[
    equipmentCount != null ? { label: 'Assigned equipment', value: `${equipmentCount} devices`, detail: 'Mounted on bench' } : null,
    groupName || typeName ? { label: 'Classification', value: [groupName, typeName].filter(Boolean).join(' · ') } : null,
    power != null ? { label: 'Requested power', value: `${power} W` } : null,
    load != null ? { label: 'Requested load', value: `${load} kg` } : null,
  ]} />;
}

interface DetailMetric { label: string; value: string; detail?: string }

function MetricGrid({ metrics }: { metrics: Array<DetailMetric | null> }) {
  const visibleMetrics = metrics.filter((metric): metric is DetailMetric => Boolean(metric?.value));
  if (!visibleMetrics.length) return null;
  return <div className={styles.metricGrid}>
    {visibleMetrics.map((metric) => <div className={styles.metricCard} key={metric.label}>
      <span className={styles.ribbonLabel}>{metric.label}</span>
      <strong>{metric.value}</strong>
      {metric.detail && <span>{metric.detail}</span>}
    </div>)}
  </div>;
}

// --- Station Descriptions ---
function StationDescriptions({ record }: { record: Record<string, unknown> }) {
  const h = record.height_mm != null ? `${record.height_mm} mm` : null;
  const w = record.width_mm != null ? `${record.width_mm} mm` : null;
  const d = record.depth_mm != null ? `${record.depth_mm} mm` : null;
  const dimensions = h && w && d ? `${h} × ${w} × ${d}` : null;

  return (
    <Descriptions column={{ xs: 1, sm: 2 }} size="small" bordered>
      {Boolean(record.sku) && <Descriptions.Item label="SKU">{String(record.sku)}</Descriptions.Item>}
      <Descriptions.Item label="Room">
        {String(record.room_name || (typeof record.room === 'object' && record.room ? (record.room as { name?: string }).name : null) || (record.room_id ? `Room #${record.room_id}` : 'Not assigned'))}
      </Descriptions.Item>
      <Descriptions.Item label="Slot Code">
        {String(record.slot_code || record.slot_id || '—')}
      </Descriptions.Item>
      {dimensions && <Descriptions.Item label="Dimensions (H×W×D)">{dimensions}</Descriptions.Item>}
      {record.max_load_kg != null && (
        <Descriptions.Item label="Max Load">{String(record.max_load_kg)} kg</Descriptions.Item>
      )}
      {record.network_port_capacity != null && (
        <Descriptions.Item label="Network Ports">
          {String(record.network_port_capacity)} ports
        </Descriptions.Item>
      )}
      {Boolean(record.label) && (
        <Descriptions.Item label="Hardware Label">{String(record.label)}</Descriptions.Item>
      )}
    </Descriptions>
  );
}

// --- Room Descriptions ---
function RoomDescriptions({ record }: { record: Record<string, unknown> }) {
  const h = record.layout_rows != null ? Number(record.layout_rows) : null;
  const w = record.layout_columns != null ? Number(record.layout_columns) : null;
  const grid = h && w ? `${h} Rows × ${w} Columns` : null;
  const roomLocation = [record.building ? `Building ${String(record.building)}` : null, record.floor ? `Floor ${String(record.floor)}` : null]
    .filter(Boolean).join(' · ') || (record.location ? String(record.location) : null);

  return (
    <Descriptions column={{ xs: 1, sm: 2 }} size="small" bordered>
      {Boolean(record.sku) && <Descriptions.Item label="SKU">{String(record.sku)}</Descriptions.Item>}
      {Boolean(roomLocation) && <Descriptions.Item label="Facility location">
        {roomLocation}
      </Descriptions.Item>}
      {Boolean(record.city || record.country) && <Descriptions.Item label="City & Country">
        {[record.city ? String(record.city) : null, record.country ? String(record.country) : null].filter(Boolean).join(', ') || '—'}
      </Descriptions.Item>
      }
      {grid && <Descriptions.Item label="Layout Grid">{grid}</Descriptions.Item>}
      {record.setup_capacity != null && (
        <Descriptions.Item label="Capacity">{String(record.setup_capacity)} stations</Descriptions.Item>
      )}
      {Boolean(record.location) && (
        <Descriptions.Item label="Location Info">{String(record.location)}</Descriptions.Item>
      )}
      {Boolean(record.label) && (
        <Descriptions.Item label="Room Label">{String(record.label)}</Descriptions.Item>
      )}
    </Descriptions>
  );
}

// --- Bench Descriptions ---
function BenchDescriptions({ record }: { record: Record<string, unknown> }) {
  const group =
    record.group_name ||
    (typeof record.bench_group === 'object' && record.bench_group
      ? (record.bench_group as { name?: string }).name
      : null);
  const type =
    record.type_name ||
    (typeof record.bench_type === 'object' && record.bench_type
      ? (record.bench_type as { name?: string }).name
      : null);

  return (
    <Descriptions column={{ xs: 1, sm: 2 }} size="small" bordered>
      {Boolean(record.sku) && <Descriptions.Item label="SKU">{String(record.sku)}</Descriptions.Item>}
      {group && <Descriptions.Item label="Group">{String(group)}</Descriptions.Item>}
      {type && <Descriptions.Item label="Type">{String(type)}</Descriptions.Item>}
      {record.requested_power_w != null && (
        <Descriptions.Item label="Requested Power">{String(record.requested_power_w)} W</Descriptions.Item>
      )}
      {record.requested_cooling_w != null && (
        <Descriptions.Item label="Cooling Requirement">
          {String(record.requested_cooling_w)} W
        </Descriptions.Item>
      )}
      {record.requested_load_kg != null && (
        <Descriptions.Item label="Requested Load">{String(record.requested_load_kg)} kg</Descriptions.Item>
      )}
      {Boolean(record.primary_owner) && (
        <Descriptions.Item label="Primary Owner">{String(record.primary_owner)}</Descriptions.Item>
      )}
    </Descriptions>
  );
}

// --- Connected Resources Quick Summary ---
function ConnectedSummary({
  spaceKind,
  record,
  connectedRows,
}: {
  spaceKind: 'room' | 'station' | 'bench';
  record: Record<string, unknown>;
  connectedRows: ResourceMappingRow[];
}) {
  if (spaceKind === 'bench') {
    const benchRow = connectedRows.find((r) => r.bench.id === Number(record.id)) ?? connectedRows[0];
    const equipment = benchRow?.equipment ?? [];
    if (equipment.length === 0) return null;

    return (
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <h4 className={styles.sectionTitle} style={{ margin: 0, border: 0, padding: 0 }}>
            <DesktopOutlined className={styles.sectionTitleIcon} />
            Assigned Equipment ({equipment.length})
          </h4>
          <Link to="/spaces/mapping" style={{ fontSize: 12, fontWeight: 600 }}>
            Open Mapping <ArrowRightOutlined />
          </Link>
        </div>

        <div className={styles.connectedList}>
          {equipment.map((eq) => (
            <div key={eq.id} className={styles.connectedItem}>
              <div className={styles.connectedItemName}>
                <span className={styles.skuTag}>{eq.sku}</span>
                <span>{eq.name}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Tag color="blue">{eq.category.name}</Tag>
                {eq.role && <Tag>{eq.role}</Tag>}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (spaceKind === 'station' && connectedRows.length > 0) {
    const stationId = Number(record.id);
    const stationRows = connectedRows.filter(
      (r) => r.station?.id === stationId || r.bench.setup_location_id === stationId,
    );

    if (stationRows.length === 0) return null;

    return (
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <h4 className={styles.sectionTitle} style={{ margin: 0, border: 0, padding: 0 }}>
            <DesktopOutlined className={styles.sectionTitleIcon} />
            Hosted Benches ({stationRows.length})
          </h4>
          <Link to="/spaces/mapping" style={{ fontSize: 12, fontWeight: 600 }}>
            Open Mapping <ArrowRightOutlined />
          </Link>
        </div>

        <div className={styles.connectedList}>
          {stationRows.map((r) => (
            <div key={r.id} className={styles.connectedItem}>
              <div className={styles.connectedItemName}>
                <span className={styles.skuTag}>{r.bench.sku}</span>
                <span>{r.bench.name}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                {r.station_slot && <Tag color="geekblue">Slot {r.station_slot.slot_code}</Tag>}
                <Tag color="green">{r.equipment.length} equipment</Tag>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return null;
}
export default SpaceDetailSummary;
