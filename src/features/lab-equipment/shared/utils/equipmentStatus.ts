import { toneForStatus, type StatusTone } from '../../../../shared/status/statusTone.ts';
/**
 * Equipment display_status values and labels exactly as the backend defines them
 * (GET /api/labs/equipment?status=…). Use these terms in the UI; the backend has no
 * separate "hardware status".
 */
export const EQUIPMENT_DISPLAY_STATUSES = [
  { value: 'available', label: 'Available' },
  { value: 'in_use', label: 'In use' },
  { value: 'borrowed', label: 'Borrowed' },
  { value: 'maintenance', label: 'Maintenance' },
  { value: 'broken', label: 'Broken' },
  { value: 'calibration_overdue', label: 'Calibration overdue' },
  { value: 'on_order', label: 'On order' },
  { value: 'transferred', label: 'Transferred' },
  { value: 'retired', label: 'Retired' },
  { value: 'lost', label: 'Lost' },
] as const;

export type EquipmentDisplayStatus = (typeof EQUIPMENT_DISPLAY_STATUSES)[number]['value'];

const DISPLAY_STATUS_LABELS: Record<string, string> = Object.fromEntries(
  EQUIPMENT_DISPLAY_STATUSES.map(({ value, label }) => [value, label]),
);

/** Lifecycle status only; computing activity is a separate backend domain. */
export function equipmentStatusValue(status: unknown): string {
  if (typeof status === 'string') {
    const value = status.trim().toLowerCase().replace(/[\s-]+/g, '_');
    // The current equipment API computes storage as Available; older payloads
    // and status summaries may still return the legacy in_storage value.
    return ({ in_storage: 'available', operational: 'available', assigned: 'in_use',
      in_service: 'in_use', on_loan: 'borrowed', in_maintenance: 'maintenance' } as Record<string, string>)[value] ?? value;
  }
  if (status && typeof status === 'object' && 'value' in status) return equipmentStatusValue(status.value);
  return '';
}

export function equipmentStatusLabel(status: unknown): string {
  const value = equipmentStatusValue(status);
  if (status && typeof status === 'object' && 'value' in status && 'label' in status
    && typeof status.value === 'string' && typeof status.label === 'string' && status.label.trim()
    && value === status.value.trim().toLowerCase().replace(/[\s-]+/g, '_')) return status.label;
  if (!value) return 'Unknown';
  return DISPLAY_STATUS_LABELS[value] ?? value.charAt(0).toUpperCase() + value.slice(1).replaceAll('_', ' ');
}

export const equipmentStatusTone = (status: unknown): StatusTone => toneForStatus(equipmentStatusValue(status));
