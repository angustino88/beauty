import { toneForStatus, type StatusTone } from '../../../shared/status/statusTone.ts';
const labels: Record<string, string> = {
  available: 'Available', assigned: 'Assigned', revoked: 'Revoked', expired: 'Expired', suspended: 'Suspended',
  // Older labels still appear in historical summaries.
  active: 'Active', inactive: 'Inactive', deactivated: 'Deactivated', trial: 'Trial',
};

export const licenseStatusValue = (status: unknown): string =>
  typeof status === 'string' ? status.trim().toLowerCase().replace(/[\s-]+/g, '_') : '';

export const licenseStatusLabel = (status: unknown): string => {
  const value = licenseStatusValue(status);
  return labels[value] ?? (value ? value.replaceAll('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase()) : 'Unknown');
};

export const licenseStatusTone = (status: unknown): StatusTone => toneForStatus(licenseStatusValue(status));