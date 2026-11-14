import { useMemo, useState } from 'react';
import { skipToken } from '@reduxjs/toolkit/query';
import { useSelector } from 'react-redux';
import type { RootState } from '@/app/store';
import { useGetSampleHistoryQuery } from '../api';
import {
  EquipmentPageLayout,
  EquipmentFormModal,
  createActionsRenderer,
  InlineEditActions,
  printDeviceLabel,
  useInlineEquipmentEdit,
} from '../../shared';
import type { FieldConfig } from '../../shared';
import type { ISample, ISamplePayload } from '../types';
import { useSampleTable } from '../hooks/useSampleTable';
import { useSampleForm } from '../hooks/useSampleForm';
import {
  buildSampleColumns,
  toSampleInlineDraft,
  type SampleInlineDraft,
} from '../columns/sampleColumns';

const isAdminGroupMap = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

export default function SamplePage() {
  const permissionGroups = useSelector((state: RootState) => state.me.permissionGroups);
  const isAdmin = isAdminGroupMap(permissionGroups) && ('admin' in permissionGroups || 'lab-coordinator' in permissionGroups);

  const table = useSampleTable();
  const form = useSampleForm();

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
  } = useInlineEquipmentEdit<ISample, SampleInlineDraft>();

  const { data: historyData, isFetching: historyLoading } = useGetSampleHistoryQuery(
    historyId ?? skipToken,
  );

  const formFields = useMemo<FieldConfig[]>(
    () => [
      { name: 'sku', label: 'SKU', type: 'text', required: true, disabledInEdit: true },
      { name: 'name', label: 'Name', type: 'text', required: true },
      { name: 'sample_type', label: 'Type', type: 'select', options: table.typeOptions },
      { name: 'manufacturer', label: 'Manufacturer', type: 'select', options: table.manufacturerOptions },
      { name: 'product_line', label: 'Product Line', type: 'select', options: table.productLineOptions },
      { name: 'version', label: 'Version', type: 'select', options: table.versionOptions },
      { name: 'oem', label: 'OEM', type: 'select', options: table.oemOptions },
      { name: 'kl', label: 'KL', type: 'select', options: table.klOptions },
      { name: 'serial_number', label: 'Serial Number', type: 'text' },
      {
        name: 'communication_channel',
        label: 'Communication Channels',
        type: 'select',
        options: table.channelOptions,
      },
      {
        name: 'sample_characteristic',
        label: 'Characteristics',
        type: 'multi-select',
        options: table.characteristicOptions,
      },
      { name: 'log_label', label: 'LOG Label', type: 'text' },
      { name: 'primary_owner', label: 'Primary Owner', type: 'select', options: table.ownerOptions },
      { name: 'remark', label: 'Remark', type: 'textarea' },
      { name: 'image', label: 'Image', type: 'image' },
    ],
    [
      table.typeOptions,
      table.manufacturerOptions,
      table.productLineOptions,
      table.versionOptions,
      table.oemOptions,
      table.klOptions,
      table.channelOptions,
      table.characteristicOptions,
      table.ownerOptions,
    ],
  );

  const handleEdit = (id: number) => {
    const record = table.rows.find((row) => row.id === id);
    if (!record) return;
    startEdit(record, toSampleInlineDraft);
  };

  const updateDraftField = <K extends keyof SampleInlineDraft>(
    key: K,
    value: SampleInlineDraft[K],
  ) => {
    setEditingDraft((prev) => (prev ? { ...prev, [key]: value } : prev));
  };

  const handleImageChange = (file: File) => {
    setInlineImageFile(file);
  };

  const handleStatusChange = (_record: ISample, values: { status_type: string; status_data: Record<string, unknown> }) => {
    updateDraftField('pending_status_type', values.status_type);
    updateDraftField('pending_status_data', values.status_data);
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
      sample_type: editingDraft.sample_type,
      manufacturer: editingDraft.manufacturer,
      product_line: editingDraft.product_line,
      version: editingDraft.version,
      oem: editingDraft.oem,
      kl: editingDraft.kl,
      serial_number: editingDraft.serial_number,
      communication_channel: editingDraft.communication_channel,
      sample_characteristic: editingDraft.sample_characteristic,
      log_label: editingDraft.log_label,
      primary_owner: editingDraft.primary_owner,
      remark: editingDraft.remark,
      ...(pending_status_type ? { current_status: { status_type: pending_status_type, status_data: pending_status_data ?? {} } } : {}),
    } as ISamplePayload;

    await form.updateInline(editingId, payload);
    if (inlineImageFile) {
      await form.updateImage?.(editingId, inlineImageFile);
      setInlineImageFile(null);
    }
    cancelEdit();
  };

  const defaultActionsRenderer = createActionsRenderer<ISample>({
    isAdmin,
    deleting: form.deleting,
    onEdit: handleEdit,
    onDelete: form.deleteById,
    onHistory: setHistoryId,
    onPrint: printDeviceLabel,
  });

  const actionsRenderer = (_: unknown, record: ISample) => (
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

  const columns = buildSampleColumns({
    filters: table.filters,
    typeFilters: table.typeFilters,
    manufacturerFilters: table.manufacturerFilters,
    productLineFilters: table.productLineFilters,
    versionFilters: table.versionFilters,
    oemFilters: table.oemFilters,
    klFilters: table.klFilters,
    channelFilters: table.channelFilters,
    characteristicFilters: table.characteristicFilters,
    ownerFilters: table.ownerFilters,
    statusFilters: table.statusFilters,
    typeOptions: table.typeOptions,
    manufacturerOptions: table.manufacturerOptions,
    productLineOptions: table.productLineOptions,
    versionOptions: table.versionOptions,
    oemOptions: table.oemOptions,
    klOptions: table.klOptions,
    channelOptions: table.channelOptions,
    characteristicOptions: table.characteristicOptions,
    ownerOptions: table.ownerOptions,
    isEditing,
    editingDraft,
    updateDraftField,
    actionsRenderer,
    onImageChange: handleImageChange,
    onStatusChange: handleStatusChange,
  });

  return (
    <>
      <EquipmentPageLayout<ISample>
        title="Sample"
        equipmentType="sample"
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
        summaryOverride={table.summaryOverride}
        summaryOverrideTotal={table.totalRecords}
        detailValueLabels={{
          'Sample Characteristic': Object.fromEntries(
            table.characteristicOptions.map((option) => [String(option.value), option.label]),
          ),
        }}
        showCreate={isAdmin}
        createLabel="New Sample"
        onCreate={() => setModalOpen(true)}
        scrollX={3400}
        historyId={historyId}
        historyOpen={historyId !== null}
        historyData={historyData}
        historyLoading={historyLoading}
        onHistoryClose={() => setHistoryId(null)}
      />

      <EquipmentFormModal
        open={modalOpen}
        mode="create"
        title="New Sample"
        fields={formFields}
        onSubmit={handleCreateSubmit}
        onCancel={() => setModalOpen(false)}
        loading={form.creating}
      />
    </>
  );
}
