import type { ExcelColumn } from "@/features/lab-analytics/utils/export";
import type { MappingState, ResourceMappingRow } from "../types";

export const MAPPING_STATE_LABELS: Record<MappingState, string> = {
  fully_mapped: "Fully mapped",
  needs_equipment: "Needs equipment",
  needs_placement: "Needs placement",
};

export const mappingExportColumns: ExcelColumn<ResourceMappingRow>[] = [
  { title: "Bench SKU", dataIndex: "bench_sku", read: (row) => row.bench.sku },
  { title: "Bench Name", dataIndex: "bench_name", read: (row) => row.bench.name },
  { title: "Mapping", dataIndex: "state", read: (row) => MAPPING_STATE_LABELS[row.status.state] },
  { title: "Station SKU", dataIndex: "station_sku", read: (row) => row.station?.sku ?? "" },
  { title: "Station Name", dataIndex: "station_name", read: (row) => row.station?.name ?? "" },
  { title: "Station Slot", dataIndex: "station_slot", read: (row) => row.station_slot?.slot_code ?? "" },
  { title: "Room SKU", dataIndex: "room_sku", read: (row) => row.room?.sku ?? "" },
  { title: "Room Name", dataIndex: "room_name", read: (row) => row.room?.name ?? "" },
  { title: "Room Slot", dataIndex: "room_slot", read: (row) => row.room_slot?.slot_code ?? "" },
  { title: "Equipment Count", dataIndex: "equipment_count", read: (row) => row.equipment.length },
  {
    title: "Equipment",
    dataIndex: "equipment",
    read: (row) => row.equipment.map((e) => `${e.sku} (${e.category.name}${e.role ? `, ${e.role}` : ""})`).join("; "),
  },
  {
    title: "Licenses",
    dataIndex: "licenses",
    read: (row) => row.licenses.map((l) => l.sku || l.name).filter(Boolean).join("; "),
  },
];
