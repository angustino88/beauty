import { skipToken } from '@reduxjs/toolkit/query';
import {
  useLabsEquipmentOptionsRetrieveQuery,
  useLabsRoomsOptionsRetrieveQuery,
  useUsersRetrieveQuery,
} from '@/shared/api/generated/api';
import {
  mapRoomOptions,
  mapUserOptions,
} from './mapper';

interface IUserOption {
  id: number;
  username: string;
  display_name?: string;
}

export interface IRackListOption {
  id: number;
  sku: string;
  name: string;
}

export interface IRoomOption {
  id: number;
  sku: string;
  name: string;
}

export interface ILabEquipmentSkuItem {
  id: number;
  sku?: string;
  name?: string;
}

export type ILabEquipmentSkuList = Record<string, ILabEquipmentSkuItem[]>;

/** Furniture options filtered by their catalog category; no undocumented rack relationship is inferred. */
export function useGetRacksWithLabListQuery(categoryId?: number) {
  const result = useLabsEquipmentOptionsRetrieveQuery(categoryId ? { categoryId } : skipToken);
  return { ...result, data: result.data?.data.map(({ id, sku, name }) => ({ id, sku: sku ?? '', name })) as IRackListOption[] | undefined };
}

export function useGetUsersQuery() {
  const result = useUsersRetrieveQuery({});
  return { ...result, data: result.data === undefined ? undefined : mapUserOptions(result.data) };
}

export function useGetRoomsForDropdownQuery() {
  const result = useLabsRoomsOptionsRetrieveQuery({});
  return { ...result, data: result.data === undefined ? undefined : mapRoomOptions(result.data) };
}

export type { IUserOption };
