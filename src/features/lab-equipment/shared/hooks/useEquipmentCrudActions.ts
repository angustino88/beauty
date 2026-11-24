import { notifyEquipmentDeleted, notifyEquipmentError, notifyEquipmentUpdated } from '../utils/equipmentNotifications';

type MutationResult = { unwrap: () => Promise<unknown> };

type UpdateMutation<TBody> = (args: { id: number; body: TBody }) => MutationResult;
type UpdateImageMutation = (args: { id: number; image: File }) => MutationResult;
type DeleteImageMutation = (id: number) => MutationResult;
type DeleteMutation = (id: number) => MutationResult;
export interface EquipmentCrudLabels {
  entityName: string;
  entityNameLower: string;
  errorPrefix: string;
}

interface UseEquipmentCrudActionsConfig<TUpdateBody> {
  updateMutation: UpdateMutation<TUpdateBody>;
  updateImageMutation: UpdateImageMutation;
  deleteImageMutation?: DeleteImageMutation;
  deleteMutation: DeleteMutation;
  labels: EquipmentCrudLabels;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

export function useEquipmentCrudActions<TUpdateBody>({
  updateMutation,
  updateImageMutation,
  deleteImageMutation,
  deleteMutation,
  labels,
}: UseEquipmentCrudActionsConfig<TUpdateBody>) {
  const updateInline = async (id: number, payload: TUpdateBody) => {
    try {
      const updated = await updateMutation({ id, body: payload }).unwrap();
      notifyEquipmentUpdated(labels.entityName, isRecord(updated) ? updated : {}, isRecord(payload) ? payload : {});
    } catch (err) {
      notifyEquipmentError('update', labels.entityName, err);
      throw new Error(`update_${labels.errorPrefix}_failed`, { cause: err });
    }
  };

  const updateImage = async (id: number, imageFile: File) => {
    try {
      await updateImageMutation({ id, image: imageFile }).unwrap();
    } catch (err) {
      notifyEquipmentError('update', 'image', err);
    }
  };

  const removeImage = async (id: number) => {
    if (!deleteImageMutation) return;
    try {
      await deleteImageMutation(id).unwrap();
    } catch (err) {
      notifyEquipmentError('update', 'image', err);
    }
  };

  const deleteById = async (id: number) => {
    try {
      await deleteMutation(id).unwrap();
      notifyEquipmentDeleted(labels.entityName, { id });
    } catch (err) {
      notifyEquipmentError('delete', labels.entityName, err);
    }
  };

  const tryDeleteById = async (id: number, item?: { sku?: string | null; name?: string | null }) => {
    try {
      await deleteMutation(id).unwrap();
      notifyEquipmentDeleted(labels.entityName, { id, sku: item?.sku, name: item?.name });
      return { ok: true as const };
    } catch (err) {
      return { ok: false as const, error: err };
    }
  };

  return {
    updateInline,
    updateImage,
    removeImage,
    deleteById,
    tryDeleteById,
  };
}
