import { baseApi } from '@/shared/lib/api';
import { getApiErrorMessage } from '@/shared/notifications';
import type {
  AgentDetailResponseRead,
  AgentListResponseRead,
  EnrollmentGrantIssuedResponse,
  EnrollmentGrantListResponseRead,
  EnrollmentGrantResponseRead,
} from '@/shared/api/generated/api';

/**
 * Operator endpoints for computing agents (`/api/agents`). Handwritten over the generated types so
 * every write refreshes the agent column, the drawer and the grant history together.
 */
export const agentApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getComputingAgents: build.query<AgentListResponseRead, { equipmentIds: number[]; liveOnly?: boolean }>({
      query: ({ equipmentIds, liveOnly }) => ({
        url: '/api/agents',
        params: {
          equipment: equipmentIds.join(','),
          state: liveOnly ? 'pending,active' : undefined,
          page_size: 100,
        },
      }),
      providesTags: (result) => [
        { type: 'Agent' as const, id: 'LIST' },
        ...(result?.data ?? []).map((agent) => ({ type: 'Agent' as const, id: agent.id })),
      ],
    }),
    getAgentGrants: build.query<EnrollmentGrantListResponseRead, { agentId: number }>({
      query: ({ agentId }) => ({ url: `/api/agents/${agentId}/enrollment-grants`, params: { page_size: 20 } }),
      providesTags: (_result, _error, { agentId }) => [{ type: 'AgentGrant' as const, id: agentId }],
    }),
    /** First enrollment of a computer: creates a pending agent and returns the grant once. */
    issueAgentGrant: build.mutation<EnrollmentGrantIssuedResponse, { equipmentUid: string; ttlMinutes: number }>({
      query: ({ equipmentUid, ttlMinutes }) => ({
        url: '/api/agents',
        method: 'POST',
        body: { equipment_uid: equipmentUid, ttl_minutes: ttlMinutes },
      }),
      invalidatesTags: [{ type: 'Agent', id: 'LIST' }, 'AgentGrant'],
    }),
    /** New grant for a pending agent, or recovery of an active one (it stops working until re-enrolled). */
    reissueAgentGrant: build.mutation<EnrollmentGrantIssuedResponse, { agentId: number; ttlMinutes: number }>({
      query: ({ agentId, ttlMinutes }) => ({
        url: `/api/agents/${agentId}/enrollment-grants`,
        method: 'POST',
        body: { ttl_minutes: ttlMinutes },
      }),
      invalidatesTags: (_result, _error, { agentId }) => [
        { type: 'Agent', id: 'LIST' },
        { type: 'Agent', id: agentId },
        { type: 'AgentGrant', id: agentId },
        // Recovery and retirement make the computer's device observations unconfirmed on the server.
        'Monitoring',
      ],
    }),
    revokeAgentGrant: build.mutation<EnrollmentGrantResponseRead, { agentId: number; grantId: number }>({
      query: ({ agentId, grantId }) => ({
        url: `/api/agents/${agentId}/enrollment-grants/${grantId}/actions/revoke`,
        method: 'POST',
      }),
      invalidatesTags: (_result, _error, { agentId }) => [
        { type: 'Agent', id: 'LIST' },
        { type: 'Agent', id: agentId },
        { type: 'AgentGrant', id: agentId },
      ],
    }),
    retireAgent: build.mutation<AgentDetailResponseRead, { agentId: number; action: 'revoke' | 'decommission' }>({
      query: ({ agentId, action }) => ({ url: `/api/agents/${agentId}/actions/${action}`, method: 'POST' }),
      invalidatesTags: (_result, _error, { agentId }) => [
        { type: 'Agent', id: 'LIST' },
        { type: 'Agent', id: agentId },
        { type: 'AgentGrant', id: agentId },
        // Recovery and retirement make the computer's device observations unconfirmed on the server.
        'Monitoring',
      ],
    }),
  }),
});

export const {
  useGetComputingAgentsQuery,
  useGetAgentGrantsQuery,
  useIssueAgentGrantMutation,
  useReissueAgentGrantMutation,
  useRevokeAgentGrantMutation,
  useRetireAgentMutation,
} = agentApi;

/** The backend's `{error: {message}}` envelope, or a sanitized fallback. */
export function agentErrorMessage(error: unknown, fallback: string): string {
  return getApiErrorMessage(error, fallback);
}
