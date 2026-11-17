import type { Key } from "react";
import type { ColumnsType } from "antd/es/table";
import { Space } from "antd";
import { AppstoreAddOutlined, EnvironmentOutlined, PrinterOutlined } from "@ant-design/icons";
import { TooltipButton } from "@/components/layout/TooltipButton";
import { resourceText } from "@/components/inputs/ResourceOption";
import type { MappingFilterOptions, MappingOptionItem, MappingState, ResourceMappingRow } from "../types";
import { MAPPING_STATE_LABELS } from "../utils/mappingExportConfig";
import {
  renderBenchImage,
  renderBenchTag,
  renderEquipmentCategories,
  renderEquipmentImages,
  renderLicenses,
  renderMappingStatus,
  renderRoomImage,
  renderRoomTag,
  renderStationImage,
  renderStationTag,
} from "./mappingColumnRenderers";

interface BuildColumnsArgs {
  filters: Record<string, Key[] | null>;
  filterOptions: MappingFilterOptions;
  canEdit: boolean;
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
  onPlace,
  onAssignEquipment,
  onPrintLabels,
}: BuildColumnsArgs): ColumnsType<ResourceMappingRow> => [
  {
    title: "Bench",
    key: "bench",
    width: 230,
    fixed: "left",
    ...serverFilter("bench", choices(filterOptions.benches), filters),
    render: (_v, row) => renderBenchTag(row),
  },
  {
    title: "Bench image",
    key: "bench_image",
    width: 96,
    align: "center",
    render: (_v, row) => renderBenchImage(row),
  },
  {
    title: "Mapping",
    key: "state",
    width: 170,
    ...serverFilter("state", STATE_FILTERS, filters),
    render: (_v, row) => renderMappingStatus(row),
  },
  {
    title: "Station",
    key: "station",
    width: 220,
    ...serverFilter("station", choices(filterOptions.stations), filters),
    render: (_v, row) => renderStationTag(row),
  },
  {
    title: "Station image",
    key: "station_image",
    width: 96,
    align: "center",
    render: (_v, row) => renderStationImage(row),
  },
  {
    title: "Room",
    key: "room",
    width: 220,
    ...serverFilter("room", choices(filterOptions.rooms), filters),
    render: (_v, row) => renderRoomTag(row),
  },
  {
    title: "Room image",
    key: "room_image",
    width: 96,
    align: "center",
    render: (_v, row) => renderRoomImage(row),
  },
  {
    title: "Equipment",
    key: "category",
    ...serverFilter("category", choices(filterOptions.categories), filters),
    render: (_v, row) => renderEquipmentCategories(row.equipment),
  },
  {
    title: "Equipment image",
    key: "equipment_image",
    width: 150,
    render: (_v, row) => renderEquipmentImages(row.equipment),
  },
  {
    title: "Licenses",
    key: "licenses",
    width: 200,
    render: (_v, row) => renderLicenses(row.licenses),
  },
  {
    title: "",
    key: "actions",
    width: canEdit ? 132 : 56,
    fixed: "right",
    align: "center",
    render: (_v, row) => (
      <Space size={4}>
        {canEdit && (
          <TooltipButton tooltip="Place on a station" icon={<EnvironmentOutlined />} onClick={() => onPlace(row)} />
        )}
        {canEdit && (
          <TooltipButton tooltip="Manage equipment" icon={<AppstoreAddOutlined />} onClick={() => onAssignEquipment(row)} />
        )}
        <TooltipButton tooltip="Print labels" icon={<PrinterOutlined />} onClick={() => onPrintLabels(row)} />
      </Space>
    ),
  },
];
