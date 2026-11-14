import {
  useCreateSampleMutation,
  useDeleteSampleMutation,
  useUpdateSampleImageMutation,
  useUpdateSampleMutation,
} from '../api';
import { notifyEquipmentCreated, notifyEquipmentError, toId, toIdArray, useEquipmentCrudActions } from '../../shared';
import type { ISamplePayload } from '../types';

const toNullableId = (value: unknown): number | null => {
  const id = toId(value);
  if (id == null || id === '') return null;
  const numericId = Number(id);
  return Number.isNaN(numericId) ? null : numericId;
};

const toNumberIds = (value: unknown): number[] =>
  toIdArray(value)
    .map((id) => Number(id))
    .filter((id) => !Number.isNaN(id));

export function useSampleForm() {
  const [createSample, { isLoading: creating }] = useCreateSampleMutation();
  const [updateSample, { isLoading: updating }] = useUpdateSampleMutation();
  const [deleteSample, { isLoading: deleting }] = useDeleteSampleMutation();
  const [updateImageMutation] = useUpdateSampleImageMutation();
  const actions = useEquipmentCrudActions<ISamplePayload>({
    updateMutation: updateSample,
    updateImageMutation,
    deleteMutation: deleteSample,
    mapStatusBody: (values) => values,
    labels: {
      entityName: 'Sample',
      entityNameLower: 'sample',
      errorPrefix: 'sample',
    },
  });

  const createFromValues = async (values: Record<string, unknown>, imageFile?: File | null) => {
    const payload: ISamplePayload = {
      sku: typeof values.sku === 'string' ? values.sku : undefined,
      name: typeof values.name === 'string' ? values.name : undefined,
      serial_number: typeof values.serial_number === 'string' ? values.serial_number : undefined,
      log_label: typeof values.log_label === 'string' ? values.log_label : undefined,
      remark: typeof values.remark === 'string' ? values.remark : undefined,
      manufacturer: toNullableId(values.manufacturer),
      product_line: toNullableId(values.product_line),
      version: toNullableId(values.version),
      sample_type: toNullableId(values.sample_type),
      oem: toNullableId(values.oem),
      kl: toNullableId(values.kl),
      communication_channel: toNullableId(values.communication_channel),
      sample_characteristic: toNumberIds(values.sample_characteristic),
      primary_owner: toNullableId(values.primary_owner),
    };

    try {
      const created = await createSample(payload).unwrap();
      if (imageFile) await updateImageMutation({ id: created.id, image: imageFile }).unwrap();
      notifyEquipmentCreated('Sample', created, { sku: payload.sku, name: payload.name });
    } catch (err) {
      notifyEquipmentError('create', 'Sample', err);
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
