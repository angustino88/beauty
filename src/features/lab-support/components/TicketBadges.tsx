import { useState, type ReactNode } from 'react';
import { Tooltip } from 'antd';
import { CloseOutlined } from '@ant-design/icons';
import { PersonIcon } from '@/components/display/PersonIcon';
import type { StatusTone } from '@/shared/status/statusTone';
import { normalizeAvatarUrl } from '@/shared/utils/avatar';
import { useGetSupportUserAvatarQuery } from '../api';
import {
  getTicketPriorityMeta,
  getTicketSlaMeta,
  getTicketStatusMeta,
  getTicketTypeMeta,
  type TicketPriorityLevel,
  type TicketSlaMeta,
  type TicketStatusVariant,
} from '../ticketPresentation';
import styles from './SupportTickets.module.css';

const TONE_CLASS: Record<StatusTone, string> = {
  info: styles.toneInfo,
  warning: styles.toneWarning,
  reserved: styles.toneReserved,
  success: styles.toneSuccess,
  danger: styles.toneDanger,
  neutral: styles.toneNeutral,
};

function StatusVariantIcon({ variant }: { variant: TicketStatusVariant }): ReactNode {
  switch (variant) {
    case 'open':
      return (
        <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <circle cx="8" cy="8" r="5.5" stroke="currentColor" strokeWidth="1.8" />
          <circle cx="8" cy="8" r="2.2" fill="currentColor" />
        </svg>
      );
    case 'in_progress':
      return (
        <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <circle cx="8" cy="8" r="5.5" stroke="currentColor" strokeWidth="1.75" />
          <path d="M8 2.5A5.5 5.5 0 0 1 8 13.5V2.5Z" fill="currentColor" />
        </svg>
      );
    case 'waiting':
      return (
        <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <circle cx="8" cy="8" r="5.5" stroke="currentColor" strokeWidth="1.75" />
          <path d="M8 4.8V8.1l2.2 1.4" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case 'resolved':
      return (
        <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <circle cx="8" cy="8" r="6" fill="currentColor" fillOpacity="0.16" stroke="currentColor" strokeWidth="1.6" />
          <path d="M5.4 8.2 7.2 10l3.5-3.9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case 'closed':
      return (
        <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <circle cx="8" cy="8" r="5.5" stroke="currentColor" strokeWidth="1.6" />
          <path d="M5.5 8h5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      );
  }
}

/**
 * Industry-standard priority iconography (Linear / enterprise helpdesk style):
 * - Critical: Solid alert square with exclamation mark
 * - High:     3 of 3 ascending signal bars active
 * - Medium:   2 of 3 ascending signal bars active
 * - Low:      1 of 3 ascending signal bars active
 */
function PriorityLevelIcon({ level }: { level: TicketPriorityLevel }): ReactNode {
  if (level === 'critical') {
    return (
      <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <rect x="2" y="2" width="12" height="12" rx="3" fill="currentColor" />
        <path d="M8 5v3.6" stroke="#ffffff" strokeWidth="1.85" strokeLinecap="round" />
        <circle cx="8" cy="11.1" r="1" fill="#ffffff" />
      </svg>
    );
  }

  const activeBars = level === 'high' ? 3 : level === 'medium' ? 2 : 1;
  return (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <rect x="2.2" y="9.2" width="2.8" height="4.3" rx="0.9" fill="currentColor" opacity={activeBars >= 1 ? 1 : 0.24} />
      <rect x="6.6" y="6.2" width="2.8" height="7.3" rx="0.9" fill="currentColor" opacity={activeBars >= 2 ? 1 : 0.24} />
      <rect x="11" y="3" width="2.8" height="10.5" rx="0.9" fill="currentColor" opacity={activeBars >= 3 ? 1 : 0.24} />
    </svg>
  );
}

function TicketTypeIcon({ typeKey }: { typeKey: string }): ReactNode {
  switch (typeKey) {
    case 'incident':
      return (
        <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <path d="M9 1.8 3.8 8.8h3.7L6.8 14.2l5.4-7.1H8.5L9 1.8Z" fill="currentColor" />
        </svg>
      );
    case 'service_request':
      return (
        <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <rect x="2.5" y="3" width="11" height="10" rx="2" stroke="currentColor" strokeWidth="1.6" />
          <path d="M5.5 6.8h5M5.5 9.6h3.2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      );
    case 'problem':
      return (
        <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <path d="M8 2.4 14 13H2L8 2.4Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
          <path d="M8 6.4v2.9" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          <circle cx="8" cy="11.1" r="0.85" fill="currentColor" />
        </svg>
      );
    case 'change':
      return (
        <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <path d="M3 5h10M10.5 2.8 13 5l-2.5 2.2M13 11H3M5.5 8.8 3 11l2.5 2.2" stroke="currentColor" strokeWidth="1.55" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case 'question':
      return (
        <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <circle cx="8" cy="8" r="5.6" stroke="currentColor" strokeWidth="1.6" />
          <path d="M6.4 6.3a1.7 1.7 0 1 1 2.4 1.55c-.55.25-.8.6-.8 1.2" stroke="currentColor" strokeWidth="1.55" strokeLinecap="round" />
          <circle cx="8" cy="11.2" r="0.85" fill="currentColor" />
        </svg>
      );
    default:
      return (
        <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <circle cx="8" cy="8" r="4" fill="currentColor" />
        </svg>
      );
  }
}

function SlaStateIcon({ state }: { state: TicketSlaMeta['state'] }): ReactNode {
  switch (state) {
    case 'breached':
      return (
        <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <circle cx="8" cy="8" r="5.6" stroke="currentColor" strokeWidth="1.6" />
          <path d="M8 5v3.4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
          <circle cx="8" cy="10.9" r="0.9" fill="currentColor" />
        </svg>
      );
    case 'paused':
      return (
        <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <rect x="4.5" y="3.5" width="2.4" height="9" rx="0.8" fill="currentColor" />
          <rect x="9.1" y="3.5" width="2.4" height="9" rx="0.8" fill="currentColor" />
        </svg>
      );
    default:
      return (
        <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <circle cx="8" cy="8" r="5.5" stroke="currentColor" strokeWidth="1.6" />
          <path d="M8 4.8V8l2.2 1.3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
  }
}

export function TicketStatusBadge({
  status,
  systemState,
  isFinal,
  compact = false,
  showTooltip = true,
}: {
  status: unknown;
  systemState?: unknown;
  isFinal?: boolean;
  compact?: boolean;
  showTooltip?: boolean;
}) {
  const meta = getTicketStatusMeta(status, systemState, isFinal);
  const badge = (
    <span
      className={[
        styles.statusBadge,
        TONE_CLASS[meta.tone],
        compact ? styles.statusBadgeCompact : '',
      ].filter(Boolean).join(' ')}
    >
      <span className={styles.statusIcon}>
        <StatusVariantIcon variant={meta.variant} />
      </span>
      <span>{meta.label}</span>
    </span>
  );
  return showTooltip ? <Tooltip title={meta.description}>{badge}</Tooltip> : badge;
}

export function TicketPriorityBadge({
  priority,
  showTooltip = true,
}: {
  priority: unknown;
  showTooltip?: boolean;
}) {
  const meta = getTicketPriorityMeta(priority);
  const badge = (
    <span
      className={[
        styles.priorityBadge,
        TONE_CLASS[meta.tone],
        meta.level === 'critical' ? styles.priorityCritical : '',
        meta.level === 'high' ? styles.priorityHigh : '',
      ].filter(Boolean).join(' ')}
    >
      <span className={styles.priorityIcon}>
        <PriorityLevelIcon level={meta.level} />
      </span>
      <span>{meta.label}</span>
    </span>
  );
  return showTooltip ? <Tooltip title={meta.description}>{badge}</Tooltip> : badge;
}

export function TicketTypeBadge({ ticketType }: { ticketType: unknown }) {
  const meta = getTicketTypeMeta(ticketType);
  return (
    <span className={`${styles.typeBadge} ${TONE_CLASS[meta.tone]}`}>
      <span className={styles.typeIcon} aria-hidden="true">
        <TicketTypeIcon typeKey={meta.key} />
      </span>
      <span>{meta.label}</span>
    </span>
  );
}

export function TicketSlaBadge({
  sla,
  status,
  systemState,
}: {
  sla: unknown;
  status?: unknown;
  systemState?: unknown;
}) {
  const statusMeta = getTicketStatusMeta(status, systemState);
  const meta = getTicketSlaMeta(sla, statusMeta);
  if (meta.state === 'none') return null;

  const badge = (
    <span className={`${styles.slaBadge} ${TONE_CLASS[meta.tone]}`}>
      <span className={styles.slaIcon} aria-hidden="true">
        <SlaStateIcon state={meta.state} />
      </span>
      <span>{meta.label}</span>
    </span>
  );
  return meta.detail ? <Tooltip title={meta.detail}>{badge}</Tooltip> : badge;
}

export function TicketUserChip({
  user,
  emptyLabel = 'Unassigned',
  onRemove,
  removing = false,
}: {
  user:
    | {
        id?: number;
        username?: string | null;
        displayName?: string | null;
        display_name?: string | null;
        email?: string | null;
        avatar_url?: string | null;
      }
    | string
    | null
    | undefined;
  emptyLabel?: string;
  onRemove?: () => void;
  removing?: boolean;
}) {
  const userObj = typeof user === 'object' && user !== null ? user : null;
  const username = (userObj?.username || '').trim();
  const directAvatar = normalizeAvatarUrl(userObj?.avatar_url);
  const { data: fetchedAvatar } = useGetSupportUserAvatarQuery(username, {
    skip: !username || Boolean(directAvatar),
  });
  const resolvedAvatar = directAvatar ?? fetchedAvatar ?? null;
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const showImage = Boolean(resolvedAvatar && failedSrc !== resolvedAvatar);

  if (!user) {
    return <span className={styles.unassignedChip}>{emptyLabel}</span>;
  }
  if (typeof user === 'string') {
    const trimmed = user.trim();
    if (!trimmed) return <span className={styles.unassignedChip}>{emptyLabel}</span>;
    return (
      <span className={styles.userChip} title={trimmed}>
        <PersonIcon size={18} />
        <span className={styles.userName}>{trimmed}</span>
      </span>
    );
  }

  const displayName = (user.display_name || user.displayName || user.username || '').trim();
  if (!displayName) {
    return <span className={styles.unassignedChip}>{emptyLabel}</span>;
  }

  return (
    <Tooltip title={displayName} placement="bottom">
      <span
        className={`${styles.userChip} ${onRemove ? styles.userChipRemovable : ''}`}
      >
        {showImage && resolvedAvatar ? (
          <img
            src={resolvedAvatar}
            alt=""
            aria-hidden="true"
            className={styles.userAvatarImg}
            onError={() => setFailedSrc(resolvedAvatar)}
          />
        ) : (
          <PersonIcon size={18} />
        )}
        <span className={styles.userName}>{displayName}</span>
        {onRemove && (
          <button
            type="button"
            className={styles.userChipRemoveBtn}
            aria-label={`Remove ${displayName}`}
            disabled={removing}
            onClick={(event) => {
              event.stopPropagation();
              onRemove();
            }}
          >
            <CloseOutlined />
          </button>
        )}
      </span>
    </Tooltip>
  );
}
