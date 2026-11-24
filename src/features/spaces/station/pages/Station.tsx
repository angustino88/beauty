import { useGetUsersQuery } from "@/features/lab-equipment/shared";
import { WorkbookImportButton } from "@/features/data-import";
import { toResourceOption } from "@/components/inputs/ResourceOption";
import { useMemo, useState } from "react";
import { skipToken } from "@reduxjs/toolkit/query";
import { useLabsRoomsSlotsRetrieveByRoomIdQuery, useLabsStationTypesOptionsRetrieveQuery } from "@/shared/api/generated/api";
import {
  EquipmentPageLayout,
  EquipmentFormModal,
  GuardedDeleteModal,
  createActionsRenderer,
  printDeviceLabel,
  type GuardedDeleteInitialMode,
} from "@/features/lab-equipment/shared";
import type { FieldConfig } from "@/features/lab-equipment/shared";
import { STATION_DETAILS, detailPayload, editableDetails, singleFilterId } from "../../shared/resourceForm";
import { changedReference, ownershipFormValues, ownershipPayload } from '../../../../shared/utils/resourceReferences.ts';
import { referenceOptions, useOwnershipFields } from "@/features/lab-equipment/shared/hooks/useOwnershipFields";
import type { IStation, IStationPayload } from "../types";
import SpaceOverview from "../../shared/SpaceOverview";
import { useGetStationHistoryQuery, useGetStationDropdownQuery, useGetStationFiltersQuery } from "../api";
import { useStationTable } from "../hooks/useStationTable";
import { useStationForm } from "../hooks/useStationForm";
import { buildStationColumns } from "../columns/stationColumns";
import { facetToAntdFilters, getFacetOptions } from "@/features/lab-equipment/shared/facets/filterFacets";
import { usePermission } from '@/features/auth/hooks/useCan';
import { buildRoomSlotOptions, getRoomSlotsHint } from "../../shared/slotOptions";

