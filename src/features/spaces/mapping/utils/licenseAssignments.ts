import type { MappingLicenseItem, ResourceMappingRow } from "../types";

export interface LicenseAssignmentRecord {
  id: number;
  sku?: string | null;
  name?: string | null;
  license_name?: string | null;
  equipment_id?: number | null;
  carrier_device?: {
    id: number;
    sku?: string | null;
    carrier_device_name?: string | null;
  } | null;
}

export const addCarrierLicenses = (
  rows: ResourceMappingRow[],
  licenses: LicenseAssignmentRecord[],
): ResourceMappingRow[] =>
  rows.map((row) => {
    const equipmentIds = new Set(row.equipment.map((eq) => eq.id));
    const licenseById = new Map<number, MappingLicenseItem>(
      row.licenses.map((lic) => [lic.id, lic]),
    );

    for (const lic of licenses) {
      const eqId = lic.equipment_id ?? (lic.carrier_device ? Number(lic.carrier_device.id) : null);
      if (!eqId || !equipmentIds.has(eqId)) {
        continue;
      }

      licenseById.set(lic.id, {
        id: lic.id,
        sku: lic.sku ?? "",
        name: lic.license_name ?? lic.name ?? lic.sku ?? "",
        equipment_id: eqId,
      });
    }

    const updatedLicenses = Array.from(licenseById.values());
    return {
      ...row,
      licenses: updatedLicenses,
      status: {
        ...row.status,
        license_count: updatedLicenses.length,
      },
    };
  });
