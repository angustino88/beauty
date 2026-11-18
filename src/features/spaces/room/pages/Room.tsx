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
  printDeviceLabel,
} from "@/features/lab-equipment/shared";
import type { IRoom, IRoomPayload } from "../types";
import SpaceOverview from "../../shared/SpaceOverview";
import { useRoomTable } from "../hooks/useRoomTable";
import { useRoomForm } from "../hooks/useRoomForm";
import { buildRoomColumns, buildRoomFormFields, toRoomFormValues } from "../columns/roomColumns";

const isAdminGroupMap = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const nullableNumber = (value: unknown): number | null =>
  value == null || value === "" || Number.isNaN(Number(value)) ? null : Number(value);

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
  primary_owner: nullableNumber(values.primary_owner),
});

export default function RoomPage() {
  const permissionGroups = useSelector(
    (state: RootState) => state.me.permissionGroups,
  );
  const isAdmin =
    isAdminGroupMap(permissionGroups) && ("admin" in permissionGroups || "lab-coordinator" in permissionGroups);

  const table = useRoomTable();
  const form = useRoomForm();

  const [createOpen, setCreateOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<IRoom | null>(null);
  const [historyId, setHistoryId] = useState<number | null>(null);
  const [historyPage, setHistoryPage] = useState(1);
  const [historyPageSize, setHistoryPageSize] = useState(10);

  const { data: historyData, isFetching: historyLoading } = useGetRoomHistoryQuery(
    historyId === null ? skipToken : { id: historyId, page: historyPage, pageSize: historyPageSize },
  );

  const formFields = useMemo(() => buildRoomFormFields(table.optionsMap), [table.optionsMap]);
  const editValues = useMemo(() => (editingRoom ? toRoomFormValues(editingRoom) : undefined), [editingRoom]);

  const actionsRenderer = createActionsRenderer<IRoom>({
    isAdmin,
    deleting: form.deleting,
    onEdit: (id) => setEditingRoom(table.rows.find((room) => room.id === id) ?? null),
    onDelete: form.deleteById,
    onHistory: (id) => {
      setHistoryPage(1);
      setHistoryPageSize(10);
      setHistoryId(id);
    },
    onPrint: printDeviceLabel,
  });

  const columns = buildRoomColumns({
    activeFilters: table.filters,
    filtersMap: table.filtersMap,
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
        showCreate={isAdmin}
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
        searchPlaceholder="Search by SKU, Name, Location, Country, etc."
        detailValueLabels={{
          Country: Object.fromEntries(
            (table.optionsMap.country ?? []).map((option) => [String(option.value), option.label]),
          ),
        }}
      />

      <EquipmentFormModal
        open={createOpen}
        mode="create"
        title="New Room"
        professionalForm
        fields={formFields}
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
        initialValues={editValues}
        onSubmit={async (values, imageFile) => {
          if (!editingRoom) return;
          await form.updateInline(editingRoom.id, toRoomUpdatePayload(values));
          await form.syncSlots(editingRoom.id, values);
          if (imageFile) await form.updateImage(editingRoom.id, imageFile);
          else if (imageFile === null) await form.removeImage(editingRoom.id);
          setEditingRoom(null);
        }}
        onCancel={() => setEditingRoom(null)}
        loading={form.updating}
      />
    </>
  );
}
