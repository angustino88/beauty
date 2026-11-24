import { editableDetails, ROOM_DETAILS } from "../../shared/resourceForm";
import { ownershipFormValues } from '../../../../shared/utils/resourceReferences.ts';
import type { IRoom } from "../types";
import type { RoomLocationOptions } from "../hooks/useRoomLocationOptions";
import type { FieldConfig } from "@/features/lab-equipment/shared";

// Room field configuration: table cell readers, the select sources and the create/edit form.
// ─── Field config ─────────────────────────────────────────────────────────────
export interface RoomFieldConfig {
  key: string;
  label: string;
  type?: FieldConfig["type"];
  required?: boolean;
  /** Reads the display string from a room record */
  reader?: (r: IRoom) => string;
}

export const ROOM_FIELD_CONFIG: RoomFieldConfig[] = [
  { key: "name", label: "Name", type: "text", reader: (r) => r.name ?? "" },
  {
    key: "primary_owner",
    label: "Owner",
    type: "select",
    reader: (r) => r.primary_owner?.username ?? "",
  },
  {
    key: "city",
    label: "City",
    type: "select",
    reader: (r) => r.location_info?.city?.name ?? "",
  },
  {
    key: "building",
    label: "Building",
    type: "select",
    reader: (r) => r.location_info?.building?.name ?? "",
  },
  {
    key: "country",
    label: "Country",
    type: "select",
    reader: (r) => {
      const c = r.location_info?.country;
      if (!c) return String(r.country ?? "");
      return c.code ? `${c.name} (${c.code})` : c.name;
    },
  },
  { key: "floor", label: "Floor", reader: (r) => String(r.location_info?.floor ?? r.floor ?? "") },
  { key: "rows", label: "Rows", reader: (r) => String(r.rows ?? "") },
  { key: "cols", label: "Columns", reader: (r) => String(r.cols ?? "") },
  { key: "remark", label: "Remark", reader: (r) => r.remark ?? "" },
];

// ─── Specs popover ────────────────────────────────────────────────────────────
export interface RoomSpecField {
  label: string;
  reader: (r: IRoom) => string;
}
export const ROOM_SPECS_FIELDS: RoomSpecField[] = [
  { label: "Setup Capacity (RU)", reader: (r) => (r.setup_capacity != null ? `${r.setup_capacity} RU` : "") },
  { label: "Max Power (W)", reader: (r) => (r.max_power != null ? `${r.max_power} W` : "") },
  { label: "Length (m)", reader: (r) => (r.length != null ? `${r.length} m` : "") },
  { label: "Width (m)", reader: (r) => (r.width != null ? `${r.width} m` : "") },
  { label: "Size", reader: (r) => r.size ?? "" },
  { label: "Label", reader: (r) => r.label ?? "" },
];

// ─── Create / edit form ───────────────────────────────────────────────────────
/**
 * One field list for both forms, so create and edit cannot drift. Only fields the room API saves are here
 * (stations are placed from the station, not the room). The SKU is shown read-only when editing: it identifies
 * the room and cannot change after creation.
 */
export const buildRoomFormFields = (location: RoomLocationOptions): FieldConfig[] => [
  { name: "sku", span: 7, label: "SKU", type: "text", required: true, maxLength: 255, disabledInEdit: true, section: "Identification" },
  { name: "name", span: 10, label: "Name", type: "text", required: true, maxLength: 255, section: "Identification" },
  { name: "label", span: 7, label: "Short label", type: "text", essential: true, placeholder: "e.g. A101", section: "Identification" },
  { name: "rows", span: 8, apiField: "layout_rows", label: "Grid rows", type: "number", required: true, section: "Layout" },
  { name: "cols", span: 8, apiField: "layout_columns", label: "Grid columns", type: "number", required: true, section: "Layout" },
  {
    name: "setup_capacity", span: 8, label: "Setup capacity", type: "number", disabled: true,
    help: "Calculated from grid rows × columns.", section: "Layout",
  },
  { name: "length", span: 8, apiField: "length_m", label: "Length (m)", type: "number", section: "Layout" },
  { name: "width", span: 8, apiField: "width_m", label: "Width (m)", type: "number", section: "Layout" },
  { name: "max_power", apiField: "power_capacity_w", label: "Max power (W)", type: "number", section: "Specifications" },
  { name: "country", apiField: "country_id", label: "Country", type: "select", essential: true, ...location.country, section: "Location" },
  { name: "city", apiField: "city_id", label: "City", type: "select", dependsOn: ["country"], ...location.city, placeholder: location.city.disabled ? "Select a country first" : "Select City", section: "Location" },
  { name: "building", apiField: "building_id", label: "Building", type: "select", dependsOn: ["city"], ...location.building, placeholder: location.building.disabled ? "Select a city first" : "Select Building", section: "Location" },
  { name: "floor", label: "Floor", type: "text", placeholder: "e.g. 1 or B1", section: "Location" },
  { name: "location", apiField: "map_url", label: "Map link", type: "text", placeholder: "https://…", section: "Location" },
  { name: "remark", label: "Remark", type: "textarea", section: "Notes" },
  ...editableDetails(ROOM_DETAILS),
  { name: "image", label: "Image", type: "image" },
];

/** A room record as form values (ids for the selects). */
export const toRoomFormValues = (room: IRoom): Record<string, unknown> => ({
  ...room,
  ...ownershipFormValues(room),
  sku: room.sku,
  name: room.name,
  label: room.label,
  rows: room.rows,
  cols: room.cols,
  setup_capacity: room.setup_capacity,
  length: room.length,
  width: room.width,
  max_power: room.max_power,
  country: room.location_info?.country?.id ?? null,
  city: room.location_info?.city?.id ?? null,
  building: room.location_info?.building?.id ?? null,
  floor: String(room.floor ?? room.location_info?.floor ?? ""),
  location: room.location,
  remark: room.remark,
  image: room.image,
});

// ─── Read ─────────────────────────────────────────────────────────────────────
/** Reads the display string for a field key from a room record */
export const readField = (key: string, r: IRoom): string =>
  ROOM_FIELD_CONFIG.find((c) => c.key === key)?.reader?.(r) ?? "";
