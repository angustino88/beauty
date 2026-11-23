import {
  normalizeStatusKey,
  supportTicketPriorityTone,
  supportTicketStatusTone,
  type StatusTone,
} from '../../shared/status/statusTone.ts';

export type TicketStatusVariant = 'open' | 'in_progress' | 'waiting' | 'resolved' | 'closed';

export interface TicketStatusMeta {
  key: string;
  label: string;
  tone: StatusTone;
  variant: TicketStatusVariant;
  description: string;
  isTerminal: boolean;
}

export type TicketPriorityLevel = 'critical' | 'high' | 'medium' | 'low';

export interface TicketPriorityMeta {
  key: string;
  label: string;
  level: TicketPriorityLevel;
  rank: number;
  tone: StatusTone;
  description: string;
}

export interface TicketTypeMeta {
  key: string;
  label: string;
  shortLabel: string;
  tone: StatusTone;
}

export interface TicketSlaMeta {
  state: 'breached' | 'paused' | 'at_risk' | 'on_track' | 'none';
  label: string;
  tone: StatusTone;
  detail?: string;
}

export interface TransitionRequirements {
  requiresResolution: boolean;
  requiresReason: boolean;
  isReopen: boolean;
  isClosing: boolean;
  actionLabel: string;
  buttonVariant: 'primary' | 'default' | 'resolve' | 'reopen';
}

export const TICKET_TYPE_OPTIONS = [
  { value: 'incident', label: 'Incident', description: 'Something is broken or not working as expected' },
  { value: 'service_request', label: 'Service request', description: 'Access, equipment setup, or routine assistance' },
  { value: 'problem', label: 'Problem', description: 'Recurring or root-cause investigation' },
  { value: 'change', label: 'Change', description: 'Planned modification or upgrade' },
  { value: 'question', label: 'Question', description: 'General inquiry or technical guidance' },
] as const;

export const IMPACT_URGENCY_OPTIONS = [
  { value: '1', label: 'High (1)' },
  { value: '2', label: 'Medium (2)' },
  { value: '3', label: 'Low (3)' },
] as const;

export const RESOLUTION_CODE_OPTIONS = [
  { value: 'fixed', label: 'Fixed — root issue resolved' },
  { value: 'workaround', label: 'Workaround — temporary solution provided' },
  { value: 'cannot_reproduce', label: 'Cannot reproduce' },
  { value: 'duplicate', label: 'Duplicate of another ticket' },
  { value: 'wont_fix', label: "Won't fix — out of scope or by design" },
  { value: 'user_error', label: 'User error / guidance provided' },
  { value: 'vendor', label: 'Vendor / third-party resolved' },
] as const;

function extractNameAndState(value: unknown, explicitState?: unknown): { name: string; systemState: string } {
  if (typeof value === 'string') {
    return {
      name: value.trim(),
      systemState: typeof explicitState === 'string' ? explicitState.trim() : '',
    };
  }
  if (typeof value === 'object' && value !== null) {
    const rec = value as Record<string, unknown>;
    const rawName = typeof rec.name === 'string' ? rec.name : typeof rec.label === 'string' ? rec.label : '';
    const rawState =
      typeof explicitState === 'string'
        ? explicitState
        : typeof rec.system_state === 'string'
          ? rec.system_state
          : typeof rec.value === 'string'
            ? rec.value
            : '';
    return { name: rawName.trim(), systemState: rawState.trim() };
  }
  return {
    name: '',
    systemState: typeof explicitState === 'string' ? explicitState.trim() : '',
  };
}

