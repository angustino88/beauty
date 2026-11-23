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
  const fields = asRecord(item.fields);

  // Normalize category
  const categoryRec = asRecord(item.category);
  const category = categoryRec.id != null ? { id: asNumber(categoryRec.id), name: asString(categoryRec.name) } : null;

  // Normalize priority
  const priorityRec = asRecord(item.priority || fields.priority);
  const priorityName = asString(priorityRec.name || item.priority || fields.priority);
  const priority = priorityRec.id != null ? { id: asNumber(priorityRec.id), name: priorityName, level: asNumber(priorityRec.level) } : priorityName;

  // Normalize status
  const statusRec = asRecord(item.status || fields.status);
  const statusName = asString(statusRec.name || item.status || fields.status);
  const status = statusRec.id != null ? { id: asNumber(statusRec.id), name: statusName, system_state: asString(statusRec.system_state) } : statusName;

  // Normalize requester / reporter
  const reqRec = asRecord(item.requester || item.reporter || fields.reporter);
  const requester: SupportUserRef | null = reqRec.id != null || reqRec.username != null
    ? {
        id: reqRec.id != null ? asNumber(reqRec.id) : undefined,
        username: asString(reqRec.username),
        displayName: asString(reqRec.display_name || reqRec.displayName || reqRec.displayname || reqRec.username),
        email: asString(reqRec.email || reqRec.emailAddress),
      }
    : null;

  // Normalize assignee
  const assRec = asRecord(item.assignee || fields.assignee);
  const assignee: SupportUserRef | null = assRec.id != null || assRec.username != null
    ? {
        id: assRec.id != null ? asNumber(assRec.id) : undefined,
        username: asString(assRec.username),
        displayName: asString(assRec.display_name || assRec.displayName || assRec.displayname || assRec.username),
        email: asString(assRec.email || assRec.emailAddress),
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
  const subject = asString(item.subject || item.summary || fields.summary);
  const createdAt = asString(item.created_at || item.created || fields.created);
  const updatedAt = asString(item.updated_at);
  const duedate = asString(item.duedate || fields.duedate);
  const resolutiondate = asString(item.resolutiondate || item.resolved_at || fields.resolutiondate);

  return {
    id: item.id != null ? (typeof item.id === 'number' ? item.id : asString(item.id)) : key,
    key,
    number: item.number != null ? asNumber(item.number) : undefined,
    subject,
    summary: subject,
    ticket_type: ticketType,
    source,
    impact: asString(item.impact) || null,
    urgency: asString(item.urgency) || null,
    category,
    priority,
    status,
    requester,
    reporter: requester,
    assignee,
    team,
    created_at: createdAt,
    created: createdAt,
    updated_at: updatedAt,
    resolved_at: asString(item.resolved_at) || null,
    closed_at: asString(item.closed_at) || null,
    last_activity_at: asString(item.last_activity_at) || null,
    due_date: asString(item.due_date) || null,
    description: asString(item.description),
    labels: Array.isArray(item.labels) ? item.labels.filter((label): label is string => typeof label === 'string') : [],
    sla: Object.keys(asRecord(item.sla)).length > 0 ? asRecord(item.sla) : undefined,
    version: item.version != null ? asNumber(item.version, 1) : undefined,
    duedate: duedate || null,
    resolutiondate: resolutiondate || null,
    fields: {
      summary: subject,
      priority: typeof priority === 'object' && priority !== null ? { name: priority.name } : { name: priorityName },
      status: typeof status === 'object' && status !== null ? { name: status.name } : { name: statusName },
      reporter: requester,
      assignee,
      created: createdAt,
      duedate: duedate || null,
      resolutiondate: resolutiondate || null,
    },
  };
}

export function mapSupportTicketsResponse(rawResponse: unknown): SupportTicketListResponse {
  const envelope = asRecord(rawResponse);
  const meta = asRecord(envelope.meta);
  const pagination = asRecord(meta.pagination);

  let rawList: unknown[] = [];
  if (Array.isArray(envelope.data)) {
    rawList = envelope.data;
  } else if (Array.isArray(envelope.issues)) {
    rawList = envelope.issues;
  } else if (Array.isArray(envelope.tickets)) {
    rawList = envelope.tickets;
  } else if (Array.isArray(envelope.results)) {
    rawList = envelope.results;
  }

  const tickets = rawList.map(mapSupportTicket);
  const total = asNumber(
    pagination.count ?? envelope.total ?? envelope.total_count ?? envelope.count,
    tickets.length,
  );
  const page = asNumber(pagination.page ?? 1);
  const pageSize = asNumber(pagination.page_size ?? envelope.maxResults ?? 10);
  const startAt = asNumber(envelope.startAt ?? (page - 1) * pageSize);

  return {
    total,
    count: total,
    startAt,
    maxResults: pageSize,
    page,
    page_size: pageSize,
    isLast: Boolean(envelope.isLast ?? (startAt + tickets.length >= total)),
    tickets,
    issues: tickets,
    create_url: asString(envelope.create_url),
    base_url: asString(envelope.base_url),
  };
}

/** Legacy alias */
export const mapJiraIssuesResponse = mapSupportTicketsResponse;
