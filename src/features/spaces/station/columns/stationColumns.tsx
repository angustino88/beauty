import type { Key, ReactNode } from "react";
import type { ColumnsType } from "antd/es/table";
import {
  renderImageCell,
  renderOwnerCell,
} from "@/features/lab-equipment/shared";
import { pageIcons } from "@/components/layout/pageIcons";
import type { IStation } from "../types";
import { SpaceLocationEmpty, SpaceLocationRow, SpaceLocationStack } from "@/features/spaces/shared/components/SpaceLocation";
import { buildStateColumns } from "@/features/spaces/shared/stateColumns";

interface BuildStationColumnsArgs {
  isAdmin: boolean;
  activeFilters: Record<string, Key[] | null>;
  roomFilters: Array<{ text: string; value: string }>;
  ownerFilters: Array<{ text: string; value: string }>;
  actionsRenderer: (_: unknown, record: IStation) => ReactNode;
}

export const buildStationColumns = ({
  activeFilters,
  roomFilters,
  ownerFilters,
  actionsRenderer,
}: BuildStationColumnsArgs): ColumnsType<IStation> => {
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
      render: (_: unknown, record) => renderImageCell(record.image, pageIcons.stations),
    },
    // Lifecycle (main status), Availability and Activity: the same three columns as rooms and benches.
    ...buildStateColumns<IStation>("station", activeFilters),
    {
      title: "Room & Slot",
      key: "room",
      width: 200,
      filters: roomFilters,
      filterSearch: true,
      filteredValue: activeFilters.room ?? null,
      render: (_, record) => {
        if (!record.room) return <SpaceLocationEmpty label="Not placed" />;
        return (
          <SpaceLocationStack>
              <SpaceLocationRow
                kind="room"
                primary
                label={record.room.name || record.room.sku}
                searchKey={record.room.sku}
                refId={record.room.id}
                slot={record.slot_code}
              />
          </SpaceLocationStack>
        );
      },
    },
    {
      title: "Dimensions (H×W×D mm)",
      key: "dimensions",
      width: 180,
      render: (_, record) => {
        const { height_mm, width_mm, depth_mm } = record;
        if (!height_mm && !width_mm && !depth_mm) return "—";
        return `${height_mm ?? "—"} × ${width_mm ?? "—"} × ${depth_mm ?? "—"}`;
      },
    },
    {
      title: "Power Capacity (W)",
      dataIndex: "power_capacity_w",
      key: "power_capacity_w",
      width: 150,
      align: "center",
      render: (val: number | null) => (val != null ? `${val} W` : "—"),
    },
    {
      title: "Benches / Capacity",
      key: "bench_capacity",
      width: 160,
      align: "center",
      render: (_, record) => record.active_bench_count != null || record.bench_capacity != null
        ? `${record.active_bench_count ?? record.bench_count ?? '—'} / ${record.bench_capacity ?? '—'}`
        : record.bench_count ? `${record.bench_count} benches` : '—',
    },
    {
      title: "Power Remaining",
      key: "available_power_w",
      width: 165,
      align: "center",
      render: (_, record) => record.available_power_w != null ? `${record.available_power_w} W` : '—',
    },
    {
      title: "Max Load (kg)",
      dataIndex: "max_load_kg",
      key: "max_load_kg",
      width: 130,
      align: "center",
      render: (val: number | null) => (val != null ? `${val} kg` : "—"),
    },
    {
      title: "Network Ports",
      dataIndex: "network_port_capacity",
      key: "network_port_capacity",
      width: 120,
      align: "center",
      render: (val: number | null) => val ?? "—",
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
      width: 150,
      align: "center",
      render: actionsRenderer,
    },
  ];
};
