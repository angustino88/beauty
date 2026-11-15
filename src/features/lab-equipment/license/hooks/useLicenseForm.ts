import dayjs from 'dayjs';
import {
  useCreateLicenseMutation,
  useDeleteLicenseMutation,
  useUpdateLicenseImageMutation,
  useUpdateLicenseMutation,
  useChangeLicenseStatusMutation,
} from '../api';
import { notifyEquipmentCreated, notifyEquipmentError, toId, useEquipmentCrudActions } from '../../shared';
import type { ILicensePayload } from '../types';

export type LicenseUpsertPayload = Omit<ILicensePayload, 'carrier_device'> & {
  maximum_version?: string | null;
  license_ID?: string | null;
};

const toNullableId = (value: unknown): number | null => {
  const id = toId(value);
  if (id == null || id === '') return null;
  const numericId = Number(id);
  return Number.isNaN(numericId) ? null : numericId;
};

const toDateString = (value: unknown): string | null | undefined => {
  if (value == null || value === '') return null;
  if (dayjs.isDayjs(value)) return value.format('YYYY-MM-DD');
  if (typeof value === 'string') return value;
  return undefined;
};

const toSeats = (value: unknown): number | undefined => {
  if (value == null || value === '') return undefined;
  const seats = Number(value);
  return Number.isInteger(seats) && seats >= 1 ? seats : undefined;
};

export function useLicenseForm() {
  const [createLicense, { isLoading: creating }] = useCreateLicenseMutation();
  const [updateLicense, { isLoading: updating }] = useUpdateLicenseMutation();
  const [deleteLicense, { isLoading: deleting }] = useDeleteLicenseMutation();
  const [updateImageMutation] = useUpdateLicenseImageMutation();
  const [changeStatusMutation] = useChangeLicenseStatusMutation();
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
      maximum_version: typeof values.maximum_version === 'string' ? values.maximum_version.trim() : undefined,
      license_ID: typeof values.license_ID === 'string' ? values.license_ID : undefined,
      license_seats: toSeats(values.license_seats),
      remark: typeof values.remark === 'string' ? values.remark : undefined,
      expiry_date: toDateString(values.expiry_date),
      license_product: toNullableId(values.license_product),
      license_vendor: toNullableId(values.license_vendor),
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

  const changeStatus = async (id: number, status: string, details: Record<string, unknown> = {}) => {
    try {
      await changeStatusMutation({ id, status, details }).unwrap();
    } catch (err) {
      notifyEquipmentError('update', 'status', err);
    }
  };

  return {
    createFromValues,
    changeStatus,
    ...actions,
    creating,
    updating,
    deleting,
  };
}
