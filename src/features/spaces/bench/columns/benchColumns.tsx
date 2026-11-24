import type { Key, ReactNode } from "react";
import type { ColumnsType } from "antd/es/table";
import {
  renderImageCell,
  renderOwnerCell,
} from "@/features/lab-equipment/shared";
import { pageIcons } from "@/components/layout/pageIcons";
import { ownershipColumns, specificationColumns } from "@/features/lab-equipment/shared/columns/specificationColumns";
import { BENCH_DETAILS } from "../../shared/resourceForm";
import type { IBench } from "../types";
import { buildStateColumns } from "@/features/spaces/shared/stateColumns";
import { BenchEquipmentCell } from "./BenchEquipmentCell";
import { BenchLocationCell } from "./BenchLocationCell";

interface BuildBenchColumnsArgs {
  canManageLabOperations: boolean;
  activeFilters: Record<string, Key[] | null>;
  groupFilters: Array<{ text: string; value: string }>;
  typeFilters: Array<{ text: string; value: string }>;
  locationFilters: Array<{ text: string; value: string }>;
  ownerFilters: Array<{ text: string; value: string }>;
  actionsRenderer: (_: unknown, record: IBench) => ReactNode;
  onManageEquipment: (bench: IBench) => void;
}

export const buildBenchColumns = ({
  canManageLabOperations,
  activeFilters,
  groupFilters,
  typeFilters,
  locationFilters,
  ownerFilters,
  actionsRenderer,
  onManageEquipment,
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
    // Lifecycle (main status), Availability and Activity: the same three columns as rooms and stations.
    ...buildStateColumns<IBench>("bench", activeFilters),
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
      key: "bench_group",
      width: 160,
      filters: groupFilters,
      filterSearch: true,
      filteredValue: activeFilters.bench_group ?? null,
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
      width: 150,
      align: "center",
      render: (_count: number, record) => (
        <BenchEquipmentCell
          bench={record}
          canManageLabOperations={canManageLabOperations}
          onManageEquipment={onManageEquipment}
        />
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
    ...ownershipColumns<IBench>(),
    ...specificationColumns<IBench>(BENCH_DETAILS),
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