export default function StationPage() {
  const canManageLabOperations = usePermission("lab_operations.manage");

  const table = useStationTable();
  const form = useStationForm();
  const filteredParentId = singleFilterId(table.filters.room);

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editingStation, setEditingStation] = useState<IStation | null>(null);
  const [deleteModal, setDeleteModal] = useState<{ item: IStation; mode: GuardedDeleteInitialMode } | null>(null);
  const [historyId, setHistoryId] = useState<number | null>(null);
  const [historyPage, setHistoryPage] = useState(1);
  const [historyPageSize, setHistoryPageSize] = useState(10);

  const ownership = useOwnershipFields(createModalOpen || editingStation !== null, editingStation);

  const { data: historyData, isFetching: historyLoading } = useGetStationHistoryQuery(
    historyId === null ? skipToken : { id: historyId, page: historyPage, pageSize: historyPageSize },
  );
  const { data: dropdownData } = useGetStationDropdownQuery();
  const { data: facets } = useGetStationFiltersQuery();

  const roomOptions = useMemo(() => {
    return (dropdownData?.rooms ?? []).map((room) => toResourceOption(room));
  }, [dropdownData?.rooms]);

  // The slot list follows the room chosen in whichever form is open; occupied and blocked slots are
  // disabled with status badges except the slot this station already holds.
  const [formRoomId, setFormRoomId] = useState<number | null>(null);
  // Slots arrive 100 per page; read up to three pages so large rooms stay selectable.
  const roomSlotsPage1 = useLabsRoomsSlotsRetrieveByRoomIdQuery(
    formRoomId == null ? skipToken : { roomId: formRoomId, pageSize: 100, page: 1 },
  );
  const roomSlotsPage2 = useLabsRoomsSlotsRetrieveByRoomIdQuery(
    formRoomId == null || !roomSlotsPage1.currentData?.meta.pagination.next ? skipToken : { roomId: formRoomId, pageSize: 100, page: 2 },
  );
  const roomSlotsPage3 = useLabsRoomsSlotsRetrieveByRoomIdQuery(
    formRoomId == null || !roomSlotsPage2.currentData?.meta.pagination.next ? skipToken : { roomId: formRoomId, pageSize: 100, page: 3 },
  );
  const roomSlots = useMemo(
    () => [roomSlotsPage1.currentData, roomSlotsPage2.currentData, roomSlotsPage3.currentData].flatMap((page) => page?.data ?? []),
    [roomSlotsPage1.currentData, roomSlotsPage2.currentData, roomSlotsPage3.currentData],
  );
  const editingRoomId = editingStation ? (editingStation.room?.id ?? editingStation.room_id ?? null) : null;
  const currentSlotId = editingStation && formRoomId === editingRoomId ? (editingStation.slot_id ?? null) : null;
  const currentSlotLabel = editingStation && formRoomId === editingRoomId ? (editingStation.slot_code ?? null) : null;
  const { classified: classifiedSlots, options: slotOptions } = useMemo(
    () => buildRoomSlotOptions(roomSlots, { currentSlotId, currentSlotLabel }),
    [roomSlots, currentSlotId, currentSlotLabel],
  );
  const roomSlotsHint = getRoomSlotsHint(formRoomId != null, roomSlotsPage1.isSuccess, roomSlots, classifiedSlots);
  const handleFormValues = (values: Record<string, unknown>) => {
    ownership.setDepartmentId(values.department_id);
    setFormRoomId(values.room_id == null || values.room_id === '' ? null : Number(values.room_id));
  };

  const roomFallback = useMemo(() => (dropdownData?.rooms ?? []).map((room) => ({
    text: room.name,
    value: String(room.id),
  })), [dropdownData?.rooms]);
  const roomFilters = useMemo(() => facetToAntdFilters(getFacetOptions(facets, 'room', 'room_id'))?.map(({ text, value }) => ({ text, value: String(value) })) ?? roomFallback, [facets, roomFallback]);
  const { data: users } = useGetUsersQuery();
  const ownerFallback = useMemo(() => (users ?? []).map((u) => ({ text: u.display_name || u.username || String(u.id), value: String(u.id) })), [users]);
  const ownerFilters = useMemo(() => facetToAntdFilters(getFacetOptions(facets, 'owner', 'owner_id', 'primary_owner'))?.map(({ text, value }) => ({ text, value: String(value) })) ?? ownerFallback, [facets, ownerFallback]);

  const [stationTypeSearch, setStationTypeSearch] = useState('');
  const stationTypes = useLabsStationTypesOptionsRetrieveQuery({
    q: stationTypeSearch.trim() || undefined,
    includeIds: editingStation?.station_type ? [editingStation.station_type.id] : undefined,
  }, { skip: !createModalOpen && !editingStation });
  const formFields: FieldConfig[] = [
      // The SKU identifies the station and cannot change after creation (the API refuses a changed SKU).
      { name: "sku", label: "SKU", type: "text", required: true, disabledInEdit: true },
      { name: "name", label: "Name", type: "text", required: true },
      { name: "type_id", span: 24, section: "Classification", apiField: "type", label: "Station Type", type: "select", essential: true,
        options: referenceOptions(stationTypes.currentData?.data, editingStation?.station_type),
        onSearch: setStationTypeSearch, loading: stationTypes.isFetching },
      ...ownership.fields,
      { name: "room_id", section: "Location", essential: true, label: "Room", type: "select", options: roomOptions },
      {
        name: "slot_id", section: "Location",
        label: "Room Slot",
        type: "select",
        dependsOn: ["room_id"],
        options: slotOptions,
        loading: roomSlotsPage1.isFetching,
        placeholder: formRoomId == null ? "Select a room first" : "Select a slot (optional)",
        searchHint: roomSlotsHint,
        help: roomSlotsHint && !roomSlotsPage1.isFetching ? roomSlotsHint : undefined,
      },
      { name: "label", section: "Location", label: "Position Label", type: "text" },
      { name: "width_mm", span: 8, section: "Specifications", label: "Width (mm)", type: "number" },
      { name: "depth_mm", span: 8, section: "Specifications", label: "Depth (mm)", type: "number" },
      { name: "height_mm", span: 8, section: "Specifications", label: "Height (mm)", type: "number" },
      { name: "power_capacity_w", section: "Specifications", label: "Power Capacity (W)", type: "number" },
      { name: "max_load_kg", section: "Specifications", label: "Max Load (kg)", type: "number" },
      { name: "network_port_capacity", section: "Specifications", label: "Network Ports", type: "number" },
      {
        name: "bench_capacity", section: "Specifications",
        label: "Bench Capacity",
        type: "number",
        help: "Saving creates the corresponding bench slots.",
      },
      ...editableDetails(STATION_DETAILS),
      { name: "remark", section: "Notes", label: "Remark", type: "textarea" },
      { name: "image", label: "Image", type: "image" },
  ];

  const actionsRenderer = createActionsRenderer<IStation>({
    canManageLabOperations,
    onEdit: (id) => setEditingStation(table.rows.find((station) => station.id === id) ?? null),
    deleting: form.deleting || form.forceDeleting,
    onDelete: (_id, record) => setDeleteModal({ item: record, mode: 'standard' }),
    onHistory: (id) => {
      setHistoryPage(1);
      setHistoryPageSize(10);
      setHistoryId(id);
    },
    onPrint: printDeviceLabel,
  });

  const columns = buildStationColumns({
    canManageLabOperations,
    activeFilters: table.filters,
    roomFilters,
    ownerFilters,
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
        showCreate={canManageLabOperations}
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
        professionalForm
        open={createModalOpen}
        mode="create"
        title="New Station"
        initialValues={{ room_id: filteredParentId }}
        fields={formFields}
        onValuesChange={handleFormValues}
        onSubmit={async (values, imageFile) => {
          await form.createFromValues(values, imageFile);
          setCreateModalOpen(false);
          setFormRoomId(null);
          void table.refetch();
        }}
        onCancel={() => {
          setCreateModalOpen(false);
          setFormRoomId(null);
        }}
        loading={form.creating}
      />
      <EquipmentFormModal
        professionalForm
        open={editingStation !== null}
        mode="edit"
        title="Edit Station"
        fields={formFields}
        onValuesChange={handleFormValues}
        initialValues={editingStation ? {
          ...editingStation,
          ...ownershipFormValues(editingStation),
          type_id: editingStation.station_type?.id,
          room_id: editingStation.room?.id ?? editingStation.room_id,
        } : undefined}
        onSubmit={async (values, imageFile) => {
          if (!editingStation) return;
          const payload: IStationPayload = {
            ...ownershipPayload(values, editingStation),
            ...detailPayload(STATION_DETAILS, values, { ...editingStation }),
            type_id: changedReference(values.type_id, editingStation.station_type?.id),
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
          setFormRoomId(null);
          void table.refetch();
        }}
        onCancel={() => {
          setEditingStation(null);
          setFormRoomId(null);
        }}
        loading={form.updating}
      />

      <GuardedDeleteModal
        key={deleteModal ? `${deleteModal.item.id}-${deleteModal.mode}` : 'closed'}
        open={deleteModal !== null}
        resourceKind="station"
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
