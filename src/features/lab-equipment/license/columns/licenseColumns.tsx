import { CarrierCell } from './CarrierCells';
import type { EquipmentOption } from '../hooks/useEquipmentSearchOptions';
import type { Key, ReactNode } from 'react';
import { DatePicker, Input, Select } from 'antd';
import dayjs, { type Dayjs } from 'dayjs';
import {
  InlineImageUpload,
  readStatusFromRecord,
  LastAuditCell,
  renderImageCell,
  renderOwnerCell,
} from '../../shared';
import LicenseStatus from '../../shared/components/status/LicenseStatus';
import LicenseInformationCell from './LicenseInformationCell';
import type { ILicense } from '../types';

type FilterItem = { text: string; value: string };
type SelectOption = { label: string; value: number };

const readProduct = (record: ILicense) => record.license_product?.product_name ?? record.product?.product_name ?? '';
const readVendor = (record: ILicense) => record.license_vendor?.vendor_name ?? record.vendor?.vendor_name ?? '';
const readType = (record: ILicense) => record.license_type?.type_name ?? record.license_type?.license_type_name ?? '';
const readCategory = (record: ILicense) => record.license_category?.category_name ?? record.category?.category_name ?? '';
const readRestriction = (record: ILicense) =>
  record.license_restriction?.restriction_name
  ?? record.license_restriction?.license_restriction_name
  ?? record.restriction?.restriction_name
  ?? '';

export interface LicenseInlineDraft {
  name: string;
  license_product: number | null;
  license_vendor: number | null;
  maximum_version: string;
  license_ID: string;
  assigned_equipment_ids: number[];
  license_category: number | null;
  license_type: number | null;
  license_restriction: number | null;
  log_label: string;
  expiry_date: Dayjs | null;
  primary_owner: number | null;
  remark: string;
  pending_status_type?: string;
  pending_status_data?: Record<string, unknown>;
}

interface BuildColumnsArgs {
  filters: Record<string, Key[] | null>;
  productFilters: FilterItem[];
  vendorFilters: FilterItem[];
  categoryFilters: FilterItem[];
  typeFilters: FilterItem[];
  restrictionFilters: FilterItem[];
  ownerFilters: FilterItem[];
  statusFilters: FilterItem[];
  productOptions: SelectOption[];
  vendorOptions: SelectOption[];
  categoryOptions: SelectOption[];
  typeOptions: SelectOption[];
  restrictionOptions: SelectOption[];
  ownerOptions: SelectOption[];
  carrierOptions: EquipmentOption[];
  onCarrierSearch: (query: string) => void;
  carrierLoading: boolean;
  isEditing: (record: ILicense) => boolean;
  editingDraft: LicenseInlineDraft | null;
  updateDraftField: <K extends keyof LicenseInlineDraft>(
    key: K,
    value: LicenseInlineDraft[K],
  ) => void;
  actionsRenderer: (_: unknown, record: ILicense) => ReactNode;
  onImageChange?: (file: File, record: ILicense) => void;
  onStatusChange?: (record: ILicense, values: { status_type: string; status_data: Record<string, unknown> }) => void;
}

export const toLicenseInlineDraft = (item: ILicense): LicenseInlineDraft => ({
  name: item.name ?? '',
  license_product: item.license_product?.id ?? item.product?.id ?? null,
  license_vendor: item.license_vendor?.id ?? item.vendor?.id ?? null,
  maximum_version: item.maximum_version == null ? '' : String(item.maximum_version),
  license_ID: item.license_ID ?? '',
  assigned_equipment_ids: (item.assigned_equipment ?? []).map((equipment) => equipment.id),
  license_category: item.license_category?.id ?? item.category?.id ?? null,
  license_type: item.license_type?.id ?? null,
  license_restriction: item.license_restriction?.id ?? item.restriction?.id ?? null,
  log_label: item.log_label ?? '',
  expiry_date: item.expiry_date ? dayjs(item.expiry_date) : null,
  primary_owner: item.primary_owner?.id ?? null,
  remark: item.remark ?? '',
});

