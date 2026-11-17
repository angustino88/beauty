import { useMemo, useState } from 'react';
import { useLabsEquipmentRetrieveQuery } from '@/shared/api/generated/api';
import { useDebouncedValue } from '@/shared/hooks/useDebouncedValue';

/** One selectable equipment item: the SKU is shown, the name appears as the hover title. */
export type EquipmentOption = { value: number; label: string; title: string; name: string };

type Known = { id: number; sku?: string; name: string };

/** Rows fetched per request: enough to browse, small enough to stay fast on a large catalog. */
export const EQUIPMENT_PICKER_PAGE_SIZE = 20;

const NO_KNOWN: readonly Known[] = [];

/**
 * Equipment options for the license-carrier multi-select.
 *
 * Uses the paginated equipment list rather than the `/equipment/options` selector: that selector
 * refuses to answer without a search term (large catalog) and rejects short terms that match more
 * than its cap, so the picker showed nothing. The list answers with the first page when the
 * dropdown opens, and with the first page of matches while the user types.
 *
 * Nothing is requested until the dropdown has been opened once (`onOpenChange`).
 */
export function useEquipmentSearchOptions(known: readonly Known[] = NO_KNOWN) {
  const [search, setSearch] = useState('');
  const [active, setActive] = useState(false);
  const query = useDebouncedValue(search.trim(), 300);
  const { data, isFetching, isError } = useLabsEquipmentRetrieveQuery(
    { q: query || undefined, page: 1, pageSize: EQUIPMENT_PICKER_PAGE_SIZE },
    { skip: !active },
  );
  const options = useMemo<EquipmentOption[]>(() => {
    // Only what the server returned for the current search (plus the carriers already on the row).
    // A picked item that leaves the list keeps its SKU: the select caches labels of its values.
    const items = new Map<number, { sku: string; name: string }>();
    for (const item of data?.data ?? []) items.set(item.id, { sku: item.sku ?? '', name: item.name ?? '' });
    for (const item of known) if (!items.has(item.id)) items.set(item.id, { sku: item.sku ?? '', name: item.name });
    return [...items].map(([value, item]) => ({ value, label: item.sku || `#${value}`, title: item.name, name: item.name }));
  }, [known, data]);

  const total = data?.meta?.pagination?.count;

  const emptyText = isError
    ? 'Could not load equipment. Type a SKU or name to try again.'
    : query
      ? `No equipment matches "${query}".`
      : 'No equipment registered yet.';
  // When there are more matches than one page, say so instead of silently cutting the list.
  const moreHint = total != null && total > EQUIPMENT_PICKER_PAGE_SIZE
    ? `Showing ${EQUIPMENT_PICKER_PAGE_SIZE} of ${total}. Type a SKU or name to narrow the list.`
    : null;

  return {
    options,
    onSearch: setSearch,
    onOpenChange: (open: boolean) => { if (open) setActive(true); },
    loading: isFetching,
    emptyText,
    moreHint,
  };
}
