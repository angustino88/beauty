import { useState, type Key } from "react";
import { Alert, Button, Card, Dropdown, Empty, Segmented, Table } from "antd";
import type { FilterValue } from "antd/es/table/interface";
import {
  AppstoreOutlined,
  ClearOutlined,
  DownloadOutlined,
  LayoutOutlined,
  ReloadOutlined,
  TableOutlined,
} from "@ant-design/icons";
import { useSelector } from "react-redux";
import type { RootState } from "@/app/store";
import { PageHeader } from "@/components/layout/PageHeader";
import { FullTextSearch } from "@/components/inputs/FullTextSearch";
import { TooltipButton } from "@/components/layout/TooltipButton";
import { WorkbookImportButton } from "@/features/data-import";
import { printDeviceLabel, printLabInfoLabel } from "@/features/lab-equipment/shared";
import type { MappingState, ResourceMappingRow, TableFilters } from "../types";
import { useMappingTable } from "../hooks/useMappingTable";
import { useMappingExport } from "../hooks/useMappingExport";
import { buildMappingColumns } from "../columns/mappingColumns";
import { MappingStateTag } from "../columns/mappingColumnRenderers";
import { MappingVisualization } from "../components/MappingVisualization";
import { BenchPlacementModal } from "../components/modals/BenchPlacementModal";
import { EquipmentAssignmentModal } from "../components/modals/EquipmentAssignmentModal";
import tableStyles from "@/features/lab-equipment/shared/components/layout/EquipmentTable.module.css";
import styles from "../columns/MappingTable.module.css";

type MappingViewMode = "table" | "visualization";

const isGroupMap = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const STATE_CARDS: Array<{ state: MappingState; hint: string }> = [
  { state: "fully_mapped", hint: "In a room, on a station, with equipment" },
  { state: "needs_equipment", hint: "Placed, but nothing on the bench" },
  { state: "needs_placement", hint: "No station, or a station without a room" },
];

const printLabels = (row: ResourceMappingRow) => {
  if (row.room) printDeviceLabel({ sku: row.room.sku, name: row.room.name });
  if (row.station) printDeviceLabel({ sku: row.station.sku, name: row.station.name });
  printLabInfoLabel({ sku: row.bench.sku, lab_name: row.bench.name });
  row.equipment.forEach((item) => printDeviceLabel({ sku: item.sku, name: item.name }));
};

