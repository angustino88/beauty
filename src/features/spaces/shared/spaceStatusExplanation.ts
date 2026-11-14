import { DOWNTIME_REASON_LABELS, LIFECYCLE_STATUS_LABELS, resourceBadge, type DowntimeReason, type LocationState, type ResourceState, type ResourceType } from './resourceStatus.ts';
import type { StatusTone } from '../../../shared/status/statusTone.ts';

export interface SpaceStatusExplanation {
  tone: StatusTone;
  title: string;
  description: string;
}

const reasonLabel = (reason: unknown): string | null => {
  if (typeof reason !== 'string' || !reason) return null;
  return DOWNTIME_REASON_LABELS[reason as DowntimeReason]
    ?? LIFECYCLE_STATUS_LABELS[reason as keyof typeof LIFECYCLE_STATUS_LABELS]
    ?? reason.replaceAll('_', ' ');
};

/**
 * Headline status plus a plain-language reason, derived from the same priority
 * rules as the list badge (resourceBadge) so the table and the sheet always agree.
 */
export function explainSpaceStatus(
  state: Partial<ResourceState & LocationState> | null | undefined,
  kind: Extract<ResourceType, 'room' | 'station' | 'bench'>,
): SpaceStatusExplanation {
  const badge = resourceBadge(state, kind);
  const noun = kind === 'bench' ? 'bench' : kind;
  if (!state?.lifecycle_status) {
    return { tone: 'neutral', title: 'Unknown', description: 'No lifecycle information has been recorded yet.' };
  }
  const lifecycle = state.lifecycle_status.value;
  const condition = state.condition?.value;
  const availability = state.availability;

  if (lifecycle === 'retired') {
    return { tone: badge.tone, title: badge.text, description: `This ${noun} is decommissioned and can no longer be used or booked.` };
  }
  if (lifecycle === 'planned') {
    return { tone: badge.tone, title: badge.text, description: `This ${noun} is planned and not in service yet.` };
  }
  if (condition && condition !== 'operational') {
    const reason = reasonLabel(availability?.reason);
    const base = condition === 'out_of_service'
      ? `Out of service and not usable until it is repaired`
      : `Under maintenance and temporarily unavailable`;
    return { tone: badge.tone, title: badge.text, description: `${base}${reason ? ` (reason: ${reason.toLowerCase()})` : ''}.` };
  }
  if (availability?.value === 'unavailable') {
    const blocker = availability.blocked_by;
    const reason = reasonLabel(availability.reason ?? availability.condition);
    return {
      tone: 'warning',
      title: 'Unavailable',
      description: blocker
        ? `Blocked because ${blocker.type} ${blocker.name} is unavailable${reason ? ` (${reason.toLowerCase()})` : ''}. It becomes available again when that ${blocker.type} is back in service.`
        : `Unavailable due to upstream maintenance or downtime${reason ? ` (${reason.toLowerCase()})` : ''}.`,
    };
  }
  if (kind !== 'bench') {
    return { tone: 'success', title: 'Operational', description: `In service and ready for ${kind === 'room' ? 'stations and equipment' : 'benches and equipment'}.` };
  }
  const activity = state.activity_status?.value;
  if (activity === 'active') return { tone: badge.tone, title: badge.text, description: 'Someone is working on this bench right now.' };
  if (activity === 'scheduled') return { tone: badge.tone, title: badge.text, description: 'Free now, with a booking later today.' };
  return { tone: badge.tone, title: badge.text, description: 'Free and ready to book.' };
}
