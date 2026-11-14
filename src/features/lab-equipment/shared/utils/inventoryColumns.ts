export const REQUIRED_INVENTORY_COLUMN_KEYS = ['id', 'sku', 'name', 'status', 'actions'];

/** Keep ID visible and first even when a caller supplies a different column order. */
export function getVisibleInventoryColumns<T extends { key?: unknown }>(
  columns: T[],
  enabledKeys?: string[],
  filters: Record<string, readonly unknown[] | null> = {},
): T[] {
  const visible = columns.filter((column) => {
    const key = String(column.key);
    return !enabledKeys || enabledKeys.includes(key) || Boolean(filters[key]?.length)
      || REQUIRED_INVENTORY_COLUMN_KEYS.includes(key);
  });
  return [...visible.filter((column) => column.key === 'id'), ...visible.filter((column) => column.key !== 'id')];
}