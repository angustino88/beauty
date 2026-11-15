import { useEffect, useMemo, useState } from 'react';
import { useLabsEquipmentOptionsRetrieveQuery } from '@/shared/api/generated/api';
import { useDebouncedValue } from '@/shared/hooks/useDebouncedValue';
import { equipmentLabel } from '../equipmentLabel';

/** One selectable equipment item: `label` for the dropdown, `sku` for the selected tag. */
export type EquipmentOption = { value: number; label: string; sku: string; name: string };

type Known = { id: number; sku?: string; name: string };

/**
 * Search-as-you-type equipment options for a multi-select.
 *
 * The equipment selector is a large catalog: the API answers only when `q` is sent, so nothing is
 * requested until the user types. Items already shown (`known`) and every item seen in earlier
 * searches stay in the list, so selected items keep their SKU and name while the search text changes.
 */
export function useEquipmentSearchOptions(known: readonly Known[] = []) {
  const [search, setSearch] = useState('');
  const query = useDebouncedValue(search.trim(), 300);
  const { data, isFetching } = useLabsEquipmentOptionsRetrieveQuery({ q: query }, { skip: !query });
  const [seen, setSeen] = useState<Record<number, { sku: string; name: string }>>({});

  useEffect(() => {
    if (!data?.data?.length) return;
    // Remember every item the search returned so a picked one keeps its SKU and name afterwards.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSeen((previous) => ({
      ...previous,
      ...Object.fromEntries(data.data.map((item) => [item.id, { sku: item.sku ?? '', name: item.name ?? '' }])),
    }));
  }, [data]);

  const options = useMemo<EquipmentOption[]>(() => {
    const items = new Map<number, { sku: string; name: string }>(
      Object.entries(seen).map(([id, item]) => [Number(id), item]),
    );
    for (const item of known) items.set(item.id, { sku: item.sku ?? '', name: item.name });
    for (const item of data?.data ?? []) items.set(item.id, { sku: item.sku ?? '', name: item.name ?? '' });
    return [...items].map(([value, item]) => ({ value, ...item, label: equipmentLabel({ id: value, ...item }) }));
  }, [seen, known, data]);

  return { options, onSearch: setSearch, loading: isFetching };
}
