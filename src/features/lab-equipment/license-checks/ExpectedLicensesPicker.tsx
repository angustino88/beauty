import { Select } from 'antd';
import { nameSkuLabel, usePagedOptions } from '@/shared/hooks/usePagedOptions';

export interface PickedLicense {
  id: number;
  name: string;
}

/** Licenses a check should find; one no run reports is flagged missing and its owner is warned. */
export function ExpectedLicensesPicker({ value, onChange }: { value: PickedLicense[]; onChange: (next: PickedLicense[]) => void }) {
  // Licenses load when the list opens and page in as the user scrolls; typing narrows them.
  const licenses = usePagedOptions({
    path: '/api/labs/licenses',
    noun: 'licenses',
    toOption: (row: { id: number; name?: string | null; sku?: string | null }) => ({ value: row.id, label: nameSkuLabel(row) }),
  });
  const known = new Map(value.map((item) => [item.id, item.name]));
  licenses.options.forEach((option) => known.set(option.value, option.label));
  return (
    <Select
      mode="multiple"
      {...licenses.selectProps}
      aria-label="Expected licenses"
      placeholder="Choose licenses, or type a name, SKU or serial"
      value={value.map((item) => item.id)}
      onChange={(ids: number[]) => onChange(ids.map((id) => ({ id, name: known.get(id) ?? `#${id}` })))}
      options={[...known.entries()].map(([id, name]) => ({ value: id, label: name }))}
    />
  );
}
