export interface ILabAudit {
  audit_id: string | null;
  auditor: string | null;
  audited_at: string | null;
  audit_status: string | null;
  remarks: string | null;
}

export interface IEquipmentStatus {
  id: number;
  status_type?: string;
  status?: string;
  status_data?: Record<string, unknown>;
  created: string;
}

export interface IPrimaryOwner {
  id: number;
  username: string;
  display_name: string;
}

export interface IChangeLog {
  id: number;
  field_changed?: string;
  old_value?: string | null;
  new_value?: string | null;
  changed_by?: IPrimaryOwner | null;
  created?: string;
  status_type?: string | { value: string; label: string };
  status?: string | { value: string; label: string };
  labdevice_type?: string;
  status_data?: Record<string, unknown> | null;
  modified?: string | null;
  last_modified_by?: IPrimaryOwner | null;
}

export interface IEquipmentListParams {
  page?: number;
  page_size?: number;
  search?: string;
}
