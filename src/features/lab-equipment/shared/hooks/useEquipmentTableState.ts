import { useState, type Key } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useDebouncedValue } from '@/shared/hooks/useDebouncedValue';

type TableFilters = Record<string, Key[] | null>;

export function useEquipmentTableState(debounceMs = 500) {
  const [searchParams] = useSearchParams();
  const [search, setSearch] = useState(() => searchParams.get('search') ?? '');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [filters, setFilters] = useState<TableFilters>({});
  const debouncedSearch = useDebouncedValue(search, debounceMs);

  const setSafePage = (nextPage: number) => {
    if (!Number.isFinite(nextPage) || nextPage <= 0) return;
    setPage(Math.trunc(nextPage));
  };

  const setSafePageSize = (nextPageSize: number) => {
    if (!Number.isFinite(nextPageSize) || nextPageSize <= 0) return;
    const normalizedPageSize = Math.trunc(nextPageSize);
    setPageSize((currentPageSize) => {
      if (currentPageSize !== normalizedPageSize) setPage(1);
      return normalizedPageSize;
    });
  };

  const setSafeFilters = (nextFilters: TableFilters) => {
    setPage(1);
    setFilters(nextFilters);
  };

  return {
    search,
    setSearch,
    page,
    setPage: setSafePage,
    pageSize,
    setPageSize: setSafePageSize,
    filters,
    setFilters: setSafeFilters,
    debouncedSearch,
  };
}
