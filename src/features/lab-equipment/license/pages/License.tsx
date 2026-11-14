import { useMemo, useState } from 'react';
import { Alert } from 'antd';
import { skipToken } from '@reduxjs/toolkit/query';
import { useSelector } from 'react-redux';
import type { RootState } from '@/app/store';
import { useGetLicenseHistoryQuery } from '../api';
import {
  EquipmentPageLayout,
  EquipmentFormModal,
  createActionsRenderer,
  InlineEditActions,
  printDeviceLabel,
  useInlineEquipmentEdit,
} from '../../shared';
import type { FieldConfig } from '../../shared';
import type { ILicense } from '../types';
import { useLicenseTable } from '../hooks/useLicenseTable';
import { useLicenseForm, type LicenseUpsertPayload } from '../hooks/useLicenseForm';
import EquipmentInventoryOverview from '../../shared/components/cards/EquipmentInventoryOverview';
import { licenseStatusLabel, licenseStatusTone, licenseStatusValue } from '../licenseStatus';
import {
  buildLicenseColumns,
  toLicenseInlineDraft,
  type LicenseInlineDraft,
} from '../columns/licenseColumns';

const isAdminGroupMap = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const toNullableInteger = (value: unknown): number | null => {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null;
  }
  if (typeof value !== 'string') {
    return null;
  }
  const trimmed = value.trim();
  if (!trimmed) return null;
  return /^\d+$/.test(trimmed) ? Number(trimmed) : null;
};

