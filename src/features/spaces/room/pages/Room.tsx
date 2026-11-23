import { nullableNumber, ownershipPayload } from '../../../../shared/utils/resourceReferences.ts';
import { useOwnershipFields } from "@/features/lab-equipment/shared/hooks/useOwnershipFields";
import { roomDetailsPayload } from "../mapper";
import { useMemo, useState } from "react";
import { WorkbookImportButton } from "@/features/data-import";
import { skipToken } from "@reduxjs/toolkit/query";
import { useGetRoomHistoryQuery } from "../api";
import {
  EquipmentPageLayout,
  EquipmentFormModal,
  GuardedDeleteModal,
  createActionsRenderer,
  printDeviceLabel,
  type GuardedDeleteInitialMode,
} from "@/features/lab-equipment/shared";
import type { IRoom, IRoomPayload } from "../types";
import SpaceOverview from "../../shared/SpaceOverview";
import { roomLocationIds } from "../roomFilters";
import { useRoomLocationOptions } from "../hooks/useRoomLocationOptions";
import { useRoomTable } from "../hooks/useRoomTable";
import { useRoomForm } from "../hooks/useRoomForm";
import { buildRoomColumns, buildRoomFormFields, toRoomFormValues } from "../columns/roomColumns";
import { usePermission } from '@/features/auth/hooks/useCan';

/** Form values → the room write payload. The SKU is never sent on edit: it cannot change after creation. */
const toRoomUpdatePayload = (values: Record<string, unknown>): IRoomPayload & Record<string, unknown> => ({
  name: String(values.name ?? ""),
  label: String(values.label ?? ""),
  remark: values.remark == null ? "" : String(values.remark),
  location: String(values.location ?? ""),
  floor: String(values.floor ?? ""),
  rows: nullableNumber(values.rows),
  cols: nullableNumber(values.cols),
  length: nullableNumber(values.length),
  width: nullableNumber(values.width),
  country: nullableNumber(values.country),
  city: nullableNumber(values.city),
  building: nullableNumber(values.building),
  max_power: nullableNumber(values.max_power),
});

export default function RoomPage() {
  const canManageLabOperations = usePermission("lab_operations.manage");

  const table = useRoomTable();
  const form = useRoomForm();

  const [createOpen, setCreateOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<IRoom | null>(null);
  const [deleteModal, setDeleteModal] = useState<{ item: IRoom; mode: GuardedDeleteInitialMode } | null>(null);
  const [historyId, setHistoryId] = useState<number | null>(null);
  const [historyPage, setHistoryPage] = useState(1);
  const [historyPageSize, setHistoryPageSize] = useState(10);

  const { data: historyData, isFetching: historyLoading } = useGetRoomHistoryQuery(
    historyId === null ? skipToken : { id: historyId, page: historyPage, pageSize: historyPageSize },
  );

  const formOpen = createOpen || editingRoom !== null;
  const ownership = useOwnershipFields(formOpen, editingRoom);
  const [formLocation, setFormLocation] = useState(() => roomLocationIds({}));
  const locationOptions = useRoomLocationOptions(formLocation, formOpen, editingRoom?.location_info ?? undefined);
  const formFields = [
    ...buildRoomFormFields(locationOptions),
    ...ownership.fields,
  ];
  const handleFormValues = (values: Record<string, unknown>) => {
    ownership.setDepartmentId(values.department_id);
    setFormLocation(roomLocationIds(values));
  };
  const editValues = useMemo(() => (editingRoom ? toRoomFormValues(editingRoom) : undefined), [editingRoom]);

  const actionsRenderer = createActionsRenderer<IRoom>({
    canManageLabOperations,
    deleting: form.deleting || form.forceDeleting,
    onEdit: (id) => setEditingRoom(table.rows.find((room) => room.id === id) ?? null),
    onDelete: (_id, record) => setDeleteModal({ item: record, mode: 'standard' }),
    onHistory: (id) => {
      setHistoryPage(1);
      setHistoryPageSize(10);
      setHistoryId(id);
    },
    onPrint: printDeviceLabel,
  });

  const columns = buildRoomColumns({
    activeFilters: table.filters,
    locationOptions: table.locationOptions,
    ownerFilters: table.ownerFilters,
    actionsRenderer,
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
        showCreate={canManageLabOperations}
        createLabel="New Room"
        onCreate={() => setCreateOpen(true)}
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
        searchPlaceholder="Search by SKU, name, or label"
      />

      <EquipmentFormModal
        open={createOpen}
        mode="create"
        title="New Room"
        professionalForm
        fields={formFields}
        onValuesChange={handleFormValues}
        onSubmit={async (values, imageFile) => {
          await form.createFromValues(values, imageFile);
          setCreateOpen(false);
        }}
        onCancel={() => setCreateOpen(false)}
        loading={form.creating}
      />

      <EquipmentFormModal
        open={editingRoom !== null}
        mode="edit"
        title={editingRoom ? `Edit Room ${editingRoom.sku}` : "Edit Room"}
        professionalForm
        fields={formFields}
        onValuesChange={handleFormValues}
        initialValues={editValues}
        onSubmit={async (values, imageFile) => {
          if (!editingRoom) return;
          await form.updateInline(editingRoom.id, {
            ...toRoomUpdatePayload(values),
            ...ownershipPayload(values, editingRoom),
            ...roomDetailsPayload(values, editingRoom),
          });
          await form.syncSlots(editingRoom.id, values);
          if (imageFile) await form.updateImage(editingRoom.id, imageFile);
          else if (imageFile === null) await form.removeImage(editingRoom.id);
          setEditingRoom(null);
        }}
        onCancel={() => setEditingRoom(null)}
        loading={form.updating}
      />

      <GuardedDeleteModal
        key={deleteModal ? `${deleteModal.item.id}-${deleteModal.mode}` : 'closed'}
        open={deleteModal !== null}
        resourceKind="room"
        item={deleteModal?.item ?? null}
        initialMode={deleteModal?.mode ?? 'standard'}
        deleting={form.deleting}
        forceDeleting={form.forceDeleting}
        onCancel={() => setDeleteModal(null)}
        onConfirm={(id) => form.tryDeleteById(id, deleteModal?.item)}
        onForceDelete={(id, reason) => form.forceDeleteById(id, reason, deleteModal?.item)}
      />
    </>
  );
}
