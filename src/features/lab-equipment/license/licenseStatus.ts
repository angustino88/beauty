const labels: Record<string, string> = {
  active: 'Active', inactive: 'Inactive', deactivated: 'Deactivated',
  revoked: 'Revoked', expired: 'Expired', trial: 'Trial', suspended: 'Suspended',
};

const tones: Record<string, string> = {
  active: 'overviewGreen', inactive: 'neutral', deactivated: 'neutral',
  revoked: 'overviewRed', expired: 'overviewAmber', trial: 'overviewBlue',
  suspended: 'overviewAmber',
};

export const licenseStatusValue = (status: unknown): string =>
  typeof status === 'string' ? status.trim().toLowerCase().replace(/[\s-]+/g, '_') : '';

export const licenseStatusLabel = (status: unknown): string => {
  const value = licenseStatusValue(status);
  return labels[value] ?? (value ? value.replaceAll('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase()) : 'Unknown');
};

export const licenseStatusTone = (status: unknown): string => tones[licenseStatusValue(status)] ?? 'neutral';