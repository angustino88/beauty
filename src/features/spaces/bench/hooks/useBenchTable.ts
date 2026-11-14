import { useCallback, useMemo, useState } from "react";
import { useDebouncedValue } from "@/shared/hooks/useDebouncedValue";
import { useGetBenchesQuery } from "../api";
import type { IBench } from "../types";

export function useBenchTable() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [filters, setFilters] = useState<Record<string, (string | number)[] | null>>({});
  const debouncedSearch = useDebouncedValue(search, 500);

  const queryParams = useMemo(() => {
    return {
      page,
      page_size: pageSize,
      search: debouncedSearch || undefined,
      ordering: "id",
      bench_group_id: filters.group?.[0] != null ? String(filters.group[0]) : undefined,
      type_id: filters.type?.[0] != null ? String(filters.type[0]) : undefined,
      setup_location_id: filters.location?.[0] != null ? String(filters.location[0]) : undefined,
      owner_id: filters.owner?.[0] != null ? String(filters.owner[0]) : undefined,
      status: filters.status?.[0] != null ? String(filters.status[0]) : undefined,
    };
  }, [page, pageSize, debouncedSearch, filters]);

  const listQuery = useGetBenchesQuery(queryParams, {
    pollingInterval: 45000,
    skipPollingIfUnfocused: true,
  });

  const setTableFilters = useCallback((nextFilters: Record<string, (string | number)[] | null>) => {
    setFilters(nextFilters);
    setPage(1);
  }, []);

  const rows = useMemo(() => listQuery.data?.data ?? [], [listQuery.data?.data]);
  const totalRecords = listQuery.data?.total_count ?? 0;

  return {
    search,
    setSearch,
    page,
    setPage,
    pageSize,
    setPageSize,
    filters,
    setFilters: setTableFilters,
    rows: rows as IBench[],
    totalRecords,
    isFetching: listQuery.isFetching,
    refetch: listQuery.refetch,
  };
}
