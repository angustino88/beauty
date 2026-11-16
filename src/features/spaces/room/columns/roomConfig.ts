import type { IRoom } from "../types";
import type { FieldConfig } from "@/features/lab-equipment/shared";

export type SelectOption = { label: string; value: number };

// change this file only for config related to room columns, inline edit, and create form
// ─── Field config ─────────────────────────────────────────────────────────────
export interface RoomFieldConfig {
  key: string;
  label: string;
  type?: FieldConfig["type"];
  required?: boolean;
  /** Appears in the inline-edit row */
  inEdit?: boolean;
  /** Appears in the create-room modal */
  inCreate?: boolean;
  /** Raw-data field for the label text — dropdown fields only */
  labelField?: string;
  /** Raw-data field for the id value — dropdown fields only */
  valueField?: string;
  /** Reads the display string from a room record */
  reader?: (r: IRoom) => string;
  /** Extracts the draft value from a room record */
  draftReader?: (r: IRoom) => unknown;
}

export const ROOM_FIELD_CONFIG: RoomFieldConfig[] = [
  // ─── create form ──────────────────────────────────────────────────────────
  // The SKU identifies the room and cannot change after creation: create only, never edited.
  { key: "sku", label: "SKU", type: "text", required: true, inCreate: true, inEdit: false },
  {
    key: "name",
    label: "Name",
    type: "text",
    required: true,
    inCreate: true,
    inEdit: true,
    reader: (r) => r.name ?? "",
    draftReader: (r) => r.name ?? "",
  },
  {
    key: "rows",
    label: "Rows",
    type: "number",
    required: true,
    inCreate: true,
    inEdit: true,
    reader: (r) => String(r.rows ?? ""),
    draftReader: (r) => r.rows ?? null,
  },
  {
    key: "cols",
    label: "Columns",
    type: "number",
    required: true,
    inCreate: true,
    inEdit: true,
    reader: (r) => String(r.cols ?? ""),
    draftReader: (r) => r.cols ?? null,
  },
  {
    key: "setup_capacity",
    label: "Setup Capacity",
    type: "number",
    inCreate: true,
    inEdit: false,
    reader: (r) => String(r.setup_capacity ?? ""),
    draftReader: (r) => r.setup_capacity ?? null,
  },
  {
    key: "location",
    label: "Location URL",
    type: "text",
    inCreate: true,
    inEdit: true,
    reader: (r) => r.location ?? "",
    draftReader: (r) => r.location ?? "",
  },
  { key: "max_power", label: "Max Power (W)", type: "number", inCreate: true },
  // ─── dropdown fields ──────────────────────────────────────────────────────
  {
    key: "primary_owner",
    label: "Primary Owner",
    type: "select",
    inCreate: true,
    inEdit: true,
    labelField: "username",
    valueField: "id",
    reader: (r) => r.primary_owner?.username ?? "",
    draftReader: (r) => r.primary_owner?.id ?? null,
  },
  {
    key: "city",
    label: "City",
    type: "select",
    inCreate: true,
    inEdit: true,
    labelField: "name",
    valueField: "id",
    reader: (r) => r.location_info?.city?.name ?? "",
    draftReader: (r) => r.location_info?.city?.id ?? null,
  },
  {
    key: "building",
    label: "Building",
    type: "select",
    inCreate: true,
    inEdit: true,
    labelField: "name",
    valueField: "id",
    reader: (r) => r.location_info?.building?.name ?? "",
    draftReader: (r) => r.location_info?.building?.id ?? null,
  },
  {
    key: "rack_list",
    label: "Stations",
    type: "multi-select",
    inCreate: true,
    inEdit: true,
    labelField: "sku",
    valueField: "id",
    draftReader: (r) =>
      (r.rack_list ?? []).map((x) => (typeof x === "number" ? x : x.id)),
  },
  {
    key: "country",
    label: "Country",
    type: "select",
    inCreate: true,
    inEdit: true,
    labelField: "name",
    valueField: "id",
    reader: (r) => {
      const c = r.location_info?.country;
      if (!c) return String(r.country ?? "");
      return c.code ? `${c.name} (${c.code})` : c.name;
    },
    draftReader: (r) => r.location_info?.country?.id ?? null,
  },
  // ─── inline text ──────────────────────────────────────────────────────────
  {
    key: "floor",
    label: "Floor",
    type: "text",
    inCreate: true,
    inEdit: true,
    reader: (r) => String(r.location_info?.floor ?? r.floor ?? ""),
    draftReader: (r) => String(r.floor ?? r.location_info?.floor ?? ""),
  },
  {
    key: "label",
    label: "Label",
    type: "text",
    inCreate: true,
    reader: (r) => r.label ?? "",
    draftReader: (r) => r.label ?? "",
  },
  {
    key: "remark",
    label: "Remark",
    type: "textarea",
    inCreate: true,
    inEdit: true,
    reader: (r) => r.remark ?? "",
    draftReader: (r) => r.remark ?? "",
  },
  // ─── computed display only ─────────────────────────────────────────────────
  {
    key: "size",
    label: "Size",
    reader: (r) => r.size ?? "",
  },
];

