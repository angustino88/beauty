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
  type TicketAttachmentRead,
  type UsersRetrieveApiResponse,
} from '@/shared/api/generated/api';
import { normalizeAvatarUrl } from '@/shared/utils/avatar';
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

export interface SupportAttachmentUpload {
  key: string;
  file: File;
  /** Attach to a reply rather than the ticket itself. */
  commentId?: number;
  /** Staff only: hide the file from the requester. */
  isRestricted?: boolean;
}

/**
 * Upload and download need a multipart body and a binary response, which the generated JSON
 * endpoints cannot send or read; deletion uses the generated hook.
 */
const supportAttachmentApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    uploadSupportAttachment: build.mutation<TicketAttachmentRead, SupportAttachmentUpload>({
      query: ({ key, file, commentId, isRestricted }) => {
        const body = new FormData();
        body.append('file', file, file.name);
        if (commentId !== undefined) body.append('comment_id', String(commentId));
        if (isRestricted) body.append('is_restricted', 'true');
        return { url: `/api/support/tickets/${encodeURIComponent(key)}/attachments`, method: 'POST', body };
      },
      transformResponse: (response: { data: TicketAttachmentRead }) => response.data,
    }),
    downloadSupportAttachment: build.mutation<null, { attachmentId: number; filename: string }>({
      query: ({ attachmentId, filename }) => ({
        url: `/api/support/attachments/${attachmentId}/download`,
        method: 'GET',
        responseHandler: async (response: Response) => {
          if (!response.ok) return response.json().catch(() => null);
          saveBlob(await response.blob(), filename);
          return null;
        },
      }),
    }),
    removeSupportWatcher: build.mutation<unknown, { key: string; userId?: number }>({
      query: ({ key, userId }) => ({
        url: `/api/support/tickets/${encodeURIComponent(key)}/watchers`,
        method: 'DELETE',
        params: userId !== undefined ? { user_id: userId } : undefined,
      }),
    }),
    getSupportUserAvatar: build.query<string | null, string>({
      query: (username) => ({ url: '/api/users', params: { username } }),
      transformResponse: (response: UsersRetrieveApiResponse, _meta, username) => {
        const list = Array.isArray(response?.data) ? response.data : [];
        const user = list.find((item) => item?.username === username);
        return normalizeAvatarUrl(user?.avatar_url ?? null);
      },
      keepUnusedDataFor: 300,
    }),
  }),
});

export const {
  useUploadSupportAttachmentMutation,
  useDownloadSupportAttachmentMutation,
  useRemoveSupportWatcherMutation,
  useGetSupportUserAvatarQuery,
} = supportAttachmentApi;

function saveBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  setTimeout(() => {
    link.remove();
    URL.revokeObjectURL(url);
  }, 100);
}

export const supportTicketApi = baseApi;

function toGeneratedTicketQuery(params: SupportTicketQueryParams): SupportTicketsRetrieveApiArg {
  return {
    q: params.search || params.q,
    page: params.page,
    pageSize: params.page_size,
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
