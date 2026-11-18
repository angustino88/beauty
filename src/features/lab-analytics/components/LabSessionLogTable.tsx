import dayjs, { type Dayjs } from "dayjs";
import { Button, DatePicker, Input, message, Select, Table } from "antd";
import { ExportOutlined, ReloadOutlined } from "@ant-design/icons";
import type { TableProps } from "antd/es/table";
import { useMemo, useState } from "react";
import { useGetBenchOptionsQuery } from "@/features/booking/api";
import { useDebouncedValue } from "@/shared/hooks/useDebouncedValue";
import { useGetLabSessionLogsQuery, useLazyGetLabSessionLogsQuery } from "../api/sessionLogEndpoints";
import { useMonitoringReload } from "@/shared/ws/useMonitoringReload";
import type { LabSessionLogEntry } from "../types";
import { exportSessionLogExcel } from "../utils/export";
import { labSessionLogColumns } from "./LabSessionLogTable.columns";
import tableStyles from "@/components/tables/AppTable.module.css";
import styles from "./LabSessionLogTable.module.css";

const { RangePicker } = DatePicker;
const EXPORT_PAGE_SIZE = 100;
const EXPORT_MAX_ROWS = 5000;

const ACCESS_OPTIONS = [
  { value: "booked", label: "Booked" },
  { value: "ad_hoc", label: "Ad hoc (no booking)" },
  { value: "unverified_booking", label: "Unverified booking" },
];

const RANGE_PRESETS: { label: string; value: [Dayjs, Dayjs] }[] = [
  { label: "Today", value: [dayjs().startOf("day"), dayjs().endOf("day")] },
  { label: "Last 7 days", value: [dayjs().subtract(6, "day"), dayjs()] },
  { label: "Last 30 days", value: [dayjs().subtract(29, "day"), dayjs()] },
  { label: "This month", value: [dayjs().startOf("month"), dayjs()] },
  { label: "Last 90 days", value: [dayjs().subtract(89, "day"), dayjs()] },
];

/**
 * Completed remote sessions reported by the computer agents (GET /api/labs/lab-sessions).
 * The server filters, sorts and pages; the login-day range is always sent (the API requires it).
 */
const SESSION_RELOAD_TYPES = ["SESSION_RELOAD"] as const;

