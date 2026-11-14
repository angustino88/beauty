import { useState } from "react";
import { message } from "antd";
import dayjs from "dayjs";
import { exportRowsToExcel } from "@/features/lab-analytics/utils/export";
import {
  useLazyGetMappingsQuery,
  useExportMappingChangeLogMutation,
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
  const [exportChangeLogMut] = useExportMappingChangeLogMutation();

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
      const blob = await exportChangeLogMut().unwrap();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Mapping_ChangeLog_${dayjs().format("YYYY-MM-DD")}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
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
