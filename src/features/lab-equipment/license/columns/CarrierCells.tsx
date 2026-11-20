import { Select, Spin } from 'antd';
import type { UIEventHandler } from 'react';
import type { EquipmentOption } from '../hooks/useEquipmentSearchOptions';
import type { IAssignedEquipment } from '../types';

const stack = { display: 'flex', flexDirection: 'column', gap: 6 } as const;
const muted = { color: 'var(--lm-text-tertiary)' } as const;

/** SKU in bold with the name in grey beneath it. */
function TwoLine({ sku, name }: { sku: string; name?: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.3 }}>
      <strong>{sku}</strong>
      {name ? <span style={{ ...muted, fontSize: 12 }}>{name}</span> : null}
    </div>
  );
}

interface CarrierCellProps {
  assigned: IAssignedEquipment[];
  editing: boolean;
  value: number[];
  onChange: (ids: number[]) => void;
  seats?: number | null;
  options: EquipmentOption[];
  onSearch: (query: string) => void;
  onOpenChange: (open: boolean) => void;
  onPopupScroll: UIEventHandler<HTMLDivElement>;
  /** Shown under the options while more pages exist. */
  moreHint: string | null;
  loading: boolean;
  emptyText: string;
}

/** License carrier: the equipment holding the license's seats; while editing, a searchable multi-select. */
export function CarrierCell({ assigned, editing, value, onChange, seats, options, onSearch, onOpenChange, onPopupScroll, moreHint, loading, emptyText }: CarrierCellProps) {
  if (editing) {
    return (
      <Select
        mode="multiple"
        allowClear
        showSearch
        filterOption={false}
        style={{ width: '100%' }}
        placeholder="Pick equipment, or type a SKU or name"
        notFoundContent={loading ? <Spin size="small" /> : emptyText}
        loading={loading}
        onOpenChange={onOpenChange}
        onPopupScroll={onPopupScroll}
        popupRender={(menu) => (
          <>
            {menu}
            {moreHint && <div style={{ ...muted, padding: '6px 12px', fontSize: 12 }}>{moreHint}</div>}
          </>
        )}
        value={value}
        options={options}
        // Picked items show the SKU; the dropdown rows show SKU with the name beneath.
        optionRender={(option) => <TwoLine sku={String(option.label)} name={(option.data as EquipmentOption).name} />}
        onSearch={onSearch}
        onChange={(ids: number[]) => onChange(ids)}
        maxCount={seats ?? undefined}
      />
    );
  }
  if (assigned.length === 0) return <span style={muted}>Not assigned</span>;
  return (
    <div style={stack}>
      {assigned.map((item) => <TwoLine key={item.id} sku={item.sku || `#${item.id}`} name={item.name} />)}
    </div>
  );
}
