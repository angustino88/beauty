import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Button,
  Card,
  DatePicker,
  Flex,
  Form,
  message,
  Select,
  Table,
} from "antd";
import {
  CloseOutlined,
  ExportOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import type { TablePaginationConfig } from "antd/es/table";
import type { Dayjs } from "dayjs";
import { PageHeader } from "@/components/layout/PageHeader";
import { useGetBenchOptionsQuery } from "@/features/booking/api";
import {
  useGetLabMonitoringListQuery,
  useLazyGetLabMonitoringExportQuery,
} from "../api";
import type { ILabMonitoring, ILabMonitoringParams } from "../types";
import { useLabMonitoringWebSocket } from "../hooks/useLabMonitoringWebSocket";
import { exportMonitoringExcel } from "../utils/export";
import { labMonitoringColumns } from "../components/labMonitoringColumns";
import styles from "./LabMonitoring.module.css";
import tableStyles from "@/components/tables/AppTable.module.css";

const { RangePicker } = DatePicker;

const DATE_FORMAT = "YYYY-MM-DD";
export default function LabMonitoring() {
  const [form] = Form.useForm();
  const [rowAdded, setRowAdded] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const prevLengthRef = useRef(0);

  const [filter, setFilter] = useState<
    Omit<ILabMonitoringParams, "page" | "page_size">
  >({});
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [fetchExport] = useLazyGetLabMonitoringExportQuery();
  const { data, isFetching, refetch } = useGetLabMonitoringListQuery({
    ...filter,
    page,
    page_size: pageSize,
  });
  useLabMonitoringWebSocket({ labId: filter.lab, onReload: refetch });

  const rows = useMemo<ILabMonitoring[]>(
    () => data?.value ?? [],
    [data?.value],
  );

  // Highlight first row when new data appears (simulates WS silent reload)
  useEffect(() => {
    if (rows.length > 0 && rows.length > prevLengthRef.current) {
      setRowAdded(true);
      prevLengthRef.current = rows.length;
      const timer = setTimeout(() => setRowAdded(false), 3000);
      return () => clearTimeout(timer);
    }
    prevLengthRef.current = rows.length;
  }, [rows]);

  // Lab name dropdown options — already filtered (computer != null) and transformed by API layer
  const { data: labNameComputerOptions = [] } = useGetBenchOptionsQuery();

  const handleFilterChange = useCallback(
    (_: unknown, allValues: Record<string, unknown>) => {
      const labValue = allValues?.lab as { value?: number } | undefined;
      const period = allValues?.period as [Dayjs, Dayjs] | undefined;
      setFilter({
        lab: labValue?.value,
        from_date_time: period?.[0]?.format() ?? undefined,
        to_date_time: period?.[1]?.format() ?? undefined,
      });
      setPage(1);
    },
    [],
  );

  const clearAllFilters = () => {
    form.resetFields();
    setFilter({});
    setPage(1);
  };

  const handleTableChange = useCallback(
    (pagination: TablePaginationConfig) => {
      if (pagination.current !== page) setPage(pagination.current ?? 1);
      if (pagination.pageSize !== pageSize)
        setPageSize(pagination.pageSize ?? 10);
    },
    [page, pageSize],
  );

  const handleExport = async () => {
    setExportLoading(true);
    try {
      const result = await fetchExport({
        lab: filter.lab,
        from_date_time: filter.from_date_time,
        to_date_time: filter.to_date_time,
      }).unwrap();
      await exportMonitoringExcel(result.value ?? [], "Lab_Monitoring");
    } catch {
      message.error("Export failed");
    } finally {
      setExportLoading(false);
    }
  };

  return (
    <div className={tableStyles.registerPage}>
      <PageHeader title="Lab Monitoring" />
      <Card className={`${tableStyles.tableCard} ${tableStyles.registerCard}`}>
        <Form
          className={tableStyles.toolbar}
          form={form}
          onValuesChange={handleFilterChange}
          style={{ width: "100%" }}
        >
          <Flex gap={12} wrap="wrap" align="center" style={{ width: "100%" }}>
            <Form.Item
              name="lab"
              style={{ marginBottom: 0, flex: "1 1 240px", minWidth: 220 }}
            >
              <Select
                showSearch
                placeholder="Filter by lab"
                allowClear
                labelInValue
                options={labNameComputerOptions}
                optionFilterProp="label"
              />
            </Form.Item>
            <Form.Item
              name="period"
              style={{ marginBottom: 0, flex: "1 1 260px", minWidth: 240 }}
            >
              <RangePicker format={DATE_FORMAT} style={{ width: "100%" }} />
            </Form.Item>
            <Flex className={tableStyles.actions} gap={8} wrap={false}>
              <Button icon={<ReloadOutlined />} onClick={() => refetch()}>
                Refresh
              </Button>
              <Button icon={<CloseOutlined />} onClick={clearAllFilters}>
                Clear
              </Button>
              <Button
                icon={<ExportOutlined />}
                type="primary"
                onClick={() => void handleExport()}
                loading={exportLoading}
              >
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
          rowClassName={(_, index) =>
            `${styles.row} ${rowAdded && index === 0 ? styles.highlightRow : ""}`
          }
          loading={{ spinning: isFetching, tip: "Loading..." }}
          locale={{
            emptyText: "No monitoring data found — try adjusting the filters",
          }}
          onChange={handleTableChange}
          sticky={{ offsetHeader: 60 }}
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
          scroll={{ x: 1550, y: "calc(100vh - 320px)" }}
        />
      </Card>
    </div>
  );
}
