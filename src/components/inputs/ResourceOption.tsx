/* eslint-disable react-refresh/only-export-components */
import type { ReactNode } from 'react';
import styles from './ResourceOption.module.css';

/**
 * Select options for resources (rooms, stations, benches, equipment): the SKU on the first line, the name on the
 * second, so both are readable at a glance in the open list. A tooltip alone hides the name until hover and does
 * not work on touch screens; it is kept only as the native `title` for text that is cut off.
 *
 * The closed Select shows the short `selectedLabel` ("SKU · Name"): pass `optionLabelProp="selectedLabel"`.
 * Search uses `searchText` (SKU, name and any extra words): pass `filterOption={filterResourceOption}`.
 */
export interface ResourceOptionSource {
  id: number;
  sku?: string | null;
  name?: string | null;
  /** Extra searchable words that are not shown, e.g. hostnames. */
  keywords?: Array<string | null | undefined>;
}

export interface ResourceSelectOption {
  value: number;
  label: ReactNode;
  title: string;
  selectedLabel: string;
  searchText: string;
}

interface ResourceOptionLabelProps {
  sku?: string | null;
  name?: string | null;
  /** Shown beside the SKU, e.g. the computers on a bench. */
  aside?: ReactNode;
  /** A third, muted line. */
  detail?: ReactNode;
}

export function ResourceOptionLabel({ sku, name, aside, detail }: ResourceOptionLabelProps) {
  const primary = sku || name || '—';
  const secondary = sku && name && name !== sku ? name : null;
  return (
    <span className={styles.option}>
      <span className={styles.primaryLine}>
        <span className={styles.primary}>{primary}</span>
        {aside}
      </span>
      {secondary && <span className={styles.secondary}>{secondary}</span>}
      {detail && <span className={styles.detail}>{detail}</span>}
    </span>
  );
}

export const resourceText = (sku?: string | null, name?: string | null): string =>
  [sku, name && name !== sku ? name : null].filter(Boolean).join(' · ');

export function toResourceOption(
  item: ResourceOptionSource,
  extra: Pick<ResourceOptionLabelProps, 'aside' | 'detail'> & { title?: string; selectedLabel?: string } = {},
): ResourceSelectOption {
  const text = resourceText(item.sku, item.name) || String(item.id);
  return {
    value: item.id,
    label: <ResourceOptionLabel sku={item.sku} name={item.name} aside={extra.aside} detail={extra.detail} />,
    title: extra.title ?? text,
    selectedLabel: extra.selectedLabel ?? text,
    searchText: [item.sku, item.name, ...(item.keywords ?? [])].filter(Boolean).join(' ').toLowerCase(),
  };
}

/** `filterOption` for resource options: matches SKU, name and keywords; falls back to a plain string label. */
export const filterResourceOption = (input: string, option?: { searchText?: string; label?: unknown }): boolean => {
  const query = input.trim().toLowerCase();
  if (!query) return true;
  const haystack = option?.searchText ?? (typeof option?.label === 'string' ? option.label.toLowerCase() : '');
  return haystack.includes(query);
};
