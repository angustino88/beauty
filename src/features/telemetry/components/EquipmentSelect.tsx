import { Select } from 'antd';
import { useMemo, useState } from 'react';
import { skipToken } from '@reduxjs/toolkit/query';
import { useDebouncedValue } from '@/shared/hooks/useDebouncedValue';
import { useGetTargetOptionsQuery } from '../api';

interface EquipmentSelectProps {
  value?: number | null;
  onChange?: (value: number | null) => void;
  /** Shown while the current value is not in the latest search results. */
  currentLabel?: string;
  placeholder?: string;
  allowClear?: boolean;
}

/** Search the equipment inventory by name or SKU (the inventory asset of a device or sensor). */
export function EquipmentSelect({ value, onChange, currentLabel, placeholder, allowClear }: EquipmentSelectProps) {
  const [search, setSearch] = useState('');
  const q = useDebouncedValue(search, 300).trim();
  const { data, isFetching } = useGetTargetOptionsQuery(q ? { type: 'equipment', q } : skipToken);
  const options = useMemo(() => {
    const items = (data ?? []).map((item) => ({ value: item.id, label: item.sku ? `${item.name} · ${item.sku}` : item.name }));
    if (value != null && !items.some((item) => item.value === value)) {
      items.unshift({ value, label: currentLabel ?? `Equipment #${value}` });
    }
    return items;
  }, [data, value, currentLabel]);

  return (
    <Select<number>
      showSearch={{ filterOption: false, onSearch: setSearch }}
      allowClear={allowClear}
      loading={isFetching}
      placeholder={placeholder ?? 'Type a name or SKU'}
      notFoundContent={q ? (isFetching ? 'Searching…' : 'No match') : 'Type a name or SKU'}
      value={value ?? undefined}
      options={options}
      onChange={(next) => onChange?.(next ?? null)}
    />
  );
}

export default EquipmentSelect;
