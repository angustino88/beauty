import { getApiErrorMessage, notify, type ToastDetailItem } from '@/shared/notifications';
import { parseFormApiError } from './formApiError';

type EquipmentIdentity = {
  id?: unknown;
  sku?: unknown;
  name?: unknown;
};

const toText = (value: unknown): string | undefined => {
  if (typeof value !== 'string') return undefined;
  const text = value.trim();
  return text || undefined;
};

export const notifyEquipmentCreated = (
  entityName: string,
  created: EquipmentIdentity,
  fallback: EquipmentIdentity = {},
): void => {
  const sku = toText(created.sku) ?? toText(fallback.sku);
  const name = toText(created.name) ?? toText(fallback.name);

  if (sku) {
    notify.success(`${entityName} created`, {
      code: sku,
      description: name && name !== sku ? name : undefined,
    });
    return;
  }

  notify.success(name ? `${entityName} "${name}" created` : `${entityName} created`);
};

export const notifyEquipmentUpdated = (
  entityName: string,
  updated: EquipmentIdentity,
  fallback: EquipmentIdentity = {},
): void => {
  const sku = toText(updated.sku) ?? toText(fallback.sku);
  const name = toText(updated.name) ?? toText(fallback.name);

  if (sku) {
    notify.success(`${entityName} updated`, {
      code: sku,
      description: name && name !== sku ? name : undefined,
    });
    return;
  }

  notify.success(name ? `${entityName} "${name}" updated` : `${entityName} updated`);
};

export const notifyMappingUpdated = (
  previous: {
    lab?: { sku?: unknown; lab_name?: unknown } | null;
    rack?: { id?: unknown; sku?: unknown; name?: unknown } | null;
    computer?: { id?: unknown; sku?: unknown; computer_name?: unknown } | null;
    samples_list?: Array<{ id?: unknown; sku?: unknown; name?: unknown }>;
    network_interface_list?: Array<{ id?: unknown; sku?: unknown; network_interface_name?: unknown }>;
    debug_hardware_list?: Array<{ id?: unknown; sku?: unknown; debug_hardware_name?: unknown }>;
    powersupply_list?: Array<{ id?: unknown; sku?: unknown; powersupply_name?: unknown }>;
    monitor_list?: Array<{ id?: unknown; sku?: unknown; monitor_name?: unknown }>;
    accessory_list?: Array<{ id?: unknown; sku?: unknown; accessory_name?: unknown }>;
  } | null,
  mapping: {
    lab?: { sku?: unknown; lab_name?: unknown } | null;
    rack?: { sku?: unknown; name?: unknown } | null;
    computer?: { sku?: unknown; computer_name?: unknown } | null;
    samples_list?: Array<{ sku?: unknown; name?: unknown }>;
    network_interface_list?: Array<{ sku?: unknown; network_interface_name?: unknown }>;
    debug_hardware_list?: Array<{ sku?: unknown; debug_hardware_name?: unknown }>;
    powersupply_list?: Array<{ sku?: unknown; powersupply_name?: unknown }>;
    monitor_list?: Array<{ sku?: unknown; monitor_name?: unknown }>;
    accessory_list?: Array<{ sku?: unknown; accessory_name?: unknown }>;
  },
): void => {
  const labSku = toText(mapping.lab?.sku);
  const labName = toText(mapping.lab?.lab_name);
  const labLabel = labSku ?? labName ?? 'the lab';
  const itemGroups = [
    { type: 'Rack', before: previous?.rack ? [previous.rack] : [], after: mapping.rack ? [mapping.rack] : [] },
    { type: 'Computer', before: previous?.computer ? [previous.computer] : [], after: mapping.computer ? [mapping.computer] : [] },
    { type: 'Sample', before: previous?.samples_list ?? [], after: mapping.samples_list ?? [] },
    { type: 'Network interface', before: previous?.network_interface_list ?? [], after: mapping.network_interface_list ?? [] },
    { type: 'Debug hardware', before: previous?.debug_hardware_list ?? [], after: mapping.debug_hardware_list ?? [] },
    { type: 'Power supply', before: previous?.powersupply_list ?? [], after: mapping.powersupply_list ?? [] },
    { type: 'Monitor', before: previous?.monitor_list ?? [], after: mapping.monitor_list ?? [] },
    { type: 'Accessory', before: previous?.accessory_list ?? [], after: mapping.accessory_list ?? [] },
  ];
  const changedItems = itemGroups.flatMap(({ type, before, after }) => {
    const getId = (item: unknown) => String((item as Record<string, unknown>).id);
    const beforeIds = new Set(before.map(getId));
    const afterIds = new Set(after.map(getId));
    return [
      ...after.filter((item) => !beforeIds.has(getId(item))).map((item) => ({ status: 'Added' as const, type, item })),
      ...before.filter((item) => !afterIds.has(getId(item))).map((item) => ({ status: 'Removed' as const, type, item })),
    ];
  });
  const mappedItems: ToastDetailItem[] = changedItems
    .flatMap(({ status, type, item }): ToastDetailItem[] => {
      const itemFields = item as Record<string, unknown>;
      const identity = toText(itemFields.sku) ?? toText(itemFields.name) ?? toText(itemFields.computer_name)
        ?? toText(itemFields.network_interface_name) ?? toText(itemFields.debug_hardware_name)
        ?? toText(itemFields.powersupply_name) ?? toText(itemFields.monitor_name) ?? toText(itemFields.accessory_name);
      if (!identity) return [];
      return [{
        tone: status === 'Added' ? 'added' : 'removed',
        label: `${status} ${status === 'Added' ? 'to' : 'from'} ${labLabel}:`,
        value: `${type} ${identity}`,
      }];
    });

  if (!mappedItems.length) {
    notify.success('Mapping updated');
    return;
  }

  notify.success('Mapping updated', {
    details: mappedItems,
    duration: 5000,
  });
};

export const notifyEquipmentError = (
  action: string,
  entityName: string,
  error: unknown,
): void => {
  const parsed = parseFormApiError(error);
  const entityNameLower = entityName.toLowerCase();
  const detail = parsed?.message ?? getApiErrorMessage(error, 'Please try again.');
  notify.error(`Unable to ${action} ${entityNameLower}`, {
    description: detail,
  });
};

const getIdentityLabel = (identity: EquipmentIdentity, fallback: EquipmentIdentity = {}): string | undefined =>
  toText(identity.sku) ?? toText(fallback.sku) ?? toText(identity.name) ?? toText(fallback.name);

export const notifyEquipmentDeleted = (entityName: string, identity: EquipmentIdentity): void => {
  const sku = toText(identity.sku);
  const label = getIdentityLabel(identity);

  if (sku) {
    notify.success(`${entityName} deleted`, {
      code: sku,
      description: label && label !== sku ? label : undefined,
    });
    return;
  }

  notify.success(label ? `${entityName} "${label}" deleted` : `${entityName} deleted`);
};