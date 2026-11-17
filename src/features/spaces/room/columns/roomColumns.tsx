/* eslint-disable react-refresh/only-export-components */
import type { Key, ReactNode } from "react";
import {
  buildEquipmentInfo,
  LastAuditCell,
  renderImageCell,
  renderOwnerCell,
} from "@/features/lab-equipment/shared";
import { pageIcons } from "@/components/layout/pageIcons";
import type { IRoom } from "../types";
import { readField } from "./roomConfig";
import {
  renderRoomLocationCell,
  renderRoomRacksCell,
  renderRoomSpecsCell,
} from "./roomColumnRenderers";
import SpaceStatusBadge from "@/features/spaces/shared/SpaceStatusBadge";
import { readSpaceStatus } from "@/features/spaces/shared/spaceStatus";

// Re-export config & types so existing consumers don't need to change imports
export type { RoomFieldConfig, RoomOptionSource, RoomSpecField } from "./roomConfig";
export {
  ROOM_FIELD_CONFIG,
  ROOM_OPTIONS_CONFIG,
  ROOM_SPECS_FIELDS,
  buildRoomFormFields,
  toRoomFormValues,
  readField,
} from "./roomConfig";

type FilterItem = { text: string; value: string };
interface BuildColumnsArgs {
  /** Active filter state passed to Ant Design Table filteredValue */
  activeFilters: Record<string, Key[] | null>;
  /** Column filter dropdown items keyed by ROOM_OPTIONS_CONFIG key */
  filtersMap: Record<string, FilterItem[]>;
  /** Backend facet-derived status filter options */
  statusFilters: FilterItem[];
  actionsRenderer: (_: unknown, record: IRoom) => ReactNode;
}

const text = (key: string) => (_: unknown, record: IRoom) => readField(key, record);

/** Read-only room table; rooms are edited in the Edit Room form. */
export const buildRoomColumns = ({
  activeFilters,
  filtersMap,
  statusFilters,
  actionsRenderer,
}: BuildColumnsArgs) => [
  { title: "ID", dataIndex: "id", key: "id", width: 70, fixed: "left" as const },
  { title: "SKU", dataIndex: "sku", key: "sku", width: 120, fixed: "left" as const },
  { title: "Name", key: "name", width: 180, fixed: "left" as const, render: text("name") },
  { title: "Image", key: "image", width: 90, align: "center" as const, render: (_: unknown, record: IRoom) => renderImageCell(record.image, pageIcons.rooms) },
  {
    title: "Status",
    key: "status",
    width: 172,
    align: "left" as const,
    onHeaderCell: () => ({ className: 'centeredFilterHeader' }),
    filters: statusFilters,
    filterSearch: true,
    filteredValue: activeFilters.status ?? null,
    onFilter: (value: boolean | Key, r: IRoom) => {
      const val = String(value);
      return (
        r.lifecycle_status?.value === val ||
        r.access_policy?.value === val ||
        r.condition?.value === val ||
        r.activity_status?.value === val ||
        readSpaceStatus(r) === val
      );
    },
    render: (_: unknown, record: IRoom) => (
      <SpaceStatusBadge
        spaceKind="room"
        resourceState={record}
        accessPolicy={record.access_policy}
        status={readSpaceStatus(record)}
      />
    ),
  },
  { title: "Location", key: "location", width: 220, render: (_: unknown, record: IRoom) => renderRoomLocationCell(record) },
  {
    title: "Country",
    key: "country",
    width: 120,
    filters: filtersMap.country,
    filterSearch: true,
    filteredValue: activeFilters.country ?? null,
    onFilter: (value: boolean | Key, r: IRoom) =>
      String(r.country ?? r.location_info?.country?.id ?? readField("country", r)) === String(value),
    render: text("country"),
  },
  {
    title: "City",
    key: "city",
    width: 120,
    filters: filtersMap.city,
    filterSearch: true,
    filteredValue: activeFilters.city ?? null,
    onFilter: (value: boolean | Key, r: IRoom) =>
      String(r.location_info?.city?.id ?? readField("city", r)) === String(value),
    render: text("city"),
  },
  {
    title: "Building",
    key: "building",
    width: 150,
    filters: filtersMap.building,
    filterSearch: true,
    filteredValue: activeFilters.building ?? null,
    onFilter: (value: boolean | Key, r: IRoom) =>
      String(r.location_info?.building?.id ?? readField("building", r)) === String(value),
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
    filters: filtersMap.primary_owner,
    filterSearch: true,
    filteredValue: activeFilters.primary_owner ?? null,
    onFilter: (value: boolean | Key, r: IRoom) => readField("primary_owner", r) === String(value),
    render: (_: unknown, record: IRoom) => renderOwnerCell(record.primary_owner),
  },
  {
    title: "Last Audited",
    key: "lab_audit",
    width: 140,
    align: "center" as const,
    render: (_: unknown, record: IRoom) => <LastAuditCell resourceType="room" resourceId={record.id} />,
  },
  {
    title: "Information",
    key: "information",
    width: 180,
    render: (_: unknown, r: IRoom) => <span style={{ whiteSpace: "pre-line" }}>{buildEquipmentInfo(r)}</span>,
  },
  { title: "Remark", key: "remark", width: 150, render: text("remark") },
  { title: "Actions", key: "actions", fixed: "right" as const, width: 165, align: "center" as const, render: actionsRenderer },
];
