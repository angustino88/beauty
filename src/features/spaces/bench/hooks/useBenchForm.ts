import {
  useCreateBenchMutation,
  useDeleteBenchMutation,
  useUpdateBenchMutation,
  useUpdateBenchImageMutation,
  useDeleteBenchImageMutation,
} from "../api";
import {
  notifyEquipmentCreated,
  notifyEquipmentError,
  useEquipmentCrudActions,
} from "@/features/lab-equipment/shared";
import type { IBenchPayload } from "../types";

export function useBenchForm() {
  const [createBench, { isLoading: creating }] = useCreateBenchMutation();
  const [updateBench, { isLoading: updating }] = useUpdateBenchMutation();
  const [deleteBench, { isLoading: deleting }] = useDeleteBenchMutation();
  const [updateBenchImage] = useUpdateBenchImageMutation();
  const [deleteBenchImage] = useDeleteBenchImageMutation();

  const actions = useEquipmentCrudActions<IBenchPayload>({
    updateMutation: updateBench,
    deleteMutation: deleteBench,
    updateImageMutation: updateBenchImage,
    deleteImageMutation: deleteBenchImage,
    mapStatusBody: (values) => values as unknown as IBenchPayload,
    labels: { entityName: "Bench", entityNameLower: "bench", errorPrefix: "bench" },
  });

  const createFromValues = async (values: Record<string, unknown>, imageFile?: File | null) => {
    const payload: IBenchPayload = {
      sku: typeof values.sku === "string" ? values.sku : undefined,
      name: typeof values.name === "string" ? values.name : undefined,
      bench_group_id: values.bench_group_id ? Number(values.bench_group_id) : null,
      type_id: values.type_id ? Number(values.type_id) : null,
      setup_location_id: values.setup_location_id ? Number(values.setup_location_id) : null,
      station_slot_id: values.station_slot_id ? Number(values.station_slot_id) : null,
      remark: typeof values.remark === "string" ? values.remark : "",
    };

    try {
      const created = await createBench(payload).unwrap();
      if (imageFile) await updateBenchImage({ id: created.id, image: imageFile }).unwrap();
      notifyEquipmentCreated("Bench", created, { sku: payload.sku, name: payload.name });
    } catch (err) {
      notifyEquipmentError("create", "Bench", err);
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
