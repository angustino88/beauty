import dayjs from "dayjs";
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
import type { TableProps } from "antd/es/table";
import { useCallback, useState } from "react";
import { useGetBenchOptionsQuery } from "@/features/booking/api";
import {
  useGetLabSessionLogsQuery,
  useLazyGetLabSessionLogsQuery,
} from "../api/sessionLogEndpoints";
import { useMonitoringReload } from "@/shared/ws/useMonitoringReload";
import type { LabSessionLogEntry } from "../types";
import { exportSessionLogExcel } from "../utils/export";
import { labSessionLogColumns } from "./LabSessionLogTable.columns";
import tableStyles from "@/components/tables/AppTable.module.css";

const { RangePicker } = DatePicker;

export function LabSessionLogTable() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [labName, setLabName] = useState<string | undefined>(undefined);
  const [startDate, setStartDate] = useState<string | undefined>(undefined);
  const [endDate, setEndDate] = useState<string | undefined>(undefined);
  const [sorts, setSorts] = useState<string[]>([]);
  const [orders, setOrders] = useState<string[]>([]);
  const [form] = Form.useForm();
  const [fetchAll] = useLazyGetLabSessionLogsQuery();
  const [isExporting, setIsExporting] = useState(false);
  const { data: labOptions = [] } = useGetBenchOptionsQuery();
  const { data, isFetching, refetch } = useGetLabSessionLogsQuery({
    page,
    page_size: pageSize,
    lab_name: labName,
    start_date: startDate,
    end_date: endDate,
    sorts,
    orders,
  });

  useMonitoringReload({ onReload: refetch });

  const handleValuesChange = (_: unknown, all: Record<string, unknown>) => {
    const period = all.period as [dayjs.Dayjs, dayjs.Dayjs] | null;
    const opt = all.labName as { label: string } | undefined;
    setLabName(opt?.label?.split("(")[0].trim() || undefined);
    setStartDate(period?.[0]?.format("YYYY-MM-DD") || undefined);
    setEndDate(period?.[1]?.format("YYYY-MM-DD") || undefined);
    setPage(1);
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const result = await fetchAll({
        lab_name: labName,
        start_date: startDate,
        end_date: endDate,
        sorts,
        orders,
      }).unwrap();
      await exportSessionLogExcel(result.results ?? [], "Lab Session Log");
    } catch {
      message.error("Export failed");
    } finally {
      setIsExporting(false);
    }
  };

  const handleClear = () => {
    form.resetFields();
    setLabName(undefined);
    setStartDate(undefined);
    setEndDate(undefined);
    setSorts([]);
    setOrders([]);
    setPage(1);
  };

  const handleTableChange: TableProps<LabSessionLogEntry>["onChange"] =
    useCallback((_pagination, _filters, sorter) => {
      const sorterArr = Array.isArray(sorter)
        ? sorter
        : sorter.columnKey
          ? [sorter]
          : [];
      setSorts(sorterArr.map((s) => String(s.columnKey)));
      setOrders(sorterArr.map((s) => (s.order === "ascend" ? "asc" : "desc")));
    }, []);

  return (
    <Card className={tableStyles.tableCard} title="Lab Session Log" styles={{ body: { padding: 20 } }}>
      <Form
        className={tableStyles.toolbar}
        form={form}
        onValuesChange={handleValuesChange}
        style={{ width: "100%" }}
      >
        <Flex gap={12} wrap="wrap" align="center">
          <Form.Item
            name="labName"
            style={{ marginBottom: 0, flex: "1 1 220px", minWidth: 220 }}
          >
            <Select
              showSearch
              placeholder="Filter by lab"
              allowClear
              labelInValue
              options={labOptions.map((o) => ({
                value: o.value,
                label: o.label,
              }))}
              optionFilterProp="label"
            />
          </Form.Item>
          <Form.Item
            name="period"
            style={{ marginBottom: 0, flex: "1 1 220px", minWidth: 220 }}
          >
            <RangePicker style={{ width: "100%" }} format="MM/DD/YYYY" />
          </Form.Item>
          <Flex
            className={tableStyles.actions}
            gap={8}
            wrap={false}
            style={{ flex: "0 0 auto" }}
          >
            <Button icon={<ReloadOutlined />} onClick={() => refetch()}>
              Refresh
            </Button>
            <Button icon={<CloseOutlined />} onClick={handleClear}>
              Clear
            </Button>
            <Button
              icon={<ExportOutlined />}
              type="primary"
              loading={isExporting}
              onClick={() => void handleExport()}
            >
              Export
            </Button>
          </Flex>
        </Flex>
      </Form>
      <Table
        className={`${tableStyles.table} ${tableStyles.nowrapHeader}`}
        tableLayout="fixed"
        rowKey="id"
        loading={isFetching}
        columns={labSessionLogColumns}
        dataSource={data?.results ?? []}
        onChange={handleTableChange}
        sticky={{ offsetHeader: 60 }}
        locale={{ emptyText: "No session activity found — try adjusting the filters" }}
        pagination={{
          total: data?.total_count ?? 0,
          current: page,
          pageSize,
          pageSizeOptions: [5, 10, 25, 50],
          showQuickJumper: true,
          showSizeChanger: true,
          showTotal: (total) => `Total ${total} items`,
          onChange: (nextPage, nextPageSize) => {
            setPage(nextPage);
            if (nextPageSize && nextPageSize !== pageSize) {
              setPageSize(nextPageSize);
              setPage(1);
            }
          },
        }}
        scroll={{ x: 1940, y: "calc(100vh - 320px)" }}
      />
    </Card>
  );
}