export function LabSessionLogTable() {
  const [range, setRange] = useState<[Dayjs, Dayjs]>(() => [dayjs().subtract(6, "day"), dayjs()]);
  const [benchId, setBenchId] = useState<number | undefined>();
  const [accessType, setAccessType] = useState<string | undefined>();
  const [search, setSearch] = useState("");
  const [ordering, setOrdering] = useState<string | undefined>();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [isExporting, setIsExporting] = useState(false);
  const q = useDebouncedValue(search.trim(), 400);

  const filters = useMemo(() => ({
    start_date: range[0].format("YYYY-MM-DD"),
    end_date: range[1].format("YYYY-MM-DD"),
    bench_id: benchId,
    access_type: accessType,
    q: q || undefined,
    ordering,
  }), [range, benchId, accessType, q, ordering]);

  const { data: benchOptions = [] } = useGetBenchOptionsQuery();
  const { data, currentData, isFetching, isError, refetch } = useGetLabSessionLogsQuery({ ...filters, page, page_size: pageSize });
  const [fetchPage] = useLazyGetLabSessionLogsQuery();
  // Live: the server pushes SESSION_RELOAD when an agent stores a session; refetch in place.
  useMonitoringReload({ onReload: refetch, reloadTypes: SESSION_RELOAD_TYPES });
  // Spinner only while the shown rows are for other filters/page; a live or manual refetch swaps rows silently.
  const isLoadingNewQuery = isFetching && currentData === undefined;

  const resetPage = <T,>(setter: (value: T) => void) => (value: T) => { setter(value); setPage(1); };

  const handleTableChange: TableProps<LabSessionLogEntry>["onChange"] = (_pagination, _filters, sorter) => {
    const single = Array.isArray(sorter) ? sorter[0] : sorter;
    const key = single?.order ? String(single.columnKey) : undefined;
    setOrdering(key ? `${single?.order === "ascend" ? "" : "-"}${key}` : undefined);
    setPage(1);
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const rows: LabSessionLogEntry[] = [];
      for (let next = 1; rows.length < EXPORT_MAX_ROWS; next += 1) {
        const result = await fetchPage({ ...filters, page: next, page_size: EXPORT_PAGE_SIZE }).unwrap();
        rows.push(...result.results);
        if (rows.length >= result.total_count || result.results.length < EXPORT_PAGE_SIZE) break;
      }
      await exportSessionLogExcel(rows, `Lab sessions ${filters.start_date} to ${filters.end_date}`);
      if (rows.length >= EXPORT_MAX_ROWS) message.info(`Exported the first ${EXPORT_MAX_ROWS} sessions. Narrow the range for the rest.`);
    } catch {
      message.error("Export failed. Try again or narrow the date range.");
    } finally {
      setIsExporting(false);
    }
  };

  const total = data?.total_count ?? 0;

  return (
    <div className={styles.panel}>
      <div className={styles.toolbar}>
        <RangePicker
          className={styles.range}
          value={range}
          allowClear={false}
          format="DD MMM YYYY"
          presets={RANGE_PRESETS}
          disabledDate={(day) => day.isAfter(dayjs(), "day")}
          onChange={(value) => {
            if (value?.[0] && value[1]) resetPage(setRange)([value[0], value[1]]);
          }}
          aria-label="Login date range"
        />
        <Select
          className={styles.select}
          showSearch
          allowClear
          placeholder="All benches"
          value={benchId}
          options={benchOptions.map((option) => ({ value: option.value, label: option.label }))}
          optionFilterProp="label"
          onChange={resetPage(setBenchId)}
          aria-label="Bench"
        />
        <Select
          className={styles.select}
          allowClear
          placeholder="Any access"
          value={accessType}
          options={ACCESS_OPTIONS}
          onChange={resetPage(setAccessType)}
          aria-label="Access type"
        />
        <Input.Search
          className={styles.search}
          allowClear
          placeholder="User, computer, bench or booking code"
          value={search}
          onChange={(event) => resetPage(setSearch)(event.target.value)}
          aria-label="Search sessions"
        />
        <div className={styles.actions}>
          <Button icon={<ReloadOutlined />} onClick={() => void refetch()} aria-label="Refresh sessions" />
          <Button icon={<ExportOutlined />} loading={isExporting} disabled={!total} onClick={() => void handleExport()}>
            Export
          </Button>
        </div>
      </div>
      <p className={styles.summary} aria-live="polite">
        {isError
          ? "Sessions could not be loaded. Lab coordinators and admins can see this list."
          : `${total.toLocaleString()} ${total === 1 ? "session" : "sessions"} · logins ${range[0].format("D MMM YYYY")} – ${range[1].format("D MMM YYYY")}`}
      </p>
      <Table<LabSessionLogEntry>
        className={`${tableStyles.table} ${tableStyles.nowrapHeader}`}
        tableLayout="fixed"
        rowKey="id"
        size="middle"
        loading={isLoadingNewQuery}
        columns={labSessionLogColumns}
        dataSource={data?.results ?? []}
        onChange={handleTableChange}
        locale={{ emptyText: "No sessions in this period. Widen the date range or clear the filters." }}
        pagination={{
          total,
          current: page,
          pageSize,
          pageSizeOptions: [10, 25, 50, 100],
          showSizeChanger: true,
          showTotal: (count, [from, to]) => `${from}–${to} of ${count}`,
          onChange: (nextPage, nextPageSize) => {
            if (nextPageSize !== pageSize) {
              setPageSize(nextPageSize);
              setPage(1);
            } else {
              setPage(nextPage);
            }
          },
        }}
        scroll={{ x: 1470 }}
      />
    </div>
  );
}
