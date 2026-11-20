import { Select } from 'antd';
import { useMemo } from 'react';
import { equipmentPagedConfig, usePagedOptions } from '@/shared/hooks/usePagedOptions';

interface EquipmentSelectProps {
  value?: number | null;
  onChange?: (value: number | null) => void;
  /** Shown while the current value is not in the loaded options. */
  currentLabel?: string;
  placeholder?: string;
  allowClear?: boolean;
}

/** Pick an item from the equipment inventory (the inventory asset of a device or sensor, a gateway PC). */
export function EquipmentSelect({ value, onChange, currentLabel, placeholder, allowClear }: EquipmentSelectProps) {
  const equipment = usePagedOptions(equipmentPagedConfig);
  const options = useMemo(() => {
    const items = [...equipment.options];
    if (value != null && !items.some((item) => item.value === value)) {
      items.unshift({ value, label: currentLabel ?? `Equipment #${value}` });
    }
    return items;
  }, [equipment.options, value, currentLabel]);

  return (
    <Select<number>
      {...equipment.selectProps}
      allowClear={allowClear}
      placeholder={placeholder ?? 'Choose, or type a name or SKU'}
      value={value ?? undefined}
      options={options}
      onChange={(next) => onChange?.(next ?? null)}
    />
  );
}

export default EquipmentSelect;
