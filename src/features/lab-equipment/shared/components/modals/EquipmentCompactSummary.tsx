import React from 'react';
import { Alert, Button, Spin } from 'antd';
import { Link } from 'react-router-dom';
import {
  Activity, IdCard, KeyRound, Network, ReceiptText, Users, Waypoints, Wrench,
} from 'lucide-react';
import { resourcePageIcon } from '@/components/layout/pageIcons';
import { MappingVisualization } from '@/features/spaces/mapping/components/MappingVisualization';
import type { ResourceMappingRow } from '@/features/spaces/mapping/types';
import {
  Code, DetailSection, FacetGrid, LinkedList, NoteBox, PropertyList, StatGrid, StatTile, StatusHero, type Facet,
} from '@/shared/components/detail/DetailPrimitives';
import { refLabel } from '@/shared/utils/refLabel';
import { toneForStatus, type StatusTone } from '@/shared/status/statusTone';
import { explainEquipmentStatus } from '../../utils/equipmentStatusExplanation';

interface EquipmentCompactSummaryProps {
  equipmentType: string;
  record: Record<string, unknown>;
  connectedRows: ResourceMappingRow[];
  displayStatus: unknown;
  mappingLoading?: boolean;
  mappingError?: boolean;
  onRetryMapping?: () => void;
}

const dateOnly = (value: unknown) => {
  if (!value) return null;
  const date = new Date(String(value));
  return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
};

const money = (value: unknown): string | null => {
  const amount = value && typeof value === 'object' ? (value as Record<string, unknown>).amount ?? (value as Record<string, unknown>).value : value;
  if (amount === null || amount === undefined || amount === '' || !Number.isFinite(Number(amount))) return null;
  const currency = value && typeof value === 'object' && typeof (value as Record<string, unknown>).currency === 'string'
    ? String((value as Record<string, unknown>).currency) : 'USD';
  try {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency, maximumFractionDigits: 0 }).format(Number(amount));
  } catch {
    return `${currency} ${Number(amount).toLocaleString()}`;
  }
};

function warrantyStat(value: unknown, now = new Date()) {
  if (!value) return null;
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) return <StatTile label="Warranty" value={String(value)} />;
  const days = Math.round((date.getTime() - now.getTime()) / 86_400_000);
  const detail = days < 0 ? 'Expired' : days <= 90 ? `Expires in ${days} days` : 'Active';
  return <StatTile label="Warranty until" value={dateOnly(value)} detail={detail} />;
}

function facetsOf(record: Record<string, unknown>): Facet[] {
  const facets: Facet[] = [];
  const lifecycle = record.lifecycle_state as { value?: string; label?: string } | null | undefined;
  if (lifecycle?.value) {
    const tone: StatusTone = lifecycle.value === 'in_service' ? 'success' : toneForStatus(lifecycle.value);
    facets.push({ label: 'Lifecycle', value: lifecycle.label && lifecycle.label !== lifecycle.value ? lifecycle.label : lifecycle.value.replaceAll('_', ' '), tone });
  }
  const condition = record.condition as { value?: string; label?: string } | null | undefined;
  if (condition?.value) {
    const tone: StatusTone = condition.value === 'operational' ? 'success' : condition.value === 'in_maintenance' ? 'warning' : 'danger';
    const label = condition.value === 'operational' ? 'Operational' : condition.value === 'in_maintenance' ? 'In maintenance' : 'Out of service';
    facets.push({ label: 'Condition', value: label, tone, icon: condition.value === 'operational' ? undefined : <Wrench /> });
  }
  const placement = record.placement as Record<string, unknown> | null | undefined;
  const target = placement?.target_type as string | undefined;
  facets.push({
    label: 'Placement',
    value: target === 'bench' ? 'On a bench' : target === 'station' ? 'At a station' : target === 'room' ? 'In a room' : target === 'note' ? 'Noted location' : 'Not placed',
    tone: target === 'bench' ? 'info' : 'neutral',
  });
  if (record.loan) {
    const loan = record.loan as Record<string, unknown>;
    facets.push({ label: 'Loan', value: loan.overdue ? 'Overdue' : 'Active loan', tone: loan.overdue ? 'danger' : 'reserved', icon: <Activity /> });
  }
  if (record.is_calibration_required) {
    facets.push({
      label: 'Calibration',
      value: record.is_calibration_overdue ? 'Overdue' : 'Up to date',
      tone: record.is_calibration_overdue ? 'warning' : 'success',
    });
  }
  return facets;
}

