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
};

export type LicenseWritePayload = Record<string, unknown>;

/** Noon UTC keeps the calendar date stable in every time zone; the API stores a date-time. */
const toExpiresAt = (value: string | null | undefined): string | null | undefined => {
  if (value === undefined) return undefined;
  if (!value) return null;
  return /^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T12:00:00Z` : value;
};

/**
 * UI draft -> `POST/PATCH /api/labs/licenses` body. Relations are written as `<name>_id`; `identifier`
 * (the license key) is write-only and sent only when the user typed one, so an empty field never wipes it.
 * Status is not part of this body: it changes through `actions/change-status`.
 */
export function mapLicenseWritePayload(payload: LicenseUiWritePayload): LicenseWritePayload {
  const maximumVersion = payload.maximum_version;
  const body: LicenseWritePayload = {
    sku: payload.sku,
    name: payload.name,
    remark: payload.remark,
    product_id: payload.license_product,
    vendor_id: payload.license_vendor,
    type_id: payload.license_type,
    category_id: payload.license_category,
    restriction_id: payload.license_restriction,
    owner_id: payload.primary_owner,
    seats: payload.license_seats ?? undefined,
    max_version: maximumVersion == null ? undefined : String(maximumVersion),
    expires_at: toExpiresAt(payload.expiry_date),
  };
  if (typeof payload.license_ID === 'string' && payload.license_ID.trim()) {
    body.identifier = payload.license_ID.trim();
  }
  // Drop keys the caller did not set; `null` stays, it clears an optional field. The four required
  // relations never accept null, so an empty one is left out and the API keeps the stored value.
  const required = ['product_id', 'vendor_id', 'type_id', 'category_id'];
  return Object.fromEntries(
    Object.entries(body).filter(([key, value]) => value !== undefined && !(required.includes(key) && value === null)),
  );
}

export function mapLicenseRead(rawItem: unknown): ILicense {
  const item = asRecord(rawItem);
  const owner = item.owner ? asRecord(item.owner) : null;
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
    maximum_version: ((item.max_version ?? item.maximum_version) as ILicense['maximum_version']) ?? null,
    license_ID: (item.license_ID as string) ?? (item.license_identifier as string) ?? null,
    log_label: asString(item.log_label),
    remark: asString(item.remark || item.description),
    expiry_date: asString(item.expires_at) || null,
    license_seats: ((item.seats ?? item.license_seats) as number | undefined) ?? null,
    assigned_equipment: (Array.isArray(item.assigned_equipment) ? item.assigned_equipment : []).map((entry) => {
      const equipment = asRecord(entry);
      return {
        id: asNumber(equipment.id),
        sku: asString(equipment.sku),
        name: asString(equipment.name),
        uid: asString(equipment.uid) || undefined,
      };
    }),
    primary_owner: owner
      ? ({ id: asNumber(owner.id), username: asString(owner.name), display_name: asString(owner.name) } as ILicense['primary_owner'])
      : ((item.primary_owner as ILicense['primary_owner']) ?? null),
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
