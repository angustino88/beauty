import { notify } from "@/shared/notifications";
import {
  useCreateBenchMutation,
  useDeleteBenchMutation,
  useForceDeleteBenchMutation,
  useUpdateBenchMutation,
  useUpdateBenchImageMutation,
  useDeleteBenchImageMutation,
} from "../api";
import {
  notifyEquipmentCreated,
  notifyEquipmentError,
  parseFormApiError,
  useEquipmentCrudActions,
  type GuardedForceDeleteResult,
} from "@/features/lab-equipment/shared";
import { BENCH_DETAILS, detailPayload } from "../../shared/resourceForm";
import { ownershipPayload } from '../../../../shared/utils/resourceReferences.ts';
import type { IBenchPayload } from "../types";

export function useBenchForm() {
  const [createBench, { isLoading: creating }] = useCreateBenchMutation();
  const [updateBench, { isLoading: updating }] = useUpdateBenchMutation();
  const [deleteBench, { isLoading: deleting }] = useDeleteBenchMutation();
  const [forceDeleteBench, { isLoading: forceDeleting }] = useForceDeleteBenchMutation();
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

  const forceDeleteById = async (
    id: number,
    reason: string,
    item?: { sku?: string | null; name?: string | null },
  ): Promise<GuardedForceDeleteResult> => {
    try {
      const result = await forceDeleteBench({ id, reason, confirm: true }).unwrap();
      const label = item?.sku || item?.name || `Bench #${id}`;
      const parts: string[] = [];
      if (result?.released?.equipment) {
        parts.push(`unassigned ${result.released.equipment} equipment unit${result.released.equipment === 1 ? "" : "s"}`);
      }
      if (result?.released?.bookings) {
        parts.push(`cancelled ${result.released.bookings} booking${result.released.bookings === 1 ? "" : "s"}`);
      }
      notify.success(
        parts.length > 0 ? `Force-deleted ${label} (${parts.join(", ")}).` : `Force-deleted ${label}.`,
      );
      return { ok: true };
    } catch (err) {
      const parsed = parseFormApiError(err);
      const errMsg =
        parsed?.message ||
        parsed?.nonFieldErrors[0] ||
        Object.values(parsed?.fieldErrors ?? {})[0]?.[0] ||
        "Failed to force-delete bench.";
      return { ok: false, error: errMsg };
    }
  };

  const createFromValues = async (values: Record<string, unknown>, imageFile?: File | null) => {
    const payload: IBenchPayload = {
      ...ownershipPayload(values),
      ...detailPayload(BENCH_DETAILS, values),
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
    forceDeleteById,
    ...actions,
    creating,
    updating,
    deleting,
    forceDeleting,
  };
}
