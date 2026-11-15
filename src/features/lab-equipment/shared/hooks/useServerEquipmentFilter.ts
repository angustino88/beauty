import { useMemo } from 'react';
import type { Key } from 'react';
import {
  serverFilterKeys,
  useFilterEquipmentQuery,
  type EquipmentFilterRules,
} from '../api/equipmentFilterApi';

type TableFilters = Record<string, Key[] | null>;

type UseServerEquipmentFilterArgs<T> = {
  filters: TableFilters;
  filterKey: string;
  filterRules: EquipmentFilterRules;
  page: number;
  enabled?: boolean;
  /** Maps a raw list item to the row shape the table renders. */
  mapItem?: (raw: unknown) => T;
};

export function useServerEquipmentFilter<T>({
  filters,
  filterKey,
  page,
  enabled = true,
  mapItem,
}: UseServerEquipmentFilterArgs<T>) {
  // Only filters the list endpoint understands go to the server; the table filters the rest locally.
  const filterParams = useMemo(() => {
    const supported = new Set(serverFilterKeys(filterKey));
    return Object.fromEntries(
      Object.entries(filters)
        .filter(([key, values]) => supported.has(key) && values && values.length > 0)
        .map(([key, values]) => [key, values]),
    );
  }, [filters, filterKey]);
  const hasActiveFilters = Object.keys(filterParams).length > 0;
  const isFilterEnabled = enabled && hasActiveFilters;

  const filterState = useFilterEquipmentQuery({
    page,
    filter_params: filterParams,
    filter_key: filterKey,
  }, { skip: !isFilterEnabled });

  return {
    data: useMemo(() => {
      if (!isFilterEnabled) return [] as T[];
      const raw = filterState.currentData?.data ?? [];
      return (mapItem ? raw.map(mapItem) : raw) as T[];
    }, [isFilterEnabled, filterState.currentData?.data, mapItem]),
    totalCount: isFilterEnabled ? filterState.currentData?.total_count ?? 0 : 0,
    hasActiveFilters,
    isFetching: filterState.isFetching,
    error: filterState.error,
    refetch: filterState.refetch,
  };
}