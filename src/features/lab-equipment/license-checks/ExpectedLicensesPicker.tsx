import { useState } from 'react';
import { Select } from 'antd';
import { skipToken } from '@reduxjs/toolkit/query';
import { useLabsLicensesRetrieveQuery } from '@/shared/api/generated/api';

export interface PickedLicense {
  id: number;
  name: string;
}

/** Licenses a check should find; one no run reports is flagged missing and its owner is warned. */
export function ExpectedLicensesPicker({ value, onChange }: { value: PickedLicense[]; onChange: (next: PickedLicense[]) => void }) {
  const [search, setSearch] = useState('');
  const q = search.trim();
  const { data, isFetching } = useLabsLicensesRetrieveQuery(q.length >= 2 ? { q, pageSize: 20 } : skipToken);
  const known = new Map(value.map((item) => [item.id, item.name]));
  (data?.data ?? []).forEach((row) => known.set(row.id, row.sku ? `${row.name} · ${row.sku}` : row.name));
  return (
    <Select
      mode="multiple"
      showSearch
      aria-label="Expected licenses"
      placeholder="Search licenses by name, SKU or serial"
      filterOption={false}
      onSearch={setSearch}
      loading={isFetching}
      value={value.map((item) => item.id)}
      onChange={(ids: number[]) => onChange(ids.map((id) => ({ id, name: known.get(id) ?? `#${id}` })))}
      options={[...known.entries()].map(([id, name]) => ({ value: id, label: name }))}
      notFoundContent={q.length < 2 ? 'Type at least 2 characters' : 'No license found'}
    />
  );
}
