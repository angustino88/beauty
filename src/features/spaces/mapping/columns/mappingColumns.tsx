import type { Key } from "react";
import type { ColumnsType } from "antd/es/table";
import { Space } from "antd";
import { AppstoreAddOutlined, EnvironmentOutlined, PrinterOutlined } from "@ant-design/icons";
import { TooltipButton } from "@/components/layout/TooltipButton";
import { resourceText } from "@/components/inputs/ResourceOption";
import type { MappingFilterOptions, MappingOptionItem, MappingState, ResourceMappingRow } from "../types";
import { MAPPING_STATE_LABELS } from "../utils/mappingExportConfig";
import {
  renderBenchTag,
  MappingAssetSummary,
  type MappingAssetKind,
  renderMappingStatus,
  renderRoomTag,
  renderStationTag,
} from "./mappingColumnRenderers";

interface BuildColumnsArgs {
  filters: Record<string, Key[] | null>;
  filterOptions: MappingFilterOptions;
  canEdit: boolean;
  pinColumns: boolean;
  onViewAssets: (row: ResourceMappingRow, kind: MappingAssetKind) => void;
  onPlace: (row: ResourceMappingRow) => void;
  onAssignEquipment: (row: ResourceMappingRow) => void;
  onPrintLabels: (row: ResourceMappingRow) => void;
}

/** Server-side single-choice column filter; options read "SKU · Name". */
const serverFilter = (
  key: string,
  options: Array<{ text: string; value: string | number }>,
  filters: BuildColumnsArgs["filters"],
) => ({
  filters: options,
  filterSearch: true,
  filterMultiple: false,
  filteredValue: filters[key] ?? null,
});

const choices = (items: MappingOptionItem[]) =>
  items.map((item) => ({ text: resourceText(item.sku, item.name) || String(item.id), value: item.id }));

const STATE_FILTERS = (Object.keys(MAPPING_STATE_LABELS) as MappingState[]).map((state) => ({
  text: MAPPING_STATE_LABELS[state],
  value: state,
}));

export const buildMappingColumns = ({
  filters,
  filterOptions,
  canEdit,
  pinColumns,
  onViewAssets,
  onPlace,
  onAssignEquipment,
  onPrintLabels,
}: BuildColumnsArgs): ColumnsType<ResourceMappingRow> => [
  {
    title: "Bench",
    key: "bench",
    width: 180,
    fixed: pinColumns ? "left" : undefined,
    ...serverFilter("bench", choices(filterOptions.benches), filters),
    render: (_v, row) => renderBenchTag(row),
  },
  {
    title: "Mapping",
    key: "state",
    width: 155,
    ...serverFilter("state", STATE_FILTERS, filters),
    render: (_v, row) => renderMappingStatus(row),
  },
  {
    title: "Station",
    key: "station",
    width: 190,
    ...serverFilter("station", choices(filterOptions.stations), filters),
    render: (_v, row) => renderStationTag(row),
  },
  {
    title: "Room",
    key: "room",
    width: 190,
    ...serverFilter("room", choices(filterOptions.rooms), filters),
    render: (_v, row) => renderRoomTag(row),
  },
  {
    title: "Equipment",
    key: "category",
    width: 140,
    ...serverFilter("category", choices(filterOptions.categories), filters),
    render: (_v, row) => <MappingAssetSummary row={row} kind="equipment" onOpen={() => onViewAssets(row, "equipment")} />,
  },
  {
    title: "Licenses",
    key: "licenses",
    width: 140,
    render: (_v, row) => <MappingAssetSummary row={row} kind="licenses" onOpen={() => onViewAssets(row, "licenses")} />,
  },
  {
    title: "",
    key: "actions",
    width: canEdit ? 132 : 56,
    fixed: pinColumns ? "right" : undefined,
    align: "center",
    render: (_v, row) => (
      <Space size={4}>
        {canEdit && (
          <TooltipButton tooltip={`Place ${row.bench.name || row.bench.sku} on a station`} icon={<EnvironmentOutlined />} onClick={() => onPlace(row)} />
        )}
        {canEdit && (
          <TooltipButton tooltip={`Assign equipment to ${row.bench.name || row.bench.sku}`} icon={<AppstoreAddOutlined />} onClick={() => onAssignEquipment(row)} />
        )}
        <TooltipButton tooltip={`Print labels for ${row.bench.name || row.bench.sku}`} icon={<PrinterOutlined />} onClick={() => onPrintLabels(row)} />
      </Space>
    ),
  },
];
