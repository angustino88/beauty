import { useEquipmentSearchOptions } from '../hooks/useEquipmentSearchOptions';
import { useMemo, useState } from 'react';
import { Alert, Badge, Tabs } from 'antd';
import { useSearchParams } from 'react-router-dom';
import { FoundLicensesPanel, LicenseChecksPanel, useGetLicenseObservationsQuery } from '@/features/lab-equipment/license-checks';
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
import { WorkbookImportButton } from '@/features/data-import';
import { useLicenseTable } from '../hooks/useLicenseTable';
import { useLicenseForm, type LicenseUpsertPayload } from '../hooks/useLicenseForm';
import EquipmentInventoryOverview from '../../shared/components/cards/EquipmentInventoryOverview';
import { licenseStatusLabel, licenseStatusTone, licenseStatusValue } from '../licenseStatus';
import {
  buildLicenseColumns,
  toLicenseInlineDraft,
  type LicenseInlineDraft,
} from '../columns/licenseColumns';

/** Shown until the user changes View options; every one of these can be hidden there. */
const LICENSE_DEFAULT_COLUMNS = [
  'id', 'sku', 'name', 'license_product', 'license_vendor', 'license_category', 'license_type', 'license_restriction',
  'assigned_equipment', 'expiry_date', 'primary_owner', 'status', 'actions',
];

const isAdminGroupMap = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

function LicenseInventory() {
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

  const editingAssigned = table.rows.find((row) => row.id === editingId)?.assigned_equipment;
  const equipmentSearch = useEquipmentSearchOptions(editingAssigned);

  const formFields = useMemo<FieldConfig[]>(
    () => [
      { name: 'sku', label: 'SKU', type: 'text', required: true, disabledInEdit: true },
      { name: 'name', label: 'Name', type: 'text', required: true },
      { name: 'license_product', label: 'Product', type: 'select', required: true, options: table.productOptions },
      { name: 'license_vendor', label: 'Vendor', type: 'select', required: true, options: table.vendorOptions },
      { name: 'maximum_version', label: 'Maximum Version', type: 'text' },
      { name: 'serial_number', label: 'Serial Number', type: 'text', help: "The vendor's license serial or ID, for example the Vector license ID. Lab computers match the licenses they find by it." },
      { name: 'license_ID', label: 'License Key (write-only)', type: 'text', help: 'Write-only: stored securely and never shown again. Leave empty to keep the current key; type a new one to replace it.' },
      { name: 'license_category', label: 'License Category', type: 'select', required: true, options: table.categoryOptions },
      { name: 'license_type', label: 'License Type', type: 'select', required: true, options: table.typeOptions },
      {
        name: 'license_restriction',
        label: 'License Restriction',
        type: 'select',
        options: table.restrictionOptions,
      },
      { name: 'license_seats', label: 'Seats', type: 'number' },
      { name: 'expiry_date', label: 'Expiry Date', type: 'date' },
      { name: 'primary_owner', label: 'Owner', type: 'select', options: table.ownerOptions },
      {
        name: 'assigned_equipment_ids',
        label: 'License Carrier',
        type: 'multi-select',
        options: equipmentSearch.options,
        onSearch: equipmentSearch.onSearch,
        onOpenChange: equipmentSearch.onOpenChange,
        onPopupScroll: equipmentSearch.onPopupScroll,
        loading: equipmentSearch.loading,
        popupHint: equipmentSearch.moreHint,
        placeholder: 'Pick equipment, or type a SKU or name',
        searchHint: equipmentSearch.emptyText,
        help: 'Optional. A license can be assigned to as many equipment items as it has seats.',
      },
      { name: 'remark', label: 'Remark', type: 'textarea' },
      { name: 'image', label: 'Image', type: 'image' },
    ],
    [
      table.productOptions,
      table.vendorOptions,
      table.categoryOptions,
      table.typeOptions,
      table.restrictionOptions,
      table.ownerOptions,
      equipmentSearch.options,
      equipmentSearch.onSearch,
      equipmentSearch.onOpenChange,
      equipmentSearch.onPopupScroll,
      equipmentSearch.loading,
      equipmentSearch.moreHint,
      equipmentSearch.emptyText,
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
    const { pending_status_type, pending_status_data } = editingDraft;
    // Only the fields a license accepts; status changes through its own action below.
    const payload: LicenseUpsertPayload = {
      name: editingDraft.name,
      license_product: editingDraft.license_product,
      license_vendor: editingDraft.license_vendor,
      maximum_version: editingDraft.maximum_version ?? '',
      serial_number: editingDraft.serial_number ?? '',
      license_ID: editingDraft.license_ID || null,
      license_category: editingDraft.license_category,
      license_type: editingDraft.license_type,
      license_restriction: editingDraft.license_restriction,
      expiry_date: editingDraft.expiry_date ? editingDraft.expiry_date.format('YYYY-MM-DD') : null,
      primary_owner: editingDraft.primary_owner,
      remark: editingDraft.remark,
    };

    await form.updateInline(editingId, payload);
    if (pending_status_type) await form.changeStatus(editingId, pending_status_type, pending_status_data ?? {});
    const current = (table.rows.find((row) => row.id === editingId)?.assigned_equipment ?? []).map((item) => item.id);
    await form.syncAssignments(editingId, current, editingDraft.assigned_equipment_ids ?? []);
    if (inlineImageFile) {
      await form.updateImage?.(editingId, inlineImageFile);
      setInlineImageFile(null);
    }
    cancelEdit();
  };

  // The image uploads as soon as a file is picked; it has its own endpoint.
  const handleImageChange = (file: File, record: ILicense) => {
    void form.updateImage?.(record.id, file);
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
    carrierOptions: equipmentSearch.options,
    onCarrierSearch: equipmentSearch.onSearch,
    onCarrierOpenChange: equipmentSearch.onOpenChange,
    onCarrierPopupScroll: equipmentSearch.onPopupScroll,
    carrierMoreHint: equipmentSearch.moreHint,
    carrierLoading: equipmentSearch.loading,
    carrierEmptyText: equipmentSearch.emptyText,
    isEditing,
    editingDraft,
    updateDraftField,
    actionsRenderer,
    onImageChange: isAdmin ? handleImageChange : undefined,
    onStatusChange: handleStatusChange,
  });

  return (
    <>
      <EquipmentPageLayout<ILicense>
        professionalTable
        title="License"
        equipmentType="license"
        isLicense
        itemNoun="license"
        defaultVisibleColumnKeys={LICENSE_DEFAULT_COLUMNS}
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
              { key: 'available', label: 'Available', description: 'Free to assign', tone: 'success' },
              { key: 'assigned', label: 'Assigned', description: 'In use on equipment', tone: 'info' },
              { key: 'expired', label: 'Expired', description: 'Past expiry date', tone: 'danger' },
              { key: 'suspended', label: 'Suspended', description: 'Temporarily withdrawn', tone: 'warning' },
            ]}
          />
        </>}
        extraControls={<WorkbookImportButton />}
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