export const buildLicenseColumns = ({
  filters,
  productFilters,
  vendorFilters,
  categoryFilters,
  typeFilters,
  restrictionFilters,
  ownerFilters,
  statusFilters,
  productOptions,
  vendorOptions,
  categoryOptions,
  typeOptions,
  restrictionOptions,
  ownerOptions,
  carrierOptions,
  onCarrierSearch,
  carrierLoading,
  isEditing,
  editingDraft,
  updateDraftField,
  actionsRenderer,
  onImageChange,
  onStatusChange,
}: BuildColumnsArgs) => [
  { title: 'ID', dataIndex: 'id', key: 'id', width: 100, fixed: 'left' as const },
  { title: 'SKU', dataIndex: 'sku', key: 'sku', width: 200, fixed: 'left' as const },
  {
    title: 'Name',
    dataIndex: 'name',
    key: 'name',
    width: 200,
    fixed: 'left' as const,
    render: (value: string, record: ILicense) => (
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
    title: 'Product',
    key: 'license_product',
    width: 150,
    filters: productFilters,
    filterSearch: true,
    filteredValue: filters.license_product ?? null,
    onFilter: (value: boolean | Key, record: ILicense) => String(record.license_product?.id ?? record.product?.id ?? '') === String(value),
    render: (_: unknown, record: ILicense) => (
      isEditing(record)
        ? (
          <Select
            allowClear
            showSearch
            style={{ width: '100%' }}
            value={editingDraft?.license_product ?? undefined}
            options={productOptions}
            onChange={(value) => updateDraftField('license_product', typeof value === 'number' ? value : null)}
          />
        )
        : readProduct(record)
    ),
  },
  {
    title: 'Vendor',
    key: 'license_vendor',
    width: 150,
    filters: vendorFilters,
    filterSearch: true,
    filteredValue: filters.license_vendor ?? null,
    onFilter: (value: boolean | Key, record: ILicense) => String(record.license_vendor?.id ?? record.vendor?.id ?? '') === String(value),
    render: (_: unknown, record: ILicense) => (
      isEditing(record)
        ? (
          <Select
            allowClear
            showSearch
            style={{ width: '100%' }}
            value={editingDraft?.license_vendor ?? undefined}
            options={vendorOptions}
            onChange={(value) => updateDraftField('license_vendor', typeof value === 'number' ? value : null)}
          />
        )
        : readVendor(record)
    ),
  },
  {
    title: 'Maximum Version',
    dataIndex: 'maximum_version',
    key: 'maximum_version',
    width: 150,
    render: (value: string | null | undefined, record: ILicense) => (
      isEditing(record)
        ? (
          <Input
            value={editingDraft?.maximum_version ?? ''}
            onChange={(event) => updateDraftField('maximum_version', event.target.value)}
          />
        )
        : (value ?? '')
    ),
  },
  {
    title: 'License Carrier',
    key: 'assigned_equipment',
    width: 240,
    render: (_: unknown, record: ILicense) => (
      <CarrierCell
        key={record.id}
        assigned={record.assigned_equipment}
        editing={isEditing(record)}
        value={editingDraft?.assigned_equipment_ids ?? []}
        onChange={(ids) => updateDraftField('assigned_equipment_ids', ids)}
        seats={record.license_seats}
        options={carrierOptions}
        onSearch={onCarrierSearch}
        loading={carrierLoading}
      />
    ),
  },
  {
    title: 'License Category',
    key: 'license_category',
    width: 150,
    filters: categoryFilters,
    filterSearch: true,
    filteredValue: filters.license_category ?? null,
    onFilter: (value: boolean | Key, record: ILicense) => String(record.license_category?.id ?? record.category?.id ?? '') === String(value),
    render: (_: unknown, record: ILicense) => (
      isEditing(record)
        ? (
          <Select
            allowClear
            showSearch
            style={{ width: '100%' }}
            value={editingDraft?.license_category ?? undefined}
            options={categoryOptions}
            onChange={(value) => updateDraftField('license_category', typeof value === 'number' ? value : null)}
          />
        )
        : readCategory(record)
    ),
  },
  {
    title: 'License Type',
    key: 'license_type',
    width: 180,
    filters: typeFilters,
    filterSearch: true,
    filteredValue: filters.license_type ?? null,
    onFilter: (value: boolean | Key, record: ILicense) => String(record.license_type?.id ?? '') === String(value),
    render: (_: unknown, record: ILicense) => (
      isEditing(record)
        ? (
          <Select
            allowClear
            showSearch
            style={{ width: '100%' }}
            value={editingDraft?.license_type ?? undefined}
            options={typeOptions}
            onChange={(value) => updateDraftField('license_type', typeof value === 'number' ? value : null)}
          />
        )
        : readType(record)
    ),
  },
  {
    title: 'License Restriction',
    key: 'license_restriction',
    width: 180,
    filters: restrictionFilters,
    filterSearch: true,
    filteredValue: filters.license_restriction ?? null,
    onFilter: (value: boolean | Key, record: ILicense) => String(record.license_restriction?.id ?? record.restriction?.id ?? '') === String(value),
    render: (_: unknown, record: ILicense) => (
      isEditing(record)
        ? (
          <Select
            allowClear
            showSearch
            style={{ width: '100%' }}
            value={editingDraft?.license_restriction ?? undefined}
            options={restrictionOptions}
            onChange={(value) => updateDraftField('license_restriction', typeof value === 'number' ? value : null)}
          />
        )
        : readRestriction(record)
    ),
  },
  {
    title: 'Expiry Date',
    key: 'expiry_date',
    width: 150,
    render: (_: unknown, record: ILicense) => (
      isEditing(record)
        ? (
          <DatePicker
            value={editingDraft?.expiry_date ?? null}
            format="YYYY-MM-DD"
            style={{ width: '100%' }}
            onChange={(value) => updateDraftField('expiry_date', value)}
          />
        )
        : (record.expiry_date ? dayjs(record.expiry_date).format('YYYY-MM-DD') : '')
    ),
  },
  {
    title: 'Primary Owner',
    key: 'primary_owner',
    width: 150,
    filters: ownerFilters,
    filterSearch: true,
    filteredValue: filters.primary_owner ?? null,
    onFilter: (value: boolean | Key, record: ILicense) => (record.primary_owner?.username ?? '') === String(value),
    render: (_: unknown, record: ILicense) => (
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
  {
    title: 'Last Audited',
    dataIndex: 'lab_audit',
    key: 'lab_audit',
    width: 180,
    align: 'center' as const,
    render: (_: unknown, record: ILicense) => <LastAuditCell resourceType="license" resourceId={record.id} />,
  },
  {
    title: 'Image',
    dataIndex: 'image',
    key: 'image',
    width: 150,
    align: 'center' as const,
    render: (_: unknown, record: ILicense) => (
      onImageChange
        ? <InlineImageUpload key={record.id} currentImage={record.image} onImageChange={(file) => onImageChange(file, record)} />
        : renderImageCell(record.image)
    ),
  },
  {
    title: 'Status',
    key: 'status',
    width: 150,
    align: 'left' as const,
    onHeaderCell: () => ({ className: 'centeredFilterHeader' }),
    filters: statusFilters,
    filterSearch: true,
    filteredValue: filters.status ?? null,
    onFilter: (value: boolean | Key, record: ILicense) => readStatusFromRecord(record) === String(value),
    render: (_: unknown, record: ILicense) => (
      <LicenseStatus
        status={isEditing(record) ? editingDraft?.pending_status_type ?? readStatusFromRecord(record) : readStatusFromRecord(record)}
        isEditing={isEditing(record)}
        record={isEditing(record) && editingDraft?.pending_status_type ? {
          ...record,
          status: editingDraft.pending_status_type,
        } : record}
        onStatusChange={onStatusChange ? (values) => onStatusChange(record, values) : undefined}
      />
    ),
  },
  {
    title: 'Information',
    key: 'information',
    width: 180,
    render: (_: unknown, record: ILicense) => (
      <span style={{ whiteSpace: 'pre-line' }}>
        <LicenseInformationCell record={record} />
      </span>
    ),
  },
  {
    title: 'Remark',
    dataIndex: 'remark',
    key: 'remark',
    width: 150,
    render: (value: string | null | undefined, record: ILicense) => (
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
  {
    title: 'Actions',
    key: 'actions',
    fixed: 'right' as const,
    width: 165,
    align: 'center' as const,
    render: actionsRenderer,
  },
];
