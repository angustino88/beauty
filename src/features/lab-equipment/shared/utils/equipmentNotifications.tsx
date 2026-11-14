import { message } from 'antd';
import { MinusCircleOutlined, PlusCircleOutlined } from '@ant-design/icons';
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

  if (!sku) {
    message.success(`${entityName} ${name ?? 'record'} created successfully`);
    return;
  }

  message.open({
    content: (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, whiteSpace: 'nowrap' }}>
        <code
          style={{
            padding: '2px 7px',
            border: '1px solid var(--lm-success-solid)',
            borderRadius: 4,
            background: 'var(--lm-surface-muted)',
            color: 'var(--lm-success-fg)',
            fontFamily: 'ui-monospace, SFMono-Regular, Consolas, monospace',
            fontSize: 12,
            fontWeight: 700,
          }}
        >
          {sku}
        </code>
        <strong style={{ fontSize: 13 }}>created</strong>
      </span>
    ),
    duration: 4,
  });
};

export const notifyEquipmentUpdated = (
  entityName: string,
  updated: EquipmentIdentity,
  fallback: EquipmentIdentity = {},
): void => {
  const sku = toText(updated.sku) ?? toText(fallback.sku);
  const name = toText(updated.name) ?? toText(fallback.name);

  if (!sku) {
    message.success(`${entityName} ${name ?? 'record'} updated successfully`);
    return;
  }

  message.open({
    content: (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, whiteSpace: 'nowrap' }}>
        <code
          style={{
            padding: '2px 7px',
            border: '1px solid var(--lm-success-solid)',
            borderRadius: 4,
            background: 'var(--lm-surface-muted)',
            color: 'var(--lm-success-fg)',
            fontFamily: 'ui-monospace, SFMono-Regular, Consolas, monospace',
            fontSize: 12,
            fontWeight: 700,
          }}
        >
          {sku}
        </code>
        <strong style={{ fontSize: 13 }}>updated</strong>
      </span>
    ),
    duration: 4,
  });
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
      ...after.filter((item) => !beforeIds.has(getId(item))).map((item) => ({ status: 'Added', type, item })),
      ...before.filter((item) => !afterIds.has(getId(item))).map((item) => ({ status: 'Removed', type, item })),
    ];
  });
  const mappedItems = changedItems
    .map(({ status, type, item }) => {
      const itemFields = item as Record<string, unknown>;
      const identity = toText(itemFields.sku) ?? toText(itemFields.name) ?? toText(itemFields.computer_name)
        ?? toText(itemFields.network_interface_name) ?? toText(itemFields.debug_hardware_name)
        ?? toText(itemFields.powersupply_name) ?? toText(itemFields.monitor_name) ?? toText(itemFields.accessory_name);
      return identity ? { status, label: `${type}: ${identity}` } : null;
    })
    .filter((item): item is { status: string; label: string } => Boolean(item));

  if (!mappedItems.length) {
    message.success('Mapping updated successfully');
    return;
  }

  message.success({
    content: (
      <span style={{ display: 'inline-flex', flexDirection: 'column', gap: 4 }}>
        {mappedItems.map((item) => (
          <span
            key={`${item.status}-${item.label}`}
            style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, textAlign: 'left' }}
          >
            {item.status === 'Added' ? <PlusCircleOutlined style={{ color: 'var(--lm-success-fg)' }} /> : <MinusCircleOutlined style={{ color: 'var(--lm-danger-fg)' }} />}
            <span>
              <strong>{item.status} {item.status === 'Added' ? 'to' : 'from'} {labLabel}:</strong> {item.label}
            </span>
          </span>
        ))}
      </span>
    ),
    duration: 4,
  });
};

export const notifyEquipmentError = (
  action: string,
  entityName: string,
  error: unknown,
): void => {
  const parsed = parseFormApiError(error);
  const entityNameLower = entityName.toLowerCase();
  message.error(parsed?.message ?? `Failed to ${action} ${entityNameLower}`);
};

const getIdentityLabel = (identity: EquipmentIdentity, fallback: EquipmentIdentity = {}): string =>
  toText(identity.sku) ?? toText(fallback.sku) ?? toText(identity.name) ?? toText(fallback.name)
  ?? (identity.id != null ? `#${String(identity.id)}` : undefined)
  ?? (fallback.id != null ? `#${String(fallback.id)}` : 'record');

export const notifyEquipmentDeleted = (entityName: string, identity: EquipmentIdentity): void => {
  message.success({
    content: (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
        <strong>{getIdentityLabel(identity)}</strong>
        <span>{entityName} deleted successfully.</span>
      </span>
    ),
    duration: 4,
  });
};