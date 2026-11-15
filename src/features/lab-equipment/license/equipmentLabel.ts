/** One label for an equipment item everywhere in the license screens: "SKU · Name". */
export const equipmentLabel = (item: { sku?: string | null; name?: string | null; id: number }): string => {
  const sku = item.sku?.trim();
  const name = item.name?.trim();
  if (sku && name) return `${sku} · ${name}`;
  return sku || name || `#${item.id}`;
};