export function getTicketStatusMeta(status: unknown, systemState?: unknown): TicketStatusMeta {
  const { name, systemState: resolvedState } = extractNameAndState(status, systemState);
  const key = normalizeStatusKey(name || resolvedState);
  const stateKey = normalizeStatusKey(resolvedState);
  const tone = supportTicketStatusTone(name || resolvedState, resolvedState);
  const label = name || (key ? key.charAt(0).toUpperCase() + key.slice(1).replaceAll('_', ' ') : 'Unknown');

  if (key.includes('close') || key.includes('cancel')) {
    return {
      key: key || 'closed',
      label,
      tone: 'neutral',
      variant: 'closed',
      description: 'Ticket is closed and archived.',
      isTerminal: true,
    };
  }

  if (key.includes('resolv') || key.includes('complete') || stateKey === 'done') {
    return {
      key: key || 'resolved',
      label,
      tone: 'success',
      variant: 'resolved',
      description: 'Resolution has been provided for this ticket.',
      isTerminal: true,
    };
  }

  if (key.includes('wait') || key.includes('hold') || key.includes('pend') || key.includes('pause') || stateKey === 'waiting') {
    return {
      key: key || 'waiting',
      label,
      tone: 'reserved',
      variant: 'waiting',
      description: 'Awaiting response or external action; SLA clock is paused.',
      isTerminal: false,
    };
  }

  if (key.includes('progress') || key.includes('investig') || key.includes('triage') || key.includes('active') || stateKey === 'active') {
    return {
      key: key || 'in_progress',
      label,
      tone: 'warning',
      variant: 'in_progress',
      description: 'Actively being investigated or worked on by support.',
      isTerminal: false,
    };
  }

  return {
    key: key || 'open',
    label: name || 'Open',
    tone,
    variant: 'open',
    description: 'Open in the support queue and awaiting triage or action.',
    isTerminal: false,
  };
}

export function getTicketPriorityMeta(priority: unknown): TicketPriorityMeta {
  let name = '';
  let explicitRank: number | undefined;
  if (typeof priority === 'string') {
    name = priority.trim();
  } else if (typeof priority === 'object' && priority !== null) {
    const rec = priority as Record<string, unknown>;
    name = typeof rec.name === 'string' ? rec.name.trim() : typeof rec.label === 'string' ? rec.label.trim() : '';
    const r = Number(rec.rank ?? rec.level);
    if (Number.isFinite(r) && r > 0) explicitRank = r;
  }

  const key = normalizeStatusKey(name);
  const tone = supportTicketPriorityTone(name);

  if (key.includes('crit') || key.includes('urgent') || key.includes('block') || key === 'p1' || explicitRank === 1) {
    return {
      key: key || 'critical',
      label: name || 'Critical',
      level: 'critical',
      rank: 1,
      tone: 'danger',
      description: 'Critical impact — requires immediate response.',
    };
  }

  if (key.includes('high') || key.includes('major') || key === 'p2' || explicitRank === 2) {
    return {
      key: key || 'high',
      label: name || 'High',
      level: 'high',
      rank: 2,
      tone: 'warning',
      description: 'High priority — significant operational impact.',
    };
  }

  if (key.includes('low') || key.includes('minor') || key.includes('trivial') || key === 'p4' || explicitRank === 4) {
    return {
      key: key || 'low',
      label: name || 'Low',
      level: 'low',
      rank: 4,
      tone: 'neutral',
      description: 'Low priority — routine request or minor issue.',
    };
  }

  return {
    key: key || 'medium',
    label: name || 'Medium',
    level: 'medium',
    rank: 3,
    tone,
    description: 'Standard priority request.',
  };
}

