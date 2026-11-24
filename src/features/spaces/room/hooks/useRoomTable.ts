import { useUrlSearch } from '@/shared/hooks/useUrlSearch';
import { useMemo, useState } from 'react';
import { useDebouncedValue } from '@/shared/hooks/useDebouncedValue';
import { useGetRoomsQuery, useGetRoomFiltersQuery } from '../api';
import { useGetStationsQuery } from '../../station/api';
import { useGetUsersQuery } from '@/features/lab-equipment/shared';
import { facetToAntdFilters, getFacetOptions } from '@/features/lab-equipment/shared/facets/filterFacets';
import { roomFilterParams, selectedRoomLocation, updateRoomFilters, type RoomFilters } from '../roomFilters';
import { useRoomLocationOptions } from './useRoomLocationOptions';
import type { IRoom } from '../types';

export function useRoomTable() {
  const [search, setSearch] = useUrlSearch();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [filters, setFilters] = useState<RoomFilters>({});
  const debouncedSearch = useDebouncedValue(search, 500);

  const listQuery = useGetRoomsQuery(
    { page, page_size: pageSize, search: debouncedSearch || undefined, ordering: 'id', ...roomFilterParams(filters) },
    { pollingInterval: 45000, skipPollingIfUnfocused: true },
  );
  const locationOptions = useRoomLocationOptions(selectedRoomLocation(filters));
  const facetsQuery = useGetRoomFiltersQuery();
  const usersQuery = useGetUsersQuery();
  const ownerFilters = facetToAntdFilters(getFacetOptions(facetsQuery.data, 'owner_id', 'owner', 'primary_owner'))
    ?? usersQuery.data?.map((user) => ({ text: user.display_name || user.username, value: user.id }));

  const baseRows = listQuery.currentData?.data;
  // The room payload carries no stations, so load those of the rooms on this page and attach them.
  const pageRoomIds = useMemo(() => (baseRows ?? []).map((room) => room.id).join(','), [baseRows]);
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
    return (baseRows ?? []).map((room) => ({ ...room, rack_list: byRoom.get(room.id) ?? room.rack_list }));
  }, [baseRows, pageStationsQuery.data?.data]);

  const setTableFilters = (nextFilters: RoomFilters) => {
    setFilters((previous) => updateRoomFilters(previous, nextFilters));
    setPage(1);
  };

  return {
    search, setSearch,
    page, setPage,
    pageSize, setPageSize,
    filters, setFilters: setTableFilters,
    rows,
    totalRecords: listQuery.currentData?.total_count ?? 0,
    isFetching: listQuery.isFetching,
    refetch: listQuery.refetch,
    locationOptions,
    ownerFilters,
  };
}
