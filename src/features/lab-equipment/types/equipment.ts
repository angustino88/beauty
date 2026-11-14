import type { ILabAudit } from '../shared/types/equipment.types';
import type { EquipmentLoanRead, EquipmentPlacementRead } from '@/shared/api/generated/api';

export type EquipmentCategoryKey =
  | 'computing'
  | 'display'
  | 'debugging'
  | 'networking'
  | 'power'
  | 'accessory'
  | 'sample'
  | 'furniture'
  | 'instrument'
  | 'laboratory'
  | 'mechanical'
  | 'other';

export type EquipmentFacetDimension =
  | 'category'
  | 'kind'
  | 'type'
  | 'manufacturer'
  | 'product_model_id'
  | 'department_id'
  | 'group_id';

export interface EquipmentFacetParams {
  category?: string;
  kind?: string;
  type?: string;
  manufacturer?: string;
  product_model_id?: string;
  department_id?: string;
  group_id?: string;
  owner_id?: string;
  status?: string;
  assigned?: boolean;
  q?: string;
  search?: string;
  dimension: EquipmentFacetDimension;
}

export interface EquipmentCatalogOption {
  id: number;
  sku: string | null;
  name: string;
}

export interface EquipmentCatalogOptionList {
  data: EquipmentCatalogOption[];
  results?: EquipmentCatalogOption[];
}

export interface EquipmentFacetValue {
  value: { id: number; name: string } | null;
  equipment_count: number;
}

export interface EquipmentFacetResponse {
  data: EquipmentFacetValue[];
  meta?: { pagination?: { count: number; page: number; page_size: number } };
}

export interface EquipmentNamedRef {
  id: number;
  name: string;
}

export interface EquipmentChoiceRef {
  value: string;
  label: string;
}

export interface EquipmentItem {
  id: number;
  uid?: string;
  sku: string;
  name: string;
  category?: EquipmentNamedRef | null;
  kind?: EquipmentNamedRef | null;
  type?: EquipmentNamedRef | null;
  manufacturer?: EquipmentNamedRef | null;
  product_model?: EquipmentNamedRef | null;
  serial_number?: string | null;
  log_label?: string | null;
  owner?: { id: number; username?: string; name?: string; display_name?: string } | null;
  department?: EquipmentNamedRef | null;
  group?: EquipmentNamedRef | null;
  storage_room?: EquipmentNamedRef | null;
  status?: EquipmentChoiceRef | string | null;
  display_status?: EquipmentChoiceRef | null;
  condition?: EquipmentChoiceRef | null;
  lifecycle_state?: EquipmentChoiceRef | null;
  placement?: EquipmentPlacementRead | null;
  loan?: EquipmentLoanRead | null;
  calibration_required?: boolean;
  calibration_overdue?: boolean;
  details?: string | null;
  remark?: string | null;
  image?: string | null;
  created_at?: string;
  updated_at?: string;

  // Commercial, audit and lifecycle fields
  acquisition_price?: { amount?: number | string; currency?: string } | number | string | null;
  replacement_date?: string | null;
  warranty_until?: string | null;
  lab_audit?: ILabAudit | null;
  licenses?: Array<{ id: number; sku?: string | null; name?: string | null; license_name?: string | null }> | null;
  information?: string | null;

  // Hardware telemetry & monitoring
  disk_usage?: Array<{ name: string; used: number; total: number }> | null;
  sys_info?: Array<{ item: string; value: string }> | Record<string, unknown> | null;
  monitoring?: Array<Record<string, unknown>> | boolean | null;
  // Canonical Computing API names; legacy category responses may use aliases above.
  system_info?: Array<{ item: string; value: string }> | Record<string, unknown> | null;
  monitored_devices?: Array<Record<string, unknown>> | boolean | null;

  // Category-specific extensions
  ip_address?: string | null;
  os_name?: string | null;
  hostname?: string | null;
  mac_address?: string | null;
  rdp_file?: string | null;
  technical_user?: { id: number; username?: string } | null;
  display_size?: string | null;
  display_resolution?: string | null;
  max_voltage?: number | null;
  max_current?: number | null;
  sample_type?: string | null;
  customer?: EquipmentNamedRef | string | null;
  last_calibrated_at?: string | null;
  next_calibration_due_at?: string | null;
  power_draw_w?: number | null;
  weight_kg?: number | null;
  [key: string]: unknown;
}

export interface EquipmentListResponse {
  data: EquipmentItem[];
  meta?: {
    pagination?: {
      count: number;
      page: number;
      page_size: number;
    };
  };
  total_count?: number;
}

export interface EquipmentListParams {
  category: number;
  page?: number;
  page_size?: number;
  search?: string;
  ordering?: string;
  kind?: string | number;
  type?: string | number;
  manufacturer?: string | number;
  product_model?: string | number;
  status?: string;
  owner?: string | number;
  department?: string | number;
  department_id?: string | number;
  storage_room?: string | number;
  group_id?: string | number;
  assigned?: boolean;
}

export interface EquipmentWritePayload {
  sku?: string;
  name: string;
  kind_id: number;
  type_id?: number | null;
  manufacturer_id?: number | null;
  product_model_id?: number | null;
  serial_number?: string | null;
  acquisition_price?: number | string | null;
  replacement_date?: string | null;
  warranty_until?: string | null;
  log_label?: string | null;
  owner_id?: number | null;
  department_id?: number | null;
  group_id?: number | null;
  details?: string | null;
  remark?: string | null;
  image?: string | null;
  [key: string]: unknown;
}

export interface EquipmentReferenceData {
  kinds?: EquipmentNamedRef[];
  types?: EquipmentNamedRef[];
  manufacturers?: EquipmentNamedRef[];
  product_models?: EquipmentNamedRef[];
  groups?: EquipmentNamedRef[];
  owners?: Array<{ id: number; username: string; email?: string }>;
  departments?: EquipmentNamedRef[];
  storage_rooms?: EquipmentNamedRef[];
  sizes?: Array<{ id: number; size: string | number }>;
  resolutions?: Array<{ id: number; resolution: string }>;
  interfaces?: EquipmentNamedRef[];
  protocols?: EquipmentNamedRef[];
  customers?: EquipmentNamedRef[];
  characteristics?: EquipmentNamedRef[];
  materials?: EquipmentNamedRef[];
}

export interface EquipmentStatusSummary {
  total_count: number;
  unknown_status_count: number;
  statuses: Array<{
    status: {
      value: string;
      label: string;
    };
    count: number;
    resource_count?: number;
  }>;
}

export interface ChangeStatusPayload {
  category: EquipmentCategoryKey | string;
  id: number;
  status: string;
  details?: Record<string, unknown>;
  reason?: string;
}
