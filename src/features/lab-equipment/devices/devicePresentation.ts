import type {
  DeviceConnection,
  DeviceConnectionChange,
  ExpectedDevice,
  KnownFreshness,
  KnownMatchStatus,
  KnownPresence,
} from './types.ts';

export type Tone = 'success' | 'warning' | 'error' | 'processing' | 'default';
/** Dot shown before a device: confirmed connected, last reported connected, or unplugged. */
export type StatusDot = 'connected' | 'unconfirmed' | 'disconnected';

const matchDescriptions: Record<KnownMatchStatus, string> = {
  matched: 'Identified in equipment inventory',
  unmatched: 'No matching equipment found',
  ambiguous: 'More than one equipment matches this device',
  interface_mismatch: 'Detected interface differs from the equipment definition',
};

const matchShortLabels: Record<Exclude<KnownMatchStatus, 'matched'>, string> = {
  unmatched: 'Not in inventory',
  ambiguous: 'Ambiguous',
  interface_mismatch: 'Wrong interface',
};

const freshnessDescriptions: Record<Exclude<KnownFreshness, 'fresh'>, string> = {
  stale: 'No recent report from this collector; the current physical connection is unconfirmed',
  unknown: 'The agent was re-enrolled or retired; the current physical connection is unconfirmed until it reports again',
};

const presence: Record<KnownPresence, { label: string; tone: Tone; description: string }> = {
  present: { label: 'Present', tone: 'success', description: 'Connected in the latest report' },
  missing: { label: 'Missing', tone: 'error', description: 'The agent is reporting, but this device is not connected' },
  unconfirmed: {
    label: 'Unconfirmed',
    tone: 'warning',
    description: 'The agent has not reported recently, so presence cannot be confirmed',
  },
};

const UNCONFIRMED = 'Current physical connection is unconfirmed; waiting for a fresh device observation';

function isKnown<Key extends string>(table: Record<Key, unknown>, value: string): value is Key {
  return Object.prototype.hasOwnProperty.call(table, value);
}

/**
 * Mirrors the backend rule: a PnP ID whose last segment contains `&` was made up by Windows from
 * the USB port (the device has no serial), so it identifies the unit only on one computer.
 */
