type EquipmentId = string | number;

type UnknownRecord = Record<string, unknown>;

const isRecord = (value: unknown): value is UnknownRecord =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isEquipmentId = (value: unknown): value is EquipmentId =>
  typeof value === 'string' || typeof value === 'number';

const isIdRecord = (value: unknown): value is { id: EquipmentId } =>
  isRecord(value) && isEquipmentId(value.id);

const isValueRecord = (value: unknown): value is { value: EquipmentId } =>
  isRecord(value) && isEquipmentId(value.value);

export const toId = (value: unknown): EquipmentId | undefined => {
  if (isEquipmentId(value)) return value;
  if (isIdRecord(value)) return value.id;
  if (isValueRecord(value)) return value.value;
  return undefined;
};

export const toIdArray = (value: unknown): EquipmentId[] => {
  if (value == null) return [];
  if (!Array.isArray(value)) return [];

  return value
    .map((item) => toId(item))
    .filter((item): item is EquipmentId => item !== undefined);
};

export const remapPayloadKeys = <T extends object>(
  payload: T,
  keyMap: Record<string, string>,
): T => {
  if (!isRecord(payload)) return payload;

  const nextPayload: UnknownRecord = { ...(payload as UnknownRecord) };
  Object.entries(keyMap).forEach(([sourceKey, targetKey]) => {
    if (!(sourceKey in nextPayload)) return;
    if (!(targetKey in nextPayload) || nextPayload[targetKey] === undefined) {
      nextPayload[targetKey] = nextPayload[sourceKey];
    }
    delete nextPayload[sourceKey];
  });

  return nextPayload as T;
};

type CrudEndpoints = {
  CREATE: string;
  UPDATE: (id: number | string) => string;
};

export const createMappedCrudQueries = <TPayload extends object>(
  endpoints: CrudEndpoints,
  keyMap: Record<string, string>,
) => ({
  create: (body: TPayload) => ({
    url: endpoints.CREATE,
    method: 'POST' as const,
    body: remapPayloadKeys(body, keyMap),
  }),
  update: ({ id, body }: { id: number; body: TPayload }) => ({
    url: endpoints.UPDATE(id),
    method: 'PATCH' as const,
    body: remapPayloadKeys(body, keyMap),
  }),
});

export const POWER_SUPPLY_PAYLOAD_KEY_MAP: Record<string, string> = {
  powersupply_name: 'name',
  powersupply_type: 'power_supply_type',
  powersupply_manufacturer: 'manufacturer',
  powersupply_model: 'model',
};

export const ACCESSORY_PAYLOAD_KEY_MAP: Record<string, string> = {
  accessory_name: 'name',
  accessory_manufacturer: 'manufacturer',
  accessory_model: 'model',
};

export const MONITOR_PAYLOAD_KEY_MAP: Record<string, string> = {
  monitor_name: 'name',
  monitor_manufacturer: 'manufacturer',
  monitor_model: 'model',
  monitor_size: 'size',
};

export const NETWORK_INTERFACE_PAYLOAD_KEY_MAP: Record<string, string> = {
  network_protocol: 'protocol',
  network_interface_manufacturer: 'manufacturer',
  network_interface_model: 'model',
};

export const DEBUG_HARDWARE_PAYLOAD_KEY_MAP: Record<string, string> = {
  debug_hardware_name: 'name',
  debug_hardware_manufacturer: 'manufacturer',
  debug_hardware_model: 'model',
};

// License: BE write serializer expects canonical model field names
// (`product`, `vendor`, `category`, `restriction`, `license_identifier`)
// while the read serializer / FE use legacy aliases (`license_product`,
// `license_vendor`, `license_category`, `license_restriction`, `license_ID`).
export const LICENSE_PAYLOAD_KEY_MAP: Record<string, string> = {
  license_product: 'product',
  license_vendor: 'vendor',
  license_category: 'category',
  license_restriction: 'restriction',
  license_ID: 'license_identifier',
};

// License carrier_device → individual FK fields on the License model.
// Read responses return a single `carrier_device` object plus a
// `carrier_device_name` group identifier; updates must instead set the
// matching FK column and null the other carrier FKs so the BE clears the
// previous association.
const LICENSE_CARRIER_FK_FIELDS = [
  'computer',
  'accessory',
  'monitor',
  'powersupply',
  'sample',
  'debug_hardware',
  'network_interface',
] as const;

type LicenseCarrierFk = (typeof LICENSE_CARRIER_FK_FIELDS)[number];

const LICENSE_CARRIER_GROUP_TO_FK: Record<string, LicenseCarrierFk> = {
  labcomputer: 'computer',
  computer: 'computer',
  accessory: 'accessory',
  monitor: 'monitor',
  powersupply: 'powersupply',
  sample: 'sample',
  debughardware: 'debug_hardware',
  debug_hardware: 'debug_hardware',
  networkinterface: 'network_interface',
  network_interface: 'network_interface',
};

const parseCarrierDeviceValue = (
  value: unknown,
): { fk: LicenseCarrierFk; id: number } | { clear: true } | null => {
  if (value == null || value === '') return { clear: true };

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return { clear: true };
    const dash = trimmed.lastIndexOf('-');
    if (dash <= 0) return null;
    const group = trimmed.slice(0, dash).toLowerCase();
    const idPart = trimmed.slice(dash + 1);
    const id = Number(idPart);
    const fk = LICENSE_CARRIER_GROUP_TO_FK[group];
    if (!fk || !Number.isFinite(id)) return null;
    return { fk, id };
  }

  return null;
};

const remapLicenseCarrierDevice = (
  payload: Record<string, unknown>,
): Record<string, unknown> => {
  if (!('carrier_device' in payload)) return payload;
  const parsed = parseCarrierDeviceValue(payload.carrier_device);
  const next: Record<string, unknown> = { ...payload };
  delete next.carrier_device;

  if (parsed == null) {
    // Couldn't interpret — drop the field so BE doesn't reject the request
    return next;
  }

  if ('clear' in parsed) {
    LICENSE_CARRIER_FK_FIELDS.forEach((fk) => {
      next[fk] = null;
    });
    return next;
  }

  LICENSE_CARRIER_FK_FIELDS.forEach((fk) => {
    next[fk] = fk === parsed.fk ? parsed.id : null;
  });
  return next;
};

export const createLicenseMappedCrudQueries = <TPayload extends object>(
  endpoints: CrudEndpoints,
) => {
  const transform = (body: TPayload): TPayload => {
    const remapped = remapPayloadKeys(body, LICENSE_PAYLOAD_KEY_MAP);
    if (!isRecord(remapped)) return remapped;
    return remapLicenseCarrierDevice(remapped as Record<string, unknown>) as TPayload;
  };

  return {
    create: (body: TPayload) => ({
      url: endpoints.CREATE,
      method: 'POST' as const,
      body: transform(body),
    }),
    update: ({ id, body }: { id: number; body: TPayload }) => ({
      url: endpoints.UPDATE(id),
      method: 'PATCH' as const,
      body: transform(body),
    }),
  };
};
