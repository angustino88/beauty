import { getApiErrorDetails, getApiErrorMessage, notify } from '@/shared/notifications';

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

const notifiedErrors = new WeakSet<object>();

export const isEquipmentErrorNotified = (error: unknown): boolean => {
  if (!error || typeof error !== 'object') return false;
  if (notifiedErrors.has(error)) return true;
  if (error instanceof Error && error.cause && typeof error.cause === 'object') {
    return notifiedErrors.has(error.cause);
  }
  return false;
};

export const notifyEquipmentError = (
  action: string,
  entityName: string,
  error: unknown,
): void => {
  if (error && typeof error === 'object') {
    notifiedErrors.add(error);
  }
  const entityNameLower = entityName.toLowerCase();
  const details = getApiErrorDetails(error);
  notify.error(`Unable to ${action} ${entityNameLower}`, {
    description: getApiErrorMessage(error, 'Please try again.'),
    details: details.length > 0 ? details : undefined,
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