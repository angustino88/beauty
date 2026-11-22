import { useLabsBenchTypesOptionsRetrieveQuery, useLabsStationsOptionsRetrieveQuery, useLabsStationsSlotsRetrieveByStationIdQuery } from "@/shared/api/generated/api";
import { WorkbookImportButton } from "@/features/data-import";
import { useGetUsersQuery } from "@/features/lab-equipment/shared";
import { toResourceOption } from "@/components/inputs/ResourceOption";
import { useCallback, useMemo, useState } from "react";
import { skipToken } from "@reduxjs/toolkit/query";
import {
  EquipmentPageLayout,
  EquipmentFormModal,
  GuardedDeleteModal,
  createActionsRenderer,
  printDeviceLabel,
  type GuardedDeleteInitialMode,
} from "@/features/lab-equipment/shared";
import type { FieldConfig } from "@/features/lab-equipment/shared";
import type { IBench, IBenchPayload } from "../types";
import SpaceOverview from "../../shared/SpaceOverview";
import { useGetBenchGroupsQuery, useGetBenchFiltersQuery } from "../api";
import { useBenchTable } from "../hooks/useBenchTable";
import { useBenchForm } from "../hooks/useBenchForm";
import { buildBenchColumns } from "../columns/benchColumns";
import { facetToAntdFilters, getFacetOptions } from "@/features/lab-equipment/shared/facets/filterFacets";
import { usePermission } from '@/features/auth/hooks/useCan';
import { useGetBenchMappingQuery } from "@/features/spaces/mapping/api";
import { EquipmentAssignmentModal } from "@/features/spaces/mapping/components/modals/EquipmentAssignmentModal";

