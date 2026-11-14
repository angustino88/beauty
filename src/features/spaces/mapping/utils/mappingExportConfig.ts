import type { ExcelColumn } from "@/features/lab-analytics/utils/export";
import type { ResourceMappingRow } from "../types";

export const mappingExportColumns: ExcelColumn<ResourceMappingRow>[] = [
  { title: "ID", dataIndex: "id" },
  { title: "Bench SKU", dataIndex: "bench_sku", read: (row) => row.bench.sku },
  { title: "Bench Name", dataIndex: "bench_name", read: (row) => row.bench.name },
  { title: "Station SKU", dataIndex: "station_sku", read: (row) => row.station?.sku ?? "" },
  { title: "Station Name", dataIndex: "station_name", read: (row) => row.station?.name ?? "" },
  { title: "Station Slot", dataIndex: "station_slot", read: (row) => row.station_slot?.slot_code ?? "" },
  { title: "Room SKU", dataIndex: "room_sku", read: (row) => row.room?.sku ?? "" },
  { title: "Room Name", dataIndex: "room_name", read: (row) => row.room?.name ?? "" },
  { title: "Room Slot", dataIndex: "room_slot", read: (row) => row.room_slot?.slot_code ?? "" },
  { title: "Equipment Count", dataIndex: "equipment_count", read: (row) => row.equipment.length },
  {
    title: "Equipment SKUs",
    dataIndex: "equipment_skus",
    read: (row) => row.equipment.map((e) => e.sku).filter(Boolean).join(", "),
  },
  {
    title: "Equipment Names",
    dataIndex: "equipment_names",
    read: (row) => row.equipment.map((e) => e.name).filter(Boolean).join(", "),
  },
  {
    title: "Licenses",
    dataIndex: "licenses",
    read: (row) => row.licenses.map((l) => l.name || l.sku).filter(Boolean).join(", "),
  },
];

export const changeLogExportRequest = {
  debug: false,
  sheets: {
    resource_mapping: {
      sheet: "Resource Mapping",
      cols: [
        { title: "ID", field: "id" },
        { title: "Bench SKU", field: "bench__sku" },
        { title: "Action Type", field: "action_type" },
        { title: "Field Changed", field: "field_changed" },
        { title: "Old Value", field: "old_value" },
        { title: "New Value", field: "new_value" },
        { title: "Changed By", field: "changed_by__username" },
        { title: "Changed At", field: "created" },
      ],
    },
  },
};
