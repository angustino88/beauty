import { Select, Typography } from 'antd';
import { useMemo } from 'react';
import { useEquipmentOptions } from './useEquipmentOptions';

interface EquipmentSelectProps {
  value?: number | null;
  onChange?: (value: number | null) => void;
  /** Shown while the current value is not in the latest search results. */
  currentLabel?: string;
  placeholder?: string;
  allowClear?: boolean;
}

/** Pick an item from the equipment inventory (the inventory asset of a device or sensor, a gateway PC). */
export function EquipmentSelect({ value, onChange, currentLabel, placeholder, allowClear }: EquipmentSelectProps) {
  const equipment = useEquipmentOptions();
  const options = useMemo(() => {
    const items = [...equipment.options];
    if (value != null && !items.some((item) => item.value === value)) {
      items.unshift({ value, label: currentLabel ?? `Equipment #${value}` });
    }
    return items;
  }, [equipment.options, value, currentLabel]);

  return (
    <Select<number>
      showSearch={{ filterOption: false, onSearch: equipment.onSearch }}
      allowClear={allowClear}
      loading={equipment.loading}
      placeholder={placeholder ?? 'Choose, or type a name or SKU'}
      notFoundContent={equipment.emptyText}
      onOpenChange={equipment.onOpenChange}
      onPopupScroll={equipment.onPopupScroll}
      popupRender={(menu) => (
        <>
          {menu}
          {equipment.footer && (
            <Typography.Text type="secondary" style={{ display: 'block', padding: '6px 12px', fontSize: 12 }}>
              {equipment.footer}
            </Typography.Text>
          )}
        </>
      )}
      value={value ?? undefined}
      options={options}
      onChange={(next) => onChange?.(next ?? null)}
    />
  );
}

export default EquipmentSelect;
