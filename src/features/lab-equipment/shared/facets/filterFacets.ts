import type { Key } from 'react';

export interface FilterFacetOption {
  label: string;
  value: Key;
}

export type FilterFacets = Record<string, FilterFacetOption[]>;

/**
 * Normalize the open-ended `data.filters` contract returned by the API.
 * Supports common facet forms: arrays of values/options, and objects with
 * `options`, `choices`, `values`, or `buckets` arrays. It also accepts generic
 * count maps commonly used by faceted-filter APIs. Unknown shapes are omitted
 * rather than becoming misleading empty filters.
 */
export function normalizeFilterFacets(response: unknown): FilterFacets {
  const root = asRecord(response);
  const data = asRecord(root?.data) ?? root;
  const rawFacets = asRecord(data?.filters) ?? (Array.isArray(data?.filters) ? data.filters : undefined);
  if (!rawFacets) return {};

  const result: FilterFacets = {};
  const entries: Array<[string, unknown]> = Array.isArray(rawFacets)
    ? rawFacets.flatMap((facet) => {
        const item = asRecord(facet);
        const key = item?.key ?? item?.name ?? item?.field ?? item?.field_name;
        return typeof key === 'string' ? [[key, item]] : [];
      })
    : Object.entries(rawFacets);

  for (const [key, rawFacet] of entries) {
    const options = normalizeFacetOptions(rawFacet);
    if (options.length > 0) result[key] = options;
  }
  return result;
}

export function getFacetOptions(
  facets: FilterFacets | undefined,
  ...keys: string[]
): FilterFacetOption[] | undefined {
  if (!facets) return undefined;
  for (const key of keys) {
    const options = facets[key];
    if (options?.length) return options;
  }
  return undefined;
}

export function facetToAntdFilters(options: FilterFacetOption[] | undefined) {
  return options?.map(({ label, value }) => ({ text: label, value }));
}

function normalizeFacetOptions(rawFacet: unknown): FilterFacetOption[] {
  const direct = Array.isArray(rawFacet)
    ? rawFacet
    : (() => {
        const facet = asRecord(rawFacet);
        if (!facet) return [];
        for (const key of ['options', 'choices', 'values', 'buckets', 'results', 'facets', 'items']) {
          if (Array.isArray(facet[key])) return facet[key] as unknown[];
        }
        if (Array.isArray(facet.data)) return facet.data as unknown[];
        if (Array.isArray(facet.choices)) return facet.choices as unknown[];
        const counts = asRecord(facet.counts);
        if (counts) return Object.entries(counts).map(([value, count]) => ({ value, label: value, count }));
        const valueCounts = facet.value_counts;
        if (Array.isArray(valueCounts)) return valueCounts as unknown[];
        const valueCountMap = asRecord(valueCounts);
        if (valueCountMap) return Object.entries(valueCountMap).map(([value, count]) => ({ value, label: value, count }));
        return [];
      })();

  const options: FilterFacetOption[] = [];
  const seen = new Set<string>();
  for (const rawOption of direct) {
    const item = asRecord(rawOption);
    const value = item ? item.value ?? item.id ?? item.key ?? item.slug ?? item.code ?? item.pk : rawOption;
    const label = item
      ? item.label ?? item.name ?? item.title ?? item.display_name ?? item.text ?? item.value ?? item.id ?? item.key ?? item.slug ?? item.code ?? item.pk
      : rawOption;
    if ((typeof value !== 'string' && typeof value !== 'number') || value === '') continue;
    if (typeof label !== 'string' && typeof label !== 'number') continue;
    const identity = `${typeof value}:${String(value)}`;
    if (seen.has(identity)) continue;
    seen.add(identity);
    options.push({ label: String(label), value });
  }
  return options;
}

function asRecord(value: unknown): Record<string, unknown> | undefined {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? value as Record<string, unknown>
    : undefined;
}
