import type { Key } from 'react';
import { nullableNumber } from '../../../shared/utils/resourceReferences.ts';
import { stateFilterParams } from '../shared/resourceStatusFilter.ts';

export type RoomFilters = Record<string, Key[] | null>;
export type RoomLocationField = 'country' | 'city' | 'building';
export type RoomLocationIds = Record<RoomLocationField, number | null>;

export function roomLocationIds(values: Partial<Record<RoomLocationField, unknown>>): RoomLocationIds {
  return {
    country: nullableNumber(values.country),
    city: nullableNumber(values.city),
    building: nullableNumber(values.building),
  };
}

export function selectedRoomLocation(filters: RoomFilters): RoomLocationIds {
  return roomLocationIds({
    country: filters.country?.[0],
    city: filters.city?.[0],
    building: filters.building?.[0],
  });
}

export function updateRoomFilters(previous: RoomFilters, next: RoomFilters): RoomFilters {
  const before = selectedRoomLocation(previous);
  const after = selectedRoomLocation(next);
  if (after.country == null || before.country !== after.country) {
    return { ...next, city: null, building: null };
  }
  if (after.city == null || before.city !== after.city) {
    return { ...next, building: null };
  }
  return next;
}

export function roomFilterParams(filters: RoomFilters) {
  const csv = (key: string) => filters[key]?.length ? filters[key].map(String).join(',') : undefined;
  return {
    ...stateFilterParams(filters),
    country_id: csv('country'),
    city_id: csv('city'),
    building_id: csv('building'),
    owner_id: csv('primary_owner'),
  };
}
