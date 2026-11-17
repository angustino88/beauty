import { useGetUsersQuery } from "@/features/lab-equipment/shared";
import { WorkbookImportButton } from "@/features/data-import";
import { toResourceOption } from "@/components/inputs/ResourceOption";
import { useCallback, useMemo, useState } from "react";
import { skipToken } from "@reduxjs/toolkit/query";
import { useLabsRoomsSlotsRetrieveByRoomIdQuery } from "@/shared/api/generated/api";
import { useSelector } from "react-redux";
import type { RootState } from "@/app/store";
import {
  EquipmentPageLayout,
  EquipmentFormModal,
  createActionsRenderer,
  printDeviceLabel,
} from "@/features/lab-equipment/shared";
import type { FieldConfig } from "@/features/lab-equipment/shared";
import type { IStation, IStationPayload } from "../types";
import SpaceOverview from "../../shared/SpaceOverview";
import { useGetStationHistoryQuery, useGetStationDropdownQuery, useGetStationFiltersQuery } from "../api";
import { useStationTable } from "../hooks/useStationTable";
import { useStationForm } from "../hooks/useStationForm";
import { buildStationColumns } from "../columns/stationColumns";
import { facetToAntdFilters, getFacetOptions } from "@/features/lab-equipment/shared/facets/filterFacets";

const isAdminGroupMap = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

