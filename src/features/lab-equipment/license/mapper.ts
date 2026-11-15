import type {
  ILicense,
  ILicenseCategory,
  ILicensePayload,
  ILicenseProduct,
  ILicenseRestriction,
  ILicenseType,
  ILicenseVendor,
} from './types';

/** `{value, label}` choice (ENU-1) → its value; plain strings pass through. */
function choiceOf(raw: unknown): string | undefined {
  if (raw && typeof raw === 'object') return asString((raw as { value?: unknown }).value) || undefined;
  return asString(raw) || undefined;
}

type RecordValue = Record<string, unknown>;

const asRecord = (val: unknown): RecordValue =>
  typeof val === 'object' && val !== null && !Array.isArray(val) ? (val as RecordValue) : {};

const asString = (val: unknown, fallback = ''): string =>
  typeof val === 'string' ? val : fallback;

const asNumber = (val: unknown, fallback = 0): number =>
  typeof val === 'number' && Number.isFinite(val) ? val : fallback;

type LicenseUiWritePayload = ILicensePayload & {
  maximum_version?: string | number | null;
  license_ID?: string | null;
  carrier_device?: string | number | null;
};

export type LicenseWritePayload = Record<string, unknown>;

export function mapLicenseWritePayload(payload: LicenseUiWritePayload): LicenseWritePayload {
  const maximumVersion = payload.maximum_version;
  const numericMaximumVersion =
    maximumVersion == null || maximumVersion === '' ? null : Number(maximumVersion);

  const carrierFkFields: Record<
    'computer' | 'accessory' | 'monitor' | 'powersupply' | 'sample' | 'debug_hardware' | 'network_interface',
    number | null
  > = {
    computer: null,
    accessory: null,
    monitor: null,
    powersupply: null,
    sample: null,
    debug_hardware: null,
    network_interface: null,
  };
  if (typeof payload.carrier_device === 'string') {
    const separator = payload.carrier_device.lastIndexOf('-');
    const group = separator > 0 ? payload.carrier_device.slice(0, separator).toLowerCase() : '';
    const id = Number(payload.carrier_device.slice(separator + 1));
    const carrierField: Record<string, keyof typeof carrierFkFields> = {
      labcomputer: 'computer', computer: 'computer', accessory: 'accessory', monitor: 'monitor',
      powersupply: 'powersupply', sample: 'sample', debughardware: 'debug_hardware',
      debug_hardware: 'debug_hardware', networkinterface: 'network_interface', network_interface: 'network_interface',
    };
    const field = carrierField[group];
    if (field && Number.isFinite(id)) carrierFkFields[field] = id;
  }

  return {
    sku: payload.sku,
    name: payload.name,
    serial_number: payload.serial_number,
    product: payload.license_product,
    vendor: payload.license_vendor,
    license_type: payload.license_type,
    category: payload.license_category,
    restriction: payload.license_restriction,
    license_identifier: payload.license_ID,
    maximum_version: numericMaximumVersion !== null && Number.isFinite(numericMaximumVersion)
      ? numericMaximumVersion
      : null,
    log_label: payload.log_label,
    expiry_date: payload.expiry_date,
    remark: payload.remark,
    primary_owner: payload.primary_owner,
    status: payload.status,
    status_type: payload.status_type,
    status_data: payload.status_data,
    current_status: payload.current_status,
    license_seats: payload.license_seats,
    ...carrierFkFields,
  };
}

