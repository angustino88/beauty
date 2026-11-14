import { useMemo, useState } from "react";
import { Card, Col, message, Progress, Row, Segmented, Table, Typography } from "antd";
import {
  ClearOutlined,
  AppstoreAddOutlined,
  ExportOutlined,
  ImportOutlined,
  LayoutOutlined,
  ReloadOutlined,
  TableOutlined,
} from "@ant-design/icons";
import type { Key } from "react";
import type { FilterValue } from "antd/es/table/interface";
import { PageHeader } from "@/components/layout/PageHeader";
import { FullTextSearch } from "@/components/inputs/FullTextSearch";
import { TooltipButton } from "@/components/layout/TooltipButton";
import { CheckCircleFilled, ExclamationCircleFilled } from "@ant-design/icons";
import { printDeviceLabel, printLabInfoLabel } from "@/features/lab-equipment/shared";
import type { ResourceMappingRow, TableFilters } from "../types";
import { useMappingTable } from "../hooks/useMappingTable";
import { useMappingExport } from "../hooks/useMappingExport";
import { buildMappingColumns } from "../columns/mappingColumns";
import { MappingVisualization } from "../components/MappingVisualization";
import { BenchPlacementModal } from "../components/modals/BenchPlacementModal";
import { EquipmentAssignmentModal } from "../components/modals/EquipmentAssignmentModal";
import styles from "@/features/lab-equipment/shared/components/layout/EquipmentTable.module.css";
import mappingStyles from "../columns/MappingTable.module.css";

type MappingViewMode = "table" | "visualization";