export default function StationPage() {
  const permissionGroups = useSelector((state: RootState) => state.me.permissionGroups);
  const isAdmin =
    isAdminGroupMap(permissionGroups) && ("admin" in permissionGroups || "lab-coordinator" in permissionGroups);

  const table = useStationTable();
  const form = useStationForm();

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editingStation, setEditingStation] = useState<IStation | null>(null);
  const [historyId, setHistoryId] = useState<number | null>(null);
  const [historyPage, setHistoryPage] = useState(1);
  const [historyPageSize, setHistoryPageSize] = useState(10);

  const { data: historyData, isFetching: historyLoading } = useGetStationHistoryQuery(
    historyId === null ? skipToken : { id: historyId, page: historyPage, pageSize: historyPageSize },
  );
  const { data: dropdownData } = useGetStationDropdownQuery();
  const { data: facets } = useGetStationFiltersQuery();

  const roomOptions = useMemo(() => {
    return (dropdownData?.rooms ?? []).map((room) => toResourceOption(room));
  }, [dropdownData?.rooms]);

  // The slot list follows the room chosen in whichever form is open; occupied slots are hidden
  // except the one this station already holds.
  const [formRoomId, setFormRoomId] = useState<number | null>(null);
  const [formSlotId, setFormSlotId] = useState<number | null>(null);
  // Slots arrive 100 per page; read up to three pages so large rooms stay selectable.
  const roomSlotsPage1 = useLabsRoomsSlotsRetrieveByRoomIdQuery(
    formRoomId == null ? skipToken : { roomId: formRoomId, pageSize: 100, page: 1 },
    // Slots can be generated from the Rooms page at any time; never trust an older cached list.
    { refetchOnMountOrArgChange: true },
  );
  const roomSlotsPage2 = useLabsRoomsSlotsRetrieveByRoomIdQuery(
    formRoomId == null || !roomSlotsPage1.data?.meta.pagination.next ? skipToken : { roomId: formRoomId, pageSize: 100, page: 2 },
  );
  const roomSlotsPage3 = useLabsRoomsSlotsRetrieveByRoomIdQuery(
    formRoomId == null || !roomSlotsPage2.data?.meta.pagination.next ? skipToken : { roomId: formRoomId, pageSize: 100, page: 3 },
  );
  const roomSlots = useMemo(
    () => [roomSlotsPage1.data, roomSlotsPage2.data, roomSlotsPage3.data].flatMap((page) => page?.data ?? []),
    [roomSlotsPage1.data, roomSlotsPage2.data, roomSlotsPage3.data],
  );
  const currentSlotId = editingStation?.slot_id ?? null;
  const slotOptions = useMemo(
    () => roomSlots
      .filter((slot) => !slot.is_occupied || slot.id === currentSlotId || slot.id === formSlotId)
      .map((slot) => ({ label: slot.slot_code, value: slot.id })),
    [roomSlots, currentSlotId, formSlotId],
  );
  // Why the slot list is empty, in words the user can act on.
  const roomSlotsHint = formRoomId == null || !roomSlotsPage1.isSuccess
    ? undefined
    : roomSlots.length === 0
      ? "This room has no slots yet. Edit the room, set its layout (rows × columns) and save: one slot is created per cell."
      : slotOptions.length === 0
        ? "Every slot in this room already holds a station. Enlarge the room layout or move a station."
        : undefined;
  const handleFormValues = useCallback((values: Record<string, unknown>) => {
    setFormRoomId(values.room_id == null || values.room_id === '' ? null : Number(values.room_id));
    setFormSlotId(values.slot_id == null || values.slot_id === '' ? null : Number(values.slot_id));
  }, []);

  const roomFallback = useMemo(() => (dropdownData?.rooms ?? []).map((room) => ({
    text: room.name,
    value: String(room.id),
  })), [dropdownData?.rooms]);
  const roomFilters = useMemo(() => facetToAntdFilters(getFacetOptions(facets, 'room', 'room_id'))?.map(({ text, value }) => ({ text, value: String(value) })) ?? roomFallback, [facets, roomFallback]);
  const { data: users } = useGetUsersQuery();
  const ownerFallback = useMemo(() => (users ?? []).map((u) => ({ text: u.display_name || u.username || String(u.id), value: String(u.id) })), [users]);
  const ownerFilters = useMemo(() => facetToAntdFilters(getFacetOptions(facets, 'owner', 'owner_id', 'primary_owner'))?.map(({ text, value }) => ({ text, value: String(value) })) ?? ownerFallback, [facets, ownerFallback]);
  const statusFilters = useMemo(() => facetToAntdFilters(getFacetOptions(facets, 'status', 'status_type'))?.map(({ text, value }) => ({ text, value: String(value) })) ?? [], [facets]);

  const formFields: FieldConfig[] = useMemo(
    () => [
      // The SKU identifies the station and cannot change after creation (the API refuses a changed SKU).
      { name: "sku", label: "SKU", type: "text", required: true, disabledInEdit: true },
      { name: "name", label: "Name", type: "text", required: true },
      { name: "room_id", label: "Target Room", type: "select", options: roomOptions },
      {
        name: "slot_id",
        label: "Room Slot",
        type: "select",
        dependsOn: ["room_id"],
        options: slotOptions,
        loading: roomSlotsPage1.isFetching,
        placeholder: formRoomId == null ? "Select a room first" : "Select a slot (optional)",
        searchHint: roomSlotsHint,
        help: roomSlotsHint && !roomSlotsPage1.isFetching ? roomSlotsHint : undefined,
      },
      { name: "height_mm", label: "Height (mm)", type: "number" },
      { name: "width_mm", label: "Width (mm)", type: "number" },
      { name: "depth_mm", label: "Depth (mm)", type: "number" },
      { name: "power_capacity_w", label: "Power Capacity (W)", type: "number" },
      { name: "max_load_kg", label: "Max Load (kg)", type: "number" },
      { name: "network_port_capacity", label: "Network Ports", type: "number" },
      {
        name: "bench_capacity",
        label: "Bench Capacity",
        type: "number",
        help: "How many benches the station holds. Saving creates the bench slots S1, S2, … that benches are placed on.",
      },
      { name: "label", label: "Position Label", type: "text" },
      { name: "remark", label: "Remark", type: "textarea" },
      { name: "image", label: "Image", type: "image" as const },
    ],
    [roomOptions, slotOptions, formRoomId, roomSlotsPage1.isFetching, roomSlotsHint],
  );

  const actionsRenderer = createActionsRenderer<IStation>({
    isAdmin,
    onEdit: (id) => setEditingStation(table.rows.find((station) => station.id === id) ?? null),
    deleting: form.deleting,
    onDelete: form.deleteById,
    onHistory: (id) => {
      setHistoryPage(1);
      setHistoryPageSize(10);
      setHistoryId(id);
    },
    onPrint: printDeviceLabel,
  });

  const columns = buildStationColumns({
    isAdmin,
    activeFilters: table.filters,
    roomFilters,
    ownerFilters,
    statusFilters,
    actionsRenderer,
  });

  return (
    <>
      <EquipmentPageLayout<IStation>
        extraControls={<WorkbookImportButton />}
        professionalTable
        spaceKind="station"
        title="Stations"
        description="Track stations, their rooms, and their capacity."
        equipmentType="station"
        customSummary={<SpaceOverview kind="station" />}
        columns={columns}
        rows={table.rows}
        totalRecords={table.totalRecords}
        loading={table.isFetching}
        onRefetch={table.refetch}
        page={table.page}
        pageSize={table.pageSize}
        onPageChange={(p, ps) => {
          table.setPage(p);
          table.setPageSize(ps);
        }}
        search={table.search}
        onSearchChange={table.setSearch}
        filters={table.filters}
        onFiltersChange={table.setFilters as (filters: Record<string, import("react").Key[] | null>) => void}
        showCreate={isAdmin}
        createLabel="New Station"
        onCreate={() => setCreateModalOpen(true)}
        scrollX={1800}
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
        searchPlaceholder="Search by SKU, Name, Room..."
      />

      <EquipmentFormModal
        open={createModalOpen}
        mode="create"
        title="New Station"
        fields={formFields}
        onValuesChange={handleFormValues}
        onSubmit={async (values, imageFile) => {
          await form.createFromValues(values, imageFile);
          setCreateModalOpen(false);
          void table.refetch();
        }}
        onCancel={() => setCreateModalOpen(false)}
        loading={form.creating}
      />
      <EquipmentFormModal
        open={editingStation !== null}
        mode="edit"
        title="Edit Station"
        fields={formFields}
        onValuesChange={handleFormValues}
        initialValues={editingStation ? {
          ...editingStation,
          room_id: editingStation.room?.id ?? editingStation.room_id,
        } : undefined}
        onSubmit={async (values, imageFile) => {
          if (!editingStation) return;
          const payload: IStationPayload = {
            name: String(values.name ?? ''),
            room_id: values.room_id == null ? null : Number(values.room_id),
            slot_id: values.room_id == null || values.slot_id == null ? null : Number(values.slot_id),
            height_mm: values.height_mm == null ? null : Number(values.height_mm),
            width_mm: values.width_mm == null ? null : Number(values.width_mm),
            depth_mm: values.depth_mm == null ? null : Number(values.depth_mm),
            power_capacity_w: values.power_capacity_w == null ? null : Number(values.power_capacity_w),
            max_load_kg: values.max_load_kg == null ? null : Number(values.max_load_kg),
            network_port_capacity: values.network_port_capacity == null ? null : Number(values.network_port_capacity),
            bench_capacity: values.bench_capacity == null || values.bench_capacity === '' ? null : Number(values.bench_capacity),
            label: String(values.label ?? ''),
            remark: values.remark == null ? (editingStation.remark ?? "") : String(values.remark),
          };
          await form.updateInline(editingStation.id, payload);
          await form.syncSlots(editingStation.id, values.bench_capacity);
          if (imageFile) await form.updateImage(editingStation.id, imageFile);
          else if (imageFile === null) await form.removeImage(editingStation.id);
          setEditingStation(null);
          void table.refetch();
        }}
        onCancel={() => setEditingStation(null)}
        loading={form.updating}
      />
    </>
  );
}