export function mapLicenseRead(rawItem: unknown): ILicense {
  const item = asRecord(rawItem);
  const carrier = item.carrier_device ? asRecord(item.carrier_device) : null;
  const status = item.current_status ? asRecord(item.current_status) : null;
  const audit = item.lab_audit ? asRecord(item.lab_audit) : null;
  const product = item.product ? asRecord(item.product) : null;
  const vendor = item.vendor ? asRecord(item.vendor) : null;
  const category = item.category ? asRecord(item.category) : null;
  const restriction = (item.license_restriction || item.restriction) ? asRecord(item.license_restriction || item.restriction) : null;
  const licenseType = (item.license_type || item.type) ? asRecord(item.license_type || item.type) : null;

  return {
    id: asNumber(item.id),
    sku: asString(item.sku),
    name: asString(item.name),
    serial_number: asString(item.serial_number),
    maximum_version: (item.maximum_version as number) ?? null,
    license_ID: (item.license_ID as string) ?? (item.license_identifier as string) ?? null,
    log_label: asString(item.log_label),
    remark: asString(item.remark || item.description),
    expiry_date: asString(item.expires_at) || null,
    license_seats: (item.license_seats as number) ?? null,
    carrier_device: carrier
      ? {
          id: asNumber(carrier.id),
          sku: asString(carrier.sku) || undefined,
          carrier_device_name: asString(carrier.carrier_device_name || carrier.name) || undefined,
        }
      : null,
    primary_owner: (item.primary_owner as ILicense['primary_owner']) ?? null,
    status: asString(status?.status_type || choiceOf(item.status)) || null,
    current_status: status
      ? {
          id: asNumber(status.id),
          status_type: asString(status.status_type),
          status_data: asRecord(status.status_data),
        }
      : null,
    lab_audit: audit
      ? {
          audit_id: audit.audit_id != null ? String(audit.audit_id) : null,
          auditor: (audit.auditor as string) ?? null,
          audited_at: (audit.audited_at as string) ?? null,
          audit_status: (audit.audit_status as string) ?? null,
          remarks: (audit.remarks as string) ?? null,
        }
      : null,
    image: ((item.image_url ?? item.image) as string | undefined) ?? null,
    creator: undefined,
    last_modified_by: undefined,
    modified: undefined,
    product: product ? { id: asNumber(product.id), product_name: asString(product.product_name || product.name) } : null,
    vendor: vendor ? { id: asNumber(vendor.id), vendor_name: asString(vendor.vendor_name || vendor.name) } : null,
    category: category ? { id: asNumber(category.id), category_name: asString(category.category_name || category.name) } : null,
    restriction: restriction
      ? {
          id: asNumber(restriction.id),
          restriction_name: asString(restriction.restriction_name || restriction.name) || undefined,
          license_restriction_name: asString(restriction.license_restriction_name || restriction.name) || undefined,
        }
      : null,
    license_product: product ? { id: asNumber(product.id), product_name: asString(product.product_name || product.name) } : null,
    license_vendor: vendor ? { id: asNumber(vendor.id), vendor_name: asString(vendor.vendor_name || vendor.name) } : null,
    license_type: licenseType
      ? {
          id: asNumber(licenseType.id),
          type_name: asString(licenseType.type_name || licenseType.name) || undefined,
          license_type_name: asString(licenseType.license_type_name || licenseType.name) || undefined,
        }
      : null,
    license_category: category ? { id: asNumber(category.id), category_name: asString(category.category_name || category.name) } : null,
    license_restriction: restriction
      ? {
          id: asNumber(restriction.id),
          restriction_name: asString(restriction.restriction_name || restriction.name) || undefined,
          license_restriction_name: asString(restriction.license_restriction_name || restriction.name) || undefined,
        }
      : null,
  };
}

export const mapLicenseProduct = (raw: unknown): ILicenseProduct => {
  const item = asRecord(raw);
  return {
    id: asNumber(item.id),
    product_name: asString(item.product_name || item.name),
  };
};

export const mapLicenseVendor = (raw: unknown): ILicenseVendor => {
  const item = asRecord(raw);
  return {
    id: asNumber(item.id),
    vendor_name: asString(item.vendor_name || item.name),
  };
};

export const mapLicenseType = (raw: unknown): ILicenseType => {
  const item = asRecord(raw);
  return {
    id: asNumber(item.id),
    type_name: asString(item.type_name || item.name) || undefined,
    license_type_name: asString(item.license_type_name || item.name) || undefined,
  };
};

export const mapLicenseCategory = (raw: unknown): ILicenseCategory => {
  const item = asRecord(raw);
  return {
    id: asNumber(item.id),
    category_name: asString(item.category_name || item.name),
  };
};

export const mapLicenseRestriction = (raw: unknown): ILicenseRestriction => {
  const item = asRecord(raw);
  return {
    id: asNumber(item.id),
    restriction_name: asString(item.restriction_name || item.name) || undefined,
    license_restriction_name: asString(item.license_restriction_name || item.name) || undefined,
  };
};
