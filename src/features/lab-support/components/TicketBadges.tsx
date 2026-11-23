import type { ReactNode } from 'react';
import { Tooltip } from 'antd';
import type { StatusTone } from '@/shared/status/statusTone';
import {
  getTicketPriorityMeta,
  getTicketSlaMeta,
  getTicketStatusMeta,
  getTicketTypeMeta,
  type TicketPriorityLevel,
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
          <circle cx="8" cy="8" r="5.5" stroke="currentColor" strokeWidth="2" />
          <circle cx="8" cy="8" r="2" fill="currentColor" />
        </svg>
      );
    case 'in_progress':
      return (
        <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <circle cx="8" cy="8" r="5.75" stroke="currentColor" strokeWidth="1.8" strokeDasharray="3 2" />
          <path d="M8 3.25A4.75 4.75 0 0 1 12.75 8H8V3.25Z" fill="currentColor" />
        </svg>
      );
    case 'waiting':
      return (
        <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <circle cx="8" cy="8" r="5.75" stroke="currentColor" strokeWidth="1.75" />
          <path d="M8 5v3.25l2.25 1.25" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case 'resolved':
      return (
        <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <circle cx="8" cy="8" r="6" fill="currentColor" fillOpacity="0.18" stroke="currentColor" strokeWidth="1.6" />
          <path d="M5.4 8.2 7.2 10l3.6-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case 'closed':
      return (
        <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <circle cx="8" cy="8" r="5.5" stroke="currentColor" strokeWidth="1.6" />
          <path d="M5.75 8h4.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      );
  }
}

function PriorityLevelIcon({ level }: { level: TicketPriorityLevel }): ReactNode {
  switch (level) {
    case 'critical':
      return (
        <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <path d="M3.5 7.5 8 3l4.5 4.5M3.5 12 8 7.5 12.5 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case 'high':
      return (
        <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <path d="M3.5 10.25 8 5.5l4.5 4.75" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case 'medium':
      return (
        <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <path d="M3.5 6.25h9M3.5 9.75h9" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
        </svg>
      );
    case 'low':
      return (
        <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <path d="M3.5 5.75 8 10.5l4.5-4.75" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
  }
}

export function TicketStatusBadge({
  status,
  systemState,
  compact = false,
  showTooltip = true,
}: {
  status: unknown;
  systemState?: unknown;
  compact?: boolean;
  showTooltip?: boolean;
}) {
  const meta = getTicketStatusMeta(status, systemState);
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
      <span className={styles.typeDot} aria-hidden="true" />
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
      <span>{meta.label}</span>
    </span>
  );
  return meta.detail ? <Tooltip title={meta.detail}>{badge}</Tooltip> : badge;
}

function getInitials(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return '?';
  const parts = trimmed.split(/[\s._-]+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0] ?? ''}${parts[1][0] ?? ''}`.toUpperCase();
  }
  return trimmed.slice(0, 2).toUpperCase();
}

export function TicketUserChip({
  user,
  emptyLabel = 'Unassigned',
}: {
  user:
    | {
        id?: number;
        username?: string | null;
        displayName?: string | null;
        display_name?: string | null;
        email?: string | null;
      }
    | string
    | null
    | undefined;
  emptyLabel?: string;
}) {
  if (!user) {
    return <span className={styles.unassignedChip}>{emptyLabel}</span>;
  }
  if (typeof user === 'string') {
    const trimmed = user.trim();
    if (!trimmed) return <span className={styles.unassignedChip}>{emptyLabel}</span>;
    return (
      <span className={styles.userChip} title={trimmed}>
        <span className={styles.userAvatar} aria-hidden="true">{getInitials(trimmed)}</span>
        <span className={styles.userName}>{trimmed}</span>
      </span>
    );
  }

  const displayName = (user.display_name || user.displayName || user.username || '').trim();
  const username = (user.username || '').trim();
  if (!displayName) {
    return <span className={styles.unassignedChip}>{emptyLabel}</span>;
  }

  const tooltipText =
    username && displayName !== username
      ? `${displayName} (@${username})`
      : displayName;

  return (
    <Tooltip title={tooltipText}>
      <span className={styles.userChip}>
        <span className={styles.userAvatar} aria-hidden="true">{getInitials(displayName)}</span>
        <span className={styles.userName}>{displayName}</span>
      </span>
    </Tooltip>
  );
}
