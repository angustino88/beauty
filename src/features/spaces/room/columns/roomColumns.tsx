/* eslint-disable react-refresh/only-export-components */
import type { Key, ReactNode } from "react";
import {
  LastAuditCell,
  renderImageCell,
  renderOwnerCell,
} from "@/features/lab-equipment/shared";
import { pageIcons } from "@/components/layout/pageIcons";
import { ownershipColumns, specificationColumns } from "@/features/lab-equipment/shared/columns/specificationColumns";
import { ROOM_DETAILS } from "../../shared/resourceForm";
import type { IRoom } from "../types";
import { readField } from "./roomConfig";
import {
  renderRoomLocationCell,
  renderRoomRacksCell,
  renderRoomSpecsCell,
} from "./roomColumnRenderers";
import type { RoomLocationOptions } from "../hooks/useRoomLocationOptions";
import { roomLocationColumnFilter } from "./roomLocationFilter";
import { equipmentStaticColumnFilter } from "@/features/lab-equipment/shared/facets/EquipmentFacetDropdown";
import { buildStateColumns } from "@/features/spaces/shared/stateColumns";

// Re-export config & types so existing consumers don't need to change imports
export type { RoomFieldConfig, RoomSpecField } from "./roomConfig";
export {
  ROOM_FIELD_CONFIG,
  ROOM_SPECS_FIELDS,
  buildRoomFormFields,
  toRoomFormValues,
  readField,
} from "./roomConfig";

interface BuildColumnsArgs {
  /** Active filter state passed to Ant Design Table filteredValue */
  activeFilters: Record<string, Key[] | null>;
  locationOptions: RoomLocationOptions;
  ownerFilters?: Parameters<typeof equipmentStaticColumnFilter>[0];
  actionsRenderer: (_: unknown, record: IRoom) => ReactNode;
}

const text = (key: string) => (_: unknown, record: IRoom) => readField(key, record);

/** Read-only room table; rooms are edited in the Edit Room form. */
export const buildRoomColumns = ({
  activeFilters,
  locationOptions,
  ownerFilters,
  actionsRenderer,
}: BuildColumnsArgs) => [
  { title: "ID", dataIndex: "id", key: "id", width: 70, fixed: "left" as const },
  { title: "SKU", dataIndex: "sku", key: "sku", width: 120, fixed: "left" as const },
  { title: "Name", key: "name", width: 180, fixed: "left" as const, render: text("name") },
  { title: "Image", key: "image", width: 90, align: "center" as const, render: (_: unknown, record: IRoom) => renderImageCell(record.image, pageIcons.rooms) },
  // Lifecycle (main status), Availability and Activity: the same three columns as stations and benches.
  ...buildStateColumns<IRoom>("room", activeFilters),
  { title: "Location", key: "location", width: 220, render: (_: unknown, record: IRoom) => renderRoomLocationCell(record) },
  {
    title: "Country",
    key: "country",
    width: 120,
    ...roomLocationColumnFilter("Country", locationOptions.country),
    filteredValue: activeFilters.country ?? null,
    render: text("country"),
  },
  {
    title: "City",
    key: "city",
    width: 120,
    ...roomLocationColumnFilter("City", locationOptions.city),
    filteredValue: activeFilters.city ?? null,
    render: text("city"),
  },
  {
    title: "Building",
    key: "building",
    width: 150,
    ...roomLocationColumnFilter("Building", locationOptions.building),
    filteredValue: activeFilters.building ?? null,
    render: text("building"),
  },
  { title: "Floor", key: "floor", width: 100, render: text("floor") },
  { title: "Rows", key: "rows", width: 90, align: "center" as const, render: text("rows") },
  { title: "Cols", key: "cols", width: 90, align: "center" as const, render: text("cols") },
  {
    title: "Size (m²)",
    key: "size",
    width: 200,
    render: (_: unknown, record: IRoom) => {
      const length = record.length != null ? `${record.length}m` : "-";
      const width = record.width != null ? `${record.width}m` : "-";
      return length === "-" && width === "-" ? "" : `${length} x ${width}`;
    },
  },
  { title: "Stations", key: "rack_list", width: 220, render: (_: unknown, record: IRoom) => renderRoomRacksCell(record) },
  {
    title: "Capacity (Used/Total)",
    key: "capacity",
    width: 160,
    align: "center" as const,
    render: (_: unknown, r: IRoom) => {
      const used = Array.isArray(r.rack_list) ? r.rack_list.length : 0;
      return `${used} / ${r.setup_capacity ?? 0}`;
    },
  },
  { title: "Specs", key: "specs", width: 80, align: "center" as const, render: (_: unknown, record: IRoom) => renderRoomSpecsCell(record) },
  {
    title: "Owner",
    key: "primary_owner",
    width: 150,
    ...equipmentStaticColumnFilter(ownerFilters),
    filteredValue: activeFilters.primary_owner ?? null,
    render: (_: unknown, record: IRoom) => renderOwnerCell(record.primary_owner),
  },
  {
    title: "Last Audited",
    key: "lab_audit",
    width: 140,
    align: "center" as const,
    render: (_: unknown, record: IRoom) => <LastAuditCell resourceType="room" resourceId={record.id} />,
  },
  ...ownershipColumns<IRoom>(),
  ...specificationColumns<IRoom>([
    { name: "label", label: "Short Label" },
    { name: "length", label: "Length (m)", type: "number" },
    { name: "width", label: "Width (m)", type: "number" },
    { name: "max_power", label: "Max Power (W)", type: "number" },
    { name: "location", label: "Map Link" },
    ...ROOM_DETAILS,
  ]),
  { title: "Remark", key: "remark", width: 150, render: text("remark") },
  { title: "Actions", key: "actions", fixed: "right" as const, width: 165, align: "center" as const, render: actionsRenderer },
];