export default function MappingPage() {
  const [viewMode, setViewMode] = useState<MappingViewMode>("table");
  const [placementModalRow, setPlacementModalRow] = useState<ResourceMappingRow | null>(null);
  const [assignmentModalRow, setAssignmentModalRow] = useState<ResourceMappingRow | null>(null);

  const table = useMappingTable();
  const export_ = useMappingExport({
    search: table.search,
    filters: table.filters,
  });

  const handlePrintAllDeviceLabels = (record: ResourceMappingRow) => {
    const hasMapped = Boolean(
      record.bench ||
      record.station ||
      record.room ||
      record.equipment.length,
    );
    if (!hasMapped) {
      void message.info("No mapped devices to print");
      return;
    }

    if (record.room) {
      printDeviceLabel({
        sku: record.room.sku,
        name: record.room.name,
      });
    }

    if (record.station) {
      printDeviceLabel({
        sku: record.station.sku,
        name: record.station.name,
      });
    }

    if (record.bench) {
      printLabInfoLabel({
        sku: record.bench.sku,
        lab_name: record.bench.name,
        location_name: record.room?.location ?? undefined,
      });
    }

    record.equipment.forEach((eq) =>
      printDeviceLabel({
        sku: eq.sku,
        name: eq.name,
      }),
    );
  };

  const columns = buildMappingColumns({
    filters: table.filters,
    filterOptions: table.filterOptions,
    onPlace: (row) => setPlacementModalRow(row),
    onAssignEquipment: (row) => setAssignmentModalRow(row),
    onPrintAll: handlePrintAllDeviceLabels,
  });

  const handleTableChange = (
    pagination: { current?: number; pageSize?: number },
    nextFilters: Record<string, FilterValue | null>,
  ) => {
    const safeFilters: TableFilters = {};
    for (const [k, v] of Object.entries(nextFilters)) {
      safeFilters[k] = v
        ? v.filter((i): i is Key => i !== true && i !== false)
        : null;
    }
    table.setPageSize(pagination.pageSize ?? 10);
    table.setPage(pagination.current ?? 1);

    if (JSON.stringify(safeFilters) !== JSON.stringify(table.filters)) {
      table.setFilters(safeFilters);
    }
  };

  const summaryCounts = useMemo(() => {
    const rows = table.rows;
    let fullyMapped = 0;
    let partial = 0;
    let unplaced = 0;
    let totalAssets = 0;

    for (const r of rows) {
      if (r.status.is_fully_mapped) fullyMapped++;
      if (!r.status.has_station || !r.status.has_room) unplaced++;
      else if (!r.status.is_fully_mapped) partial++;
      totalAssets += r.status.equipment_count;
    }

    return { fullyMapped, partial, unplaced, totalAssets };
  }, [table.rows]);

  const visibleBenchCount = table.rows.length;

  const summary = useMemo(
    () => (
      <Card className={mappingStyles.mappingSummary}>
        <div className={mappingStyles.summaryHeader}>
          <div>
            <Typography.Text className={mappingStyles.summaryEyebrow}>Mapping status</Typography.Text>
            <Typography.Title level={4} className={mappingStyles.summaryTitle}>Placement overview</Typography.Title>
          </div>
          <div className={mappingStyles.summaryTotal}>
            <strong>{table.loading ? "—" : visibleBenchCount}</strong>
            <span>Benches on this page</span>
          </div>
        </div>
        <Progress
          className={mappingStyles.summaryProgress}
          percent={visibleBenchCount ? Math.round((summaryCounts.fullyMapped / visibleBenchCount) * 100) : 0}
          showInfo={false}
          strokeColor="#168458"
          trailColor="var(--lm-border)"
        />
        <Row gutter={[12, 12]} className={mappingStyles.summaryMetrics}>
          <Col xs={12} md={6}>
            <div className={`${mappingStyles.summaryMetric} ${mappingStyles.metricComplete}`}>
              <span className={mappingStyles.metricIcon}><CheckCircleFilled /></span>
              <span className={mappingStyles.metricText}><strong>{table.loading ? "—" : summaryCounts.fullyMapped}</strong><small>Fully mapped</small></span>
              <span className={mappingStyles.metricHint}>Room + station + equipment</span>
            </div>
          </Col>
          <Col xs={12} md={6}>
            <div className={`${mappingStyles.summaryMetric} ${mappingStyles.metricPartial}`}>
              <span className={mappingStyles.metricIcon}><ExclamationCircleFilled /></span>
              <span className={mappingStyles.metricText}><strong>{table.loading ? "—" : summaryCounts.partial}</strong><small>Needs equipment</small></span>
              <span className={mappingStyles.metricHint}>Placed, but no equipment assigned</span>
            </div>
          </Col>
          <Col xs={12} md={6}>
            <div className={`${mappingStyles.summaryMetric} ${mappingStyles.metricUnplaced}`}>
              <span className={mappingStyles.metricIcon}><ExclamationCircleFilled /></span>
              <span className={mappingStyles.metricText}><strong>{table.loading ? "—" : summaryCounts.unplaced}</strong><small>Needs placement</small></span>
              <span className={mappingStyles.metricHint}>Missing room or station</span>
            </div>
          </Col>
          <Col xs={12} md={6}>
            <div className={`${mappingStyles.summaryMetric} ${mappingStyles.metricAssets}`}>
              <span className={mappingStyles.metricIcon}><AppstoreAddOutlined /></span>
              <span className={mappingStyles.metricText}><strong>{table.loading ? "—" : summaryCounts.totalAssets}</strong><small>Assigned equipment</small></span>
              <span className={mappingStyles.metricHint}>Across the current result set</span>
            </div>
          </Col>
        </Row>
      </Card>
    ),
    [table.loading, visibleBenchCount, summaryCounts],
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <PageHeader title="Lab Equipment Mapping" />
      {summary}
      <Card className={styles.tableCard}>
        <Row
          className={styles.toolbar}
          style={{
            marginBottom: 8,
            backgroundColor: "var(--lm-surface)",
            position: "sticky",
            top: 0,
            paddingTop: 20,
            zIndex: 100,
          }}
        >
          <Col flex="auto">
            <FullTextSearch
              className={styles.search}
              value={table.search}
              onSearch={(v) => {
                table.setSearch(v);
                table.setPage(1);
              }}
              placeholder="Search by Bench, Station, Room, Equipment, License..."
            />
          </Col>
          <Col className={styles.actions}>
            <Segmented<MappingViewMode>
              value={viewMode}
              onChange={setViewMode}
              options={[
                { value: "table", label: "Table", icon: <TableOutlined /> },
                {
                  value: "visualization",
                  label: "Visualization",
                  icon: <LayoutOutlined />,
                },
              ]}
            />
            <TooltipButton
              responsive
              tooltip="Clear all filters"
              icon={<ClearOutlined />}
              onClick={() => {
                table.setSearch("");
                table.setFilters({});
                table.setPage(1);
              }}
            >
              Clear all filters
            </TooltipButton>
            <TooltipButton
              responsive
              tooltip="Re-fetch data"
              icon={<ReloadOutlined />}
              loading={table.loading}
              onClick={() => void table.refetch()}
            >
              Refresh
            </TooltipButton>
            <TooltipButton
              responsive
              tooltip="Import XLXS file"
              icon={<ImportOutlined />}
              onClick={() =>
                void message.info("Import Resource Mapping - Not implemented")
              }
            >
              Import
            </TooltipButton>
            <TooltipButton
              responsive
              tooltip="Export mapping"
              type="default"
              icon={<ExportOutlined />}
              loading={export_.exportMappingLoading}
              onClick={() => void export_.handleExportMapping()}
            >
              Export
            </TooltipButton>
            <TooltipButton
              responsive
              tooltip="Export change log"
              type="default"
              icon={<ExportOutlined />}
              loading={export_.exportChangeLogLoading}
              onClick={() => void export_.handleExportChangeLog()}
            >
              Change Log
            </TooltipButton>
          </Col>
        </Row>
        {viewMode === "table" ? (
          <Table<ResourceMappingRow>
            className={`${styles.table} ${mappingStyles.mappingTable}`}
            rowKey={(row) => row.id}
            loading={table.loading}
            columns={columns}
            dataSource={table.rows}
            sticky={{ offsetHeader: 60 }}
            tableLayout="auto"
            scroll={{ x: 1800, y: "calc(100vh - 280px)" }}
            rowClassName={(_, index) =>
              index % 2 === 1 ? "stripedRow" : ""
            }
            onChange={handleTableChange}
            pagination={{
              total: table.total,
              pageSizeOptions: [5, 10, 25, 50],
              pageSize: table.pageSize,
              showQuickJumper: true,
              showSizeChanger: true,
              defaultPageSize: 10,
              current: table.page,
              showTotal: (total) => `Total ${total} items`,
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

      <BenchPlacementModal
        open={Boolean(placementModalRow)}
        row={placementModalRow}
        onClose={() => setPlacementModalRow(null)}
        onSuccess={() => void table.refetch()}
      />

      <EquipmentAssignmentModal
        open={Boolean(assignmentModalRow)}
        row={assignmentModalRow}
        onClose={() => setAssignmentModalRow(null)}
        onSuccess={() => void table.refetch()}
      />
    </div>
  );
}
