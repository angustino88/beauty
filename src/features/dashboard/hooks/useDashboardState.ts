// src/features/dashboard/hooks/useDashboardState.ts
//
// Simple state manager for dashboard pagination + filters.
// All filtering is done SERVER-SIDE — this hook just holds UI state and builds query params.
// Auto-resets to page 1 whenever any filter changes.
import { useCallback, useDeferredValue, useEffect, useMemo, useState } from 'react';
import type { FilterValue, TableCurrentDataSource, TablePaginationConfig } from 'antd/es/table/interface';
import type {
  DashboardColumnFilters,
  DashboardPageParams,
  DashboardBench,
  SummaryStatus,
} from '../types';
import { INITIAL_COLUMN_FILTERS, SUMMARY_STATUS_VALUES } from '../types';

const DASHBOARD_FILTERS_KEY = 'dashFilters';
const SHOW_FAVORITES_KEY = 'dashShowFavorites';
const DASHBOARD_SEARCH_KEY = 'dashSearch';
const DASHBOARD_STATUS_KEY = 'dashSummaryStatus';

export interface DashboardState {
  // Query params (sent to server)
  queryParams: DashboardPageParams;

  // UI state for components
  page: number;
  pageSize: number;
  search: string;
  summaryStatus: SummaryStatus;
  columnFilters: DashboardColumnFilters;
  showFavoritesOnly: boolean;

  // Handlers
  handleSummaryClick: (key: SummaryStatus) => void;
  handleTableChange: (
    pagination: TablePaginationConfig,
    filters: Record<string, FilterValue | null>,
    sorter: unknown,
    extra: TableCurrentDataSource<DashboardBench>,
  ) => void;
  clearAllFilters: () => void;
  setSearch: (v: string) => void;
  setShowFavoritesOnly: (v: boolean) => void;
}

export function useDashboardState(): DashboardState {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearchRaw] = useState(() => localStorage.getItem(DASHBOARD_SEARCH_KEY) ?? '');
  const [summaryStatus, setSummaryStatus] = useState<SummaryStatus>(() => {
    const stored = localStorage.getItem(DASHBOARD_STATUS_KEY);
    return SUMMARY_STATUS_VALUES.includes(stored as (typeof SUMMARY_STATUS_VALUES)[number])
      ? (stored as SummaryStatus)
      : null;
  });
  const [columnFilters, setColumnFilters] = useState<DashboardColumnFilters>(() => {
    try {
      const stored = localStorage.getItem(DASHBOARD_FILTERS_KEY);
      if (stored) {
        const parsed: unknown = JSON.parse(stored);
        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed) && Object.keys(parsed).length > 0) {
          return { ...INITIAL_COLUMN_FILTERS, ...(parsed as Partial<DashboardColumnFilters>) };
        }
      }
    } catch {
      // ignore malformed data
    }
    return INITIAL_COLUMN_FILTERS;
  });
  const [showFavoritesOnly, setShowFavoritesOnlyRaw] = useState(() =>
    localStorage.getItem(SHOW_FAVORITES_KEY) === 'true',
  );

  useEffect(() => {
    try {
      localStorage.setItem(DASHBOARD_FILTERS_KEY, JSON.stringify(columnFilters));
      localStorage.setItem(SHOW_FAVORITES_KEY, String(showFavoritesOnly));
      localStorage.setItem(DASHBOARD_SEARCH_KEY, search);
      if (summaryStatus) {
        localStorage.setItem(DASHBOARD_STATUS_KEY, summaryStatus);
      } else {
        localStorage.removeItem(DASHBOARD_STATUS_KEY);
      }
    } catch {
      // Ignore unavailable storage (for example, private browsing restrictions).
    }
  }, [columnFilters, search, showFavoritesOnly, summaryStatus]);

  // Defer search to prevent per-keystroke API calls.
  // Input updates immediately (search), but queryParams uses deferredSearch
  // which React defers to a lower-priority render. This prevents request spam.
  const deferredSearch = useDeferredValue(search);

  // ── Build query params for RTK Query ─────────────────────────────────────
  // Determine effective server-side status filter:
  // - summaryStatus (from card click) overrides column filter
  // - columnFilters.status (from table dropdown) used otherwise
  const effectiveStatus = useMemo(
    () => (summaryStatus ? [summaryStatus] : columnFilters.status),
    [summaryStatus, columnFilters.status],
  );

  const queryParams: DashboardPageParams = useMemo(
    () => ({
      page,
      page_size: pageSize,
      ...(deferredSearch && { search: deferredSearch }),
      ...(effectiveStatus.length > 0 && { status: effectiveStatus }),
      ...(columnFilters.lab_group_ids.length > 0 && { lab_group: columnFilters.lab_group_ids }),
      ...(columnFilters.sample_ids.length > 0 && { sample_ids: columnFilters.sample_ids }),
      ...(columnFilters.license_ids.length > 0 && { license_ids: columnFilters.license_ids }),
      ...(showFavoritesOnly && { is_favorite: true }),
    }),
    [
      page,
      pageSize,
      deferredSearch,
      effectiveStatus,
      columnFilters.lab_group_ids,
      columnFilters.sample_ids,
      columnFilters.license_ids,
      showFavoritesOnly,
    ],
  );

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleSummaryClick = useCallback((key: SummaryStatus) => {
    setSummaryStatus((prev) => (prev === key ? null : key));
    setPage(1);
  }, []);

  const handleTableChange = useCallback(
    (
      pagination: TablePaginationConfig,
      filters: Record<string, FilterValue | null>,
      _sorter: unknown,
      extra: TableCurrentDataSource<DashboardBench>,
    ) => {
      if (extra.action === 'paginate') {
        if (pagination.current) setPage(pagination.current);
        if (pagination.pageSize) setPageSize(pagination.pageSize);
        return;
      }
      if (extra.action !== 'filter') return;
      setPage(1);
      setSummaryStatus(null); // column filter overrides summary card selection
      const rawSampleValues = (filters['lab_equipment__samples_list'] as string[] | null) ?? [];
      const rawLicenseValues = (filters['lab_equipment__license_list'] as string[] | null) ?? [];
      setColumnFilters({
        status: (filters['status'] as string[] | null) ?? [],
        lab_group_ids: ((filters['lab_group'] as Array<string | number> | null) ?? []).map(Number),
        // Store encoded strings for filteredValue UI matching
        sample_filter_values: rawSampleValues,
        // Expand "id1|id2|..." → individual IDs sent to the server
        sample_ids: rawSampleValues.flatMap((v) =>
          String(v).split('|').map(Number).filter((n) => Number.isFinite(n)),
        ),
        license_filter_values: rawLicenseValues,
        license_ids: rawLicenseValues.flatMap((v) =>
          String(v).split('|').map(Number).filter((n) => Number.isFinite(n)),
        ),
      });
    },
    [],
  );

  const clearAllFilters = useCallback(() => {
    setSummaryStatus(null);
    setColumnFilters(INITIAL_COLUMN_FILTERS);
    setSearchRaw('');
    setShowFavoritesOnlyRaw(false);
    setPage(1);
  }, []);

  const setSearch = useCallback((v: string) => {
    setSearchRaw(v);
    setPage(1);
  }, []);

  const setShowFavoritesOnly = useCallback((v: boolean) => {
    setShowFavoritesOnlyRaw(v);
    setPage(1);
  }, []);

  return {
    queryParams,
    page,
    pageSize,
    search,
    summaryStatus,
    columnFilters,
    showFavoritesOnly,
    handleSummaryClick,
    handleTableChange,
    clearAllFilters,
    setSearch,
    setShowFavoritesOnly,
  };
}