export function isPortBoundPnpId(value: string): boolean {
  const normalized = value.trim().replace(/\//g, '\\');
  const last = normalized.split('\\').pop() ?? '';
  return normalized.includes('\\') && last.includes('&');
}

/** The ID Link registers: the PnP instance ID when reported, otherwise the first reported ID. */
export function primaryHardwareId(connection: Pick<DeviceConnection, 'hardware_ids'>): string {
  const ids = connection.hardware_ids ?? [];
  return (ids.find((id) => id.kind === 'pnp_id') ?? ids[0])?.value ?? '';
}

/**
 * Derives display text and tones for one device connection.
 *
 * `isAvailable` is false while the latest refresh failed: cached rows are then shown as
 * unconfirmed without altering the server data. Enum values the UI does not know yet fall
 * back to the server label and a neutral tone.
 */
export function deviceConnectionPresentation(connection: DeviceConnection, isAvailable = true) {
  const isFresh = isAvailable && connection.freshness.value === 'fresh';
  const matchValue = connection.match_status.value;
  const freshnessValue = connection.freshness.value;
  const isConnected = connection.state.value === 'connected';
  const matchTone: Tone = matchValue === 'matched' ? 'success' : isKnown(matchDescriptions, matchValue) ? 'warning' : 'default';
  let freshnessDescription = 'Based on the latest device observation';
  if (!isFresh) {
    freshnessDescription = isAvailable && isKnown(freshnessDescriptions, freshnessValue)
      ? freshnessDescriptions[freshnessValue]
      : UNCONFIRMED;
  }
  const hardwareId = primaryHardwareId(connection);
  const dot: StatusDot = !isConnected ? 'disconnected' : isFresh ? 'connected' : 'unconfirmed';
  return {
    title: connection.equipment?.name || connection.name || 'Unidentified device',
    connectionLabel: isFresh ? connection.state.label : `Last reported: ${connection.state.label.toLowerCase()}`,
    connectionTone: (isFresh && isConnected ? 'success' : !isFresh && isConnected ? 'warning' : 'default') as Tone,
    freshnessLabel: isAvailable ? connection.freshness.label : 'Unconfirmed',
    freshnessTone: (isFresh ? 'success' : 'warning') as Tone,
    matchTone,
    matchLabel: matchValue === 'matched'
      ? 'Matched'
      : isKnown(matchShortLabels, matchValue) ? matchShortLabels[matchValue] : connection.match_status.label,
    matchDescription: isKnown(matchDescriptions, matchValue)
      ? matchDescriptions[matchValue]
      : `Match status: ${connection.match_status.label}`,
    freshnessDescription,
    dot,
    hardwareId,
    meta: [connection.interface?.name || connection.interface_name, hardwareId].filter(Boolean).join(' · '),
    // Only an unregistered ID can be linked: an ambiguous or wrong-interface match is an inventory
    // correction (ID on two units, missing interface) that linking would refuse.
    canLink: matchValue === 'unmatched' && Boolean(hardwareId),
    inventoryFix: matchValue === 'ambiguous'
      ? 'The IDs this device reported are registered on more than one unit. Remove the wrong hardware ID from the equipment inventory; the device matches automatically on the next report.'
      : matchValue === 'interface_mismatch'
        ? `The unit with this hardware ID does not list the ${connection.interface_name} interface. Add it to the unit in the equipment inventory; the device matches automatically on the next report.`
        : '',
  };
}

export function presencePresentation(expected: Pick<ExpectedDevice, 'presence'>) {
  const value = expected.presence.value;
  return isKnown(presence, value)
    ? presence[value]
    : { label: expected.presence.label, tone: 'default' as Tone, description: expected.presence.label };
}

export function historyLabel(change: DeviceConnectionChange): string {
  const kind = change.is_complete ? 'full snapshot' : 'incremental report';
  return `${change.state.label} · ${kind} #${change.sequence}`;
}

/** Compact observation time: "09:12" today, "Yesterday 18:03", otherwise "14 Nov 10:42". */
export function formatObserved(iso: string, now: Date = new Date()): string {
  const at = new Date(iso);
  const pad = (value: number) => String(value).padStart(2, '0');
  const time = `${pad(at.getHours())}:${pad(at.getMinutes())}`;
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const day = 24 * 60 * 60 * 1000;
  if (at.getTime() >= startOfToday) return time;
  if (at.getTime() >= startOfToday - day) return `Yesterday ${time}`;
  const month = at.toLocaleString('en-GB', { month: 'short' });
  return `${at.getDate()} ${month} ${time}`;
}

/** Row spans that merge the computing column of consecutive rows on the same unit. */
export function computingRowSpans(rows: readonly Pick<DeviceConnection, 'computing'>[]): number[] {
  const spans = rows.map(() => 0);
  let start = 0;
  rows.forEach((row, index) => {
    if (index === 0 || row.computing.id !== rows[index - 1].computing.id) start = index;
    spans[start] += 1;
  });
  return spans;
}

/** Returns the last valid page for `count` rows, so a shrinking list never strands the reader. */
export function clampPage(page: number, count: number, pageSize: number): number {
  return Math.min(Math.max(1, page), Math.max(1, Math.ceil(count / pageSize)));
}

/** Counts shown in a computing unit's popover header. */
export function connectionCounts(connections: readonly DeviceConnection[]) {
  return {
    connected: connections.filter((row) => row.state.value === 'connected').length,
    toMatch: connections.filter((row) => row.match_status.value !== 'matched').length,
    unplugged: connections.filter((row) => row.state.value !== 'connected').length,
  };
}
