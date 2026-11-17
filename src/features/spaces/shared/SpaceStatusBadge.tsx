import { LockOutlined } from '@ant-design/icons';
import { Tooltip } from 'antd';
import { CalendarCheck2, UserRound } from 'lucide-react';
import { normalizeSpaceStatus, spaceStatusLabel, spaceStatusTone } from './spaceStatus';
import {
  resourceActivityMarker,
  resourceBadge,
  type AccessPolicy,
  type Choice,
  type ResourceState,
} from './resourceStatus';
import styles from './SpaceStatusBadge.module.css';
import { StatusBadge } from '@/shared/components/StatusBadge';

interface SpaceStatusBadgeProps {
  status?: unknown;
  label?: string;
  resourceState?: Partial<ResourceState> | null;
  accessPolicy?: Choice<AccessPolicy> | string | null;
  spaceKind?: 'room' | 'station' | 'bench';
}

const isResourceState = (value: unknown): value is Partial<ResourceState> =>
  typeof value === 'object' && value !== null && 'lifecycle_status' in value;

export default function SpaceStatusBadge({
  status,
  label,
  resourceState,
  accessPolicy,
  spaceKind,
}: SpaceStatusBadgeProps) {
  // If resourceState is provided, or status itself is a ResourceState object:
  const state = resourceState ?? (isResourceState(status) ? status : null);

  if (state && state.lifecycle_status) {
    const badge = resourceBadge(state, spaceKind);
    const resolvedAccess =
      accessPolicy ??
      ('access_policy' in (state as Record<string, unknown>)
        ? ((state as Record<string, unknown>).access_policy as Choice<AccessPolicy>)
        : null);
    const isRestricted =
      typeof resolvedAccess === 'string'
        ? resolvedAccess.toLowerCase() === 'restricted'
        : resolvedAccess?.value === 'restricted';

    // "Unavailable (Room X)" is too long for the shared badge width: show the
    // short state and keep the blocker in the tooltip.
    const shortText = badge.text.replace(/\s*\(.*\)$/, '');
    // Booking activity is its own fact (dashboard style): a marker beside the
    // badge, never a replacement for the bench's status.
    const marker = spaceKind === 'bench' ? resourceActivityMarker(state) : null;
    const MarkerIcon = marker?.value === 'active' ? UserRound : CalendarCheck2;

    return (
      <span className={styles.wrap}>
        <StatusBadge tone={badge.tone} label={shortText} title={badge.text} className={styles.badge} />
        <span className={styles.lockSlot}>
          {isRestricted && (
            <Tooltip title="Restricted access">
              <LockOutlined aria-label="Restricted access" />
            </Tooltip>
          )}
        </span>
        {marker && (
          <Tooltip title={marker.description}>
            <span className={`${styles.activity} ${styles[marker.tone]}`} aria-label={marker.description}>
              <MarkerIcon size={13} strokeWidth={2.25} aria-hidden="true" />
              {marker.text}
            </span>
          </Tooltip>
        )}
      </span>
    );
  }

  // Fallback for legacy status strings / records
  const value = normalizeSpaceStatus(status);
  let resolvedLabel = label?.trim() || spaceStatusLabel(value);
  let resolvedTone = spaceStatusTone(value);

  if (spaceKind === 'room' || spaceKind === 'station') {
    if (value === 'available' || resolvedLabel.toLowerCase() === 'available') {
      resolvedLabel = 'Operational';
      resolvedTone = 'success';
    }
  }

  return (
    <span className={styles.wrap}>
      <StatusBadge tone={resolvedTone} label={resolvedLabel} className={styles.badge} />
      <span className={styles.lockSlot} />
    </span>
  );
}
