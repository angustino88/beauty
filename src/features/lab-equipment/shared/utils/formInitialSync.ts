import dayjs from 'dayjs';
import type { FieldConfig } from '../components/modals/EquipmentFormModal';

export type SelectLikeValue = string | number;
type UnknownRecord = Record<string, unknown>;

export const isRecord = (value: unknown): value is UnknownRecord =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

export const normalizeSelectLikeValue = (value: unknown): SelectLikeValue | undefined => {
  if (typeof value === 'string' || typeof value === 'number') return value;
  if (!isRecord(value)) return undefined;
  const directCandidates = [value.id, value.value, value.pk];
  for (const candidate of directCandidates) {
    if (typeof candidate === 'string' || typeof candidate === 'number') return candidate;
  }
  for (const [key, candidate] of Object.entries(value)) {
    if (key.endsWith('_id') && (typeof candidate === 'string' || typeof candidate === 'number')) {
      return candidate;
    }
  }
  return undefined;
};

export function normalizeFieldInitialValue(
  field: Pick<FieldConfig, 'name' | 'type'>,
  raw: unknown,
): unknown {
  if (field.type === 'date' || field.type === 'datetime' || field.type === 'quarter') {
    return raw ? dayjs(raw as string) : null;
  }
  if (field.type === 'json-object' || field.type === 'json') {
    return raw == null ? undefined : JSON.stringify(raw, null, 2);
  }
  if (field.type === 'select') {
    return normalizeSelectLikeValue(raw) ?? undefined;
  }
  if (field.type === 'multi-select' && Array.isArray(raw)) {
    return raw
      .map((item) => normalizeSelectLikeValue(item))
      .filter((item): item is SelectLikeValue => item !== undefined);
  }
  return raw ?? undefined;
}

export function buildEditFormValues(
  fields: ReadonlyArray<Pick<FieldConfig, 'name' | 'type'>>,
  record: UnknownRecord,
): { formValues: UnknownRecord; rawSnapshot: UnknownRecord } {
  const formValues: UnknownRecord = {};
  const rawSnapshot: UnknownRecord = {};
  for (const field of fields) {
    if (field.type === 'image') continue;
    const raw = record[field.name];
    rawSnapshot[field.name] = raw;
    formValues[field.name] = normalizeFieldInitialValue(field, raw);
  }
  return { formValues, rawSnapshot };
}

function areRawInitialValuesEqual(prev: unknown, next: unknown): boolean {
  if (Object.is(prev, next)) return true;
  if (prev == null || next == null) return false;
  if (Array.isArray(prev) && Array.isArray(next)) {
    if (prev.length !== next.length) return false;
    return prev.every((item, index) => areRawInitialValuesEqual(item, next[index]));
  }
  if (isRecord(prev) && isRecord(next)) {
    try {
      return JSON.stringify(prev) === JSON.stringify(next);
    } catch {
      return false;
    }
  }
  return false;
}

/**
 * Computes form field updates when async initial values (such as a resource's 3D model selection)
 * resolve after an edit modal has already initialized, without overwriting fields the user edited.
 */
export function computeAsyncInitialPatch({
  fields,
  record,
  previousRaw,
  touchedFields,
}: {
  fields: ReadonlyArray<Pick<FieldConfig, 'name' | 'type'>>;
  record: UnknownRecord;
  previousRaw: UnknownRecord;
  touchedFields: ReadonlySet<string>;
}): { patch: UnknownRecord; nextRaw: UnknownRecord } {
  const patch: UnknownRecord = {};
  const nextRaw: UnknownRecord = { ...previousRaw };

  for (const field of fields) {
    if (field.type === 'image') continue;
    const raw = record[field.name];
    const hasPrevious = Object.prototype.hasOwnProperty.call(previousRaw, field.name);
    if (hasPrevious && areRawInitialValuesEqual(previousRaw[field.name], raw)) {
      continue;
    }
    nextRaw[field.name] = raw;
    if (touchedFields.has(field.name)) {
      continue;
    }
    patch[field.name] = normalizeFieldInitialValue(field, raw);
  }

  return { patch, nextRaw };
}
