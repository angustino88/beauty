import { useEffect, useMemo } from "react";
import { useEquipmentTableState } from "@/features/lab-equipment/shared";
import { useGetMappingsQuery, useGetMappingFilterOptionsQuery } from "../api";
import type {
  MappingFilterOptions,
  MappingState,
  MappingSummary,
  ResourceMappingParams,
  TableFilters,
} from "../types";

const EMPTY_OPTIONS: MappingFilterOptions = { rooms: [], stations: [], benches: [], categories: [] };
const EMPTY_SUMMARY: MappingSummary = { benches: 0, fully_mapped: 0, needs_equipment: 0, needs_placement: 0, equipment: 0 };

const firstId = (filters: TableFilters, key: string): number | undefined => {
  const value = filters[key]?.[0];
  return value == null ? undefined : Number(value);
};

/** Mapping table state → the server query. Search, filters, paging and the summary all come from the server. */
export const toMappingParams = (
  filters: TableFilters,
  search: string,
  page: number,
  pageSize: number,
): ResourceMappingParams => ({
  page,
  page_size: pageSize,
  q: search.trim() || undefined,
  room_id: firstId(filters, "room"),
  station_id: firstId(filters, "station"),
  bench_id: firstId(filters, "bench"),
  equipment_category_id: firstId(filters, "category"),
  state: (filters.state?.[0] as MappingState | undefined) ?? undefined,
});

export function useMappingTable() {
  const {
    search,
    setSearch,
    page,
    setPage,
    pageSize,
    setPageSize,
    filters,
    setFilters,
    debouncedSearch,
  } = useEquipmentTableState();

  const params = useMemo(
    () => toMappingParams(filters as TableFilters, debouncedSearch, page, pageSize),
    [filters, debouncedSearch, page, pageSize],
  );
  const listQuery = useGetMappingsQuery(params, { refetchOnMountOrArgChange: true });
  const filterOptionsQuery = useGetMappingFilterOptionsQuery();

  // The server answers a page beyond the last one with 404 (rows removed meanwhile): go back to the first page.
  const pageGone = page > 1 && (listQuery.error as { status?: unknown } | undefined)?.status === 404;
  useEffect(() => {
    if (pageGone) setPage(1);
  }, [pageGone, setPage]);

  return {
    search,
    setSearch,
    page,
    setPage,
    pageSize,
    setPageSize,
    filters: filters as TableFilters,
    setFilters: (next: TableFilters) => setFilters(next),
    params,
    rows: listQuery.data?.data ?? [],
    total: listQuery.data?.total_count ?? 0,
    summary: listQuery.data?.summary ?? EMPTY_SUMMARY,
    loading: listQuery.isFetching,
    isLoading: listQuery.isLoading,
    error: listQuery.isError && !pageGone,
    filterOptions: filterOptionsQuery.data ?? EMPTY_OPTIONS,
    refetch: listQuery.refetch,
  };
}
