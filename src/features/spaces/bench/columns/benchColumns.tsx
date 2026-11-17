import type { Key, ReactNode } from "react";
import type { ColumnsType } from "antd/es/table";
import { Tag } from "antd";
import {
  buildEquipmentInfo,
  renderImageCell,
  renderOwnerCell,
} from "@/features/lab-equipment/shared";
import { pageIcons } from "@/components/layout/pageIcons";
import type { IBench } from "../types";
import SpaceStatusBadge from "@/features/spaces/shared/SpaceStatusBadge";
import { readSpaceStatus } from "@/features/spaces/shared/spaceStatus";
import { BenchLocationCell } from "./BenchLocationCell";

interface BuildBenchColumnsArgs {
  isAdmin: boolean;
  activeFilters: Record<string, Key[] | null>;
  groupFilters: Array<{ text: string; value: string }>;
  typeFilters: Array<{ text: string; value: string }>;
  locationFilters: Array<{ text: string; value: string }>;
  ownerFilters: Array<{ text: string; value: string }>;
  statusFilters: Array<{ text: string; value: string }>;
  actionsRenderer: (_: unknown, record: IBench) => ReactNode;
}

export const buildBenchColumns = ({
  activeFilters,
  groupFilters,
  typeFilters,
  locationFilters,
  ownerFilters,
  statusFilters,
  actionsRenderer,
}: BuildBenchColumnsArgs): ColumnsType<IBench> => {
  return [
    {
      title: "ID",
      dataIndex: "id",
      key: "id",
      width: 70,
      fixed: "left",
      align: "center",
    },
    {
      title: "SKU",
      dataIndex: "sku",
      key: "sku",
      width: 130,
      fixed: "left",
    },
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
      width: 180,
      fixed: "left",
      render: (name: string, record) => <strong>{name || record.sku}</strong>,
    },
    {
      title: "Image",
      key: "image",
      width: 90,
      align: "center",
      render: (_: unknown, record) => renderImageCell(record.image, pageIcons.benches),
    },
    {
      title: "Status",
      key: "status",
      width: 172,
      align: "left",
      filters: statusFilters,
      filteredValue: activeFilters.status ?? null,
      onFilter: (value: boolean | Key, record: IBench) => {
        const val = String(value);
        return (
          record.lifecycle_status?.value === val ||
          record.condition?.value === val ||
          record.activity_status?.value === val ||
          readSpaceStatus(record) === val
        );
      },
      render: (_, record) => (
        <SpaceStatusBadge
          spaceKind="bench"
          resourceState={record}
          status={readSpaceStatus(record)}
          label={record.status_label ?? undefined}
        />
      ),
    },
    {
      title: "Station & Room",
      key: "location",
      width: 220,
      filters: locationFilters,
      filterSearch: true,
      filteredValue: activeFilters.location ?? null,
      render: (_, record) => <BenchLocationCell bench={record} />,
    },
    {
      title: "Bench Group",
      key: "group",
      width: 160,
      filters: groupFilters,
      filterSearch: true,
      filteredValue: activeFilters.group ?? null,
      render: (_, record) => record.bench_group?.name || "—",
    },
    {
      title: "Bench Type",
      key: "type",
      width: 140,
      filters: typeFilters,
      filterSearch: true,
      filteredValue: activeFilters.type ?? null,
      render: (_, record) => record.bench_type?.name || "—",
    },
    {
      title: "Assigned Equipment",
      dataIndex: "equipment_count",
      key: "equipment_count",
      width: 140,
      align: "center",
      render: (count: number) => (
        <Tag color={count > 0 ? "geekblue" : "default"}>{count} {count === 1 ? "asset" : "assets"}</Tag>
      ),
    },
    {
      title: "Owner",
      key: "owner",
      width: 150,
      filters: ownerFilters,
      filterSearch: true,
      filteredValue: activeFilters.owner ?? null,
      render: (_, record) =>
        renderOwnerCell(record.primary_owner),
    },
    {
      title: "Information",
      key: "information",
      width: 180,
      render: (_, record) => (
        <span style={{ whiteSpace: "pre-line" }}>{buildEquipmentInfo(record)}</span>
      ),
    },
    {
      title: "Remark",
      dataIndex: "remark",
      key: "remark",
      width: 160,
      render: (v: string | null) => v ?? "",
    },
    {
      title: "Actions",
      key: "actions",
      fixed: "right",
      width: 140,
      align: "center",
      render: actionsRenderer,
    },
  ];
};
