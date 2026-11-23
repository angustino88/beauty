import type { NamedReference } from '@/shared/utils/resourceReferences';
import type { IPrimaryOwner } from '../shared/types/equipment.types';

export interface ILicenseProduct { id: number; product_name: string; }
export interface ILicenseVendor { id: number; vendor_name: string; }
export interface ILicenseType { id: number; type_name?: string; license_type_name?: string; }
export interface ILicenseCategory { id: number; category_name: string; }
export interface ILicenseRestriction { id: number; restriction_name?: string; license_restriction_name?: string; }
/** Equipment that currently holds one of the license's seats. */
export interface IAssignedEquipment { id: number; sku: string; name: string; uid?: string; }
export interface ILicenseStatusData {
  lab_name?: string;
  location?: string;
  transfer_to?: string;
  borrower?: string;
  return_date?: string;
  reason?: string;
  to_date?: string;
  description?: string;
  status?: string;
}
export interface ICurrentLicenseStatus {
  id: number;
  status_type: string;
  status_data?: ILicenseStatusData;
}
export interface ILicenseAudit {
  audit_id: string | null;
  auditor: string | null;
  audited_at: string | null;
  audit_status: string | null;
  remarks: string | null;
}

export interface ILicense {
  id: number;
  sku: string;
  name: string;
  serial_number: string;
  maximum_version?: string | number | null;
  license_ID?: string | null;
  log_label: string;
  remark: string;
  expiry_date: string | null;
  license_seats: number | null;
  assigned_equipment: IAssignedEquipment[];
  primary_owner: IPrimaryOwner | null;
  department?: NamedReference | null;
  group?: NamedReference | null;
  status?: string | null;
  current_status?: ICurrentLicenseStatus | null;
  lab_audit?: ILicenseAudit | null;
  image?: string | null;
  creator?: number | null;
  last_modified_by?: number | null;
  modified?: string | null;
  product?: ILicenseProduct | null;
  vendor?: ILicenseVendor | null;
  category?: ILicenseCategory | null;
  restriction?: ILicenseRestriction | null;
  license_product: ILicenseProduct | null;
  license_vendor: ILicenseVendor | null;
  license_type: ILicenseType | null;
  license_category: ILicenseCategory | null;
  license_restriction: ILicenseRestriction | null;
}

export interface ILicenseListResponse { total_count: number; data: ILicense[]; }
export interface ILicenseParams {
  page?: number;
  page_size?: number;
  search?: string;
  ordering?: string;
  sorts?: string[];
  orders?: string[];
}
export interface ILicensePayload {
  sku?: string; name?: string; serial_number?: string; log_label?: string; remark?: string;
  expiry_date?: string | null; license_seats?: number | null;
  department_id?: number | null; group_id?: number | null;
  license_product?: number | null; license_vendor?: number | null;
  license_type?: number | null; license_category?: number | null;
  license_restriction?: number | null; primary_owner?: number | null;
  status?: string | null;
  current_status?: { status_type: string; status_data: Record<string, unknown> };
  status_type?: string; status_data?: Record<string, unknown>;
}
