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
  return value ? value.replaceAll('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase()) : 'Unknown';
}

export const equipmentStatusTone = (status: unknown): string => ({
  available: 'overviewGreen', in_use: 'overviewBlue', borrowed: 'overviewAmber',
  maintenance: 'overviewViolet', broken: 'overviewRed', lost: 'overviewRed',
  on_order: 'overviewBlue', transferred: 'neutral', retired: 'neutral',
  calibration_overdue: 'overviewAmber',
} as Record<string, string>)[equipmentStatusValue(status)] ?? 'neutral';