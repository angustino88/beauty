import { baseApi } from '@/shared/lib/api';
import { store } from '@/app/store';
import { generatedApi } from '@/shared/api/generated/api';
import {
  useSupportCategoriesOptionsRetrieveQuery,
  useSupportPrioritiesOptionsRetrieveQuery,
  useSupportTicketsCreateMutation,
  useSupportTicketsRetrieveQuery,
  type SupportTicketsCreateApiArg,
  type SupportTicketsCreateApiResponse,
  type SupportTicketsRetrieveApiArg,
} from '@/shared/api/generated/api';
import type {
  SupportTicketListResponse,
  SupportTicketQueryParams,
} from './types';
import { mapSupportTicket, mapSupportTicketsResponse } from './mapper';

export function useGetSupportTicketsQuery(params: SupportTicketQueryParams) {
  const { data, ...queryState } = useSupportTicketsRetrieveQuery({
    ...toGeneratedTicketQuery(params),
  });
  return {
    ...queryState,
    data: data ? mapSupportTicketsResponse(data) : undefined,
  };
}

export const useGetJiraIssuesQuery = useGetSupportTicketsQuery;

export function useCreateSupportTicketMutation() {
  const [createTicket, mutationState] = useSupportTicketsCreateMutation();
  return [
    (body: SupportTicketsCreateApiArg['ticketCreateRequest']) => ({
      unwrap: async () => {
        const response: SupportTicketsCreateApiResponse = await createTicket({ ticketCreateRequest: body }).unwrap();
        return mapSupportTicket(response.data);
      },
    }),
    mutationState,
  ] as const;
}

export const useGetSupportCategoriesQuery = useSupportCategoriesOptionsRetrieveQuery;
export const useGetSupportPrioritiesQuery = useSupportPrioritiesOptionsRetrieveQuery;

export const supportTicketApi = baseApi;
export const labSupportApi = supportTicketApi;

function toGeneratedTicketQuery(params: SupportTicketQueryParams): SupportTicketsRetrieveApiArg {
  return {
    q: params.search || params.q,
    page: params.page ?? (typeof params.startAt === 'number' && params.maxResults
      ? Math.floor(params.startAt / params.maxResults) + 1
      : undefined),
    pageSize: params.page_size ?? params.maxResults,
    assigneeId: params.assignee_id,
    categoryId: params.category_id,
    createdAfter: params.created_after,
    createdBefore: params.created_before,
    externalReference: params.external_reference,
    impact: params.impact,
    key: params.key,
    label: params.label,
    noTeam: params.no_team,
    ordering: params.ordering,
    parentKey: params.parent_key,
    priorityId: params.priority_id,
    requesterId: params.requester_id,
    resolutionCode: params.resolution_code,
    resolutionDueAfter: params.resolution_due_after,
    resolutionDueBefore: params.resolution_due_before,
    resourceId: params.resource_id,
    resourceType: params.resource_type,
    source: params.source,
    status: params.status,
    statusId: params.status_id,
    systemState: params.system_state,
    teamId: params.team_id,
    ticketType: params.ticket_type,
    unassigned: params.unassigned,
    updatedAfter: params.updated_after,
    updatedBefore: params.updated_before,
    urgency: params.urgency,
    watcherId: params.watcher_id,
  };
}

export async function fetchSupportTicketsForExport(
  params: SupportTicketQueryParams,
): Promise<SupportTicketListResponse> {
  const request = store.dispatch(generatedApi.endpoints.supportTicketsRetrieve.initiate(
    toGeneratedTicketQuery(params),
    { subscribe: false },
  ));
  try {
    return mapSupportTicketsResponse(await request.unwrap());
  } finally {
    request.unsubscribe();
  }
}

export const fetchJiraIssuesForExport = fetchSupportTicketsForExport;
