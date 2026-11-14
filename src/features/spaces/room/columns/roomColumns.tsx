/* eslint-disable react-refresh/only-export-components */
import type { Key, ReactNode } from "react";
import { makeRenderInlineField, type SelectOption } from "./InlineCell";
import {
  ResourceStatus,
  InlineImageUpload,
  buildEquipmentInfo,
  renderAuditCell,
  renderImageCell,
} from "@/features/lab-equipment/shared";
import type { IRoom } from "../types";
import { readField, type RoomInlineDraft } from "./roomConfig";
import {
  renderRoomLocationCell,
  renderRoomPrimaryOwnerCell,
  renderRoomRacksCell,
  renderRoomSpecsCell,
} from "./roomColumnRenderers";
import { ROOM_STATUS_OPTIONS } from "@/features/lab-equipment/shared/components/status/ResourceStatus";
import SpaceStatusBadge from "@/features/spaces/shared/SpaceStatusBadge";
import { readSpaceStatus } from "@/features/spaces/shared/spaceStatus";

// Re-export config & types so existing consumers don't need to change imports
export type {
  RoomFieldConfig,
  RoomOptionSource,
  RoomInlineDraft,
  RoomSpecField,
} from "./roomConfig";
export {
  ROOM_FIELD_CONFIG,
  ROOM_OPTIONS_CONFIG,
  ROOM_SPECS_FIELDS,
  toRoomInlineDraft,
  buildRoomCreateFields,
  readField,
} from "./roomConfig";

type FilterItem = { text: string; value: string };
interface BuildColumnsArgs {
  /** Active filter state passed to Ant Design Table filteredValue */
  activeFilters: Record<string, Key[] | null>;
  /** Column filter dropdown items keyed by ROOM_OPTIONS_CONFIG key */
  filtersMap: Record<string, FilterItem[]>;
  /** Select options for inline-edit cells keyed by ROOM_OPTIONS_CONFIG key */
  optionsMap: Record<string, SelectOption[]>;
  /** Backend facet-derived status filter options */
  statusFilters: FilterItem[];
  isEditing: (record: IRoom) => boolean;
  editingDraft: RoomInlineDraft | null;
  updateDraftField: <K extends keyof RoomInlineDraft>(
    key: K,
    value: RoomInlineDraft[K],
  ) => void;
  actionsRenderer: (_: unknown, record: IRoom) => ReactNode;
  onStatusChange?: (
    record: IRoom,
    values: { status_type: string; status_data: Record<string, unknown> },
  ) => void;
  onSpecsEdit?: (record: IRoom) => void;
  onImageChange?: (file: File) => void;
}

export const buildRoomColumns = ({
  activeFilters,
  filtersMap,
  optionsMap,
  statusFilters,
  isEditing,
  editingDraft,
  updateDraftField,
  actionsRenderer,
  onStatusChange,
  onSpecsEdit,
  onImageChange,
}: BuildColumnsArgs) => {
  const renderInlineField = makeRenderInlineField(
    isEditing,
    editingDraft,
    updateDraftField,
    optionsMap,
  );

  return [
    { title: "ID", dataIndex: "id", key: "id", width: 70, fixed: "left" as const },
    { title: "SKU", dataIndex: "sku", key: "sku", width: 120, fixed: "left" as const },
    {
      title: "Name",
      key: "name",
      width: 180,
      fixed: "left" as const,
      render: renderInlineField("name"),
    },
    {
      title: "Status",
      key: "status",
      width: 140,
      align: "center" as const,
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
      render: (_: unknown, record: IRoom) => {
        const draftStatus = isEditing(record) ? editingDraft?.pending_status_type : undefined;
        const displayStatus = draftStatus ?? readSpaceStatus(record);
        const displayRecord = draftStatus
          ? { ...record, current_status: { status_type: draftStatus, status_data: editingDraft?.pending_status_data ?? {} } }
          : record;
        return isEditing(record) ? (
          <ResourceStatus
            simpleMode
            status={displayStatus}
            isEditing
            record={displayRecord}
            statusOptions={ROOM_STATUS_OPTIONS}
            onStatusChange={onStatusChange ? (values) => onStatusChange(record, values) : undefined}
          />
        ) : (
          <SpaceStatusBadge
            spaceKind="room"
            resourceState={record}
            accessPolicy={record.access_policy}
            status={displayStatus}
          />
        );
      },
    },
    {
      title: "Location",
      key: "location",
      width: 220,
      render: (_: unknown, record: IRoom) => {
        if (isEditing(record)) return renderInlineField("location")(_, record);
        return renderRoomLocationCell(record);
      },
    },
    {
      title: "Country",
      key: "country",
      width: 120,
      filters: filtersMap.country,
      filterSearch: true,
      filteredValue: activeFilters.country ?? null,
      onFilter: (value: boolean | Key, r: IRoom) =>
        String(r.country ?? r.location_info?.country?.id ?? readField("country", r)) === String(value),
      render: renderInlineField("country"),
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
      render: renderInlineField("city"),
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
      render: renderInlineField("building"),
    },
    { title: "Floor", key: "floor", width: 100, render: renderInlineField("floor") },
    { title: "Rows", key: "rows", width: 90, align: "center" as const, render: renderInlineField("rows") },
    { title: "Cols", key: "cols", width: 90, align: "center" as const, render: renderInlineField("cols") },
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
    {
      title: "Stations",
      key: "rack_list",
      width: 220,
      render: (_: unknown, record: IRoom) =>
        renderRoomRacksCell(record, { isEditing, editingDraft, optionsMap, updateDraftField }),
    },
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
    {
      title: "Specs",
      key: "specs",
      width: 80,
      align: "center" as const,
      render: (_: unknown, record: IRoom) => renderRoomSpecsCell(record, { isEditing, onSpecsEdit }),
    },
    {
      title: "Primary Owner",
      key: "primary_owner",
      width: 150,
      filters: filtersMap.primary_owner,
      filterSearch: true,
      filteredValue: activeFilters.primary_owner ?? null,
      onFilter: (value: boolean | Key, r: IRoom) => readField("primary_owner", r) === String(value),
      render: (_: unknown, record: IRoom) =>
        renderRoomPrimaryOwnerCell(record, { isEditing, editingDraft, optionsMap, updateDraftField }),
    },
    {
      title: "Last Audited",
      key: "lab_audit",
      width: 140,
      align: "center" as const,
      render: (_: unknown, record: IRoom) => renderAuditCell(record.lab_audit),
    },
    {
      title: "Image",
      key: "image",
      width: 150,
      align: "center" as const,
      render: (_: unknown, record: IRoom) =>
        isEditing(record) && onImageChange ? (
          <InlineImageUpload currentImage={record.image} onImageChange={onImageChange} />
        ) : renderImageCell(record.image),
    },
    {
      title: "Information",
      key: "information",
      width: 180,
      render: (_: unknown, r: IRoom) => <span style={{ whiteSpace: "pre-line" }}>{buildEquipmentInfo(r)}</span>,
    },
    { title: "Remark", key: "remark", width: 150, render: renderInlineField("remark") },
    { title: "Actions", key: "actions", fixed: "right" as const, width: 165, align: "center" as const, render: actionsRenderer },
  ];
};
