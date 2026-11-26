import type { AvailableTicketTransitionRead, ResolutionCodeEnum } from '../../shared/api/generated/api.ts';
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

export const TICKET_TYPE_OPTIONS = [
  { value: 'incident', label: 'Incident', description: 'Something is broken or not working as expected' },
  { value: 'service_request', label: 'Service request', description: 'Access, equipment setup, or routine assistance' },
  { value: 'bug', label: 'Bug', description: 'Software issue or unexpected behavior in Lab Mango' },
  { value: 'feature_request', label: 'Feature request', description: 'New capability or workflow enhancement' },
  { value: 'feedback', label: 'Feedback', description: 'Usability, design, or general platform feedback' },
  { value: 'problem', label: 'Problem', description: 'Recurring or root-cause investigation' },
  { value: 'change', label: 'Change', description: 'Planned modification or upgrade' },
  { value: 'question', label: 'Question', description: 'General inquiry or technical guidance' },
] as const;

export const IMPACT_URGENCY_OPTIONS = [
  { value: '1', label: 'High (1)' },
  { value: '2', label: 'Medium (2)' },
  { value: '3', label: 'Low (3)' },
] as const;

const RESOLUTION_LABELS: Record<ResolutionCodeEnum, string> = {
  fixed: 'Issue fixed',
  workaround: 'Workaround provided',
  cannot_reproduce: 'Could not reproduce',
  duplicate: 'Duplicate ticket',
  wont_fix: 'No fix planned',
  user_error: 'User error / guidance provided',
  vendor: 'Resolved by a third party',
  fulfilled: 'Request fulfilled',
  partially_fulfilled: 'Request partially fulfilled',
  guidance_provided: 'Guidance or information provided',
  change_implemented: 'Change implemented',
  declined: 'Request declined',
  withdrawn: 'Request withdrawn',
};

const INCIDENT_OUTCOMES: ResolutionCodeEnum[] = ['fixed', 'workaround', 'cannot_reproduce', 'guidance_provided', 'vendor', 'wont_fix', 'duplicate', 'withdrawn'];
const REQUEST_OUTCOMES: ResolutionCodeEnum[] = ['fulfilled', 'partially_fulfilled', 'guidance_provided', 'declined', 'duplicate', 'withdrawn'];
const OUTCOMES_BY_TYPE: Record<string, ResolutionCodeEnum[]> = {
  incident: INCIDENT_OUTCOMES,
  bug: INCIDENT_OUTCOMES,
  problem: INCIDENT_OUTCOMES,
  service_request: REQUEST_OUTCOMES,
  feature_request: ['change_implemented', 'fulfilled', 'partially_fulfilled', 'declined', 'duplicate', 'withdrawn'],
  feedback: ['change_implemented', 'guidance_provided', 'fulfilled', 'declined', 'duplicate', 'withdrawn'],
  question: ['guidance_provided', 'fulfilled', 'declined', 'duplicate', 'withdrawn'],
  change: ['change_implemented', 'partially_fulfilled', 'declined', 'duplicate', 'withdrawn'],
};

const DESCRIPTION_BY_TYPE: Record<string, string> = {
  incident: 'What went wrong? Include the affected equipment or location, the impact, and what you already tried.',
  bug: 'What happened? Include steps to reproduce, expected behavior, and the screen you were using.',
  feature_request: 'What problem does this solve? Describe the proposed feature or workflow improvement.',
  feedback: 'Share what is working well, what felt unclear, or how we can improve Lab Mango.',
  problem: 'Describe the recurring issue, when it occurs, and any related tickets or findings.',
  service_request: 'What do you need? Include the resource, who needs it, and any timing or access requirements.',
  question: 'What would you like to know? Include any relevant equipment, location, or context.',
  change: 'What should change, why, and which resources or people will be affected?',
};

export function getResolutionOptions(ticketType: string) {
  return (OUTCOMES_BY_TYPE[ticketType] ?? REQUEST_OUTCOMES).map((value) => ({
    value,
    label: RESOLUTION_LABELS[value],
  }));
}

export function getResolutionLabel(value: string) {
  return RESOLUTION_LABELS[value as ResolutionCodeEnum] ?? value.replaceAll('_', ' ');
}

export function getTicketDescriptionPlaceholder(ticketType?: string) {
  return DESCRIPTION_BY_TYPE[ticketType ?? 'incident'] ?? DESCRIPTION_BY_TYPE.service_request;
}

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

