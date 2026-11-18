import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button, DatePicker, Flex, Form, Tag, Table, message } from "antd";
import { CloseOutlined, ExportOutlined, ReloadOutlined } from "@ant-design/icons";
import type { TablePaginationConfig } from "antd/es/table";
import type { Dayjs } from "dayjs";
import { useGetLabMonitoringListQuery, useLazyGetLabMonitoringExportQuery } from "../api";
import type { ILabMonitoring } from "../types";
import { useLabMonitoringWebSocket } from "../hooks/useLabMonitoringWebSocket";
import { exportMonitoringExcel } from "../utils/export";
import { labMonitoringColumns } from "./labMonitoringColumns";
import styles from "../pages/LabMonitoring.module.css";
import tableStyles from "@/components/tables/AppTable.module.css";

const { RangePicker } = DatePicker;
const DATE_FORMAT = "YYYY-MM-DD";

export interface MonitoringEventsPanelProps {
  benchId?: number;
  computingId?: number;
  computingLabel?: string;
  onClearComputing?: () => void;
}

/** The monitoring event log: period filter, live reload, Excel export. */
export function MonitoringEventsPanel({ benchId, computingId, computingLabel, onClearComputing }: MonitoringEventsPanelProps) {
  const [form] = Form.useForm();
  const [rowAdded, setRowAdded] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const prevLengthRef = useRef(0);
  const [period, setPeriod] = useState<{ from_date_time?: string; to_date_time?: string }>({});
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const filter = { lab: benchId, computing_id: computingId, ...period };
  const [fetchExport] = useLazyGetLabMonitoringExportQuery();
  const { data, currentData, isFetching, refetch } = useGetLabMonitoringListQuery({ ...filter, page, page_size: pageSize });
  // Spinner only while the shown rows are for other filters/page; a live or manual refetch swaps rows silently.
  const isLoadingNewQuery = isFetching && currentData === undefined;
  useLabMonitoringWebSocket({ labId: benchId, onReload: refetch });

  const rows = useMemo<ILabMonitoring[]>(() => data?.value ?? [], [data?.value]);

  // Highlight the first row when new data appears (live reload).
  useEffect(() => {
    if (rows.length > 0 && rows.length > prevLengthRef.current) {
      setRowAdded(true);
      prevLengthRef.current = rows.length;
      const timer = setTimeout(() => setRowAdded(false), 3000);
      return () => clearTimeout(timer);
    }
    prevLengthRef.current = rows.length;
  }, [rows]);

  const handleFilterChange = useCallback((_: unknown, allValues: Record<string, unknown>) => {
    const range = allValues?.period as [Dayjs, Dayjs] | undefined;
    setPeriod({ from_date_time: range?.[0]?.format() ?? undefined, to_date_time: range?.[1]?.format() ?? undefined });
    setPage(1);
  }, []);

  const clearAllFilters = () => {
    form.resetFields();
    setPeriod({});
    setPage(1);
    onClearComputing?.();
  };

  const handleTableChange = useCallback(
    (pagination: TablePaginationConfig) => {
      if (pagination.current !== page) setPage(pagination.current ?? 1);
      if (pagination.pageSize !== pageSize) setPageSize(pagination.pageSize ?? 10);
    },
    [page, pageSize],
  );

  const handleExport = async () => {
    setExportLoading(true);
    try {
      const result = await fetchExport(filter).unwrap();
      await exportMonitoringExcel(result.value ?? [], "Lab_Monitoring");
    } catch {
      message.error("Export failed");
    } finally {
      setExportLoading(false);
    }
  };

  return (
    <>
      <Form className={tableStyles.toolbar} form={form} onValuesChange={handleFilterChange} style={{ width: "100%" }}>
        <Flex gap={12} wrap="wrap" align="center" style={{ width: "100%" }}>
          <Form.Item name="period" style={{ marginBottom: 0, flex: "1 1 260px", minWidth: 240, maxWidth: 360 }}>
            <RangePicker format={DATE_FORMAT} style={{ width: "100%" }} aria-label="Period" />
          </Form.Item>
          {computingId !== undefined && (
            <Tag closable onClose={onClearComputing} color="purple">
              {computingLabel ?? rows[0]?.computer?.name ?? `Computing #${computingId}`}
            </Tag>
          )}
          <Flex className={tableStyles.actions} gap={8} wrap={false} style={{ marginLeft: "auto" }}>
            <Button icon={<ReloadOutlined />} onClick={() => refetch()}>Refresh</Button>
            <Button icon={<CloseOutlined />} onClick={clearAllFilters}>Clear</Button>
            <Button icon={<ExportOutlined />} type="primary" onClick={() => void handleExport()} loading={exportLoading}>
              Export
            </Button>
          </Flex>
        </Flex>
      </Form>

      <Table
        className={`${tableStyles.table} ${tableStyles.nowrapHeader} ${styles.monitoringTable}`}
        columns={labMonitoringColumns}
        tableLayout="auto"
        dataSource={rows}
        rowKey="id"
        rowClassName={(_, index) => `${styles.row} ${rowAdded && index === 0 ? styles.highlightRow : ""}`}
        loading={{ spinning: isLoadingNewQuery, description: "Loading..." }}
        locale={{ emptyText: "No monitoring data found — try adjusting the filters" }}
        onChange={handleTableChange}
        pagination={{
          total: data?.total_count ?? rows.length,
          pageSizeOptions: [5, 10, 25, 50],
          pageSize,
          showQuickJumper: true,
          showSizeChanger: true,
          defaultPageSize: 10,
          current: page,
          showTotal: (total) => `Total ${total} items`,
        }}
        scroll={{ x: 1550, y: "calc(100vh - 360px)" }}
      />
    </>
  );
}
