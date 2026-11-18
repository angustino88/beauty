import type { LicenseObservationRead } from '@/shared/api/generated/api';

export type Tone = 'success' | 'warning' | 'error' | 'processing' | 'default';

type ObservationStatus =
  | 'matched'
  | 'unregistered'
  | 'ambiguous'
  | 'carrier_unlinked'
  | 'carrier_not_at_computer'
  | 'carrier_mismatch'
  | 'unassigned';

/** What each comparison outcome means, and what a coordinator does about it. */
const OBSERVATION: Record<ObservationStatus, { tone: Tone; fix: string }> = {
  matched: { tone: 'success', fix: '' },
  unregistered: {
    tone: 'warning',
    fix: 'No license has this serial number. Register the license (or add the serial number to the existing one).',
  },
  ambiguous: { tone: 'error', fix: 'More than one license has this serial number. Remove the duplicate serial.' },
  carrier_unlinked: {
    tone: 'warning',
    fix: 'No equipment has the carrier ID the tool reported. Add it as a hardware ID on the unit that holds the license.',
  },
  carrier_not_at_computer: {
    tone: 'warning',
    fix: 'The carrier is neither on this computer\'s bench nor reported connected to it. Place it on the bench or check the device monitoring.',
  },
  carrier_mismatch: {
    tone: 'error',
    fix: 'The license is assigned to another unit. Move the assignment to the carrier if the license really moved.',
  },
  unassigned: { tone: 'warning', fix: 'The license is not assigned. Assign it to the carrier (or the computer).' },
};

const RUN_TONES: Record<string, Tone> = { ok: 'success', not_installed: 'default', failed: 'error', rejected: 'error' };

const CARRIER_LABELS: Record<string, string> = {
  computer: 'This computer',
  device: 'Device',
  dongle: 'Dongle',
  server: 'License server',
  equipment: 'Configured unit',
};

function isKnown(value: string): value is ObservationStatus {
  return Object.prototype.hasOwnProperty.call(OBSERVATION, value);
}

export function observationPresentation(observation: Pick<LicenseObservationRead, 'status'>) {
  const value = observation.status.value;
  return isKnown(value) ? OBSERVATION[value] : { tone: 'default' as Tone, fix: '' };
}

export function runTone(status: string): Tone {
  return RUN_TONES[status] ?? 'default';
}

/** "CANcase 3 (007113-585343)", "This computer", or the reported ID when no unit has it. */
export function carrierLabel(
  observation: Pick<LicenseObservationRead, 'carrier_type' | 'carrier_equipment' | 'carrier_hardware_value'>,
): string {
  const kind = CARRIER_LABELS[observation.carrier_type] ?? observation.carrier_type;
  if (observation.carrier_equipment) {
    return observation.carrier_hardware_value
      ? `${observation.carrier_equipment.name} (${observation.carrier_hardware_value})`
      : observation.carrier_equipment.name;
  }
  return observation.carrier_hardware_value ? `${kind} ${observation.carrier_hardware_value}` : kind;
}

/** Differences between what the agent found and the inventory; empty when they agree or nothing matched. */
export function inventoryDifferences(
  observation: Pick<LicenseObservationRead, 'inventory' | 'expires_at' | 'max_version'>,
): string[] {
  const inventory = observation.inventory;
  if (!inventory) return [];
  const differences: string[] = [];
  const found = observation.expires_at ? new Date(observation.expires_at).getTime() : null;
  const registered = inventory.expires_at ? new Date(inventory.expires_at).getTime() : null;
  if (found !== registered) differences.push('expiry');
  if (observation.max_version && observation.max_version !== inventory.max_version) differences.push('version');
  return differences;
}

/** One-line summary of what a check runs, e.g. "Command Vector.LicenseClient.exe -listlicenses". */
export function probeSummary(probe: unknown): string {
  if (!probe || typeof probe !== 'object') return '—';
  const value = probe as { type?: string; executable?: string; args?: string[]; path?: string; key?: string };
  const tail = (path = '') => path.split(/[\\/]/).pop() || path;
  if (value.type === 'command') return `Command ${tail(value.executable)} ${(value.args ?? []).join(' ')}`.trim();
  if (value.type === 'file') return `File ${tail(value.path)}`;
  if (value.type === 'registry') return `Registry ${value.key ?? ''}`.trim();
  return value.type ?? '—';
}
