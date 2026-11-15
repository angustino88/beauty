import type { EquipmentCreate, EquipmentDetailRead, EquipmentItemRead, PatchedEquipmentUpdate } from '@/shared/api/generated/api';
import type { EquipmentItem } from '../types/equipment';

const record = (value: unknown): Record<string, unknown> =>
  value !== null && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};

const fields = [
  'sku', 'name', 'kind_id', 'type_id', 'manufacturer_id', 'product_model_id',
  'serial_number', 'log_label', 'details', 'metadata', 'replacement_date',
  'firmware_version', 'power_draw_w', 'weight_kg', 'warranty_end_date',
  'is_calibration_required', 'mac_address', 'channels', 'power_rating', 'dimensions',
  'owner_id', 'department_id', 'group_id', 'material_id', 'size_id',
  'resolution_id', 'protocol_id', 'customer_id', 'interfaces_ids', 'characteristics_ids',
] as const;

export function equipmentWriteBody(input: Record<string, unknown>, create: true): EquipmentCreate;
export function equipmentWriteBody(input: Record<string, unknown>, create: false): PatchedEquipmentUpdate;
export function equipmentWriteBody(input: Record<string, unknown>, create: boolean) {
  const body: Record<string, unknown> = {};
  for (const key of fields) {
    if (input[key] !== undefined && input[key] !== '') body[key] = input[key];
  }
  if (typeof body.weight_kg === 'number') body.weight_kg = String(body.weight_kg);
  if (create && typeof input.hostname === 'string' && input.hostname.trim()) {
    body.computing = { hostname: input.hostname.trim() };
  }
  if (create && input.lifecycle_state !== undefined) body.lifecycle_state = input.lifecycle_state;
  if (create && typeof input.sku !== 'string') throw new Error('Equipment SKU is required');
  if (create && typeof input.kind_id !== 'number') throw new Error('Equipment kind is required');
  return body;
}

export function mapEquipmentRead(item: EquipmentItemRead | EquipmentDetailRead): EquipmentItem {
  const computing = item.computing;
  const metadata = record(item.metadata);
  return {
    ...item,
    image: item.image_url ?? null,
    status: item.display_status,
    remark: typeof metadata.remark === 'string' ? metadata.remark : null,
    information: typeof metadata.information === 'string' ? metadata.information : null,
    hostname: computing?.hostname,
    ip_address: computing?.ip_address,
    os_name: computing?.os_name,
    rdp_file: computing?.rdp_file,
    technical_user: computing?.technical_user,
    disk_usage: computing?.disk_usage,
    system_info: computing?.system_info,
    monitored_devices: computing?.monitored_devices,
  } as EquipmentItem;
}