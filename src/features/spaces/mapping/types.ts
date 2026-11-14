import type { Key } from "react";

export interface MappingRoomRef {
  id: number;
  uid?: string;
  sku: string;
  name: string;
  layout_rows?: number | null;
  layout_columns?: number | null;
  location?: string | null;
  status?: string | null;
}

export interface MappingRoomSlotRef {
  id: number;
  room_id: number;
  row_index: number;
  col_index: number;
  slot_code: string;
  x_mm?: number | null;
  y_mm?: number | null;
  width_mm?: number | null;
  depth_mm?: number | null;
  orientation_degrees?: number;
}

export interface MappingStationRef {
  id: number;
  uid?: string;
  sku: string;
  name: string;
  room_id?: number | null;
  slot_id?: number | null;
  status?: string | null;
}

export interface MappingStationSlotRef {
  id: number;
  station_id: number;
  position_index: number;
  slot_code: string;
  label?: string;
}

export interface MappingBenchRef {
  id: number;
  uid?: string;
  sku: string;
  name: string;
  setup_location_id?: number | null;
  station_slot_id?: number | null;
  status?: string | null;
  remark?: string | null;
  criticality?: string | null;
  requested_power_w?: number | null;
  requested_load_kg?: number | null;
  requested_cooling_w?: number | null;
  required_utilities?: string[] | string | null;
}

export interface MappingEquipmentCategory {
  id: number;
  name: string;
}

export interface MappingEquipmentItem {
  id: number;
  uid?: string;
  sku: string;
  name: string;
  category: MappingEquipmentCategory;
  bench_id?: number | null;
  role?: string;
  position?: number;
  is_monitored?: boolean;
  assigned_at?: string;
  display_status?: { value?: string; label?: string } | string | null;
  remark?: string | null;
}

export interface MappingLicenseItem {
  id: number;
  uid?: string;
  sku: string;
  name: string;
  category?: { id: number; name: string | null } | null;
  equipment_id: number;
  assigned_at?: string;
}

export interface ResourceMappingStatus {
  is_fully_mapped: boolean;
  has_station: boolean;
  has_room: boolean;
  equipment_count: number;
  license_count: number;
}

export interface ResourceMappingRow {
  id: number; // Bench ID
  bench: MappingBenchRef;
  station: MappingStationRef | null;
  station_slot: MappingStationSlotRef | null;
  room: MappingRoomRef | null;
  room_slot: MappingRoomSlotRef | null;
  equipment: MappingEquipmentItem[];
  licenses: MappingLicenseItem[];
  status: ResourceMappingStatus;
  remark?: string | null;
}

/** Legacy alias for compatibility during migration */
export type IMappingRow = ResourceMappingRow;

export interface ResourceMappingListResponse {
  total_count: number;
  data: ResourceMappingRow[];
}

export type IMappingListResponse = ResourceMappingListResponse;

export interface ResourceMappingParams {
  page?: number;
  page_size?: number;
  search?: string;
  ordering?: string;
  room_id?: number | string;
  station_id?: number | string;
  bench_id?: number | string;
  category?: string;
  status?: string;
}

export type IMappingParams = ResourceMappingParams;

export interface BenchPlacementPayload {
  setup_location_id?: number | null;
  station_slot_id?: number | null;
}

export interface StationPlacementPayload {
  room_id?: number | null;
  slot_id?: number | null;
  power_reserved_w?: string | null;
}

export interface EquipmentAssignmentPayload {
  bench_id: number;
  role?: string;
  position?: number;
}

export interface MappingFilterOptionItem {
  text: string;
  value: string | number;
}

export interface MappingFilterOptions {
  rooms: MappingFilterOptionItem[];
  stations: MappingFilterOptionItem[];
  benches: MappingFilterOptionItem[];
  categories: MappingFilterOptionItem[];
}

export type IMappingFilterOptions = MappingFilterOptions;

export type TableFilters = Record<string, Key[] | null>;
