import { useMemo, useState } from 'react';
import type { ReactElement, UIEvent } from 'react';
import { skipToken } from '@reduxjs/toolkit/query';
import { useDebouncedValue } from '@/shared/hooks/useDebouncedValue';
import {
  useGetPagedOptionsInfiniteQuery,
  type PagedOptionsParams,
} from '@/shared/api/pagedOptionsApi';

/** Load the next page when the list is scrolled to within this many pixels of its end. */
const LOAD_MORE_THRESHOLD_PX = 48;

export interface PagedOption {
  value: number;
  label: string;
}

interface UsePagedOptionsConfig<Row, Option extends PagedOption> {
  /** A paginated list endpoint, e.g. `/api/labs/equipment`. */
  path: string;
  /** Extra filters sent with every page. */
  params?: PagedOptionsParams;
  /** Query parameter the typed text is sent in. */
  searchParam?: string;
  /** False keeps the select idle (e.g. while another kind is chosen). */
  enabled?: boolean;
  /** Load as soon as the component mounts instead of when the dropdown first opens. */
  eager?: boolean;
  /** Plural noun for messages, e.g. "equipment", "licenses". */
  noun?: string;
  toOption: (row: Row) => Option;
}

/**
 * Options for a select box backed by a paginated list.
 *
 * The first page loads when the dropdown opens, the next pages load as the user scrolls, so every
 * item can be reached without typing; typing narrows the list on the server. A footer under the list
 * shows "50 of 120 shown · scroll down for more" until everything is loaded.
 *
 * Spread `selectProps` onto an antd `Select` (it sets search, loading, scroll and popup handlers).
 */
export function usePagedOptions<Row extends { id: number }, Option extends PagedOption = PagedOption>({
  path,
  params,
  searchParam = 'q',
  enabled = true,
  eager = false,
  noun = 'items',
  toOption,
}: UsePagedOptionsConfig<Row, Option>) {
  const [search, setSearch] = useState('');
  const [opened, setOpened] = useState(eager);
  const q = useDebouncedValue(search.trim(), 300);
  const { data, isFetching, isFetchingNextPage, isError, hasNextPage, fetchNextPage } = useGetPagedOptionsInfiniteQuery(
    enabled && opened ? { path, params: { ...params, [searchParam]: q || undefined } } : skipToken,
  );

  const options = useMemo<Option[]>(() => {
    const seen = new Set<number>();
    const items: Option[] = [];
    for (const page of data?.pages ?? []) {
      for (const row of page.data as unknown as Row[]) {
        if (seen.has(row.id)) continue;
        seen.add(row.id);
        items.push(toOption(row));
      }
    }
    return items;
    // toOption is usually an inline function; the rows decide the options.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  const total = data?.pages[0]?.meta?.pagination?.count;
  const loadingFirstPage = isFetching && !isFetchingNextPage;

  const emptyText = loadingFirstPage
    ? 'Loading…'
    : isError
      ? `Could not load ${noun}. Type to try again.`
      : q
        ? `Nothing matches "${q}".`
        : `No ${noun} found.`;

  const footer = options.length === 0
    ? null
    : isFetchingNextPage
      ? `Loading more… (${options.length} of ${total ?? '?'})`
      : hasNextPage
        ? `${options.length} of ${total ?? '?'} shown · scroll down for more`
        : null;

  const onPopupScroll = (event: UIEvent<HTMLDivElement>) => {
    if (!hasNextPage || isFetching) return;
    const target = event.currentTarget;
    if (target.scrollTop + target.clientHeight >= target.scrollHeight - LOAD_MORE_THRESHOLD_PX) {
      void fetchNextPage();
    }
  };
  const onOpenChange = (open: boolean) => { if (open) setOpened(true); };
  const popupRender = (menu: ReactElement) => (
    <>
      {menu}
      {footer && (
        <div style={{ padding: '6px 12px', fontSize: 12, color: 'var(--ant-color-text-secondary, rgba(0,0,0,0.45))' }}>
          {footer}
        </div>
      )}
    </>
  );

  return {
    options,
    loading: isFetching,
    emptyText,
    footer,
    onSearch: setSearch,
    onOpenChange,
    onPopupScroll,
    popupRender,
    /** Clear the typed text (e.g. after the kind of item changed). */
    reset: () => setSearch(''),
    selectProps: {
      showSearch: { filterOption: false, onSearch: setSearch },
      loading: isFetching,
      notFoundContent: emptyText,
      onOpenChange,
      onPopupScroll,
      popupRender,
    },
  };
}

/** Standard label: "Name · SKU" (just one when they are equal or one is missing). */
export function nameSkuLabel(row: { id: number; name?: string | null; sku?: string | null }): string {
  const name = row.name ?? '';
  const sku = row.sku ?? '';
  return sku && sku !== name ? (name ? `${name} · ${sku}` : sku) : name || sku || `#${row.id}`;
}

/** Equipment rows as select options (`/api/labs/equipment`). */
export const equipmentPagedConfig = {
  path: '/api/labs/equipment',
  noun: 'equipment',
  toOption: (row: { id: number; name?: string | null; sku?: string | null }): PagedOption => ({ value: row.id, label: nameSkuLabel(row) }),
};
