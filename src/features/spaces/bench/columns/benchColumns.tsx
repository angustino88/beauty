import type { Key, ReactNode } from "react";
import type { ColumnsType } from "antd/es/table";
import { Tag } from "antd";
import {
  renderImageCell,
  renderOwnerCell,
} from "@/features/lab-equipment/shared";
import { pageIcons } from "@/components/layout/pageIcons";
import type { IBench } from "../types";
import { ActivityBadge, AvailabilityBadge, LifecycleBadge } from "@/features/spaces/shared/components/ResourceStatusBadges";
import { BenchLocationCell } from "./BenchLocationCell";

// Filtered on the server (lifecycle_status, condition, activity_status). Availability itself has no
// filter; it follows from condition and parent downtime, so the Availability column filters condition.
const LIFECYCLE_FILTERS = [
  { text: "Planned", value: "planned" },
  { text: "In service", value: "in_service" },
  { text: "Retired", value: "retired" },
];
const CONDITION_FILTERS = [
  { text: "Operational", value: "operational" },
  { text: "In maintenance", value: "in_maintenance" },
  { text: "Out of service", value: "out_of_service" },
];
const ACTIVITY_FILTERS = [
  { text: "No booking today", value: "idle" },
  { text: "Booked (later today)", value: "scheduled" },
  { text: "In use now", value: "active" },
];

interface BuildBenchColumnsArgs {
  isAdmin: boolean;
  activeFilters: Record<string, Key[] | null>;
  groupFilters: Array<{ text: string; value: string }>;
  typeFilters: Array<{ text: string; value: string }>;
  locationFilters: Array<{ text: string; value: string }>;
  ownerFilters: Array<{ text: string; value: string }>;
  actionsRenderer: (_: unknown, record: IBench) => ReactNode;
}

export const buildBenchColumns = ({
  activeFilters,
  groupFilters,
  typeFilters,
  locationFilters,
  ownerFilters,
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
      // Three independent states, three columns (lifecycle, availability, booking activity).
      title: "Lifecycle",
      key: "status",
      width: 150,
      filters: LIFECYCLE_FILTERS,
      filteredValue: activeFilters.status ?? null,
      render: (_, record) => <LifecycleBadge value={record.lifecycle_status} />,
    },
    {
      title: "Availability",
      key: "condition",
      width: 175,
      filters: CONDITION_FILTERS,
      filteredValue: activeFilters.condition ?? null,
      render: (_, record) => <AvailabilityBadge state={record} />,
    },
    {
      title: "Activity",
      key: "activity",
      width: 160,
      filters: ACTIVITY_FILTERS,
      filteredValue: activeFilters.activity ?? null,
      render: (_, record) => <ActivityBadge value={record.activity_status} />,
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
