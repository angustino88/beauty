import dayjs from 'dayjs';
import { useGetEquipmentMappingQuery } from '@/features/spaces/mapping/api';
import type { ResourceMappingRow } from '@/features/spaces/mapping/types';
import { readStatusDataFromRecord, readStatusFromRecord } from '../../shared';
import type { ILicense } from '../types';

const getLicenseStatusInfo = (record: ILicense): string => {
  const status = readStatusFromRecord(record).toLowerCase();
  const statusData = readStatusDataFromRecord(record);

  switch (status) {
    case 'available':
    case 'active':
      return 'Ready for use';
    case 'in_storage':
      return `Location: ${String(statusData.location ?? '')}`.trim();
    case 'transferred':
      return `Transfer to: ${String(statusData.transfer_to ?? '')}`.trim();
    case 'borrowed': {
      const returnDate = dayjs(String(statusData.return_date ?? ''));
      return returnDate.isValid() ? `Borrowed until: ${returnDate.format('DD/MM/YYYY')}` : 'Borrowed';
    }
    case 'under_repair':
      return `Report: ${String(statusData.report_number ?? '')}`.trim();
    case 'lost':
      return `Reason: ${String(statusData.reason ?? '')}`.trim();
    case 'scrap':
      return 'Status: Scrapped';
    case 'disposed':
      return 'Status: Disposed';
    case 'expired':
      return 'Status: Expired';
    default:
      return '';
  }
};

export default function LicenseInformationCell({ record }: { record: ILicense }) {
  // The license can sit on several equipment items; the location shown is that of the first.
  const carrierId = Number(record.assigned_equipment[0]?.id);
  const mappingQuery = useGetEquipmentMappingQuery(carrierId, {
    skip: !Number.isFinite(carrierId) || carrierId <= 0,
  });

  const carrierRows = Number.isFinite(carrierId) && carrierId > 0
    ? (mappingQuery.data ?? []).filter((row: ResourceMappingRow) =>
        row.equipment.some((eq) => eq.id === carrierId),
      )
    : [];

  const mappedLocations = carrierRows.flatMap((row) => {
    const benchName = row.bench.name || row.bench.sku;
    if (!benchName) return [];
    const locationInfo = row.room?.name ? ` [Room: ${row.room.name}]` : '';
    return [`Bench: ${benchName}${locationInfo}`];
  });

  const statusData = readStatusDataFromRecord(record);
  const benchName = typeof statusData.lab_name === 'string' ? statusData.lab_name.trim() : '';
  const fallbackLocation = benchName ? `Bench: ${benchName}` : '';
  const locationLines = [...new Set(mappedLocations.length > 0 ? mappedLocations : [fallbackLocation].filter(Boolean))];

  return [getLicenseStatusInfo(record), ...locationLines].filter(Boolean).join('\n');
}
