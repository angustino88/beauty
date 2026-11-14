import { useMemo } from 'react';
import type { Key } from 'react';
import {
  useFilterEquipmentQuery,
  type EquipmentFilterRules,
} from '../api/equipmentFilterApi';

type TableFilters = Record<string, Key[] | null>;

type UseServerEquipmentFilterArgs = {
  filters: TableFilters;
  filterKey: string;
  filterRules: EquipmentFilterRules;
  page: number;
  enabled?: boolean;
};

export function useServerEquipmentFilter<T>({
  filters,
  filterKey,
  filterRules,
  page,
  enabled = true,
}: UseServerEquipmentFilterArgs) {
  const filterParams = useMemo(
    () => Object.fromEntries(
      Object.entries(filters)
        .filter(([, values]) => values && values.length > 0)
        .map(([key, values]) => [key, values]),
    ),
    [filters],
  );
  const hasActiveFilters = Object.keys(filterParams).length > 0;
  const isFilterEnabled = enabled && hasActiveFilters;

  const filterState = useFilterEquipmentQuery({
    page,
    filter_params: filterParams,
    filter_rules: filterRules,
    filter_key: filterKey,
  }, { skip: !isFilterEnabled });

  return {
    data: isFilterEnabled ? (filterState.currentData?.data as T[] ?? []) : [],
    totalCount: isFilterEnabled ? filterState.currentData?.total_count ?? 0 : 0,
    hasActiveFilters,
    isFetching: filterState.isFetching,
    error: filterState.error,
    refetch: filterState.refetch,
  };
}