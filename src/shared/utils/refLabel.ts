/**
 * Human label for an API value that may be a plain string/number or a reference
 * object such as { id, name }, a user { display_name, username } or a choice
 * { value, label }. Returns '' when nothing displayable is present, so callers
 * never render "[object Object]".
 */
export function refLabel(value: unknown): string {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string') return value.trim();
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (Array.isArray(value)) return value.map(refLabel).filter(Boolean).join(', ');
  if (typeof value === 'object') {
    const record = value as Record<string, unknown>;
    for (const key of ['display_name', 'name', 'label', 'full_name', 'username', 'sku', 'value']) {
      const candidate = record[key];
      if (typeof candidate === 'string' && candidate.trim()) return candidate.trim();
      if (typeof candidate === 'number') return String(candidate);
    }
    const first = [record.first_name, record.last_name].filter((part) => typeof part === 'string' && part).join(' ');
    return first;
  }
  return '';
}
