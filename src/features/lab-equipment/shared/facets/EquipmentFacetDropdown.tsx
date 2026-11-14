/* Column-config factory and its private dropdown are intentionally colocated. */
/* eslint-disable react-refresh/only-export-components */
import { useState } from 'react';
import { Alert, Button, Checkbox, Input, Space, Spin, Typography } from 'antd';
import type { FilterDropdownProps } from 'antd/es/table/interface';
import type { EquipmentFacetResponse } from '../../types/equipment';

interface FacetState {
  options?: Array<{ id: string | number; name: string; count?: number }>;
  currentData?: EquipmentFacetResponse;
  isFetching: boolean;
  isError: boolean;
  isUninitialized: boolean;
  refetch: () => unknown;
}

function EquipmentFacetDropdown({ selectedKeys, setSelectedKeys, confirm, clearFilters, facet }: FilterDropdownProps & { facet: FacetState }) {
  const [search, setSearch] = useState('');
  const options = facet.options ?? facet.currentData?.data.flatMap(({ value, equipment_count }) => value
    ? [{ id: value.id, name: value.name, count: equipment_count }] : []) ?? [];
  const visible = options.filter((option) => option.name.toLowerCase().includes(search.trim().toLowerCase()));
  const selected = new Set(selectedKeys.map(String));
  const loading = facet.isFetching || facet.isUninitialized;
  return (
    <div style={{ width: 280, padding: 12 }} onKeyDown={(event) => event.stopPropagation()}>
      <Input aria-label="Search filter options" placeholder="Search options" allowClear value={search} onChange={(event) => setSearch(event.target.value)} />
      <div style={{ maxHeight: 280, overflowY: 'auto', paddingBlock: 12 }}>
        {loading ? <Spin size="small" tip="Loading options" /> : facet.isError ? (
          <Alert type="error" title="Unable to load options" description={<Button size="small" onClick={() => facet.refetch()}>Retry</Button>} />
        ) : visible.length ? visible.map((option) => (
          <div key={option.id} style={{ paddingBlock: 5 }}>
            <Checkbox checked={selected.has(String(option.id))} onChange={(event) => {
              const next = selectedKeys.filter((key) => String(key) !== String(option.id));
              setSelectedKeys(event.target.checked ? [...next, option.id] : next);
            }}>
              {option.name} {option.count != null && <Typography.Text type="secondary">({option.count})</Typography.Text>}
            </Checkbox>
          </div>
        )) : <Typography.Text type="secondary">{search ? 'No matching options' : 'No options for the selected filters'}</Typography.Text>}
      </div>
      <Space style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--lm-border)', paddingTop: 10 }}>
        <Button size="small" disabled={!selectedKeys.length} onClick={() => {
          setSearch('');
          clearFilters?.({ confirm: true, closeDropdown: false });
        }}>Reset</Button>
        <Button size="small" type="primary" disabled={loading || facet.isError} onClick={() => confirm()}>Apply</Button>
      </Space>
    </div>
  );
}

/** Keep the menu accessible even for loading, failed, or empty facet responses. */
export function equipmentFacetColumnFilter(facet: FacetState) {
  return {
    filterDropdown: (props: FilterDropdownProps) => <EquipmentFacetDropdown {...props} facet={facet} />,
  };
}

export function equipmentStaticColumnFilter(options?: Array<{ text: unknown; value: string | number | bigint | boolean }>) {
  return equipmentFacetColumnFilter({
    options: options?.flatMap(({ text, value }) => typeof value === 'boolean' ? [] : [{ id: String(value), name: String(text) }]) ?? [],
    isFetching: false, isError: false, isUninitialized: false, refetch: () => undefined,
  });
}