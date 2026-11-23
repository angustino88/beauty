import type { BenchCreate, RoomCreate, StationCreate } from '@/shared/api/generated/api';
import type { FieldConfig } from '@/features/lab-equipment/shared';

import { nullableNumber } from '../../../shared/utils/resourceReferences.ts';

type DetailField<T> = FieldConfig & { name: Extract<keyof T, string>; decimal?: boolean; emptyNumber?: number; readOnly?: boolean };

export const BENCH_DETAILS = [
  { name: 'description', label: 'Description', type: 'textarea' },
  { name: 'documentation_url', label: 'Documentation URL', type: 'text', maxLength: 500 },
  { name: 'criticality', label: 'Criticality', type: 'text', maxLength: 32 },
  { name: 'requested_power_w', label: 'Requested power (W)', type: 'number' },
  { name: 'requested_load_kg', label: 'Requested load (kg)', type: 'number' },
  { name: 'requested_cooling_w', label: 'Requested cooling (W)', type: 'number' },
  { name: 'required_utilities', label: 'Required utilities', type: 'json-object' },
  { name: 'commissioning_date', label: 'Commissioning date', type: 'date' },
] satisfies DetailField<BenchCreate>[];

export const ROOM_DETAILS = [
  { name: 'usable_height_m', label: 'Usable height (m)', type: 'number', decimal: true },
  { name: 'floor_plan_revision', label: 'Floor plan revision', type: 'text', maxLength: 64 },
  { name: 'floor_plan_url', label: 'Floor plan URL', type: 'text', maxLength: 500 },
  { name: 'max_occupancy', label: 'Maximum occupancy', type: 'number' },
  { name: 'cooling_capacity_w', label: 'Cooling capacity (W)', type: 'number' },
  { name: 'network_port_capacity', label: 'Network ports', type: 'number' },
  { name: 'utilities', label: 'Utilities', type: 'json-object' },
] satisfies DetailField<RoomCreate>[];

export const STATION_DETAILS = [
  { name: 'position', label: 'Map Coordinates (X, Y, Z)', type: 'json-object', readOnly: true },
  { name: 'orientation_degrees', label: 'Orientation (degrees)', type: 'number', emptyNumber: 0 },
  { name: 'max_concurrent_users', label: 'Maximum concurrent users', type: 'number' },
  { name: 'usable_surface_mm2', label: 'Usable surface (mm²)', type: 'number' },
  { name: 'power_reserved_w', label: 'Reserved power (W)', type: 'number', emptyNumber: 0 },
  { name: 'cooling_capacity_w', label: 'Cooling capacity (W)', type: 'number' },
  { name: 'utilities', label: 'Utilities', type: 'json-object' },
  { name: 'safety_classification', label: 'Safety classification', type: 'text', maxLength: 64 },
] satisfies DetailField<StationCreate>[];

export function editableDetails(fields: DetailField<Record<string, unknown>>[]): FieldConfig[] {
  return fields.filter((field) => !field.readOnly);
}

export function readDetails(fields: DetailField<Record<string, unknown>>[], record: Record<string, unknown>) {
  return Object.fromEntries(fields
    .filter(({ name }) => name in record)
    .map(({ name, type }) => [name, type === 'number' ? nullableNumber(record[name]) : record[name]]));
}

function normalizeDetail(field: DetailField<Record<string, unknown>>, value: unknown): unknown {
  switch (field.type) {
    case 'number': {
      const number = nullableNumber(value) ?? field.emptyNumber ?? null;
      return field.decimal && number != null ? String(number) : number;
    }
    case 'json-object':
      return value ?? (field.name === 'position' ? null : {});
    case 'date':
      return value || null;
    case 'datetime':
      return value ? new Date(String(value)).toISOString() : null;
    default:
      return value ?? '';
  }
}

/** Keep unchanged values out of PATCH requests and let defaults apply on create. */
export function detailPayload(
  fields: DetailField<Record<string, unknown>>[],
  values: Record<string, unknown>,
  previous: Record<string, unknown> = {},
) {
  return Object.fromEntries(fields.filter((field) => !field.readOnly).flatMap((field) => {
    const next = normalizeDetail(field, values[field.name]);
    const before = normalizeDetail(field, previous[field.name]);
    return JSON.stringify(next) === JSON.stringify(before) ? [] : [[field.name, next]];
  }));
}
