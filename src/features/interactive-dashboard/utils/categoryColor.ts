const CATEGORY_COLORS = ["#38bdf8", "#a78bfa", "#34d399", "#fbbf24", "#f472b6", "#fb923c", "#2dd4bf"];

/** Stable colour per equipment category name, used for device chips and rack units. */
export function categoryColor(name: string | null | undefined) {
  if (!name) return "#64748b";
  let hash = 0;
  for (const char of name) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return CATEGORY_COLORS[hash % CATEGORY_COLORS.length];
}
