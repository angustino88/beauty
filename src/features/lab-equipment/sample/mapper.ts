import type {
  ISample,
  ISamplePayload,
  ISampleManufacturer,
  ISampleProductLine,
  ISampleVersion,
  ISampleType,
  ISampleOEM,
  ISampleKL,
  ISampleChannel,
  ISampleCharacteristic,
} from './types';

type RecordValue = Record<string, unknown>;

const asRecord = (val: unknown): RecordValue =>
  typeof val === 'object' && val !== null && !Array.isArray(val) ? (val as RecordValue) : {};

const asString = (val: unknown, fallback = ''): string =>
  typeof val === 'string' ? val : fallback;

const asNumber = (val: unknown, fallback = 0): number =>
  typeof val === 'number' && Number.isFinite(val) ? val : fallback;

export type SampleWritePayload = Record<string, unknown> &
  Pick<ISamplePayload, 'status_type' | 'status_data'>;

export function mapSampleWritePayload(payload: ISamplePayload): SampleWritePayload {
  return {
    sku: payload.sku,
    name: payload.name,
    manufacturer: payload.manufacturer,
    product_line: payload.product_line,
    version: payload.version,
    sample_type: payload.sample_type,
    oem: payload.oem,
    kl: payload.kl,
    serial_number: payload.serial_number,
    communication_channel: payload.communication_channel,
    sample_characteristic: payload.sample_characteristic,
    log_label: payload.log_label,
    remark: payload.remark,
    primary_owner: payload.primary_owner,
    status_type: payload.status_type,
    status_data: payload.status_data,
  };
}

export function mapSampleRead(rawItem: unknown): ISample {
  const item = asRecord(rawItem);
  const manufacturer = item.manufacturer ? asRecord(item.manufacturer) : null;
  const productLine = item.product_line ? asRecord(item.product_line) : null;
  const version = item.version ? asRecord(item.version) : null;
  const sampleType = item.sample_type ? asRecord(item.sample_type) : null;
  const oem = item.oem ? asRecord(item.oem) : null;
  const kl = item.kl ? asRecord(item.kl) : null;
  const channel = item.communication_channel ? asRecord(item.communication_channel) : null;
  const audit = item.lab_audit ? asRecord(item.lab_audit) : null;
  const status = item.current_status ? asRecord(item.current_status) : null;

  return {
    id: asNumber(item.id),
    sku: asString(item.sku),
    name: asString(item.name),
    serial_number: asString(item.serial_number),
    log_label: asString(item.log_label),
    remark: asString(item.remark || item.description),
    image: (item.image as string) ?? (item.image_url as string) ?? null,
    primary_owner: (item.primary_owner as ISample['primary_owner']) ?? null,
    manufacturer: manufacturer
      ? {
          id: asNumber(manufacturer.id),
          manufacturer_name: asString(manufacturer.sample_manufacturer_name || manufacturer.name) || undefined,
          sample_manufacturer_name: asString(manufacturer.sample_manufacturer_name || manufacturer.name) || undefined,
        }
      : null,
    product_line: productLine
      ? {
          id: asNumber(productLine.id),
          sample_product_line_name: asString(productLine.sample_product_line_name || productLine.name) || undefined,
        }
      : null,
    version: version
      ? {
          id: asNumber(version.id),
          sample_version_name: asString(version.sample_version_name || version.name) || undefined,
        }
      : null,
    sample_type: sampleType
      ? {
          id: asNumber(sampleType.id),
          sample_type_name: asString(sampleType.sample_type_name || sampleType.name) || undefined,
        }
      : null,
    oem: oem ? { id: asNumber(oem.id), sample_OEM_name: asString(oem.sample_OEM_name || oem.name) || undefined } : null,
    kl: kl ? { id: asNumber(kl.id), sample_KL_name: asString(kl.sample_KL_name || kl.name) || undefined } : null,
    communication_channel: channel
      ? {
          id: asNumber(channel.id),
          sample_communication_channel_name: asString(channel.sample_communication_channel_name || channel.name) || undefined,
        }
      : null,
    sample_characteristic: Array.isArray(item.sample_characteristic) ? (item.sample_characteristic as number[]) : [],
    licenses: Array.isArray(item.licenses)
      ? (item.licenses as Array<RecordValue | number>).map((lic) =>
          typeof lic === 'number'
            ? { id: lic }
            : {
                id: asNumber(lic.id),
                sku: asString(lic.sku),
                name: asString(lic.name),
              },
        )
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
    current_status: status
      ? {
          id: asNumber(status.id),
          status_type: asString(status.status_type),
          status: asString(status.status),
          status_data: asRecord(status.status_data),
          created: asString(status.created),
        }
      : null,
    status: (status?.status_type as string) ?? (item.status as string) ?? null,
  };
}

export const mapSampleManufacturer = (item: RecordValue): ISampleManufacturer => ({
  id: asNumber(item.id),
  name: asString(item.name || item.sample_manufacturer_name) || undefined,
  manufacturer_name: asString(item.name || item.sample_manufacturer_name) || undefined,
  sample_manufacturer_name: asString(item.name || item.sample_manufacturer_name) || undefined,
});

export const mapSampleProductLine = (item: RecordValue): ISampleProductLine => ({
  id: asNumber(item.id),
  name: asString(item.name || item.sample_product_line_name) || undefined,
  sample_product_line_name: asString(item.name || item.sample_product_line_name) || undefined,
});

export const mapSampleVersion = (item: RecordValue): ISampleVersion => ({
  id: asNumber(item.id),
  name: asString(item.name || item.sample_version_name) || undefined,
  sample_version_name: asString(item.name || item.sample_version_name) || undefined,
});

export const mapSampleType = (item: RecordValue): ISampleType => ({
  id: asNumber(item.id),
  name: asString(item.name || item.sample_type_name) || undefined,
  sample_type_name: asString(item.name || item.sample_type_name) || undefined,
});

export const mapSampleOEM = (item: RecordValue): ISampleOEM => ({
  id: asNumber(item.id),
  name: asString(item.name || item.sample_OEM_name) || undefined,
  sample_OEM_name: asString(item.name || item.sample_OEM_name) || undefined,
});

export const mapSampleKL = (item: RecordValue): ISampleKL => ({
  id: asNumber(item.id),
  name: asString(item.name || item.sample_KL_name) || undefined,
  sample_KL_name: asString(item.name || item.sample_KL_name) || undefined,
});

export const mapSampleChannel = (item: RecordValue): ISampleChannel => ({
  id: asNumber(item.id),
  name: asString(item.name || item.sample_communication_channel_name) || undefined,
  sample_communication_channel_name: asString(item.name || item.sample_communication_channel_name) || undefined,
});

export const mapSampleCharacteristic = (item: RecordValue): ISampleCharacteristic => ({
  id: asNumber(item.id),
  name: asString(item.name || item.sample_characteristic_name) || undefined,
  sample_characteristic_name: asString(item.name || item.sample_characteristic_name) || undefined,
});