export function getTicketStatusMeta(status: unknown, systemState?: unknown, isFinal?: boolean): TicketStatusMeta {
  const { name, systemState: resolvedState } = extractNameAndState(status, systemState);
  const key = normalizeStatusKey(name || resolvedState);
  const stateKey = normalizeStatusKey(resolvedState);
  const tone = supportTicketStatusTone(name || resolvedState, resolvedState);
  const label = name || (key ? key.charAt(0).toUpperCase() + key.slice(1).replaceAll('_', ' ') : 'Unknown');

  if (isFinal ?? (key.includes('close') || key.includes('cancel'))) {
    return {
      key: key || 'closed',
      label,
      tone: 'neutral',
      variant: 'closed',
      description: 'Ticket is closed and archived.',
      isTerminal: true,
    };
  }

  if (stateKey === 'done' || (!stateKey && (key.includes('resolv') || key.includes('complete')))) {
    return {
      key: key || 'resolved',
      label,
      tone: 'success',
      variant: 'resolved',
      description: 'Resolution has been provided for this ticket.',
      isTerminal: true,
    };
  }

  if (stateKey === 'waiting' || (!stateKey && /wait|hold|pend|pause/.test(key))) {
    return {
      key: key || 'waiting',
      label,
      tone: 'reserved',
      variant: 'waiting',
      description: 'Awaiting a response or external action.',
      isTerminal: false,
    };
  }

  if (stateKey === 'active' || (!stateKey && /progress|investig|triage|active/.test(key))) {
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
    case 'bug':
      return { key: 'bug', label: rawLabel || 'Bug', shortLabel: 'Bug', tone: 'danger' };
    case 'service_request':
      return { key: 'service_request', label: rawLabel || 'Service Request', shortLabel: 'Request', tone: 'info' };
    case 'feature_request':
      return { key: 'feature_request', label: rawLabel || 'Feature Request', shortLabel: 'Feature', tone: 'info' };
    case 'feedback':
      return { key: 'feedback', label: rawLabel || 'Feedback', shortLabel: 'Feedback', tone: 'reserved' };
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
  if (rec.state === 'none') {
    return { state: 'none', label: 'No SLA', tone: 'neutral' };
  }
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

export function getWorkflowAction(transition: AvailableTicketTransitionRead, currentState?: string) {
  const name = transition.status.name;
  const key = normalizeStatusKey(name);
  if (transition.is_reopen) return key === 'open' ? 'Reopen ticket' : `Reopen to ${name}`;

  switch (key) {
    case 'in_progress':
      return currentState === 'waiting' ? 'Resume work' : 'Start work';
    case 'waiting_for_customer':
      return 'Wait for customer';
    case 'resolved':
      return 'Resolve ticket';
    case 'closed':
      return 'Close ticket';
    default:
      return `Move to ${name}`;
  }
}

/**
 * Formats structured activity event payload into clear human-readable detail lines.
 */
export function formatTicketActivityLines(
  activity: {
    event_type?: { value?: string; label?: string } | null;
    payload?: unknown;
  },
  resolveUserName?: (raw: string) => string,
): string[] {
  if (!activity.payload || typeof activity.payload !== 'object') return [];
  const payload = activity.payload as Record<string, unknown>;
  const lines: string[] = [];
  const formatName = (name: string) => (resolveUserName ? resolveUserName(name) : name);

  if (typeof payload.duration === 'string') {
    lines.push(`Time spent: ${payload.duration}`);
    if (typeof payload.description === 'string' && payload.description) {
      lines.push(payload.description);
    }
  }

  if (typeof payload.score === 'number' && Number.isFinite(payload.score)) {
    lines.push(`Satisfaction rating: ${payload.score} / 5`);
    if (typeof payload.comment === 'string' && payload.comment.trim()) {
      lines.push(`Comment: ${payload.comment.trim()}`);
    }
  }

  if (typeof payload.page_path === 'string' && payload.page_path.trim()) {
    lines.push(`Submitted from: ${payload.page_path.trim()}`);
  }

  if (typeof payload.from_status === 'string' && typeof payload.to_status === 'string') {
    lines.push(`${payload.from_status} → ${payload.to_status}`);
  }
  if (typeof payload.resolution_code === 'string' && payload.resolution_code) {
    lines.push(`Outcome: ${getResolutionLabel(payload.resolution_code)}`);
  }
  if (typeof payload.resolution_summary === 'string' && payload.resolution_summary.trim()) {
    lines.push(`Resolution: ${payload.resolution_summary.trim()}`);
  }
  if (typeof payload.reason === 'string' && payload.reason.trim()) {
    lines.push(`Reason: ${payload.reason.trim()}`);
  }
  if (typeof payload.assignee === 'string' && payload.assignee) {
    lines.push(`Assignee: ${formatName(payload.assignee)}`);
  }
  if (typeof payload.user_name === 'string' && payload.user_name) {
    lines.push(`Watcher: ${formatName(payload.user_name)}`);
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

export function formatWorkDuration(minutes: number) {
  if (minutes < 60) return `${minutes.toLocaleString()}m`;
  const hours = Math.floor(minutes / 60).toLocaleString();
  const remainder = minutes % 60;
  return remainder ? `${hours}h ${remainder}m` : `${hours}h`;
}
