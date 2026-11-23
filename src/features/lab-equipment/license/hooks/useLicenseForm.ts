import dayjs from 'dayjs';
import { nullableNumber } from '@/shared/utils/resourceReferences';
import {
  useCreateLicenseMutation,
  useDeleteLicenseMutation,
  useUpdateLicenseImageMutation,
  useUpdateLicenseMutation,
  useChangeLicenseStatusMutation,
  useAssignLicenseMutation,
  useReleaseLicenseMutation,
} from '../api';
import { diffAssignments } from '../assignments';
import { notifyEquipmentCreated, notifyEquipmentError, useEquipmentCrudActions } from '../../shared';
import type { ILicensePayload } from '../types';

export type LicenseUpsertPayload = Omit<ILicensePayload, 'carrier_device'> & {
  maximum_version?: string | null;
  license_ID?: string | null;
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
  const [assignMutation] = useAssignLicenseMutation();
  const [releaseMutation] = useReleaseLicenseMutation();
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
      serial_number: typeof values.serial_number === 'string' ? values.serial_number.trim() : undefined,
      license_ID: typeof values.license_ID === 'string' ? values.license_ID : undefined,
      license_seats: toSeats(values.license_seats),
      remark: typeof values.remark === 'string' ? values.remark : undefined,
      expiry_date: toDateString(values.expiry_date),
      license_product: nullableNumber(values.license_product),
      license_vendor: nullableNumber(values.license_vendor),
      license_category: nullableNumber(values.license_category),
      license_type: nullableNumber(values.license_type),
      license_restriction: nullableNumber(values.license_restriction),
      primary_owner: nullableNumber(values.primary_owner),
      department_id: nullableNumber(values.department_id),
      group_id: nullableNumber(values.group_id),
    };

    try {
      const created = await createLicense(payload).unwrap();
      if (imageFile) await updateImageMutation({ id: created.id, image: imageFile }).unwrap();
      const equipmentIds = Array.isArray(values.assigned_equipment_ids)
        ? values.assigned_equipment_ids.map(Number).filter(Number.isFinite)
        : [];
      // The license already exists here; a failed assignment is reported and can be retried from the table.
      if (equipmentIds.length > 0) await syncAssignments(created.id, [], equipmentIds);
      notifyEquipmentCreated('License', created, { sku: payload.sku, name: payload.name });
    } catch (err) {
      notifyEquipmentError('create', 'License', err);
      throw err;
    }
  };

  /**
   * Bring the license's equipment from `current` to `desired`: release first (it frees seats), then assign.
   * Each call is its own transaction; a failure is reported and the rest still run. Returns true when all succeeded.
   */
  const syncAssignments = async (licenseId: number, current: readonly number[], desired: readonly number[]) => {
    const { release, assign } = diffAssignments(current, desired);
    let ok = true;
    for (const [mutate, ids] of [[releaseMutation, release], [assignMutation, assign]] as const) {
      for (const equipmentId of ids) {
        try {
          await mutate({ licenseId, equipmentId }).unwrap();
        } catch (err) {
          ok = false;
          notifyEquipmentError('update', 'license assignment', err);
        }
      }
    }
    return ok;
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
    syncAssignments,
    ...actions,
    creating,
    updating,
    deleting,
  };
}
