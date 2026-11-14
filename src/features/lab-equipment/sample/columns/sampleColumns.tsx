import type { Key, ReactNode } from 'react';
import { Input, Select, Tag } from 'antd';
import {
  InlineImageUpload,
  readStatusFromRecord,
  renderAuditCell,
  renderImageCell,
  renderInfoCell,
  renderLicenseName,
  renderLicenseSku,
  renderOwnerCell,
  ResourceStatus,
} from '../../shared';
import type { ISample } from '../types';

type FilterItem = { text: string; value: string };
type SelectOption = { label: string; value: number };
type UnknownRecord = Record<string, unknown>;

const readType = (record: ISample) => record.sample_type?.sample_type_name ?? record.sample_type?.name ?? '';
const readManufacturer = (record: ISample) =>
  record.manufacturer?.manufacturer_name ?? record.manufacturer?.sample_manufacturer_name ?? record.manufacturer?.name ?? '';
const readProductLine = (record: ISample) => record.product_line?.sample_product_line_name ?? record.product_line?.name ?? '';
const readVersion = (record: ISample) => record.version?.sample_version_name ?? record.version?.name ?? '';
const readOem = (record: ISample) => record.oem?.sample_OEM_name ?? record.oem?.name ?? '';
const readKl = (record: ISample) => record.kl?.sample_KL_name ?? record.kl?.name ?? '';
const readChannel = (record: ISample) =>
  record.communication_channel?.sample_communication_channel_name ?? record.communication_channel?.name ?? '';
const isRecord = (value: unknown): value is UnknownRecord =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const readNumeric = (value: unknown): number | null => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
};

const readCharacteristicId = (value: unknown): number | null => {
  const direct = readNumeric(value);
  if (direct != null) return direct;
  if (!isRecord(value)) return null;

  const candidates = [
    value.id,
    value.value,
    value.sample_characteristic,
    value.sample_characteristic_id,
  ];
  for (const candidate of candidates) {
    const parsed = readNumeric(candidate);
    if (parsed != null) return parsed;
  }
  return null;
};

const readCharacteristicLabel = (value: unknown): string => {
  if (!isRecord(value)) return '';
  const candidates = [
    value.sample_characteristic_name,
    value.name,
    value.label,
  ];
  for (const candidate of candidates) {
    if (typeof candidate === 'string' && candidate.trim()) return candidate;
  }
  return '';
};

const toNumberIds = (value: unknown): number[] => {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => readCharacteristicId(item))
    .filter((item): item is number => item != null);
};

export interface SampleInlineDraft {
  name: string;
  sample_type: number | null;
  manufacturer: number | null;
  product_line: number | null;
  version: number | null;
  oem: number | null;
  kl: number | null;
  serial_number: string;
  communication_channel: number | null;
  sample_characteristic: number[];
  log_label: string;
  primary_owner: number | null;
  remark: string;
  pending_status_type?: string;
  pending_status_data?: Record<string, unknown>;
}

interface BuildColumnsArgs {
  filters: Record<string, Key[] | null>;
  typeFilters: FilterItem[];
  manufacturerFilters: FilterItem[];
  productLineFilters: FilterItem[];
  versionFilters: FilterItem[];
  oemFilters: FilterItem[];
  klFilters: FilterItem[];
  channelFilters: FilterItem[];
  characteristicFilters: FilterItem[];
  ownerFilters: FilterItem[];
  statusFilters: FilterItem[];
  typeOptions: SelectOption[];
  manufacturerOptions: SelectOption[];
  productLineOptions: SelectOption[];
  versionOptions: SelectOption[];
  oemOptions: SelectOption[];
  klOptions: SelectOption[];
  channelOptions: SelectOption[];
  characteristicOptions: SelectOption[];
  ownerOptions: SelectOption[];
  isEditing: (record: ISample) => boolean;
  editingDraft: SampleInlineDraft | null;
  updateDraftField: <K extends keyof SampleInlineDraft>(
    key: K,
    value: SampleInlineDraft[K],
  ) => void;
  actionsRenderer: (_: unknown, record: ISample) => ReactNode;
  onImageChange?: (file: File) => void;
  onStatusChange?: (record: ISample, values: { status_type: string; status_data: Record<string, unknown> }) => void;
}

