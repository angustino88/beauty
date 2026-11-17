import { useUrlSearch } from '@/shared/hooks/useUrlSearch';
import { useMemo, useState, type Key } from 'react';
import { useDebouncedValue } from '@/shared/hooks/useDebouncedValue';
import { useGetRoomsQuery, useGetRoomDropdownQuery, useGetRoomFiltersQuery } from '../api';
import { useGetStationsQuery } from '../../station/api';
import { mapRoomApiItem } from '../mapper';
import { useGetUsersQuery, useServerEquipmentFilter } from '@/features/lab-equipment/shared';
import { EQUIPMENT_FILTER_RULES } from '@/features/lab-equipment/shared/utils/equipmentFilterRules';
import type { IRoom } from '../types';
import { ROOM_OPTIONS_CONFIG } from '../columns/roomConfig';
import { facetToAntdFilters, getFacetOptions } from '@/features/lab-equipment/shared/facets/filterFacets';
import { toUserOption } from '@/shared/utils/userOption';

type FilterItem   = { text: string; value: string };
type SelectOption = { label: string; value: number };

export function useRoomTable() {
  const [search,   setSearch]   = useUrlSearch();
  const [page,     setPage]     = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [filters,  setFilters]  = useState<Record<string, Key[] | null>>({});
  const debouncedSearch = useDebouncedValue(search, 500);

  const listQuery = useGetRoomsQuery(
    { page, page_size: pageSize, search: debouncedSearch || undefined, ordering: 'id' },
    {
      pollingInterval: 45000,
      skipPollingIfUnfocused: true,
    },
  );
  // The state columns (status = availability, activity, lifecycle) filter on the server's
  // condition, activity_status and lifecycle_status parameters.
  const serverFilters = useMemo(() => {
    const { status, activity, lifecycle, ...rest } = filters;
    return { ...rest, condition: status ?? null, activity_status: activity ?? null, lifecycle_status: lifecycle ?? null };
  }, [filters]);
  const serverFilter = useServerEquipmentFilter<IRoom>({ filters: serverFilters, filterKey: 'Room', filterRules: EQUIPMENT_FILTER_RULES.Room, page, mapItem: mapRoomApiItem });
  const dropdownQuery = useGetRoomDropdownQuery();
  const facetsQuery = useGetRoomFiltersQuery();
  const usersQuery    = useGetUsersQuery();

  const baseRows    = useMemo(() => serverFilter.hasActiveFilters ? serverFilter.data : listQuery.data?.data ?? [], [listQuery.data?.data, serverFilter.data, serverFilter.hasActiveFilters]);
  // The room payload carries no stations, so load those of the rooms on this page and attach them.
  const pageRoomIds = useMemo(() => baseRows.map((room) => room.id).join(','), [baseRows]);
  const pageStationsQuery = useGetStationsQuery(
    { page: 1, page_size: 100, ordering: 'id', room_id: pageRoomIds },
    { skip: !pageRoomIds },
  );
  const rows = useMemo(() => {
    const byRoom = new Map<number, IRoom['rack_list']>();
    for (const station of pageStationsQuery.data?.data ?? []) {
      const roomId = station.room?.id;
      if (roomId == null) continue;
      const list = (byRoom.get(roomId) ?? []) as Array<{ id: number; sku: string; name?: string | null }>;
      list.push({ id: station.id, sku: station.sku, name: station.name });
      byRoom.set(roomId, list);
    }
    return baseRows.map((room) => ({ ...room, rack_list: byRoom.get(room.id) ?? room.rack_list }));
  }, [baseRows, pageStationsQuery.data?.data]);
  // Collect raw data keyed by ROOM_OPTIONS_CONFIG key
  const rawSources = useMemo(() => {
    const owners = (usersQuery.data ?? []).map((u) => ({
      id: u.id,
      username: u.username || u.display_name || String(u.id),
    }));
    return {
      city:          dropdownQuery.data?.cities     ?? [],
      building:      dropdownQuery.data?.buildings  ?? [],
      country:       dropdownQuery.data?.countries  ?? [],
      primary_owner: owners,
    } as unknown as Record<string, Record<string, unknown>[]>;
  }, [dropdownQuery.data, usersQuery.data]);

  // One pass over ROOM_OPTIONS_CONFIG builds both maps  no per-field boilerplate
  const { optionsMap, filtersMap } = useMemo(() => {
    const optionsMap: Record<string, SelectOption[]> = {};
    const filtersMap: Record<string, FilterItem[]>   = {};
    for (const cfg of ROOM_OPTIONS_CONFIG) {
      const items = rawSources[cfg.key] ?? [];
      optionsMap[cfg.key] = items.map((item) => ({
        label: String(item[cfg.labelField] ?? ''),
        value: item[cfg.valueField] as number,
      }));
      filtersMap[cfg.key] = items.map((item) => {
        const label = String(item[cfg.labelField] ?? '');
        const id = item[cfg.valueField];
        return { text: label, value: String(id ?? label) };
      });
    }
    optionsMap.primary_owner = (usersQuery.data ?? []).map(toUserOption) as unknown as SelectOption[];
    for (const key of ['country', 'city', 'building', 'primary_owner']) {
      const facetKey = key === 'primary_owner' ? ['primary_owner', 'owner', 'owner_id'] : [key, `${key}_id`];
      const facetItems = facetToAntdFilters(getFacetOptions(facetsQuery.data, ...facetKey));
      if (facetItems?.length) {
        filtersMap[key] = facetItems.map(({ text, value }) => ({ text: String(text), value: String(value) }));
        if (key !== 'primary_owner') {
          optionsMap[key] = facetItems
            .filter(({ value }) => typeof value === 'number' || /^\d+$/.test(String(value)))
            .map(({ text, value }) => ({ label: String(text), value: Number(value) }));
        }
      }
    }
    return { optionsMap, filtersMap };
  }, [rawSources, facetsQuery.data, usersQuery.data]);

  const statusFacetFilters = facetToAntdFilters(getFacetOptions(facetsQuery.data, 'status', 'status_type'));
  const statusFilters = useMemo(
    () => statusFacetFilters?.map(({ text, value }) => ({ text, value: String(value) })) ?? [],
    [statusFacetFilters],
  );

  return {
    search,   setSearch,
    page,     setPage,
    pageSize, setPageSize,
    filters,  setFilters,
    rows,
    totalRecords: serverFilter.hasActiveFilters ? serverFilter.totalCount : listQuery.data?.total_count ?? 0,
    isFetching:   serverFilter.isFetching || listQuery.isFetching,
    refetch:      serverFilter.hasActiveFilters ? serverFilter.refetch : listQuery.refetch,
    optionsMap,
    filtersMap,
    statusFilters,
  };
}
