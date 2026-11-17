import type {
  DeviceConnection,
  KnownFreshness,
  KnownMatchStatus,
} from '../../types/deviceConnections.ts';

type Tone = 'success' | 'warning' | 'default';

const matchDescriptions: Record<KnownMatchStatus, string> = {
  matched: 'Identified in equipment inventory',
  unmatched: 'No matching equipment found',
  ambiguous: 'More than one equipment matches this device',
  interface_mismatch: 'Detected interface differs from the equipment definition',
};

const freshnessDescriptions: Record<Exclude<KnownFreshness, 'fresh'>, string> = {
  stale: 'No recent report from this collector; the current physical connection is unconfirmed',
  unknown: 'The agent was re-enrolled or retired; the current physical connection is unconfirmed until it reports again',
};

const UNCONFIRMED = 'Current physical connection is unconfirmed; waiting for a fresh device observation';

function isKnown<Key extends string>(table: Record<Key, string>, value: string): value is Key {
  return Object.prototype.hasOwnProperty.call(table, value);
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
  const matchTone: Tone = matchValue === 'matched' ? 'success' : isKnown(matchDescriptions, matchValue) ? 'warning' : 'default';
  let freshnessDescription = 'Based on the latest device observation';
  if (!isFresh) {
    freshnessDescription = isAvailable && isKnown(freshnessDescriptions, freshnessValue)
      ? freshnessDescriptions[freshnessValue]
      : UNCONFIRMED;
  }
  return {
    title: connection.equipment?.name || connection.name || 'Unidentified device',
    connectionLabel: isFresh ? connection.state.label : `Last reported: ${connection.state.label.toLowerCase()}`,
    connectionTone: (isFresh && connection.state.value === 'connected' ? 'success' : 'default') as Tone,
    freshnessLabel: isAvailable ? connection.freshness.label : 'Unconfirmed',
    freshnessTone: (isFresh ? 'success' : 'warning') as Tone,
    matchTone,
    matchDescription: isKnown(matchDescriptions, matchValue)
      ? matchDescriptions[matchValue]
      : `Match status: ${connection.match_status.label}`,
    freshnessDescription,
  };
}

/** Returns the last valid page for `count` rows, so a shrinking list never strands the reader. */
export function clampPage(page: number, count: number, pageSize: number): number {
  return Math.min(Math.max(1, page), Math.max(1, Math.ceil(count / pageSize)));
}
