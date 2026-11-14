import { notifyEquipmentDeleted, notifyEquipmentError, notifyEquipmentUpdated } from '../utils/equipmentNotifications';

type MutationResult = { unwrap: () => Promise<unknown> };

type UpdateMutation<TBody> = (args: { id: number; body: TBody }) => MutationResult;
type UpdateImageMutation = (args: { id: number; image: File }) => MutationResult;
type DeleteMutation = (id: number) => MutationResult;
export interface EquipmentStatusValues {
  status_type: string;
  status_data: Record<string, unknown>;
}

export interface EquipmentCrudLabels {
  entityName: string;
  entityNameLower: string;
  errorPrefix: string;
}

interface UseEquipmentCrudActionsConfig<TUpdateBody> {
  updateMutation: UpdateMutation<TUpdateBody>;
  updateImageMutation: UpdateImageMutation;
  deleteMutation: DeleteMutation;
  labels: EquipmentCrudLabels;
  mapStatusBody: (values: EquipmentStatusValues) => TUpdateBody;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const normalizeStatusBody = <TUpdateBody>(
  body: TUpdateBody,
  fallbackValues: EquipmentStatusValues,
): TUpdateBody => {
  if (!isRecord(body) || 'current_status' in body) {
    return body;
  }

  const hasStatusFields = 'status_type' in body || 'status_data' in body;
  if (!hasStatusFields) {
    return body;
  }

  const statusType = typeof body.status_type === 'string' ? body.status_type : fallbackValues.status_type;
  const statusData = isRecord(body.status_data) ? body.status_data : fallbackValues.status_data;
  const nextBody: Record<string, unknown> = { ...body };
  delete nextBody.status_type;
  delete nextBody.status_data;

  return {
    ...nextBody,
    current_status: {
      status_type: statusType,
      status_data: statusData,
    },
  } as TUpdateBody;
};

export function useEquipmentCrudActions<TUpdateBody>({
  updateMutation,
  updateImageMutation,
  deleteMutation,
  labels,
  mapStatusBody,
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

  const updateStatus = async (id: number, values: EquipmentStatusValues) => {
    try {
      const body = normalizeStatusBody(mapStatusBody(values), values);
      await updateMutation({ id, body }).unwrap();
      notifyEquipmentUpdated(labels.entityName, { id });
    } catch (err) {
      notifyEquipmentError('update', 'status', err);
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

  return {
    updateInline,
    updateImage,
    updateStatus,
    deleteById,
  };
}