export const toSampleInlineDraft = (item: ISample): SampleInlineDraft => ({
  name: item.name ?? '',
  sample_type: item.sample_type?.id ?? null,
  manufacturer: item.manufacturer?.id ?? null,
  product_line: item.product_line?.id ?? null,
  version: item.version?.id ?? null,
  oem: item.oem?.id ?? null,
  kl: item.kl?.id ?? null,
  serial_number: item.serial_number ?? '',
  communication_channel: item.communication_channel?.id ?? null,
  sample_characteristic: (item.sample_characteristic ?? [])
    .map((characteristic) => readCharacteristicId(characteristic))
    .filter((id): id is number => id != null),
  log_label: item.log_label ?? '',
  primary_owner: item.primary_owner?.id ?? null,
  remark: item.remark ?? '',
});

export const buildSampleColumns = ({
  filters,
  typeFilters,
  manufacturerFilters,
  productLineFilters,
  versionFilters,
  oemFilters,
  klFilters,
  channelFilters,
  characteristicFilters,
  ownerFilters,
  statusFilters,
  typeOptions,
  manufacturerOptions,
  productLineOptions,
  versionOptions,
  oemOptions,
  klOptions,
  channelOptions,
  characteristicOptions,
  ownerOptions,
  isEditing,
  editingDraft,
  updateDraftField,
  actionsRenderer,
  onImageChange,
  onStatusChange,
}: BuildColumnsArgs) => {
  const characteristicLabelMap = new Map<number, string>(
    characteristicOptions.map((option) => [option.value, option.label]),
  );

  const readCharacteristic = (item: unknown): string => {
    const label = readCharacteristicLabel(item);
    if (label) return label;
    const id = readCharacteristicId(item);
    if (id == null) return '';
    return characteristicLabelMap.get(id) ?? String(id);
  };

  return [
  { title: 'ID', dataIndex: 'id', key: 'id', width: 100, fixed: 'left' as const },
  { title: 'SKU', dataIndex: 'sku', key: 'sku', width: 150, fixed: 'left' as const },
  {
    title: 'Name',
    dataIndex: 'name',
    key: 'name',
    width: 150,
    fixed: 'left' as const,
    render: (value: string, record: ISample) => (
      isEditing(record)
        ? (
          <Input
            value={editingDraft?.name ?? ''}
            onChange={(event) => updateDraftField('name', event.target.value)}
          />
        )
        : (value ?? '')
    ),
  },
  {
    title: 'Type',
    key: 'sample_type',
    width: 150,
    filters: typeFilters,
    filterSearch: true,
    filteredValue: filters.sample_type ?? null,
    onFilter: (value: boolean | Key, record: ISample) => String(record.sample_type?.id ?? '') === String(value),
    render: (_: unknown, record: ISample) => (
      isEditing(record)
        ? (
          <Select
            allowClear
            showSearch
            style={{ width: '100%' }}
            value={editingDraft?.sample_type ?? undefined}
            options={typeOptions}
            onChange={(value) => updateDraftField('sample_type', typeof value === 'number' ? value : null)}
          />
        )
        : (readType(record) || '—')
    ),
  },
  {
    title: 'Manufacturer',
    key: 'manufacturer',
    width: 150,
    filters: manufacturerFilters,
    filterSearch: true,
    filteredValue: filters.manufacturer ?? null,
    onFilter: (value: boolean | Key, record: ISample) => String(record.manufacturer?.id ?? '') === String(value),
    render: (_: unknown, record: ISample) => (
      isEditing(record)
        ? (
          <Select
            allowClear
            showSearch
            style={{ width: '100%' }}
            value={editingDraft?.manufacturer ?? undefined}
            options={manufacturerOptions}
            onChange={(value) => updateDraftField('manufacturer', typeof value === 'number' ? value : null)}
          />
        )
        : (readManufacturer(record) || '—')
    ),
  },
  {
    title: 'Product Line',
    key: 'product_line',
    width: 150,
    filters: productLineFilters,
    filterSearch: true,
    filteredValue: filters.product_line ?? null,
    onFilter: (value: boolean | Key, record: ISample) => String(record.product_line?.id ?? '') === String(value),
    render: (_: unknown, record: ISample) => (
      isEditing(record)
        ? (
          <Select
            allowClear
            showSearch
            style={{ width: '100%' }}
            value={editingDraft?.product_line ?? undefined}
            options={productLineOptions}
            onChange={(value) => updateDraftField('product_line', typeof value === 'number' ? value : null)}
          />
        )
        : (readProductLine(record) || '—')
    ),
  },
  {
    title: 'Version',
    key: 'version',
    width: 150,
    filters: versionFilters,
    filterSearch: true,
    filteredValue: filters.version ?? null,
    onFilter: (value: boolean | Key, record: ISample) => String(record.version?.id ?? '') === String(value),
    render: (_: unknown, record: ISample) => (
      isEditing(record)
        ? (
          <Select
            allowClear
            showSearch
            style={{ width: '100%' }}
            value={editingDraft?.version ?? undefined}
            options={versionOptions}
            onChange={(value) => updateDraftField('version', typeof value === 'number' ? value : null)}
          />
        )
        : (readVersion(record) || '—')
    ),
  },
  {
    title: 'OEM',
    key: 'oem',
    width: 150,
    filters: oemFilters,
    filterSearch: true,
    filteredValue: filters.oem ?? null,
    onFilter: (value: boolean | Key, record: ISample) => String(record.oem?.id ?? '') === String(value),
    render: (_: unknown, record: ISample) => (
      isEditing(record)
        ? (
          <Select
            allowClear
            showSearch
            style={{ width: '100%' }}
            value={editingDraft?.oem ?? undefined}
            options={oemOptions}
            onChange={(value) => updateDraftField('oem', typeof value === 'number' ? value : null)}
          />
        )
        : (readOem(record) || '—')
    ),
  },
  {
    title: 'KL',
    key: 'kl',
    width: 150,
    filters: klFilters,
    filterSearch: true,
    filteredValue: filters.kl ?? null,
    onFilter: (value: boolean | Key, record: ISample) => String(record.kl?.id ?? '') === String(value),
    render: (_: unknown, record: ISample) => (
      isEditing(record)
        ? (
          <Select
            allowClear
            showSearch
            style={{ width: '100%' }}
            value={editingDraft?.kl ?? undefined}
            options={klOptions}
            onChange={(value) => updateDraftField('kl', typeof value === 'number' ? value : null)}
          />
        )
        : (readKl(record) || '—')
    ),
  },
  {
    title: 'Serial Number',
    dataIndex: 'serial_number',
    key: 'serial_number',
    width: 150,
    render: (value: string, record: ISample) => (
      isEditing(record)
        ? (
          <Input
            value={editingDraft?.serial_number ?? ''}
            onChange={(event) => updateDraftField('serial_number', event.target.value)}
          />
        )
        : (value ?? '')
    ),
  },
  { title: 'License', key: 'licenses-sku', width: 150, render: (_: unknown, record: ISample) => renderLicenseSku(record.licenses) },
  { title: 'License Info', key: 'licenses-name', width: 150, render: (_: unknown, record: ISample) => renderLicenseName(record.licenses) },
  {
    title: 'Communication Channels',
    key: 'communication_channel',
    width: 150,
    filters: channelFilters,
    filterSearch: true,
    filteredValue: filters.communication_channel ?? null,
    onFilter: (value: boolean | Key, record: ISample) => String(record.communication_channel?.id ?? '') === String(value),
    render: (_: unknown, record: ISample) => (
      isEditing(record)
        ? (
          <Select
            allowClear
            showSearch
            style={{ width: '100%' }}
            value={editingDraft?.communication_channel ?? undefined}
            options={channelOptions}
            onChange={(value) => updateDraftField('communication_channel', typeof value === 'number' ? value : null)}
          />
        )
        : (readChannel(record) || '—')
    ),
  },
  {
    title: 'Characteristics',
    key: 'sample_characteristic',
    width: 150,
    filters: characteristicFilters,
    filterSearch: true,
    filteredValue: filters.sample_characteristic ?? null,
    onFilter: (value: boolean | Key, record: ISample) =>
      (record.sample_characteristic ?? []).some((item) => String(readCharacteristicId(item) ?? '') === String(value)),
    render: (_: unknown, record: ISample) => (
      isEditing(record)
        ? (
          <Select
            mode="multiple"
            allowClear
            style={{ width: '100%' }}
            value={editingDraft?.sample_characteristic ?? []}
            options={characteristicOptions}
            onChange={(value) => updateDraftField('sample_characteristic', toNumberIds(value))}
          />
        )
        : record.sample_characteristic?.length
          ? record.sample_characteristic.flatMap((item) => {
              const text = readCharacteristic(item);
              if (!text) return [];
              const id = readCharacteristicId(item);
              return [<Tag key={String(id ?? text)}>{text}</Tag>];
            })
          : '—'
    ),
  },
  {
    title: 'LOG Label',
    dataIndex: 'log_label',
    key: 'log_label',
    width: 150,
    render: (value: string, record: ISample) => (
      isEditing(record)
        ? (
          <Input
            value={editingDraft?.log_label ?? ''}
            onChange={(event) => updateDraftField('log_label', event.target.value)}
          />
        )
        : (value ?? '')
    ),
  },
  {
    title: 'Primary Owner',
    key: 'primary_owner',
    width: 150,
    filters: ownerFilters,
    filterSearch: true,
    filteredValue: filters.primary_owner ?? null,
    onFilter: (value: boolean | Key, record: ISample) => String(record.primary_owner?.id ?? '') === String(value) || (record.primary_owner?.username ?? '') === String(value),
    render: (_: unknown, record: ISample) => (
      isEditing(record)
        ? (
          <Select
            allowClear
            showSearch
            style={{ width: '100%' }}
            value={editingDraft?.primary_owner ?? undefined}
            options={ownerOptions}
            onChange={(value) => updateDraftField('primary_owner', typeof value === 'number' ? value : null)}
          />
        )
        : renderOwnerCell(record.primary_owner)
    ),
  },
  { title: 'Last Audited', key: 'lab_audit', width: 180, align: 'center' as const, render: (_: unknown, record: ISample) => renderAuditCell(record.lab_audit) },
  { title: 'Image', key: 'image', width: 100, align: 'center' as const, render: (_: unknown, record: ISample) => (
    isEditing(record) && onImageChange
      ? <InlineImageUpload currentImage={record.image} onImageChange={onImageChange} />
      : renderImageCell(record.image)
  ) },
  {
    title: 'Status',
    key: 'status',
    width: 160,
    align: 'center' as const,
    onHeaderCell: () => ({ className: 'centeredFilterHeader' }),
    filters: statusFilters,
    filterSearch: true,
    filteredValue: filters.status ?? null,
    onFilter: (value: boolean | Key, record: ISample) => readStatusFromRecord(record) === String(value),
    render: (_: unknown, record: ISample) => (
      <ResourceStatus
        status={isEditing(record) ? editingDraft?.pending_status_type ?? readStatusFromRecord(record) : readStatusFromRecord(record)}
        isEditing={isEditing(record)}
        record={isEditing(record) && editingDraft?.pending_status_type ? {
          ...record,
          current_status: {
            status_type: editingDraft.pending_status_type,
            status_data: editingDraft.pending_status_data ?? {},
          },
        } : record}
        onStatusChange={onStatusChange ? (values) => onStatusChange(record, values) : undefined}
      />
    ),
  },
  { title: 'Information', key: 'information', width: 180, render: (_: unknown, record: ISample) => renderInfoCell(record) },
  {
    title: 'Remark',
    dataIndex: 'remark',
    key: 'remark',
    width: 150,
    render: (value: string | null | undefined, record: ISample) => (
      isEditing(record)
        ? (
          <Input
            value={editingDraft?.remark ?? ''}
            onChange={(event) => updateDraftField('remark', event.target.value)}
          />
        )
        : (value ?? '')
    ),
  },
  { title: 'Actions', key: 'actions', fixed: 'right' as const, width: 165, align: 'center' as const, render: actionsRenderer },
  ];
};