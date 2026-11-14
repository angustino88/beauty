import { LockOutlined } from '@ant-design/icons';
import { Tooltip } from 'antd';
import { normalizeSpaceStatus, spaceStatusLabel, spaceStatusTone } from './spaceStatus';
import {
  resourceBadge,
  type AccessPolicy,
  type Choice,
  type ResourceState,
} from './resourceStatus';
import styles from './SpaceStatusBadge.module.css';
import equipmentBadgeStyles from '@/features/lab-equipment/shared/components/status/EquipmentStatus.module.css';
import indicatorStyles from '@/shared/components/StatusIndicator.module.css';

const toneClassMap: Record<string, string> = {
  neutral: indicatorStyles.neutral,
  info: indicatorStyles.info,
  warning: indicatorStyles.warning,
  danger: indicatorStyles.danger,
  success: indicatorStyles.success,
  'success-subtle': indicatorStyles.successSubtle,
};

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

    const toneClass = toneClassMap[badge.tone] ?? indicatorStyles.neutral;

    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
        <span
          className={`${indicatorStyles.indicator} ${toneClass} ${equipmentBadgeStyles.badge} ${styles.badge}`}
        >
          <span className={indicatorStyles.statusDot} aria-hidden="true" />
          {badge.text}
        </span>
        {isRestricted && (
          <Tooltip title="Restricted access">
            <LockOutlined style={{ color: '#d97706', fontSize: 13 }} aria-label="Restricted access" />
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
      resolvedTone = 'overviewGreen';
    }
  }

  return (
    <span
      className={`${indicatorStyles.indicator} ${indicatorStyles[resolvedTone]} ${equipmentBadgeStyles.badge} ${styles.badge}`}
    >
      <span className={indicatorStyles.statusDot} aria-hidden="true" />
      {resolvedLabel}
    </span>
  );
}
