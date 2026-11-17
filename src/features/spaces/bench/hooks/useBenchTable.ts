import { useUrlSearch } from '@/shared/hooks/useUrlSearch';
import { useCallback, useMemo, useState } from "react";
import { useDebouncedValue } from "@/shared/hooks/useDebouncedValue";
import { useGetBenchesQuery } from "../api";
import type { IBench } from "../types";

export function useBenchTable() {
  const [search, setSearch] = useUrlSearch();
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
      bench_group_id: filters.group?.length ? filters.group.join(',') : undefined,
      type_id: filters.type?.length ? filters.type.join(',') : undefined,
      setup_location_id: filters.location?.length ? filters.location.join(',') : undefined,
      owner_id: filters.owner?.length ? filters.owner.join(',') : undefined,
      // One server filter per state: the Lifecycle, Availability and Activity columns.
      lifecycle_status: filters.status?.length ? filters.status.join(',') : undefined,
      condition: filters.condition?.length ? filters.condition.join(',') : undefined,
      activity_status: filters.activity?.length ? filters.activity.join(',') : undefined,
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
