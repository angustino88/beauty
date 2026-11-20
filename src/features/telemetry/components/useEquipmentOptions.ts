import { useMemo, useState } from 'react';
import { useLabsEquipmentRetrieveQuery } from '@/shared/api/generated/api';
import { useDebouncedValue } from '@/shared/hooks/useDebouncedValue';

/** Rows fetched per request: enough to browse, small enough to stay fast on a large catalog. */
export const EQUIPMENT_PAGE_SIZE = 20;

export interface EquipmentOptionItem {
  value: number;
  label: string;
}

/**
 * Equipment options for the telemetry pickers (inventory asset, gateway PC, equipment target).
 *
 * Uses the paginated equipment list rather than `/api/labs/equipment/options`: that selector is a
 * large catalog and refuses to answer without a search term, so the dropdown stayed empty until the
 * user typed. The list answers with the first page as soon as the dropdown opens, then with the first
 * page of matches while the user types. Nothing is requested until the dropdown is opened once.
 */
export function useEquipmentOptions({ enabled = true }: { enabled?: boolean } = {}) {
  const [search, setSearch] = useState('');
  const [opened, setOpened] = useState(false);
  const q = useDebouncedValue(search.trim(), 300);
  const { data, isFetching, isError } = useLabsEquipmentRetrieveQuery(
    { q: q || undefined, page: 1, pageSize: EQUIPMENT_PAGE_SIZE },
    { skip: !enabled || !opened },
  );

  const options = useMemo<EquipmentOptionItem[]>(
    () => (data?.data ?? []).map((item) => {
      const name = item.name ?? '';
      const sku = item.sku ?? '';
      return { value: item.id, label: sku && sku !== name ? `${name} · ${sku}` : name || sku || `#${item.id}` };
    }),
    [data],
  );

  const total = data?.meta?.pagination?.count;
  const emptyText = isFetching
    ? 'Loading…'
    : isError
      ? 'Could not load equipment. Type a name or SKU to try again.'
      : q
        ? `No equipment matches "${q}".`
        : 'No equipment registered yet.';
  // When more items match than one page holds, say so instead of silently cutting the list.
  const moreHint = total != null && total > EQUIPMENT_PAGE_SIZE
    ? `Showing ${EQUIPMENT_PAGE_SIZE} of ${total}. Type a name or SKU to narrow the list.`
    : null;

  return {
    options,
    loading: isFetching,
    emptyText,
    moreHint,
    onSearch: setSearch,
    reset: () => setSearch(''),
    onOpenChange: (open: boolean) => { if (open) setOpened(true); },
  };
}
