import { useState } from "react";
import { message } from "antd";
import dayjs from "dayjs";
import { exportRowsToExcel } from "@/features/lab-analytics/utils/export";
import {
  useLazyGetMappingsQuery,
  useLazyGetBenchAuditPageQuery,
  type BenchAuditRow,
} from "../api";
import type { TableFilters } from "../types";
import { matchesMappingSearch } from "./useMappingTable";
import { mappingExportColumns } from "../utils/mappingExportConfig";

interface UseMappingExportParams {
  search: string;
  filters: TableFilters;
}

export function useMappingExport({ search, filters }: UseMappingExportParams) {
  const [exportMappingLoading, setExportMappingLoading] = useState(false);
  const [exportChangeLogLoading, setExportChangeLogLoading] = useState(false);

  const [fetchAllMappings] = useLazyGetMappingsQuery();
  const [fetchAuditPage] = useLazyGetBenchAuditPageQuery();

  const filename = `Resource_Mapping_${dayjs().format("YYYY-MM-DD")}`;

  const handleExportMapping = async () => {
    setExportMappingLoading(true);
    try {
      const normalizedSearch = search.trim().toLowerCase();
      const result = await fetchAllMappings({
        station_id: filters.station?.[0] ? String(filters.station[0]) : undefined,
        bench_id: filters.bench?.[0] ? String(filters.bench[0]) : undefined,
      }).unwrap();

      let rows = result.data ?? [];
      if (filters.room?.[0]) {
        const roomId = Number(filters.room[0]);
        rows = rows.filter((r) => r.room?.id === roomId);
      }
      if (filters.category?.[0]) {
        const cat = String(filters.category[0]).toLowerCase();
        rows = rows.filter((r) =>
          r.equipment.some((eq) => eq.category.name.toLowerCase().includes(cat)),
        );
      }

      if (normalizedSearch) {
        rows = rows.filter((row) => matchesMappingSearch(row, normalizedSearch));
      }

      await exportRowsToExcel(
        rows,
        mappingExportColumns,
        filename,
        "Resource Mapping",
      );
    } catch {
      void message.error("Failed to export mapping");
    } finally {
      setExportMappingLoading(false);
    }
  };

  const handleExportChangeLog = async () => {
    setExportChangeLogLoading(true);
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
        `Mapping_ChangeLog_${dayjs().format("YYYY-MM-DD")}`,
        "Bench audits",
      );
    } catch {
      void message.error("Failed to export change log");
    } finally {
      setExportChangeLogLoading(false);
    }
  };

  return {
    exportMappingLoading,
    exportChangeLogLoading,
    handleExportMapping,
    handleExportChangeLog,
  };
}
