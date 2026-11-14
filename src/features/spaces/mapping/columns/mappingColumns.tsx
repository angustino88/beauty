import type { Key } from "react";
import type { ColumnsType } from "antd/es/table";
import { Button, Dropdown, Space } from "antd";
import {
  AppstoreAddOutlined,
  EnvironmentOutlined,
  MoreOutlined,
  PrinterOutlined,
} from "@ant-design/icons";
import { TooltipButton } from "@/components/layout/TooltipButton";
import type { MappingFilterOptions, ResourceMappingRow } from "../types";
import {
  renderBenchTag,
  renderEquipmentCategories,
  renderLicenses,
  renderMappingStatus,
  renderRoomTag,
  renderStationTag,
} from "./mappingColumnRenderers";

interface BuildColumnsArgs {
  filters: Record<string, Key[] | null>;
  filterOptions: MappingFilterOptions;
  onPlace: (row: ResourceMappingRow) => void;
  onAssignEquipment: (row: ResourceMappingRow) => void;
  onPrintAll: (row: ResourceMappingRow) => void;
}

const colFilter = (
  key: string,
  options: Array<{ text: string; value: string | number }>,
  filters: BuildColumnsArgs["filters"],
) => ({
  filters: options,
  filterSearch: true,
  filterMultiple: false,
  filteredValue: filters[key] ?? null,
});

export const buildMappingColumns = ({
  filters,
  filterOptions,
  onPlace,
  onAssignEquipment,
  onPrintAll,
}: BuildColumnsArgs): ColumnsType<ResourceMappingRow> => {
  return [
    {
      title: "ID",
      key: "id",
      width: 75,
      align: "center",
      render: (_v, row) => row.id,
    },
    {
      title: "Bench",
      key: "bench",
      width: 220,
      ...colFilter("bench", filterOptions.benches, filters),
      render: (_v, row) => renderBenchTag(row),
    },
    {
      title: "Status",
      key: "status",
      width: 140,
      align: "center",
      render: (_v, row) => renderMappingStatus(row),
    },
    {
      title: "Station & Slot",
      key: "station",
      width: 230,
      ...colFilter("station", filterOptions.stations, filters),
      render: (_v, row) => renderStationTag(row),
    },
    {
      title: "Room & Slot",
      key: "room",
      width: 230,
      ...colFilter("room", filterOptions.rooms, filters),
      render: (_v, row) => renderRoomTag(row),
    },
    {
      title: "Equipment",
      key: "equipment",
      width: 320,
      ...colFilter("category", filterOptions.categories, filters),
      render: (_v, row) => renderEquipmentCategories(row.equipment),
    },
    {
      title: "Licenses",
      key: "licenses",
      width: 180,
      render: (_v, row) => renderLicenses(row.licenses),
    },
    {
      title: "Actions",
      key: "actions",
      width: 140,
      fixed: "right",
      align: "center",
      render: (_v, row) => (
        <Space size={4}>
          <TooltipButton
            tooltip="Place Bench into Station & Room"
            icon={<EnvironmentOutlined />}
            onClick={() => onPlace(row)}
          />
          <TooltipButton
            tooltip="Assign / Manage Equipment"
            icon={<AppstoreAddOutlined />}
            onClick={() => onAssignEquipment(row)}
          />
          <Dropdown
            menu={{
              items: [
                {
                  key: "print",
                  icon: <PrinterOutlined />,
                  label: "Print device labels",
                  onClick: () => onPrintAll(row),
                },
              ],
            }}
            placement="bottomRight"
          >
            <Button icon={<MoreOutlined />} size="middle" />
          </Dropdown>
        </Space>
      ),
    },
  ];
};