export const EquipmentCompactSummary: React.FC<EquipmentCompactSummaryProps> = ({
  equipmentType, record, connectedRows, displayStatus, mappingLoading = false, mappingError = false, onRetryMapping,
}) => {
  const status = explainEquipmentStatus({ ...record, display_status: displayStatus ?? record.display_status });
  const image = typeof record.image === 'string' && record.image ? record.image : null;
  const name = refLabel(record.name) || refLabel(record.sku) || 'Equipment';
  const sku = refLabel(record.sku);

  const price = money(record.acquisition_price);
  const warranty = warrantyStat(record.warranty_end_date);
  const replacement = dateOnly(record.replacement_date);
  const lastCalibrated = dateOnly(record.last_calibrated_at);

  const network = [
    ['Hostname', refLabel(record.hostname)],
    ['IP address', refLabel(record.ip_address) && <Code>{refLabel(record.ip_address)}</Code>],
    ['MAC address', refLabel(record.mac_address) && <Code>{refLabel(record.mac_address)}</Code>],
    ['Operating system', refLabel(record.os_name)],
  ] as const;
  const licenses = Array.isArray(record.licenses) ? record.licenses as Array<Record<string, unknown>> : [];
  const notes = [record.remark, record.details, record.information].map(refLabel).filter(Boolean);

  return (
    <div className="tw:flex tw:min-w-0 tw:flex-col tw:gap-5">
      <StatusHero
        tone={status.tone}
        title={status.title}
        description={status.description}
        icon={image ? <img src={image} alt={name} /> : resourcePageIcon(equipmentType.toLowerCase())}
        facts={status.facts}
      />

      <FacetGrid items={facetsOf(record)} />

      <DetailSection
        title="Connected resources"
        icon={<Waypoints />}
        action={<Link to="/spaces/mapping">Open mapping →</Link>}
      >
        {mappingLoading ? (
          <div className="tw:grid tw:min-h-24 tw:place-items-center"><Spin size="small" /></div>
        ) : mappingError ? (
          <Alert type="warning" showIcon message="The equipment mapping could not be loaded" action={onRetryMapping && <Button size="small" onClick={onRetryMapping}>Retry</Button>} />
        ) : connectedRows.length > 0 ? (
          <>
            <p className="tw:m-0 tw:text-xs tw:text-muted-foreground">Room → Station → Bench → Equipment → Licenses. This unit is highlighted.</p>
            <MappingVisualization
              rows={connectedRows}
              loading={false}
              showPagination={false}
              compact
              selectedDeviceType={equipmentType}
              selectedDeviceId={Number(record.id)}
            />
          </>
        ) : (
          <NoteBox title="Not connected yet">
            This unit is not assigned to a bench, so it has no room, station or bench connections. Use “Change status → Assign to bench” or the mapping page to place it.
          </NoteBox>
        )}
      </DetailSection>

      {(price || warranty || replacement || lastCalibrated) && (
        <DetailSection title="Lifecycle & cost" icon={<ReceiptText />}>
          <StatGrid>
            {price && <StatTile label="Acquisition price" value={price} />}
            {warranty}
            {replacement && <StatTile label="Planned replacement" value={replacement} />}
            {lastCalibrated && <StatTile label="Last calibrated" value={lastCalibrated} detail={record.next_calibration_due_at ? `Next due ${dateOnly(record.next_calibration_due_at)}` : undefined} />}
          </StatGrid>
        </DetailSection>
      )}

      <DetailSection title="Identification" icon={<IdCard />}>
        <PropertyList items={[
          ['SKU', sku && <Code>{sku}</Code>],
          ['Serial number', refLabel(record.serial_number) && <Code>{refLabel(record.serial_number)}</Code>],
          ['Category', refLabel(record.category) || equipmentType.replaceAll('_', ' ')],
          ['Kind', refLabel(record.kind)],
          ['Type', refLabel(record.type)],
          ['Manufacturer', refLabel(record.manufacturer)],
          ['Model', refLabel(record.product_model)],
          ['Log label', refLabel(record.log_label)],
        ]} />
      </DetailSection>

      <DetailSection title="Ownership" icon={<Users />}>
        <PropertyList items={[
          ['Owner', refLabel(record.owner) || refLabel(record.primary_owner)],
          ['Department', refLabel(record.department)],
          ['Group', refLabel(record.group)],
          ['Technical user', refLabel(record.technical_user)],
          ['Home storage room', refLabel(record.storage_room)],
        ]} />
      </DetailSection>

      {network.some(([, value]) => value) && (
        <DetailSection title="Network" icon={<Network />}>
          <PropertyList items={[...network]} />
        </DetailSection>
      )}

      {licenses.length > 0 && (
        <DetailSection title={`Licenses (${licenses.length})`} icon={<KeyRound />} action={<Link to="/lab-equipment/license">All licenses →</Link>}>
          <LinkedList items={licenses.map((license, index) => ({
            key: String(license.id ?? index), code: refLabel(license.sku) || undefined,
            title: refLabel(license.name) || refLabel(license.license_name) || 'License',
          }))} />
        </DetailSection>
      )}

      {notes.length > 0 && <NoteBox title="Notes">{[...new Set(notes)].join('\n')}</NoteBox>}

    </div>
  );
};

export default EquipmentCompactSummary;
