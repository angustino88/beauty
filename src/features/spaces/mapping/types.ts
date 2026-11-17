import type { Key } from "react";

export interface MappingRoomRef {
  id: number;
  uid?: string;
  sku: string;
  name: string;
  layout_rows?: number | null;
  layout_columns?: number | null;
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

/** Same rule as the server (`mapping_state`): a station in a room, then at least one unit. */
export type MappingState = "fully_mapped" | "needs_equipment" | "needs_placement";

export interface ResourceMappingStatus {
  state: MappingState;
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
}

/** Counts over every bench matching the filters (state not applied), from `meta.summary`. */
export interface MappingSummary {
  benches: number;
  fully_mapped: number;
  needs_equipment: number;
  needs_placement: number;
  equipment: number;
}

export interface ResourceMappingListResponse {
  total_count: number;
  data: ResourceMappingRow[];
  summary: MappingSummary;
}

/** Query of GET /api/labs/resource-mappings; every filter runs on the server. */
export interface ResourceMappingParams {
  page?: number;
  page_size?: number;
  q?: string;
  room_id?: number;
  station_id?: number;
  bench_id?: number;
  equipment_category_id?: number;
  state?: MappingState;
}

export interface BenchPlacementPayload {
  setup_location_id?: number | null;
  station_slot_id?: number | null;
}

export interface EquipmentAssignmentPayload {
  bench_id: number;
  role?: string;
  position?: number;
}

/** A selector item (`/options` endpoints): id, SKU and name. */
export interface MappingOptionItem {
  id: number;
  sku: string | null;
  name: string;
}

export interface MappingFilterOptions {
  rooms: MappingOptionItem[];
  stations: MappingOptionItem[];
  benches: MappingOptionItem[];
  categories: MappingOptionItem[];
}

export type TableFilters = Record<string, Key[] | null>;
