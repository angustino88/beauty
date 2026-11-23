export interface SupportUserRef {
  id?: number;
  username?: string;
  name?: string;
  displayName?: string;
  display_name?: string;
  email?: string;
  emailAddress?: string;
}

export type JiraUserRef = SupportUserRef;

export interface SupportChoiceRef {
  value: string;
  label: string;
}

export interface SupportTicket {
  id: number | string;
  key: string;
  number?: number;
  subject: string;
  summary: string;
  ticket_type?: SupportChoiceRef | string | null;
  source?: SupportChoiceRef | string | null;
  impact?: string | null;
  urgency?: string | null;
  category?: { id: number; name: string } | null;
  priority?: { id: number; name: string; level?: number; rank?: number } | string | null;
  status?: { id: number; name: string; system_state?: string } | string | null;
  requester?: SupportUserRef | string | null;
  reporter?: SupportUserRef | string | null;
  assignee?: SupportUserRef | string | null;
  team?: { id: number; name: string } | null;
  created_at?: string | null;
  created?: string | null;
  updated_at?: string | null;
  resolved_at?: string | null;
  closed_at?: string | null;
  last_activity_at?: string | null;
  due_date?: string | null;
  description?: string;
  labels?: string[];
  sla?: Record<string, unknown>;
  version?: number;
  duedate?: string | null;
  resolutiondate?: string | null;
  fields?: {
    summary?: string;
    priority?: { name?: string } | string | null;
    status?: { name?: string } | string | null;
    reporter?: SupportUserRef | string | null;
    assignee?: SupportUserRef | string | null;
    created?: string | null;
    duedate?: string | null;
    resolutiondate?: string | null;
  };
}

export type JiraIssue = SupportTicket;

export interface SupportTicketListResponse {
  total: number;
  count?: number;
  startAt?: number;
  maxResults?: number;
  page?: number;
  page_size?: number;
  isLast?: boolean;
  tickets: SupportTicket[];
  issues: SupportTicket[];
  create_url: string;
  base_url: string;
}

export type JiraIssueListResponse = SupportTicketListResponse;

export type TicketCreatePayload = import('@/shared/api/generated/api').SupportTicketsCreateApiArg['ticketCreateRequest'];

export interface SupportTicketQueryParams {
  search?: string;
  q?: string;
  page?: number;
  page_size?: number;
  startAt?: number;
  maxResults?: number;
  status?: string;
  category_id?: number;
  priority_id?: number;
  assignee_id?: number;
  requester_id?: number;
  status_id?: number;
  system_state?: string;
  ticket_type?: string;
  team_id?: number;
  impact?: string;
  urgency?: string;
  source?: string;
  created_after?: string;
  created_before?: string;
  updated_after?: string;
  updated_before?: string;
  resolution_due_after?: string;
  resolution_due_before?: string;
  key?: string;
  label?: string;
  resource_type?: string;
  resource_id?: string;
  parent_key?: string;
  external_reference?: string;
  resolution_code?: string;
  unassigned?: boolean;
  no_team?: boolean;
  watcher_id?: number;
  ordering?: string;
}

export type JiraIssueQueryParams = SupportTicketQueryParams;
