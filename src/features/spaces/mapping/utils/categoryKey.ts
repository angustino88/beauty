import type { EquipmentCategoryKey } from '../../../lab-equipment/types/equipment.ts';

/** Category keys that have an equipment page at /lab-equipment/<key>. */
export const EQUIPMENT_CATEGORY_KEYS: readonly EquipmentCategoryKey[] = [
  'computing', 'display', 'debugging', 'networking', 'power', 'accessory',
  'sample', 'furniture', 'instrument', 'laboratory', 'mechanical', 'other',
];

const isKnownKey = (value: string): value is EquipmentCategoryKey =>
  (EQUIPMENT_CATEGORY_KEYS as readonly string[]).includes(value);

/** "Accessories", " Computing " → "accessory", "computing"; anything else → null. */
function keyFromName(name: string | null | undefined): EquipmentCategoryKey | null {
  const text = (name ?? '').trim().toLowerCase();
  if (!text) return null;
  if (isKnownKey(text)) return text;
  const singular = text.replace(/ies$/, 'y').replace(/s$/, '');
  return isKnownKey(singular) ? singular : null;
}

/**
 * The page key of an equipment category. The category id is matched against the reference data
 * (id → stable key) first, because names are editable; the name is only a fallback. Unknown
 * categories return null, so callers show them without linking to a wrong page.
 */
export function resolveCategoryKey(
  category: { id?: number | null; name?: string | null } | null | undefined,
  keyById: ReadonlyMap<number, string>,
): EquipmentCategoryKey | null {
  if (!category) return null;
  const byId = category.id != null ? keyById.get(category.id) : undefined;
  if (byId && isKnownKey(byId)) return byId;
  return keyFromName(category.name);
}