export function getTicketTypeMeta(ticketType: unknown): TicketTypeMeta {
  let rawValue = '';
  let rawLabel = '';
  if (typeof ticketType === 'string') {
    rawValue = ticketType;
  } else if (typeof ticketType === 'object' && ticketType !== null) {
    const rec = ticketType as Record<string, unknown>;
    rawValue = typeof rec.value === 'string' ? rec.value : typeof rec.name === 'string' ? rec.name : '';
    rawLabel = typeof rec.label === 'string' ? rec.label : '';
  }

  const key = normalizeStatusKey(rawValue || rawLabel);
  switch (key) {
    case 'incident':
      return { key: 'incident', label: rawLabel || 'Incident', shortLabel: 'Incident', tone: 'danger' };
    case 'service_request':
      return { key: 'service_request', label: rawLabel || 'Service Request', shortLabel: 'Request', tone: 'info' };
    case 'problem':
      return { key: 'problem', label: rawLabel || 'Problem', shortLabel: 'Problem', tone: 'warning' };
    case 'change':
      return { key: 'change', label: rawLabel || 'Change', shortLabel: 'Change', tone: 'reserved' };
    case 'question':
      return { key: 'question', label: rawLabel || 'Question', shortLabel: 'Question', tone: 'neutral' };
    default:
      return {
        key: key || 'incident',
        label: rawLabel || (rawValue ? rawValue.replaceAll('_', ' ') : 'Incident'),
        shortLabel: rawLabel || 'Ticket',
        tone: 'neutral',
      };
  }
}

export function getTicketSlaMeta(sla: unknown, statusMeta?: TicketStatusMeta): TicketSlaMeta {
  if (!sla || typeof sla !== 'object') {
    return { state: 'none', label: 'No SLA', tone: 'neutral' };
  }
  const rec = sla as Record<string, unknown>;
  const responseBreached = Boolean(rec.response_breached || rec.response_breached_at);
  const resolutionBreached = Boolean(rec.resolution_breached || rec.resolution_breached_at);
  const isPaused = Boolean(rec.is_paused || rec.paused || rec.sla_paused_at);

  if (responseBreached || resolutionBreached) {
    return {
      state: 'breached',
      label: resolutionBreached ? 'Resolution SLA Breached' : 'Response SLA Breached',
      tone: 'danger',
      detail: 'Target response or resolution window was exceeded.',
    };
  }

  if (statusMeta?.isTerminal) {
    return {
      state: 'on_track',
      label: 'SLA Met',
      tone: 'success',
      detail: 'Completed within SLA targets.',
    };
  }

  if (isPaused || statusMeta?.variant === 'waiting') {
    return {
      state: 'paused',
      label: 'SLA Paused',
      tone: 'reserved',
      detail: 'SLA timer is paused while waiting.',
    };
  }

  const dueStr = typeof rec.resolution_due_at === 'string' ? rec.resolution_due_at : typeof rec.response_due_at === 'string' ? rec.response_due_at : '';
  if (dueStr) {
    const dueTime = Date.parse(dueStr);
    if (Number.isFinite(dueTime)) {
      const diffMinutes = Math.round((dueTime - Date.now()) / 60000);
      if (diffMinutes < 0) {
        return {
          state: 'breached',
          label: 'SLA Overdue',
          tone: 'danger',
          detail: `Due ${new Date(dueTime).toLocaleString()}`,
        };
      }
      if (diffMinutes <= 120) {
        return {
          state: 'at_risk',
          label: `Due in ${diffMinutes}m`,
          tone: 'warning',
          detail: `Target: ${new Date(dueTime).toLocaleString()}`,
        };
      }
      return {
        state: 'on_track',
        label: 'SLA On Track',
        tone: 'success',
        detail: `Target: ${new Date(dueTime).toLocaleString()}`,
      };
    }
  }

  if (Object.keys(rec).length > 0 && rec.enabled !== false) {
    return {
      state: 'on_track',
      label: 'SLA Active',
      tone: 'success',
    };
  }

  return { state: 'none', label: 'No SLA', tone: 'neutral' };
}

/**
 * Determines whether a status transition requires a resolution summary or a reason based on
 * the Support Desk workflow rules (core/support_desk/features/tickets/defaults.py & transition_ticket.py).
 */