export default function MappingPage() {
  const permissionGroups = useSelector((state: RootState) => state.me.permissionGroups);
  const canEdit = isGroupMap(permissionGroups) && ("admin" in permissionGroups || "lab-coordinator" in permissionGroups);

  const [viewMode, setViewMode] = useState<MappingViewMode>("table");
  const [placementTarget, setPlacementTarget] = useState<ResourceMappingRow | null>(null);
  const [assignmentTarget, setAssignmentTarget] = useState<ResourceMappingRow | null>(null);

  const table = useMappingTable();
  const exporter = useMappingExport(table.params);
  // Modals read the refetched row, so they show the changes made inside them; the row they were opened with is the
  // fallback when a filter drops it from the page meanwhile.
  const liveRow = (target: ResourceMappingRow | null) =>
    target ? (table.rows.find((row) => row.id === target.id) ?? target) : null;

  const activeState = (table.filters.state?.[0] as MappingState | undefined) ?? null;
  const hasFilters = Boolean(table.search) || Object.values(table.filters).some((value) => value?.length);

  const applyFilters = (next: TableFilters) => {
    table.setFilters(next);
    table.setPage(1);
  };
  const toggleState = (state: MappingState) =>
    applyFilters({ ...table.filters, state: activeState === state ? null : [state] });
  const resetFilters = () => {
    table.setSearch("");
    applyFilters({});
  };

  const columns = buildMappingColumns({
    filters: table.filters,
    filterOptions: table.filterOptions,
    canEdit,
    onPlace: setPlacementTarget,
    onAssignEquipment: setAssignmentTarget,
    onPrintLabels: printLabels,
  });

  const handleTableChange = (
    pagination: { current?: number; pageSize?: number },
    nextFilters: Record<string, FilterValue | null>,
  ) => {
    const safe: TableFilters = {};
    for (const [key, value] of Object.entries(nextFilters)) {
      safe[key] = value ? value.filter((item): item is Key => typeof item !== "boolean") : null;
    }
    const filtersChanged = JSON.stringify(safe) !== JSON.stringify(table.filters);
    table.setPageSize(pagination.pageSize ?? table.pageSize);
    if (filtersChanged) applyFilters(safe);
    else table.setPage(pagination.current ?? 1);
  };

  const { summary } = table;
  const placedShare = summary.benches ? Math.round((summary.fully_mapped / summary.benches) * 100) : 0;

  return (
    <div className={styles.page}>
      <PageHeader title="Lab Equipment Mapping" />
      <p className={styles.pageIntro}>
        Where every bench is placed and what is on it: room, station, equipment and licenses.
      </p>

      <section className={styles.kpis} aria-label="Mapping summary">
        <div className={styles.kpiTotal}>
          <span className={styles.kpiLabel}>Benches</span>
          <strong>{table.isLoading ? "—" : summary.benches}</strong>
          <span className={styles.kpiHint}>
            {table.isLoading ? " " : `${placedShare}% fully mapped · ${summary.equipment} units placed`}
          </span>
          <span className={styles.kpiBar} aria-hidden="true">
            <span style={{ width: `${placedShare}%` }} />
          </span>
        </div>
        {STATE_CARDS.map(({ state, hint }) => (
          <button
            key={state}
            type="button"
            className={styles.kpiCard}
            data-state={state}
            aria-pressed={activeState === state}
            onClick={() => toggleState(state)}
            title={activeState === state ? "Show all benches" : "Show only these benches"}
          >
            <MappingStateTag state={state} />
            <strong>{table.isLoading ? "—" : summary[state]}</strong>
            <span className={styles.kpiHint}>{hint}</span>
          </button>
        ))}
      </section>

      <Card className={tableStyles.tableCard}>
        <div className={styles.toolbar}>
          <FullTextSearch
            className={styles.search}
            value={table.search}
            onSearch={(value) => {
              table.setSearch(value);
              table.setPage(1);
            }}
            placeholder="Search bench, station, room or equipment (SKU or name)"
          />
          <div className={styles.toolbarActions}>
            <Segmented<MappingViewMode>
              value={viewMode}
              onChange={setViewMode}
              options={[
                { value: "table", label: "Table", icon: <TableOutlined /> },
                { value: "visualization", label: "Diagram", icon: <LayoutOutlined /> },
              ]}
            />
            <TooltipButton responsive tooltip="Clear search and filters" icon={<ClearOutlined />}
              onClick={resetFilters} disabled={!hasFilters}>
              Reset
            </TooltipButton>
            <TooltipButton responsive tooltip="Reload" icon={<ReloadOutlined />} loading={table.loading}
              onClick={() => void table.refetch()}>
              Refresh
            </TooltipButton>
            <WorkbookImportButton />
            <Dropdown
              menu={{
                items: [
                  { key: "mapping", icon: <AppstoreOutlined />, label: "Mapping (filtered rows, .xlsx)" },
                  { key: "audits", icon: <DownloadOutlined />, label: "Bench audit history (.xlsx)" },
                ],
                onClick: ({ key }) => {
                  if (key === "mapping") void exporter.handleExportMapping();
                  else void exporter.handleExportAudits();
                },
              }}
            >
              <Button icon={<DownloadOutlined />} loading={exporter.exportMappingLoading || exporter.exportAuditLoading}>
                Export reports
              </Button>
            </Dropdown>
          </div>
        </div>

        {table.error && (
          <Alert type="error" showIcon className={styles.error} message="The mapping could not be loaded."
            action={<Button size="small" onClick={() => void table.refetch()}>Retry</Button>} />
        )}

        {viewMode === "table" ? (
          <Table<ResourceMappingRow>
            className={`${tableStyles.table} ${styles.mappingTable}`}
            rowKey="id"
            size="middle"
            loading={table.loading}
            columns={columns}
            dataSource={table.rows}
            sticky={{ offsetHeader: 0 }}
            tableLayout="fixed"
            scroll={{ x: 2000 }}
            onChange={handleTableChange}
            locale={{
              emptyText: (
                <Empty image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description={hasFilters ? "No bench matches the search and filters." : "No benches yet."}>
                  {hasFilters && <Button onClick={resetFilters}>Reset filters</Button>}
                </Empty>
              ),
            }}
            pagination={{
              total: table.total,
              current: table.page,
              pageSize: table.pageSize,
              pageSizeOptions: [10, 25, 50, 100],
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total, [from, to]) => `${from}–${to} of ${total} benches`,
            }}
          />
        ) : (
          <MappingVisualization
            rows={table.rows}
            loading={table.loading}
            page={table.page}
            pageSize={table.pageSize}
            total={table.total}
            onPageChange={(page, pageSize) => {
              table.setPage(page);
              table.setPageSize(pageSize);
            }}
          />
        )}
      </Card>

      {canEdit && (
        <>
          {/* Saving invalidates the mapping list, which refetches on its own. */}
          <BenchPlacementModal
            open={placementTarget !== null}
            row={liveRow(placementTarget)}
            onClose={() => setPlacementTarget(null)}
            onSuccess={() => undefined}
          />
          <EquipmentAssignmentModal
            open={assignmentTarget !== null}
            row={liveRow(assignmentTarget)}
            onClose={() => setAssignmentTarget(null)}
            onSuccess={() => undefined}
          />
        </>
      )}
    </div>
  );
}
