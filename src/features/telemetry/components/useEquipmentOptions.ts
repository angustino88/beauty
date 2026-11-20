import { useMemo, useState } from 'react';
import type { UIEvent } from 'react';
import { useDebouncedValue } from '@/shared/hooks/useDebouncedValue';
import { useGetEquipmentPickerPagesInfiniteQuery } from '../api';

export interface EquipmentOptionItem {
  value: number;
  label: string;
}

/** Load the next page when the list is scrolled to within this many pixels of its end. */
const LOAD_MORE_THRESHOLD_PX = 48;

/**
 * Equipment options for the telemetry pickers (inventory asset, gateway PC, equipment target).
 *
 * Browses the paginated equipment list rather than `/api/labs/equipment/options`: that selector is a
 * large catalog and refuses to answer without a search term, so the dropdown stayed empty until the
 * user typed. Here the first page shows as soon as the dropdown opens and the next pages load as the
 * user scrolls, so every item can be reached without typing; typing narrows the list.
 * Nothing is requested until the dropdown is opened once.
 */
export function useEquipmentOptions({ enabled = true }: { enabled?: boolean } = {}) {
  const [search, setSearch] = useState('');
  const [opened, setOpened] = useState(false);
  const q = useDebouncedValue(search.trim(), 300);
  const { data, isFetching, isFetchingNextPage, isError, hasNextPage, fetchNextPage } =
    useGetEquipmentPickerPagesInfiniteQuery({ q: q || undefined }, { skip: !enabled || !opened });

  const options = useMemo<EquipmentOptionItem[]>(() => {
    const seen = new Set<number>();
    const items: EquipmentOptionItem[] = [];
    for (const page of data?.pages ?? []) {
      for (const item of page.data) {
        if (seen.has(item.id)) continue;
        seen.add(item.id);
        const name = item.name ?? '';
        const sku = item.sku ?? '';
        items.push({ value: item.id, label: sku && sku !== name ? `${name} · ${sku}` : name || sku || `#${item.id}` });
      }
    }
    return items;
  }, [data]);

  const total = data?.pages[0]?.meta?.pagination?.count;
  const loadingFirstPage = isFetching && !isFetchingNextPage;

  const emptyText = loadingFirstPage
    ? 'Loading…'
    : isError
      ? 'Could not load equipment. Type a name or SKU to try again.'
      : q
        ? `No equipment matches "${q}".`
        : 'No equipment registered yet.';

  // Footer under the list: progress while more pages exist, so nothing looks missing.
  const footer = options.length === 0
    ? null
    : isFetchingNextPage
      ? `Loading more… (${options.length} of ${total ?? '?'})`
      : hasNextPage
        ? `${options.length} of ${total ?? '?'} shown · scroll down for more`
        : null;

  const onPopupScroll = (event: UIEvent<HTMLDivElement>) => {
    const target = event.currentTarget;
    if (!hasNextPage || isFetching) return;
    if (target.scrollTop + target.clientHeight >= target.scrollHeight - LOAD_MORE_THRESHOLD_PX) {
      void fetchNextPage();
    }
  };

  return {
    options,
    loading: isFetching,
    emptyText,
    footer,
    onPopupScroll,
    onSearch: setSearch,
    reset: () => setSearch(''),
    onOpenChange: (open: boolean) => { if (open) setOpened(true); },
  };
}
