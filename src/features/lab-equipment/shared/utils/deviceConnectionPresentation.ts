import type { DeviceConnection } from '../../types/deviceConnections.ts';

const matchDescriptions: Record<DeviceConnection['match_status']['value'], string> = {
  matched: 'Identified in equipment inventory',
  unmatched: 'No matching equipment found',
  ambiguous: 'More than one equipment matches this device',
  interface_mismatch: 'Detected interface differs from the equipment definition',
};

export function deviceConnectionPresentation(connection: DeviceConnection, isAvailable = true) {
  const isFresh = isAvailable && connection.freshness.value === 'fresh';
  return {
    title: connection.equipment?.name || connection.name || 'Unidentified device',
    connectionLabel: isFresh
      ? connection.state.label
      : `Last reported: ${connection.state.label.toLowerCase()}`,
    connectionTone: isFresh && connection.state.value === 'connected' ? 'success' : 'default',
    freshnessLabel: isAvailable ? connection.freshness.label : 'Unconfirmed',
    freshnessTone: isFresh ? 'success' : 'warning',
    matchTone: connection.match_status.value === 'matched' ? 'success' : 'warning',
    matchDescription: matchDescriptions[connection.match_status.value],
    freshnessDescription: isFresh
      ? 'Based on the latest device observation'
      : 'Current physical connection is unconfirmed; waiting for a fresh device observation',
  } as const;
}
