import { useLabsStationsOptionsRetrieveQuery } from "@/shared/api/generated/api";
import { useCallback, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import type { RootState } from "@/app/store";
import {
  EquipmentPageLayout,
  EquipmentFormModal,
  createActionsRenderer,
  printDeviceLabel,
} from "@/features/lab-equipment/shared";
import type { FieldConfig } from "@/features/lab-equipment/shared";
import type { IBench, IBenchPayload } from "../types";
import SpaceOverview from "../../shared/SpaceOverview";
import { useGetBenchGroupsQuery, useGetBenchFiltersQuery } from "../api";
import { useBenchTable } from "../hooks/useBenchTable";
import { useBenchForm } from "../hooks/useBenchForm";
import { buildBenchColumns } from "../columns/benchColumns";
import { facetToAntdFilters, getFacetOptions } from "@/features/lab-equipment/shared/facets/filterFacets";

const isAdminGroupMap = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

export default function BenchPage() {
  const permissionGroups = useSelector((state: RootState) => state.me.permissionGroups);
  const isAdmin =
    isAdminGroupMap(permissionGroups) && ("admin" in permissionGroups || "lab-coordinator" in permissionGroups);

  const table = useBenchTable();
  const form = useBenchForm();

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editingBench, setEditingBench] = useState<IBench | null>(null);

  const { data: benchGroups } = useGetBenchGroupsQuery();
  const { data: facets } = useGetBenchFiltersQuery();

  const { data: stationOptionsData } = useLabsStationsOptionsRetrieveQuery({});
  const stationOptions = useMemo(
    () => (stationOptionsData?.data ?? []).map((s) => ({ label: s.name || s.sku, value: s.id })),
    [stationOptionsData],
  );

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
  const typeFilters = useMemo(() => facetFilters(['type', 'type_id', 'bench_type']), [facetFilters]);
  const locationFilters = useMemo(() => facetFilters(['setup_location', 'setup_location_id', 'location', 'room']), [facetFilters]);
  const ownerFilters = useMemo(() => facetFilters(['owner', 'owner_id', 'primary_owner']), [facetFilters]);
  const statusFilters = useMemo(() => facetFilters(['status', 'status_type']), [facetFilters]);

  const formFields: FieldConfig[] = useMemo(
    () => [
      { name: "sku", label: "SKU", type: "text", required: true },
      { name: "name", label: "Name", type: "text", required: true },
      { name: "bench_group_id", label: "Bench Group", type: "select", options: groupOptions },
      { name: "setup_location_id", label: "Station", type: "select", options: stationOptions },
      { name: "remark", label: "Remark", type: "textarea" },
      { name: "image", label: "Image", type: "image" as const },
    ],
    [groupOptions, stationOptions],
  );

  const actionsRenderer = createActionsRenderer<IBench>({
    isAdmin,
    onEdit: (id) => setEditingBench(table.rows.find((bench) => bench.id === id) ?? null),
    deleting: form.deleting,
    onDelete: form.deleteById,
    onPrint: (item) => printDeviceLabel({ sku: item.sku, name: item.name }),
  });

  const columns = buildBenchColumns({
    isAdmin,
    activeFilters: table.filters,
    groupFilters,
    typeFilters,
    locationFilters,
    ownerFilters,
    statusFilters,
    actionsRenderer,
  });

  return (
    <>
      <EquipmentPageLayout<IBench>
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
        showCreate={isAdmin}
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
        initialValues={editingBench ? {
          ...editingBench,
          bench_group_id: editingBench.bench_group?.id,
          setup_location_id: editingBench.setup_location_id ?? editingBench.station?.id,
        } : undefined}
        onSubmit={async (values, imageFile) => {
          if (!editingBench) return;
          const payload: IBenchPayload = {
            sku: String(values.sku ?? ''),
            name: String(values.name ?? ''),
            bench_group_id: values.bench_group_id == null ? null : Number(values.bench_group_id),
            remark: values.remark == null ? (editingBench.remark ?? "") : String(values.remark),
          };
          const nextStation = values.setup_location_id == null ? null : Number(values.setup_location_id);
          const currentStation = editingBench.setup_location_id ?? editingBench.station?.id ?? null;
          if (nextStation !== currentStation) {
            // The old slot belongs to the old station, so moving or clearing the station clears it.
            payload.setup_location_id = nextStation;
            payload.station_slot_id = null;
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
    </>
  );
}
