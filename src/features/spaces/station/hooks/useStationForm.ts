import {
  useCreateStationMutation,
  useDeleteStationMutation,
  useForceDeleteStationMutation,
  useUpdateStationMutation,
  useUpdateStationImageMutation,
  useDeleteStationImageMutation,
} from "../api";
import {
  notifyEquipmentCreated,
  notifyEquipmentError,
  useEquipmentCrudActions,
  type GuardedForceDeleteResult,
} from "@/features/lab-equipment/shared";
import { message } from "antd";
import { useAppDispatch } from "@/app/store";
import { generatedApi, useLabsStationsSlotsCreateByStationIdMutation } from "@/shared/api/generated/api";
import { parseFormApiError } from "@/features/lab-equipment/shared/utils/formApiError";
import type { IStationPayload } from "../types";

const toCount = (value: unknown): number | null => {
  if (value == null || value === "") return null;
  const n = Number(value);
  return Number.isInteger(n) && n >= 0 ? n : null;
};

const errorText = (err: unknown): string => {
  const parsed = parseFormApiError(err);
  return parsed?.message || parsed?.nonFieldErrors[0] || Object.values(parsed?.fieldErrors ?? {})[0]?.[0] || "unknown error";
};

export function useStationForm() {
  const [createStation, { isLoading: creating }] = useCreateStationMutation();
  const [updateStation, { isLoading: updating }] = useUpdateStationMutation();
  const [deleteStation, { isLoading: deleting }] = useDeleteStationMutation();
  const [forceDeleteStation, { isLoading: forceDeleting }] = useForceDeleteStationMutation();
  const [updateStationImage] = useUpdateStationImageMutation();
  const [deleteStationImage] = useDeleteStationImageMutation();
  const [createSlot] = useLabsStationsSlotsCreateByStationIdMutation();
  const dispatch = useAppDispatch();

  /**
   * Benches are placed on station slots, which the backend never creates by itself. After a save
   * with a bench capacity, add the missing positions S1..Sn (position 0..n-1) so the "Station Slot"
   * picker in the bench form has something to offer. Existing slots (and their codes) are kept.
   */
  const syncSlots = async (stationId: number, capacityValue: unknown) => {
    const capacity = toCount(capacityValue);
    if (!capacity) return;
    try {
      const existing = await dispatch(
        generatedApi.endpoints.labsStationsSlotsRetrieveByStationId.initiate(
          { stationId, pageSize: 100 },
          { forceRefetch: true, subscribe: false },
        ),
      ).unwrap();
      const usedPositions = new Set(existing.data.map((slot) => slot.position_index));
      const usedCodes = new Set(existing.data.map((slot) => slot.slot_code.toUpperCase()));
      for (let position = 0; position < capacity; position += 1) {
        if (usedPositions.has(position)) continue;
        // S<position+1>, or S<position+1>-2, -3... when someone already used that code by hand.
        let code = `S${position + 1}`;
        for (let suffix = 2; usedCodes.has(code); suffix += 1) code = `S${position + 1}-${suffix}`;
        usedCodes.add(code);
        await createSlot({ stationId, stationSlotCreate: { position_index: position, slot_code: code } }).unwrap();
      }
    } catch (err) {
      message.warning(`Station saved, but its bench slots were not created: ${errorText(err)}.`);
    }
  };

  const actions = useEquipmentCrudActions<IStationPayload>({
    updateMutation: updateStation,
    deleteMutation: deleteStation,
    updateImageMutation: updateStationImage,
    deleteImageMutation: deleteStationImage,
    mapStatusBody: (values) => values as unknown as IStationPayload,
    labels: { entityName: "Station", entityNameLower: "station", errorPrefix: "station" },
  });

  const forceDeleteById = async (
    id: number,
    reason: string,
    item?: { sku?: string | null; name?: string | null },
  ): Promise<GuardedForceDeleteResult> => {
    try {
      const result = await forceDeleteStation({ id, reason, confirm: true }).unwrap();
      const label = item?.sku || item?.name || `Station #${id}`;
      const parts: string[] = [];
      if (result?.released?.benches) {
        parts.push(`detached ${result.released.benches} bench${result.released.benches === 1 ? "" : "es"}`);
      }
      if (result?.released?.equipment) {
        parts.push(`cleared ${result.released.equipment} resting equipment placement${result.released.equipment === 1 ? "" : "s"}`);
      }
      message.success(
        parts.length > 0 ? `Force-deleted ${label} (${parts.join(", ")}).` : `Force-deleted ${label}.`,
      );
      return { ok: true };
    } catch (err) {
      const parsed = parseFormApiError(err);
      const errMsg =
        parsed?.message ||
        parsed?.nonFieldErrors[0] ||
        Object.values(parsed?.fieldErrors ?? {})[0]?.[0] ||
        "Failed to force-delete station.";
      return { ok: false, error: errMsg };
    }
  };

  const createFromValues = async (values: Record<string, unknown>, imageFile?: File | null) => {
    const payload: IStationPayload = {
      sku: typeof values.sku === "string" ? values.sku : undefined,
      name: typeof values.name === "string" ? values.name : undefined,
      room_id: values.room_id ? Number(values.room_id) : null,
      slot_id: values.slot_id ? Number(values.slot_id) : null,
      power_capacity_w: values.power_capacity_w ? Number(values.power_capacity_w) : null,
      max_load_kg: values.max_load_kg ? Number(values.max_load_kg) : null,
      network_port_capacity: values.network_port_capacity ? Number(values.network_port_capacity) : null,
      bench_capacity: toCount(values.bench_capacity),
      height_mm: values.height_mm ? Number(values.height_mm) : null,
      width_mm: values.width_mm ? Number(values.width_mm) : null,
      depth_mm: values.depth_mm ? Number(values.depth_mm) : null,
      label: typeof values.label === "string" ? values.label : undefined,
      remark: typeof values.remark === "string" ? values.remark : "",
    };

    try {
      const created = await createStation(payload).unwrap();
      await syncSlots(created.id, values.bench_capacity);
      if (imageFile) await updateStationImage({ id: created.id, image: imageFile }).unwrap();
      notifyEquipmentCreated("Station", created, { sku: payload.sku, name: payload.name });
    } catch (err) {
      notifyEquipmentError("create", "Station", err);
      throw err;
    }
  };

  return {
    createFromValues,
    syncSlots,
    forceDeleteById,
    ...actions,
    creating,
    updating,
    deleting,
    forceDeleting,
  };
}