/** Dropdown-capable entries — used by useRoomTable to build optionsMap + filtersMap */
export interface RoomOptionSource extends RoomFieldConfig {
  labelField: string;
  valueField: string;
}
export const ROOM_OPTIONS_CONFIG: RoomOptionSource[] = ROOM_FIELD_CONFIG.filter(
  (c): c is RoomOptionSource =>
    c.labelField !== undefined && c.valueField !== undefined,
);

// ─── Inline-edit draft ────────────────────────────────────────────────────────
export interface RoomInlineDraft {
  name: string;
  rows: number | null;
  cols: number | null;
  floor: string;
  location: string;
  rack_list: number[];
  country: number | null;
  city: number | null;
  building: number | null;
  primary_owner: number | null;
  remark: string;
  pending_status_type?: string;
  pending_status_data?: Record<string, unknown>;
}
export const toRoomInlineDraft = (item: IRoom): RoomInlineDraft => {
  const draft: Record<string, unknown> = {};
  for (const cfg of ROOM_FIELD_CONFIG) {
    if (cfg.inEdit && cfg.draftReader) draft[cfg.key] = cfg.draftReader(item);
  }
  return draft as unknown as RoomInlineDraft;
};

// ─── Specs modal fields ───────────────────────────────────────────────────────
/** Extends FieldConfig with display reader and edit flag for the specs popover/modal */
export interface RoomSpecField extends FieldConfig {
  /** false = shown in tooltip but excluded from the specs edit modal */
  inEdit?: boolean;
  /** Formats the value for the specs tooltip display */
  reader: (r: IRoom) => string;
}
export const ROOM_SPECS_FIELDS: RoomSpecField[] = [
  {
    name: "setup_capacity",
    label: "Setup Capacity (RU)",
    type: "number",
    inEdit: false,
    reader: (r) => (r.setup_capacity != null ? `${r.setup_capacity} RU` : ""),
  },
  {
    name: "max_power",
    label: "Max Power (W)",
    type: "number",
    reader: (r) => (r.max_power != null ? `${r.max_power} W` : ""),
  },
  {
    name: "length",
    label: "Length (m)",
    type: "number",
    reader: (r) => (r.length != null ? `${r.length} m` : ""),
  },
  {
    name: "width",
    label: "Width (m)",
    type: "number",
    reader: (r) => (r.width != null ? `${r.width} m` : ""),
  },
  {
    name: "size",
    label: "Size",
    type: "text",
    inEdit: false,
    reader: (r) => r.size ?? "",
  },
  { name: "label", label: "Label", type: "text", reader: (r) => r.label ?? "" },
];

// ─── Create form fields ───────────────────────────────────────────────────────
export const buildRoomCreateFields = (
  optionsMap: Record<string, SelectOption[]>,
): FieldConfig[] =>
  ROOM_FIELD_CONFIG.filter((c) => c.inCreate).map(
    (c): FieldConfig => ({
      name: c.key,
      label: c.label,
      type: c.type ?? "text",
      required: c.required,
      options: optionsMap[c.key],
    }),
  );

// ─── Read ─────────────────────────────────────────────────────────────────────
/** Reads the display string for a field key from a room record */
export const readField = (key: string, r: IRoom): string =>
  ROOM_FIELD_CONFIG.find((c) => c.key === key)?.reader?.(r) ?? "";
