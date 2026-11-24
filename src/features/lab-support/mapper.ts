import type {
  SupportTicket,
  SupportTicketListResponse,
  SupportUserRef,
} from './types';

type RecordValue = Record<string, unknown>;

const asRecord = (value: unknown): RecordValue =>
  typeof value === 'object' && value !== null && !Array.isArray(value)
    ? (value as RecordValue)
    : {};

const asString = (value: unknown, fallback = ''): string =>
  typeof value === 'string' ? value : fallback;

const asNumber = (value: unknown, fallback = 0): number =>
  typeof value === 'number' && Number.isFinite(value) ? value : fallback;

export function mapSupportTicket(rawItem: unknown): SupportTicket {
  const item = asRecord(rawItem);

  const categoryRec = asRecord(item.category);
  const category = categoryRec.id != null ? { id: asNumber(categoryRec.id), name: asString(categoryRec.name) } : null;

  const priorityRec = asRecord(item.priority);
  const priorityName = asString(priorityRec.name || item.priority);
  const priority = priorityRec.id != null ? { id: asNumber(priorityRec.id), name: priorityName, level: asNumber(priorityRec.level) } : priorityName;

  const statusRec = asRecord(item.status);
  const statusName = asString(statusRec.name || item.status);
  const status = statusRec.id != null ? { id: asNumber(statusRec.id), name: statusName, system_state: asString(statusRec.system_state) } : statusName;

  const reqRec = asRecord(item.requester);
  const requester: SupportUserRef | null = reqRec.id != null || reqRec.username != null
    ? {
        id: reqRec.id != null ? asNumber(reqRec.id) : undefined,
        username: asString(reqRec.username),
        displayName: asString(reqRec.display_name || reqRec.displayName || reqRec.username),
        email: asString(reqRec.email),
      }
    : null;

  const assRec = asRecord(item.assignee);
  const assignee: SupportUserRef | null = assRec.id != null || assRec.username != null
    ? {
        id: assRec.id != null ? asNumber(assRec.id) : undefined,
        username: asString(assRec.username),
        displayName: asString(assRec.display_name || assRec.displayName || assRec.username),
        email: asString(assRec.email),
      }
    : null;

  const teamRec = asRecord(item.team);
  const team = teamRec.id != null ? { id: asNumber(teamRec.id), name: asString(teamRec.name) } : null;

  const typeRec = asRecord(item.ticket_type);
  const ticketType =
    typeRec.value != null
      ? { value: asString(typeRec.value), label: asString(typeRec.label || typeRec.value) }
      : typeof item.ticket_type === 'string'
        ? item.ticket_type
        : null;

  const sourceRec = asRecord(item.source);
  const source =
    sourceRec.value != null
      ? { value: asString(sourceRec.value), label: asString(sourceRec.label || sourceRec.value) }
      : typeof item.source === 'string'
        ? item.source
        : null;

  const key = asString(item.key || item.id);
  const subject = asString(item.subject);
  const createdAt = asString(item.created_at);
  const updatedAt = asString(item.updated_at);

  return {
    id: item.id != null ? (typeof item.id === 'number' ? item.id : asString(item.id)) : key,
    key,
    number: item.number != null ? asNumber(item.number) : undefined,
    subject,
    ticket_type: ticketType,
    source,
    impact: asString(item.impact) || null,
    urgency: asString(item.urgency) || null,
    category,
    priority,
    status,
    requester,
    assignee,
    team,
    created_at: createdAt,
    updated_at: updatedAt,
    resolved_at: asString(item.resolved_at) || null,
    closed_at: asString(item.closed_at) || null,
    last_activity_at: asString(item.last_activity_at) || null,
    due_date: asString(item.due_date) || null,
    description: asString(item.description),
    labels: Array.isArray(item.labels) ? item.labels.filter((label): label is string => typeof label === 'string') : [],
    sla: Object.keys(asRecord(item.sla)).length > 0 ? asRecord(item.sla) : undefined,
    version: item.version != null ? asNumber(item.version, 1) : undefined,
  };
}

export function mapSupportTicketsResponse(rawResponse: unknown): SupportTicketListResponse {
  const envelope = asRecord(rawResponse);
  const meta = asRecord(envelope.meta);
  const pagination = asRecord(meta.pagination);

  const rawList = Array.isArray(envelope.data) ? envelope.data : [];
  const tickets = rawList.map(mapSupportTicket);
  const total = asNumber(pagination.count ?? envelope.total, tickets.length);
  const page = asNumber(pagination.page ?? 1);
  const pageSize = asNumber(pagination.page_size ?? 10);

  return {
    total,
    count: total,
    page,
    page_size: pageSize,
    tickets,
  };
}