export default function BenchPage() {
  const canManageLabOperations = usePermission("lab_operations.manage");

  const table = useBenchTable();
  const form = useBenchForm();

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editingBench, setEditingBench] = useState<IBench | null>(null);
  const [deleteModal, setDeleteModal] = useState<{ item: IBench; mode: GuardedDeleteInitialMode } | null>(null);
  const [managingBench, setManagingBench] = useState<IBench | null>(null);

  const { data: managingMappingRow, refetch: refetchManagingMapping } = useGetBenchMappingQuery(
    managingBench ? managingBench.id : skipToken,
  );

  const { data: benchGroups } = useGetBenchGroupsQuery();
  const { data: facets } = useGetBenchFiltersQuery();

  const { data: stationOptionsData } = useLabsStationsOptionsRetrieveQuery({});
  const stationOptions = useMemo(
    () => (stationOptionsData?.data ?? []).map((station) => toResourceOption(station)),
    [stationOptionsData],
  );

  // The slot list follows the station chosen in whichever form is open.
  const [formStationId, setFormStationId] = useState<number | null>(null);
  const { data: slotsData, isFetching: slotsLoading, isSuccess: slotsLoaded } = useLabsStationsSlotsRetrieveByStationIdQuery(
    formStationId == null ? skipToken : { stationId: formStationId, pageSize: 100 },
  );
  const slotOptions = useMemo(
    () => (slotsData?.data ?? [])
      .filter((slot) => slot.is_active !== false)
      .map((slot) => toResourceOption({ id: slot.id, sku: slot.slot_code, name: slot.label })),
    [slotsData],
  );
  // Why the slot list is empty, in words the user can act on.
  const slotsHint = formStationId == null || !slotsLoaded
    ? undefined
    : (slotsData?.data ?? []).length === 0
      ? "This station has no bench slots yet. Edit the station, set its Bench Capacity and save: slots S1, S2, … are created."
      : slotOptions.length === 0
        ? "All slots of this station are out of service."
        : undefined;
  const handleFormValues = useCallback((values: Record<string, unknown>) => {
    setFormStationId(values.setup_location_id == null || values.setup_location_id === '' ? null : Number(values.setup_location_id));
  }, []);

  const groupOptions = useMemo(() => {
    return (benchGroups ?? []).map((g) => ({
      label: g.name,
      value: g.id,
    }));
  }, [benchGroups]);

  const facetFilters = useCallback((keys: string[], fallback?: Array<{ text: string; value: string }>) =>
    facetToAntdFilters(getFacetOptions(facets, ...keys))?.map(({ text, value }) => ({
      text: String(text),
      value: String(value),
    })) ?? fallback ?? [], [facets]);
  const groupFallback = useMemo(() => (benchGroups ?? []).map((group) => ({ text: group.name, value: String(group.id) })), [benchGroups]);
  const groupFilters = useMemo(() => facetFilters(['bench_group', 'bench_group_id', 'group'], groupFallback), [facetFilters, groupFallback]);
  // ID-valued filters ship no choices in `/filters` (only an options_key), so list them from the selectors.
  const { data: benchTypeOptions } = useLabsBenchTypesOptionsRetrieveQuery({});
  const { data: users } = useGetUsersQuery();
  const typeFallback = useMemo(() => (benchTypeOptions?.data ?? []).map((t) => ({ text: String(t.name || t.sku || t.id), value: String(t.id) })), [benchTypeOptions]);
  const stationFallback = useMemo(() => stationOptions.map((s) => ({ text: s.selectedLabel, value: String(s.value) })), [stationOptions]);
  const ownerFallback = useMemo(() => (users ?? []).map((u) => ({ text: u.display_name || u.username || String(u.id), value: String(u.id) })), [users]);
  const typeFilters = useMemo(() => facetFilters(['type', 'type_id', 'bench_type'], typeFallback), [facetFilters, typeFallback]);
  const locationFilters = useMemo(() => facetFilters(['setup_location', 'setup_location_id', 'location', 'room'], stationFallback), [facetFilters, stationFallback]);
  const ownerFilters = useMemo(() => facetFilters(['owner', 'owner_id', 'primary_owner'], ownerFallback), [facetFilters, ownerFallback]);

  const formFields: FieldConfig[] = useMemo(
    () => [
      // The SKU identifies the bench and cannot change after creation (the API refuses a changed SKU).
      { name: "sku", label: "SKU", type: "text", required: true, disabledInEdit: true },
      { name: "name", label: "Name", type: "text", required: true },
      { name: "bench_group_id", label: "Bench Group", type: "select", options: groupOptions },
      { name: "setup_location_id", label: "Station", type: "select", options: stationOptions },
      {
        name: "station_slot_id",
        label: "Station Slot",
        type: "select",
        dependsOn: ["setup_location_id"],
        options: slotOptions,
        loading: slotsLoading,
        placeholder: formStationId == null ? "Select a station first" : "Select a slot (optional)",
        searchHint: slotsHint,
        help: slotsHint && !slotsLoading ? slotsHint : undefined,
      },
      { name: "remark", label: "Remark", type: "textarea" },
      { name: "image", label: "Image", type: "image" as const },
    ],
    [groupOptions, stationOptions, slotOptions, formStationId, slotsLoading, slotsHint],
  );

  const actionsRenderer = createActionsRenderer<IBench>({
    canManageLabOperations,
    onEdit: (id) => setEditingBench(table.rows.find((bench) => bench.id === id) ?? null),
    deleting: form.deleting || form.forceDeleting,
    onDelete: (_id, record) => setDeleteModal({ item: record, mode: 'standard' }),
    onForceDelete: (record) => setDeleteModal({ item: record, mode: 'force' }),
    onPrint: (item) => printDeviceLabel({ sku: item.sku, name: item.name }),
  });

  const columns = buildBenchColumns({
    canManageLabOperations,
    activeFilters: table.filters,
    groupFilters,
    typeFilters,
    locationFilters,
    ownerFilters,
    actionsRenderer,
    onManageEquipment: (bench) => setManagingBench(bench),
  });

  const fallbackMappingRow = useMemo(() => {
    if (!managingBench) return null;
    return {
      id: managingBench.id,
      bench: {
        id: managingBench.id,
        sku: managingBench.sku,
        name: managingBench.name,
        setup_location_id: managingBench.setup_location_id ?? null,
        station_slot_id: managingBench.station_slot_id ?? null,
      },
      station: managingBench.station ?? null,
      station_slot: null,
      room: managingBench.room ?? null,
      room_slot: null,
      equipment: [],
      licenses: [],
      status: {
        state: "needs_equipment" as const,
        is_fully_mapped: false,
        has_room: Boolean(managingBench.room),
        has_station: Boolean(managingBench.station),
        equipment_count: managingBench.equipment_count ?? 0,
        license_count: 0,
      },
    };
  }, [managingBench]);

  return (
    <>
      <EquipmentPageLayout<IBench>
        extraControls={<WorkbookImportButton />}
        professionalTable
        spaceKind="bench"
        title="Benches"
        description="Find benches by location, group, and assigned equipment."
        equipmentType="bench"
        customSummary={<SpaceOverview kind="bench" />}
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
        createLabel="New Bench"
        onCreate={() => setCreateModalOpen(true)}
        scrollX={1600}
        searchPlaceholder="Search by SKU, Name..."
      />

      <EquipmentFormModal
        open={createModalOpen}
        mode="create"
        title="New Bench"
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
        open={editingBench !== null}
        mode="edit"
        title="Edit Bench"
        fields={formFields}
        onValuesChange={handleFormValues}
        initialValues={editingBench ? {
          ...editingBench,
          bench_group_id: editingBench.bench_group?.id,
          setup_location_id: editingBench.setup_location_id ?? editingBench.station?.id,
          station_slot_id: editingBench.station_slot_id,
        } : undefined}
        onSubmit={async (values, imageFile) => {
          if (!editingBench) return;
          const payload: IBenchPayload = {
            name: String(values.name ?? ''),
            bench_group_id: values.bench_group_id == null ? null : Number(values.bench_group_id),
            remark: values.remark == null ? (editingBench.remark ?? "") : String(values.remark),
          };
          const nextStation = values.setup_location_id == null ? null : Number(values.setup_location_id);
          const currentStation = editingBench.setup_location_id ?? editingBench.station?.id ?? null;
          const nextSlot = nextStation == null || values.station_slot_id == null ? null : Number(values.station_slot_id);
          if (nextStation !== currentStation || nextSlot !== (editingBench.station_slot_id ?? null)) {
            // Station and slot are written together: a slot always belongs to the station sent with it.
            payload.setup_location_id = nextStation;
            payload.station_slot_id = nextSlot;
          }
          await form.updateInline(editingBench.id, payload);
          if (imageFile) await form.updateImage(editingBench.id, imageFile);
          else if (imageFile === null) await form.removeImage(editingBench.id);
          setEditingBench(null);
          void table.refetch();
        }}
        onCancel={() => setEditingBench(null)}
        loading={form.updating}
      />

      <GuardedDeleteModal
        key={deleteModal ? `${deleteModal.item.id}-${deleteModal.mode}` : 'closed'}
        open={deleteModal !== null}
        resourceKind="bench"
        item={deleteModal?.item ?? null}
        initialMode={deleteModal?.mode ?? 'standard'}
        deleting={form.deleting}
        forceDeleting={form.forceDeleting}
        onCancel={() => setDeleteModal(null)}
        onConfirm={(id) => form.tryDeleteById(id, deleteModal?.item)}
        onForceDelete={(id, reason) => form.forceDeleteById(id, reason, deleteModal?.item)}
        onManageEquipment={
          canManageLabOperations && deleteModal
            ? () => setManagingBench(deleteModal.item)
            : undefined
        }
      />

      <EquipmentAssignmentModal
        open={managingBench !== null}
        row={managingMappingRow ?? fallbackMappingRow}
        onClose={() => setManagingBench(null)}
        onSuccess={() => {
          void refetchManagingMapping();
          void table.refetch();
        }}
      />
    </>
  );
}
