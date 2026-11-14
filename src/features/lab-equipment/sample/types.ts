import type { IEquipmentStatus, IPrimaryOwner, ILabAudit } from '../shared/types/equipment.types';

interface INamedRef {
  id: number;
  name?: string;
}

export interface ISampleManufacturer extends INamedRef { manufacturer_name?: string; sample_manufacturer_name?: string; }
export interface ISampleProductLine extends INamedRef { sample_product_line_name?: string; }
export interface ISampleVersion extends INamedRef { sample_version_name?: string; }
export interface ISampleType extends INamedRef { sample_type_name?: string; }
export interface ISampleOEM extends INamedRef { sample_OEM_name?: string; }
export interface ISampleKL extends INamedRef { sample_KL_name?: string; }
export interface ISampleChannel extends INamedRef { sample_communication_channel_name?: string; }
export interface ISampleCharacteristic extends INamedRef { sample_characteristic_name?: string; }

export interface ISampleLicense {
  id: number;
  sku?: string;
  name?: string;
  maximum_version?: string | null;
}

export interface ISample {
  id: number;
  sku: string;
  name: string;
  serial_number: string;
  log_label: string;
  remark: string;
  image: string | null;
  primary_owner: IPrimaryOwner | null;
  manufacturer: ISampleManufacturer | null;
  product_line: ISampleProductLine | null;
  version: ISampleVersion | null;
  sample_type: ISampleType | null;
  oem: ISampleOEM | null;
  kl: ISampleKL | null;
  communication_channel: ISampleChannel | null;
  sample_characteristic: Array<ISampleCharacteristic | number>;
  licenses?: ISampleLicense[] | null;
  lab_audit?: ILabAudit | null;
  current_status?: IEquipmentStatus | null;
  status?: string | null;
}

export interface ISampleListResponse { total_count: number; data: ISample[]; }
export interface ISampleParams {
  page?: number;
  page_size?: number;
  search?: string;
  ordering?: string;
}

export interface ISamplePayload {
  sku?: string;
  name?: string;
  serial_number?: string;
  log_label?: string;
  remark?: string;
  manufacturer?: number | null;
  product_line?: number | null;
  version?: number | null;
  sample_type?: number | null;
  oem?: number | null;
  kl?: number | null;
  communication_channel?: number | null;
  sample_characteristic?: number[]; // M2M — array of IDs on write
  primary_owner?: number | null;
  status_type?: string;
  status_data?: Record<string, unknown>;
}
