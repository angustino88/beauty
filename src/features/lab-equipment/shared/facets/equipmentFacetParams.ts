import type { EquipmentFacetParams } from '../../types/equipment';

export type EquipmentFilterState = Record<string, Array<string | number> | null | undefined>;

const descendants: Record<string, string[]> = {
  kind: ['type', 'manufacturer', 'product_model'],
  type: ['product_model'],
  manufacturer: ['product_model'],
  department: ['group_id'],
};

const dimensionKeys: Partial<Record<EquipmentFacetParams['dimension'], string>> = {
  kind: 'kind', type: 'type', manufacturer: 'manufacturer',
  product_model_id: 'product_model', department_id: 'department', group_id: 'group_id',
};

export function selectedFilterCsv(values: EquipmentFilterState[string]): string | undefined {
  const selected = [...new Set(values?.filter((value) => value != null && value !== '').map(String) ?? [])];
  return selected.length ? selected.join(',') : undefined;
}

/** A parent menu must not constrain itself or be locked by its descendants. */
export function resetDependentFilters<T extends EquipmentFilterState>(previous: T, next: T): T {
  const result = { ...next };
  for (const [parent, children] of Object.entries(descendants)) {
    const before = previous[parent]?.map(String).sort().join(',') ?? '';
    const after = next[parent]?.map(String).sort().join(',') ?? '';
    if (before === after) continue;
    for (const child of children) Object.assign(result, { [child]: null });
  }
  return result;
}

export function buildEquipmentFacetParams(
  dimension: EquipmentFacetParams['dimension'],
  category: string | number | undefined,
  filters: EquipmentFilterState,
  search: string,
): EquipmentFacetParams {
  const ownKey = dimensionKeys[dimension];
  const excluded = new Set(ownKey ? [ownKey, ...(descendants[ownKey] ?? [])] : []);
  const selected = (key: string) => excluded.has(key) ? undefined : selectedFilterCsv(filters[key]);
  const query = search.trim();
  return {
    dimension,
    ...(category != null && category !== '' ? { category: String(category) } : {}),
    kind: selected('kind'),
    type: selected('type'),
    manufacturer: selected('manufacturer'),
    product_model_id: selected('product_model'),
    department_id: selected('department'),
    group_id: selected('group_id'),
    owner_id: selected('owner'),
    status: selected('status'),
    ...(query ? { search: query } : {}),
  };
}