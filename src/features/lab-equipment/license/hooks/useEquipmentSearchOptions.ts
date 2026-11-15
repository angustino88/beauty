import { useEffect, useMemo, useState } from 'react';
import { useLabsEquipmentOptionsRetrieveQuery } from '@/shared/api/generated/api';
import { useDebouncedValue } from '@/shared/hooks/useDebouncedValue';

export type EquipmentOption = { value: number; label: string };

type Known = { id: number; name: string };

/**
 * Search-as-you-type equipment options for a multi-select.
 *
 * The equipment selector is a large catalog: the API answers only when `q` is sent, so nothing is
 * requested until the user types. Labels already shown (`known`) and every label seen in earlier
 * searches stay in the list, so selected items keep their name while the search text changes.
 */
export function useEquipmentSearchOptions(known: readonly Known[] = []) {
  const [search, setSearch] = useState('');
  const query = useDebouncedValue(search.trim(), 300);
  const { data, isFetching } = useLabsEquipmentOptionsRetrieveQuery({ q: query }, { skip: !query });
  const [seen, setSeen] = useState<Record<number, string>>({});

  useEffect(() => {
    if (!data?.data?.length) return;
    // Remember every label the search returned so a picked item keeps its name afterwards.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSeen((previous) => ({
      ...previous,
      ...Object.fromEntries(data.data.map((item) => [item.id, item.sku ? `${item.name} (${item.sku})` : item.name])),
    }));
  }, [data]);

  const options = useMemo<EquipmentOption[]>(() => {
    const labels = new Map<number, string>(Object.entries(seen).map(([id, label]) => [Number(id), label]));
    for (const item of known) labels.set(item.id, item.name);
    for (const item of data?.data ?? []) {
      labels.set(item.id, item.sku ? `${item.name} (${item.sku})` : item.name);
    }
    return [...labels].map(([value, label]) => ({ value, label }));
  }, [seen, known, data]);

  return { options, onSearch: setSearch, loading: isFetching };
}
