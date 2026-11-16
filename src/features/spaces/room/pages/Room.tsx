import { useMemo, useState } from "react";
import { WorkbookImportButton } from "@/features/data-import";
import { skipToken } from "@reduxjs/toolkit/query";
import { useSelector } from "react-redux";
import type { RootState } from "@/app/store";
import { useGetRoomHistoryQuery } from "../api";
import {
  EquipmentPageLayout,
  EquipmentFormModal,
  createActionsRenderer,
  InlineEditActions,
  printDeviceLabel,
  useInlineEquipmentEdit,
} from "@/features/lab-equipment/shared";
import type { FieldConfig } from "@/features/lab-equipment/shared";
import type { IRoom, IRoomPayload } from "../types";
import SpaceOverview from "../../shared/SpaceOverview";
import { useRoomTable } from "../hooks/useRoomTable";
import { useRoomForm } from "../hooks/useRoomForm";
import {
  buildRoomColumns,
  buildRoomCreateFields,
  toRoomInlineDraft,
  ROOM_SPECS_FIELDS,
  type RoomInlineDraft,
} from "../columns/roomColumns";

const isAdminGroupMap = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

export default function RoomPage() {
  const permissionGroups = useSelector(
    (state: RootState) => state.me.permissionGroups,
  );
  const isAdmin =
    isAdminGroupMap(permissionGroups) && ("admin" in permissionGroups || "lab-coordinator" in permissionGroups);

  const table = useRoomTable();
  const form = useRoomForm();

  const [modalOpen, setModalOpen] = useState(false);
  const [historyId, setHistoryId] = useState<number | null>(null);
  const [historyPage, setHistoryPage] = useState(1);
  const [historyPageSize, setHistoryPageSize] = useState(10);
  const [specsRecord, setSpecsRecord] = useState<IRoom | null>(null);
  const [inlineImageFile, setInlineImageFile] = useState<File | null>(null);

  const {
    editingId,
    draft: editingDraft,
    setDraft: setEditingDraft,
    isEditing,
    startEdit,
    clearEdit,
    cancelEdit,
  } = useInlineEquipmentEdit<IRoom, RoomInlineDraft>();

  const { data: historyData, isFetching: historyLoading } = useGetRoomHistoryQuery(
    historyId === null ? skipToken : { id: historyId, page: historyPage, pageSize: historyPageSize },
  );

  const formFields = useMemo<FieldConfig[]>(
    () => [
      ...buildRoomCreateFields(table.optionsMap).map((field) =>
        field.name === "setup_capacity"
          ? {
              ...field,
              disabled: true,
              help: "Auto-calculated from Rows × Columns",
            }
          : field,
      ),
      { name: "image", label: "Image", type: "image" as const },
    ],
    [table.optionsMap],
  );

  const handleEdit = (id: number) => {
    const record = table.rows.find((r) => r.id === id);
    if (record) startEdit(record, toRoomInlineDraft);
  };

  const updateDraftField = <K extends keyof RoomInlineDraft>(
    key: K,
    value: RoomInlineDraft[K],
  ) => {
    setEditingDraft((prev) => (prev ? { ...prev, [key]: value } : prev));
  };

  const handleStatusChange = (
    _record: IRoom,
    values: { status_type: string; status_data: Record<string, unknown> },
  ) => {
    // Store in draft — API call deferred to Save
    updateDraftField("pending_status_type", values.status_type);
    updateDraftField("pending_status_data", values.status_data);
  };

  const handleCreateSubmit = async (
    values: Record<string, unknown>,
    imageFile?: File | null,
  ) => {
    await form.createFromValues(values, imageFile);
    setModalOpen(false);
  };

  const handleInlineSave = async () => {
    if (editingId === null || !editingDraft) return;

    // Extract pending status, map to status_type/status_data for normalizeStatusBody
    const { pending_status_type, pending_status_data, ...restDraft } =
      editingDraft;
    const payload = {
      ...restDraft,
      ...(pending_status_type
        ? {
            current_status: {
              status_type: pending_status_type,
              status_data: pending_status_data ?? {},
            },
          }
        : {}),
    } as IRoomPayload;

    await form.updateInline(editingId, payload);
    if (inlineImageFile) {
      await form.updateImage?.(editingId, inlineImageFile);
      setInlineImageFile(null);
    }
    cancelEdit();
  };

  const handleSpecsSubmit = async (values: Record<string, unknown>) => {
    if (!specsRecord) return;
    const payload = Object.fromEntries(
      ROOM_SPECS_FIELDS.filter((f) => f.inEdit !== false).map((f) => [
        f.name,
        values[f.name],
      ]),
    ) as IRoomPayload;
    await form.updateInline(specsRecord.id, payload);
    setSpecsRecord(null);
  };

  const defaultActionsRenderer = createActionsRenderer<IRoom>({
    isAdmin,
    deleting: form.deleting,
    onEdit: handleEdit,
    onDelete: form.deleteById,
    onHistory: (id) => {
      setHistoryPage(1);
      setHistoryPageSize(10);
      setHistoryId(id);
    },
    onPrint: printDeviceLabel,
  });

  const actionsRenderer = (_: unknown, record: IRoom) =>
    isEditing(record) ? (
      <InlineEditActions
        onSave={handleInlineSave}
        onClear={clearEdit}
        onCancel={cancelEdit}
        saving={form.updating}
      />
    ) : (
      defaultActionsRenderer(_, record)
    );

  const columns = buildRoomColumns({
    activeFilters: table.filters,
    filtersMap: table.filtersMap,
    optionsMap: table.optionsMap,
    statusFilters: table.statusFilters,
    isEditing,
    editingDraft,
    updateDraftField,
    actionsRenderer,
    onStatusChange: handleStatusChange,
    onSpecsEdit: setSpecsRecord,
    onImageChange: (file) => setInlineImageFile(file),
  });

  return (
    <>
      <EquipmentPageLayout<IRoom>
        extraControls={<WorkbookImportButton />}
        professionalTable
        spaceKind="room"
        title="Rooms"
        description="Manage locations, capacity, and the spaces available for equipment."
        equipmentType="room"
        customSummary={<SpaceOverview kind="room" />}
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
        showCreate={isAdmin}
        createLabel="New Room"
        onCreate={() => setModalOpen(true)}
        scrollX={2200}
        historyId={historyId}
        historyOpen={historyId !== null}
        historyData={historyData?.data}
        historyLoading={historyLoading}
        historyPage={historyPage}
        historyPageSize={historyPageSize}
        historyTotal={historyData?.total ?? 0}
        onHistoryPageChange={(nextPage, nextPageSize) => {
          setHistoryPage(nextPageSize === historyPageSize ? nextPage : 1);
          setHistoryPageSize(nextPageSize);
        }}
        onHistoryClose={() => setHistoryId(null)}
        searchPlaceholder="Search by SKU, Name, Location, Country, etc."
        detailValueLabels={{
          Country: Object.fromEntries(
            (table.optionsMap.country ?? []).map((option) => [String(option.value), option.label]),
          ),
        }}
      />

      <EquipmentFormModal
        open={modalOpen}
        mode="create"
        title="New Room"
        fields={formFields}
        onSubmit={handleCreateSubmit}
        onCancel={() => setModalOpen(false)}
        loading={form.creating}
      />

      <EquipmentFormModal
        open={specsRecord !== null}
        mode="edit"
        title="Edit Room Specs"
        fields={ROOM_SPECS_FIELDS.filter((f) => f.inEdit !== false)}
        initialValues={specsRecord ?? undefined}
        onSubmit={handleSpecsSubmit}
        onCancel={() => setSpecsRecord(null)}
        loading={form.updating}
      />
    </>
  );
}
