import { Select, Space } from 'antd';
import { useMemo, useState } from 'react';
import { skipToken } from '@reduxjs/toolkit/query';
import { useDebouncedValue } from '@/shared/hooks/useDebouncedValue';
import { equipmentPagedConfig, usePagedOptions } from '@/shared/hooks/usePagedOptions';
import { useGetTargetOptionsQuery } from '../api';
import { TARGET_TYPE_LABEL } from '../format';
import type { TargetType } from '../types';

export interface TargetValue {
  type: TargetType;
  id: number;
  name?: string;
}

interface TargetPickerProps {
  value?: TargetValue | null;
  onChange?: (value: TargetValue | null) => void;
  /** Which kinds of target can be chosen; the first is the default. */
  types?: TargetType[];
  /** Limits the station list to one room (stations are the common choice inside a room). */
  roomId?: number;
  disabled?: boolean;
  placeholder?: string;
}

/** Choose a room, station, bench or equipment item: kind on the left, searchable item on the right. */
export function TargetPicker({
  value,
  onChange,
  types = ['station', 'room', 'bench', 'equipment'],
  roomId,
  disabled,
  placeholder,
}: TargetPickerProps) {
  const [type, setType] = useState<TargetType>(value?.type ?? types[0]);
  const [search, setSearch] = useState('');
  const q = useDebouncedValue(search, 300).trim();
  const isEquipment = type === 'equipment';
  // Rooms, stations and benches are small catalogs (options selector); equipment is a large catalog,
  // browsed through the paginated list so the first page shows before anything is typed.
  const { data, isFetching } = useGetTargetOptionsQuery(
    isEquipment ? skipToken : { type, q: q || undefined, room_id: type === 'station' ? roomId : undefined },
  );
  const equipment = usePagedOptions({ ...equipmentPagedConfig, enabled: isEquipment });

  const options = useMemo(() => {
    const items = isEquipment
      ? [...equipment.options]
      : (data ?? []).map((item) => ({
        value: item.id,
        label: item.sku && item.sku !== item.name ? `${item.name} · ${item.sku}` : item.name,
      }));
    if (value && value.type === type && !items.some((item) => item.value === value.id)) {
      items.unshift({ value: value.id, label: value.name ?? `#${value.id}` });
    }
    return items;
  }, [isEquipment, equipment.options, data, value, type]);

  return (
    <Space.Compact style={{ width: '100%' }}>
      <Select<TargetType>
        aria-label="Target kind"
        style={{ width: 132 }}
        value={type}
        disabled={disabled || types.length === 1}
        options={types.map((item) => ({ value: item, label: TARGET_TYPE_LABEL[item] }))}
        onChange={(next) => {
          setType(next);
          setSearch('');
          equipment.reset();
          onChange?.(null);
        }}
      />
      <Select<number>
        aria-label={`${TARGET_TYPE_LABEL[type]} to choose`}
        style={{ flex: 1, minWidth: 0 }}
        showSearch={{ filterOption: false, onSearch: isEquipment ? equipment.onSearch : setSearch }}
        allowClear
        disabled={disabled}
        loading={isEquipment ? equipment.loading : isFetching}
        placeholder={placeholder ?? (isEquipment ? 'Choose, or type a name or SKU' : `Choose a ${type}`)}
        notFoundContent={isEquipment ? equipment.emptyText : isFetching ? 'Searching…' : 'No match'}
        onOpenChange={isEquipment ? equipment.onOpenChange : undefined}
        onPopupScroll={isEquipment ? equipment.onPopupScroll : undefined}
        popupRender={isEquipment ? equipment.popupRender : undefined}
        value={value && value.type === type ? value.id : undefined}
        options={options}
        onChange={(id) => {
          const option = options.find((item) => item.value === id);
          onChange?.(id == null ? null : { type, id, name: option?.label });
        }}
      />
    </Space.Compact>
  );
}

export default TargetPicker;
