import type { UsersRetrieveApiResponse } from '@/shared/api/generated/api';
import type {
  ILabEquipmentSkuItem,
  ILabEquipmentSkuList,
  IRoomOption,
} from './dropdownApi';

type RecordValue = Record<string, unknown>;

const asRecord = (value: unknown): RecordValue =>
  typeof value === 'object' && value !== null && !Array.isArray(value)
    ? (value as RecordValue)
    : {};
const asNumber = (value: unknown): number =>
  typeof value === 'number' ? value : Number(value);
const asString = (value: unknown): string => (typeof value === 'string' ? value : '');

export function mapRoomOptions(response: unknown): IRoomOption[] {
  const envelope = asRecord(response);
  const rooms = Array.isArray(envelope.data) ? envelope.data : [];
  return rooms.flatMap((item) => {
    const room = asRecord(item);
    const id = asNumber(room.id);
    const name = asString(room.name);
    if (!Number.isFinite(id) || !name.trim()) return [];
    return [{ id, sku: asString(room.sku), name }];
  });
}

export function mapUserOptions(response: UsersRetrieveApiResponse) {
  const data = Array.isArray(response?.data) ? response.data : [];
  return data.map((user) => ({
    id: user.id,
    username: user.username,
    ...(user.display_name ? { display_name: user.display_name } : {}),
  }));
}

export function mapEquipmentOptions(
  response: unknown,
  group: string,
): ILabEquipmentSkuList {
  const envelope = asRecord(response);
  const items = Array.isArray(envelope.data) ? envelope.data : [];
  const options = items.flatMap((item): ILabEquipmentSkuItem[] => {
    const record = asRecord(item);
    const id = asNumber(record.id);
    if (!Number.isFinite(id)) return [];
    return [{
      id,
      ...(typeof record.sku === 'string' ? { sku: record.sku } : {}),
      ...(typeof record.name === 'string' ? { name: record.name } : {}),
    }];
  });
  return { [group]: options };
}