export function getTransitionRequirements(
  targetStatusName: string,
  currentStatusName?: string,
  targetSystemState?: string,
): TransitionRequirements {
  const targetMeta = getTicketStatusMeta(targetStatusName, targetSystemState);
  const currentMeta = getTicketStatusMeta(currentStatusName);

  const isReopen = currentMeta.isTerminal && targetMeta.variant === 'open';
  const requiresResolution = targetMeta.variant === 'resolved';
  const isClosingFromOpen = currentMeta.variant === 'open' && targetMeta.variant === 'closed';
  const requiresReason = isReopen || isClosingFromOpen;

  let actionLabel = targetStatusName;
  let buttonVariant: TransitionRequirements['buttonVariant'] = 'default';

  if (isReopen) {
    actionLabel = 'Reopen Ticket';
    buttonVariant = 'reopen';
  } else if (targetMeta.variant === 'in_progress') {
    actionLabel = currentMeta.variant === 'waiting' ? 'Resume Progress' : 'Start Progress';
    buttonVariant = 'primary';
  } else if (targetMeta.variant === 'waiting') {
    actionLabel = 'Wait on Customer';
    buttonVariant = 'default';
  } else if (targetMeta.variant === 'resolved') {
    actionLabel = 'Resolve Ticket';
    buttonVariant = 'resolve';
  } else if (targetMeta.variant === 'closed') {
    actionLabel = 'Close Ticket';
    buttonVariant = 'default';
  }

  return {
    requiresResolution,
    requiresReason,
    isReopen,
    isClosing: targetMeta.variant === 'closed',
    actionLabel,
    buttonVariant,
  };
}

/**
 * Formats structured activity event payload into clear human-readable detail lines.
 */
export function formatTicketActivityLines(activity: {
  event_type?: { value?: string; label?: string } | null;
  payload?: unknown;
}): string[] {
  if (!activity.payload || typeof activity.payload !== 'object') return [];
  const payload = activity.payload as Record<string, unknown>;
  const lines: string[] = [];

  if (typeof payload.from_status === 'string' && typeof payload.to_status === 'string') {
    lines.push(`${payload.from_status} → ${payload.to_status}`);
  }
  if (typeof payload.resolution_code === 'string' && payload.resolution_code) {
    lines.push(`Resolution code: ${payload.resolution_code.replaceAll('_', ' ')}`);
  }
  if (typeof payload.resolution_summary === 'string' && payload.resolution_summary.trim()) {
    lines.push(`Resolution: ${payload.resolution_summary.trim()}`);
  }
  if (typeof payload.reason === 'string' && payload.reason.trim()) {
    lines.push(`Reason: ${payload.reason.trim()}`);
  }
  if (typeof payload.assignee === 'string' && payload.assignee) {
    lines.push(`Assignee: ${payload.assignee}`);
  }
  if (typeof payload.user_name === 'string' && payload.user_name) {
    lines.push(`Watcher: ${payload.user_name}`);
  }

  if (payload.changes && typeof payload.changes === 'object' && !Array.isArray(payload.changes)) {
    const changes = payload.changes as Record<string, unknown>;
    for (const [field, diff] of Object.entries(changes)) {
      const label = field.replaceAll('_', ' ');
      if (diff && typeof diff === 'object' && !Array.isArray(diff)) {
        const d = diff as Record<string, unknown>;
        const oldVal = formatDiffValue(d.old);
        const newVal = formatDiffValue(d.new);
        lines.push(`${capitalize(label)}: ${oldVal} → ${newVal}`);
      }
    }
  }

  return lines;
}

function formatDiffValue(val: unknown): string {
  if (val === null || val === undefined || val === '') return 'None';
  if (Array.isArray(val)) return val.length ? val.join(', ') : 'None';
  if (typeof val === 'object') {
    const rec = val as Record<string, unknown>;
    if (typeof rec.name === 'string') return rec.name;
    return JSON.stringify(val);
  }
  return String(val);
}

function capitalize(value: string): string {
  return value ? value.charAt(0).toUpperCase() + value.slice(1) : '';
}
