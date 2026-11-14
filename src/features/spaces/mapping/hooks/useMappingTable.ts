import { useMemo } from "react";
import { useEquipmentTableState } from "@/features/lab-equipment/shared";
import { useGetMappingsQuery, useGetMappingFilterOptionsQuery } from "../api";
import type {
  MappingFilterOptions,
  ResourceMappingParams,
  ResourceMappingRow,
  TableFilters,
} from "../types";

export const matchesMappingSearch = (
  row: ResourceMappingRow,
  search: string,
): boolean => {
  const query = search.toLowerCase();
  const searchableValues = [
    row.bench.sku,
    row.bench.name,
    row.station?.sku,
    row.station?.name,
    row.station_slot?.slot_code,
    row.room?.sku,
    row.room?.name,
    row.room?.location,
    row.room_slot?.slot_code,
    ...row.equipment.flatMap((item) => [item.sku, item.name, item.category?.name, item.role]),
    ...row.licenses.flatMap((item) => [item.sku, item.name]),
    row.remark,
  ];

  return searchableValues.some((value) =>
    value?.toLowerCase().includes(query),
  );
};

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

  const normalizedSearch = debouncedSearch.trim().toLowerCase();

  const queryParams = useMemo<ResourceMappingParams>(() => {
    const params: ResourceMappingParams = {
      page: normalizedSearch ? undefined : page,
      page_size: normalizedSearch ? undefined : pageSize,
      ordering: "id",
    };

    if (filters.station && filters.station.length > 0) {
      params.station_id = String(filters.station[0]);
    }
    if (filters.bench && filters.bench.length > 0) {
      params.bench_id = String(filters.bench[0]);
    }

    return params;
  }, [filters, normalizedSearch, page, pageSize]);

  const listQuery = useGetMappingsQuery(queryParams, {
    refetchOnMountOrArgChange: true,
  });

  const filterOptionsQuery = useGetMappingFilterOptionsQuery();

  const matchingRows = useMemo(() => {
    let data = listQuery.data?.data ?? [];

    if (filters.room && filters.room.length > 0) {
      const selectedRoomId = Number(filters.room[0]);
      data = data.filter((row) => row.room?.id === selectedRoomId);
    }

    if (filters.category && filters.category.length > 0) {
      const selectedCat = String(filters.category[0]).toLowerCase();
      data = data.filter((row) =>
        row.equipment.some((eq) => eq.category.name.toLowerCase().includes(selectedCat)),
      );
    }

    if (!normalizedSearch) return data;
    return data.filter((row) => matchesMappingSearch(row, normalizedSearch));
  }, [listQuery.data?.data, filters.room, filters.category, normalizedSearch]);

  const rows = useMemo(() => {
    if (!normalizedSearch) return matchingRows;
    const start = (page - 1) * pageSize;
    return matchingRows.slice(start, start + pageSize);
  }, [matchingRows, normalizedSearch, page, pageSize]);

  const total = normalizedSearch || filters.room?.length || filters.category?.length
    ? matchingRows.length
    : listQuery.data?.total_count ?? 0;

  const defaultFilterOptions: MappingFilterOptions = {
    rooms: [],
    stations: [],
    benches: [],
    categories: [],
  };

  const filterOptions = filterOptionsQuery.data ?? defaultFilterOptions;

  return {
    search,
    setSearch,
    page,
    setPage,
    pageSize,
    setPageSize,
    filters: filters as TableFilters,
    setFilters: (next: TableFilters) => setFilters(next),
    rows,
    total,
    loading: listQuery.isFetching,
    isLoading: listQuery.isLoading,
    isFetching: listQuery.isFetching,
    filterOptions,
    refetch: listQuery.refetch,
  };
}
