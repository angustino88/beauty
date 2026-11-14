import dayjs from 'dayjs';
import {
  useCreateLicenseMutation,
  useDeleteLicenseMutation,
  useUpdateLicenseImageMutation,
  useUpdateLicenseMutation,
} from '../api';
import { notifyEquipmentCreated, notifyEquipmentError, toId, useEquipmentCrudActions } from '../../shared';
import type { ILicensePayload } from '../types';

export type LicenseUpsertPayload = Omit<ILicensePayload, 'carrier_device'> & {
  maximum_version?: number | null;
  license_ID?: string | null;
  carrier_device?: string | number | null;
};

const toNullableId = (value: unknown): number | null => {
  const id = toId(value);
  if (id == null || id === '') return null;
  const numericId = Number(id);
  return Number.isNaN(numericId) ? null : numericId;
};

const toCarrierDeviceValue = (value: unknown): string | number | null => {
  // Preserve composite `${group}-${id}` strings; old FE sent the carrier
  // selection verbatim so the BE could resolve the right FK.
  if (value == null || value === '') return null;
  if (typeof value === 'string') return value.trim() || null;
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  return null;
};

const toDateString = (value: unknown): string | null | undefined => {
  if (value == null || value === '') return null;
  if (dayjs.isDayjs(value)) return value.format('YYYY-MM-DD');
  if (typeof value === 'string') return value;
  return undefined;
};

const toNullableInteger = (value: unknown): number | null | undefined => {
  if (value == null || value === '') return null;
  if (typeof value === 'number') return Number.isInteger(value) ? value : undefined;
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return null;
    if (!/^\d+$/.test(trimmed)) return undefined;
    return Number(trimmed);
  }
  return undefined;
};

export function useLicenseForm() {
  const [createLicense, { isLoading: creating }] = useCreateLicenseMutation();
  const [updateLicense, { isLoading: updating }] = useUpdateLicenseMutation();
  const [deleteLicense, { isLoading: deleting }] = useDeleteLicenseMutation();
  const [updateImageMutation] = useUpdateLicenseImageMutation();
  const actions = useEquipmentCrudActions<LicenseUpsertPayload>({
    updateMutation: updateLicense,
    updateImageMutation,
    deleteMutation: deleteLicense,
    mapStatusBody: (values) => ({
      status: values.status_type,
      current_status: values,
    }),
    labels: {
      entityName: 'License',
      entityNameLower: 'license',
      errorPrefix: 'license',
    },
  });

  const createFromValues = async (values: Record<string, unknown>, imageFile?: File | null) => {
    const payload: LicenseUpsertPayload = {
      sku: typeof values.sku === 'string' ? values.sku : undefined,
      name: typeof values.name === 'string' ? values.name : undefined,
      maximum_version: toNullableInteger(values.maximum_version),
      license_ID: typeof values.license_ID === 'string' ? values.license_ID : undefined,
      log_label: typeof values.log_label === 'string' ? values.log_label : undefined,
      remark: typeof values.remark === 'string' ? values.remark : undefined,
      expiry_date: toDateString(values.expiry_date),
      license_product: toNullableId(values.license_product),
      license_vendor: toNullableId(values.license_vendor),
      carrier_device: toCarrierDeviceValue(values.carrier_device),
      license_category: toNullableId(values.license_category),
      license_type: toNullableId(values.license_type),
      license_restriction: toNullableId(values.license_restriction),
      primary_owner: toNullableId(values.primary_owner),
    };

    try {
      const created = await createLicense(payload).unwrap();
      if (imageFile) await updateImageMutation({ id: created.id, image: imageFile }).unwrap();
      notifyEquipmentCreated('License', created, { sku: payload.sku, name: payload.name });
    } catch (err) {
      notifyEquipmentError('create', 'License', err);
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
