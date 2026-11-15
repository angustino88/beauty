import { Select } from 'antd';
import type { EquipmentOption } from '../hooks/useEquipmentSearchOptions';
import type { IAssignedEquipment } from '../types';

/** One item per line in both carrier columns, in the same order, so SKU and name stay on one row. */
const stack = { display: 'flex', flexDirection: 'column', gap: 2 } as const;
const muted = { color: 'var(--lm-text-tertiary)' } as const;

interface SkuCellProps {
  assigned: IAssignedEquipment[];
  editing: boolean;
  value: number[];
  onChange: (ids: number[]) => void;
  seats?: number | null;
  options: EquipmentOption[];
  onSearch: (query: string) => void;
  loading: boolean;
}

/** Carrier SKU: the equipment holding the license's seats; while editing, the searchable multi-select. */
export function CarrierSkuCell({ assigned, editing, value, onChange, seats, options, onSearch, loading }: SkuCellProps) {
  if (editing) {
    return (
      <Select
        mode="multiple"
        allowClear
        showSearch
        filterOption={false}
        style={{ width: '100%' }}
        placeholder="Type to search equipment"
        notFoundContent="Type a SKU or name to find equipment"
        loading={loading}
        value={value}
        options={options}
        // Options show the SKU only; hovering one (or a picked tag) reveals the name.
        onSearch={onSearch}
        onChange={(ids: number[]) => onChange(ids)}
        maxCount={seats ?? undefined}
      />
    );
  }
  if (assigned.length === 0) return <span style={muted}>Not assigned</span>;
  return (
    <div style={stack}>
      {assigned.map((item) => <span key={item.id}>{item.sku || `#${item.id}`}</span>)}
    </div>
  );
}

interface NameCellProps {
  assigned: IAssignedEquipment[];
  editing: boolean;
  value: number[];
  options: EquipmentOption[];
}

/** Carrier Name: the names matching the SKUs next to it; while editing it follows the current selection. */
export function CarrierNameCell({ assigned, editing, value, options }: NameCellProps) {
  const names = editing
    ? value.map((id) => options.find((option) => option.value === id)?.name ?? assigned.find((item) => item.id === id)?.name ?? '')
    : assigned.map((item) => item.name);
  if (names.length === 0) return <span style={muted}>—</span>;
  return (
    <div style={stack}>
      {names.map((name, index) => <span key={index}>{name || '—'}</span>)}
    </div>
  );
}