export default function LicensePage() {
  const permissionGroups = useSelector((state: RootState) => state.me.permissionGroups);
  const isAdmin = isAdminGroupMap(permissionGroups) && ('admin' in permissionGroups || 'lab-coordinator' in permissionGroups);

  const table = useLicenseTable();
  const form = useLicenseForm();

  const [modalOpen, setModalOpen] = useState(false);
  const [historyId, setHistoryId] = useState<number | null>(null);
  const [inlineImageFile, setInlineImageFile] = useState<File | null>(null);

  const {
    editingId,
    draft: editingDraft,
    setDraft: setEditingDraft,
    isEditing,
    startEdit,
    clearEdit,
    cancelEdit,
  } = useInlineEquipmentEdit<ILicense, LicenseInlineDraft>();

  const { data: historyData, isFetching: historyLoading } = useGetLicenseHistoryQuery(
    historyId ?? skipToken,
  );

  const formFields = useMemo<FieldConfig[]>(
    () => [
      { name: 'sku', label: 'SKU', type: 'text', required: true, disabledInEdit: true },
      { name: 'name', label: 'Name', type: 'text', required: true },
      { name: 'license_product', label: 'Product', type: 'select', options: table.productOptions },
      { name: 'license_vendor', label: 'Vendor', type: 'select', options: table.vendorOptions },
      { name: 'maximum_version', label: 'Maximum Version', type: 'text' },
      { name: 'license_ID', label: 'License ID', type: 'text' },
      { name: 'carrier_device', label: 'License Carrier', type: 'select', options: table.carrierDeviceOptions },
      { name: 'license_category', label: 'License Category', type: 'select', options: table.categoryOptions },
      { name: 'license_type', label: 'License Type', type: 'select', options: table.typeOptions },
      {
        name: 'license_restriction',
        label: 'License Restriction',
        type: 'select',
        options: table.restrictionOptions,
      },
      { name: 'log_label', label: 'LOG Label', type: 'text' },
      { name: 'expiry_date', label: 'Expiry Date', type: 'date', required: true },
      { name: 'primary_owner', label: 'Primary Owner', type: 'select', options: table.ownerOptions },
      { name: 'remark', label: 'Remark', type: 'textarea' },
      { name: 'image', label: 'Image', type: 'image' },
    ],
    [
      table.productOptions,
      table.vendorOptions,
      table.carrierDeviceOptions,
      table.categoryOptions,
      table.typeOptions,
      table.restrictionOptions,
      table.ownerOptions,
    ],
  );

  const handleEdit = (id: number) => {
    const record = table.rows.find((row) => row.id === id);
    if (!record) return;
    startEdit(record, toLicenseInlineDraft);
  };

  const updateDraftField = <K extends keyof LicenseInlineDraft>(
    key: K,
    value: LicenseInlineDraft[K],
  ) => {
    setEditingDraft((prev) => (prev ? { ...prev, [key]: value } : prev));
  };

  const handleCreateSubmit = async (values: Record<string, unknown>, imageFile?: File | null) => {
    await form.createFromValues(values, imageFile);
    setModalOpen(false);
  };

  const handleInlineSave = async () => {
    if (editingId === null || !editingDraft) return;
    const { pending_status_type, pending_status_data, ...restDraft } = editingDraft;
    const payload = {
      ...restDraft,
      name: editingDraft.name,
      license_product: editingDraft.license_product,
      license_vendor: editingDraft.license_vendor,
      maximum_version: toNullableInteger(editingDraft.maximum_version),
      license_ID: editingDraft.license_ID || null,
      carrier_device: editingDraft.carrier_device,
      license_category: editingDraft.license_category,
      license_type: editingDraft.license_type,
      license_restriction: editingDraft.license_restriction,
      log_label: editingDraft.log_label,
      expiry_date: editingDraft.expiry_date ? editingDraft.expiry_date.format('YYYY-MM-DD') : null,
      primary_owner: editingDraft.primary_owner,
      remark: editingDraft.remark,
      ...(pending_status_type ? { current_status: { status_type: pending_status_type, status_data: pending_status_data ?? {} } } : {}),
    } as LicenseUpsertPayload;

    await form.updateInline(editingId, payload);
    if (inlineImageFile) {
      await form.updateImage?.(editingId, inlineImageFile);
      setInlineImageFile(null);
    }
    cancelEdit();
  };

  const handleImageChange = (file: File) => {
    setInlineImageFile(file);
  };

  const handleStatusChange = (_record: ILicense, values: { status_type: string; status_data: Record<string, unknown> }) => {
    updateDraftField('pending_status_type', values.status_type);
    updateDraftField('pending_status_data', values.status_data);
  };

  const defaultActionsRenderer = createActionsRenderer<ILicense>({
    isAdmin,
    deleting: form.deleting,
    onEdit: handleEdit,
    onDelete: form.deleteById,
    onHistory: setHistoryId,
    onPrint: printDeviceLabel,
  });

  const actionsRenderer = (_: unknown, record: ILicense) => (
    isEditing(record)
      ? (
        <InlineEditActions
          onSave={handleInlineSave}
          onClear={clearEdit}
          onCancel={cancelEdit}
          saving={form.updating}
        />
      )
      : defaultActionsRenderer(_, record)
  );

  const columns = buildLicenseColumns({
    filters: table.filters,
    productFilters: table.productFilters,
    vendorFilters: table.vendorFilters,
    categoryFilters: table.categoryFilters,
    typeFilters: table.typeFilters,
    restrictionFilters: table.restrictionFilters,
    ownerFilters: table.ownerFilters,
    statusFilters: table.statusFilters,
    productOptions: table.productOptions,
    vendorOptions: table.vendorOptions,
    categoryOptions: table.categoryOptions,
    typeOptions: table.typeOptions,
    restrictionOptions: table.restrictionOptions,
    ownerOptions: table.ownerOptions,
    carrierDeviceOptions: table.carrierDeviceOptions,
    isEditing,
    editingDraft,
    updateDraftField,
    actionsRenderer,
    onImageChange: handleImageChange,
    onStatusChange: handleStatusChange,
  });

  return (
    <>
      <EquipmentPageLayout<ILicense>
        professionalTable
        title="License"
        equipmentType="license"
        isLicense
        columns={columns}
        rows={table.rows}
        totalRecords={table.totalRecords}
        loading={table.isFetching}
        onRefetch={table.refetch}
        page={table.page}
        pageSize={table.pageSize}
        onPageChange={(page, size) => {
          table.setPage(page);
          table.setPageSize(size);
        }}
        search={table.search}
        onSearchChange={table.setSearch}
        filters={table.filters}
        onFiltersChange={table.setFilters}
        customSummary={<>
          {table.statusSummaryError && <Alert type="warning" showIcon message="License status totals are unavailable" action={<a href="#retry-license-status" onClick={(event) => { event.preventDefault(); void table.refetchStatusSummary(); }}>Try again</a>} />}
          <EquipmentInventoryOverview
            total={table.statusSummary?.total_count}
            statuses={table.statusSummary?.statuses.map(({ status, resource_count }) => ({ status, count: resource_count }))}
            unknownCount={table.statusSummary?.unknown_status_count}
            loading={table.statusSummaryLoading}
            resourceLabel="licenses"
            scopeLabel="Across all licenses, not just this page"
            statusTone={licenseStatusTone}
            normalizeStatus={licenseStatusValue}
            statusLabel={licenseStatusLabel}
            showAllOtherStatuses
            featuredStatuses={[
              { key: 'active', label: 'Active', description: 'Valid licenses', tone: 'green' },
              { key: 'inactive', label: 'Inactive', description: 'Not currently active', tone: 'slate' },
              { key: 'expired', label: 'Expired', description: 'Past expiry date', tone: 'red' },
              { key: 'trial', label: 'Trial', description: 'Evaluation licenses', tone: 'blue' },
            ]}
          />
        </>}
        showCreate={isAdmin}
        createLabel="New License"
        onCreate={() => setModalOpen(true)}
        scrollX={3200}
        historyId={historyId}
        historyOpen={historyId !== null}
        historyData={historyData}
        historyLoading={historyLoading}
        onHistoryClose={() => setHistoryId(null)}
      />

      <EquipmentFormModal
        open={modalOpen}
        mode="create"
        title="New License"
        fields={formFields}
        onSubmit={handleCreateSubmit}
        onCancel={() => setModalOpen(false)}
        loading={form.creating}
      />
    </>
  );
}