type LicenseTab = 'inventory' | 'checks' | 'found';
const LICENSE_TABS: readonly LicenseTab[] = ['inventory', 'checks', 'found'];

/** Licenses: the inventory, the license checks agents run, and what they found on lab hardware. */
export default function LicensePage() {
  const permissionGroups = useSelector((state: RootState) => state.me.permissionGroups);
  const isLabsAdmin = isAdminGroupMap(permissionGroups) && 'admin' in permissionGroups;
  const isStaff = isAdminGroupMap(permissionGroups) && ('admin' in permissionGroups || 'lab-coordinator' in permissionGroups);
  const [searchParams, setSearchParams] = useSearchParams();
  const requested = searchParams.get('tab') as LicenseTab | null;
  const tab: LicenseTab = requested && LICENSE_TABS.includes(requested) && (requested === 'inventory' || isStaff) ? requested : 'inventory';
  const checkParam = Number(searchParams.get('check'));
  const checkId = Number.isInteger(checkParam) && checkParam > 0 ? checkParam : undefined;

  const update = (changes: Record<string, string | undefined>) => {
    const next = new URLSearchParams(searchParams);
    Object.entries(changes).forEach(([key, value]) => (value ? next.set(key, value) : next.delete(key)));
    setSearchParams(next, { replace: true });
  };

  const attention = useGetLicenseObservationsQuery({ isAttentionRequired: true, pageSize: 1 }, { skip: !isStaff, pollingInterval: 300_000 });
  const attentionCount = attention.data?.meta.pagination.count ?? 0;

  if (!isStaff) return <LicenseInventory />;
  return (
    <Tabs
      activeKey={tab}
      onChange={(key) => update({ tab: key === 'inventory' ? undefined : key, check: undefined })}
      destroyOnHidden
      tabBarStyle={{ marginBottom: 0, paddingInline: 16 }}
      items={[
        { key: 'inventory', label: 'Inventory', children: <LicenseInventory /> },
        {
          key: 'checks',
          label: 'License checks',
          children: (
            <div style={{ padding: 16 }}>
              <LicenseChecksPanel isAdmin={isLabsAdmin} onShowFound={(id) => update({ tab: 'found', check: String(id) })} />
            </div>
          ),
        },
        {
          key: 'found',
          label: (
            <span>
              Found on lab hardware{' '}
              <Badge count={attentionCount} size="small" title={`${attentionCount} need attention`} />
            </span>
          ),
          children: (
            <div style={{ padding: 16 }}>
              <FoundLicensesPanel checkId={checkId} onClearCheck={() => update({ check: undefined })} />
            </div>
          ),
        },
      ]}
    />
  );
}
