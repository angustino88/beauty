import {
  useCreateStationMutation,
  useDeleteStationMutation,
  useUpdateStationMutation,
} from "../api";
import {
  notifyEquipmentCreated,
  notifyEquipmentError,
  useEquipmentCrudActions,
} from "@/features/lab-equipment/shared";
import type { IStation, IStationPayload } from "../types";

export function useStationForm() {
  const [createStation, { isLoading: creating }] = useCreateStationMutation();
  const [updateStation, { isLoading: updating }] = useUpdateStationMutation();
  const [deleteStation, { isLoading: deleting }] = useDeleteStationMutation();

  const actions = useEquipmentCrudActions<IStationPayload>({
    updateMutation: updateStation,
    deleteMutation: deleteStation,
    updateImageMutation: (async () => ({ data: undefined as unknown as IStation })) as unknown as Parameters<typeof useEquipmentCrudActions<IStationPayload>>[0]["updateImageMutation"],
    mapStatusBody: (values) => values as unknown as IStationPayload,
    labels: { entityName: "Station", entityNameLower: "station", errorPrefix: "station" },
  });

  const createFromValues = async (values: Record<string, unknown>) => {
    const payload: IStationPayload = {
      sku: typeof values.sku === "string" ? values.sku : undefined,
      name: typeof values.name === "string" ? values.name : undefined,
      room_id: values.room_id ? Number(values.room_id) : null,
      slot_id: values.slot_id ? Number(values.slot_id) : null,
      power_capacity_w: values.power_capacity_w ? Number(values.power_capacity_w) : null,
      max_load_kg: values.max_load_kg ? Number(values.max_load_kg) : null,
      network_port_capacity: values.network_port_capacity ? Number(values.network_port_capacity) : null,
      height_mm: values.height_mm ? Number(values.height_mm) : null,
      width_mm: values.width_mm ? Number(values.width_mm) : null,
      depth_mm: values.depth_mm ? Number(values.depth_mm) : null,
      label: typeof values.label === "string" ? values.label : undefined,
      remark: typeof values.remark === "string" ? values.remark : "",
    };

    try {
      const created = await createStation(payload).unwrap();
      notifyEquipmentCreated("Station", created, { sku: payload.sku, name: payload.name });
    } catch (err) {
      notifyEquipmentError("create", "Station", err);
      throw err;
    }
  };

  return {
    createFromValues,
    ...actions,
    creating,
    updating,
    deleting,
  };
}
