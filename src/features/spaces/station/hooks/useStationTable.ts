import { useUrlSearch } from '@/shared/hooks/useUrlSearch';
import { useCallback, useMemo, useState } from "react";
import { useDebouncedValue } from "@/shared/hooks/useDebouncedValue";
import { useGetStationsQuery } from "../api";
import type { IStation } from "../types";

export function useStationTable() {
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
      room_id: filters.room?.length ? filters.room.join(',') : undefined,
      owner_id: filters.owner?.length ? filters.owner.join(',') : undefined,
      status: filters.status?.length ? filters.status.join(',') : undefined,
    };
  }, [page, pageSize, debouncedSearch, filters]);

  const listQuery = useGetStationsQuery(queryParams, {
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
    rows: rows as IStation[],
    totalRecords,
    isFetching: listQuery.isFetching,
    refetch: listQuery.refetch,
  };
}
