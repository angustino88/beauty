import { useState } from "react";
import { message } from "antd";
import dayjs from "dayjs";
import { exportRowsToExcel } from "@/features/lab-analytics/utils/export";
import {
  useLazyGetMappingsQuery,
  useLazyGetBenchAuditPageQuery,
  type BenchAuditRow,
} from "../api";
import type { ResourceMappingParams, ResourceMappingRow } from "../types";
import { mappingExportColumns } from "../utils/mappingExportConfig";

const EXPORT_PAGE_SIZE = 100;
const MAX_EXPORT_PAGES = 100;

/** Exports what the table shows (same search and filters), every page, not only the visible one. */
export function useMappingExport(params: ResourceMappingParams) {
  const [exportMappingLoading, setExportMappingLoading] = useState(false);
  const [exportAuditLoading, setExportAuditLoading] = useState(false);

  const [fetchMappings] = useLazyGetMappingsQuery();
  const [fetchAuditPage] = useLazyGetBenchAuditPageQuery();

  const handleExportMapping = async () => {
    setExportMappingLoading(true);
    try {
      const rows: ResourceMappingRow[] = [];
      for (let page = 1; page <= MAX_EXPORT_PAGES; page += 1) {
        const result = await fetchMappings({ ...params, page, page_size: EXPORT_PAGE_SIZE }).unwrap();
        rows.push(...result.data);
        if (rows.length >= result.total_count || result.data.length === 0) break;
      }
      await exportRowsToExcel(
        rows,
        mappingExportColumns,
        `Resource_Mapping_${dayjs().format("YYYY-MM-DD")}`,
        "Resource Mapping",
      );
    } catch {
      void message.error("Failed to export the mapping");
    } finally {
      setExportMappingLoading(false);
    }
  };

  const handleExportAudits = async () => {
    setExportAuditLoading(true);
    try {
      // Page through the bench audit history (100 per page, capped at 50 pages).
      const rows: BenchAuditRow[] = [];
      for (let page = 1; page <= 50; page += 1) {
        const result = await fetchAuditPage(page).unwrap();
        rows.push(...result.rows);
        if (!result.hasNext) break;
      }
      await exportRowsToExcel<BenchAuditRow>(
        rows,
        [
          { title: "Audit ID", dataIndex: "id" },
          { title: "Bench", dataIndex: "bench" },
          { title: "Result", dataIndex: "result" },
          { title: "Auditor", dataIndex: "auditor" },
          { title: "Audited at", dataIndex: "audited_at" },
          { title: "Remarks", dataIndex: "remarks" },
        ],
        `Bench_Audits_${dayjs().format("YYYY-MM-DD")}`,
        "Bench audits",
      );
    } catch {
      void message.error("Failed to export the bench audits");
    } finally {
      setExportAuditLoading(false);
    }
  };

  return {
    exportMappingLoading,
    exportAuditLoading,
    handleExportMapping,
    handleExportAudits,
  };
}
