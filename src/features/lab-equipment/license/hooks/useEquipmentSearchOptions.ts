import { useMemo } from 'react';
import { usePagedOptions } from '@/shared/hooks/usePagedOptions';

/** One selectable equipment item: the SKU is shown, the name appears as the hover title. */
export type EquipmentOption = { value: number; label: string; title: string; name: string };

type Known = { id: number; sku?: string; name: string };

const NO_KNOWN: readonly Known[] = [];

const toEquipmentOption = (row: { id: number; sku?: string | null; name?: string | null }): EquipmentOption => ({
  value: row.id,
  label: row.sku || `#${row.id}`,
  title: row.name ?? '',
  name: row.name ?? '',
});

/**
 * Equipment options for the license-carrier multi-select.
 *
 * Browses the paginated equipment list (the `/equipment/options` selector refuses to answer without
 * a search term): the first page loads when the dropdown opens, the next pages load as the user
 * scrolls, so every item can be reached without typing; typing narrows the list.
 */
export function useEquipmentSearchOptions(known: readonly Known[] = NO_KNOWN) {
  const equipment = usePagedOptions({ path: '/api/labs/equipment', noun: 'equipment', toOption: toEquipmentOption });
  const options = useMemo<EquipmentOption[]>(() => {
    // What the server returned so far, plus the carriers already on the row (so they keep their SKU).
    const items = new Map<number, EquipmentOption>();
    for (const option of equipment.options) items.set(option.value, option);
    for (const item of known) if (!items.has(item.id)) items.set(item.id, toEquipmentOption(item));
    return [...items.values()];
  }, [known, equipment.options]);

  return {
    options,
    onSearch: equipment.onSearch,
    onOpenChange: equipment.onOpenChange,
    onPopupScroll: equipment.onPopupScroll,
    loading: equipment.loading,
    emptyText: equipment.emptyText,
    /** "50 of 120 shown · scroll down for more" while more pages exist. */
    moreHint: equipment.footer,
  };
}
