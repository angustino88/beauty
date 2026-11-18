import { baseApi } from '@/shared/lib/api';
import type {
  LabsLicenseChecksCreateApiResponse,
  LabsLicenseChecksPartialUpdateByCheckIdApiResponse,
  LabsLicenseChecksPresetsRetrieveApiResponse,
  LabsLicenseChecksRetrieveApiResponse,
  LabsLicenseChecksRunsRetrieveByCheckIdApiResponse,
  LabsLicenseObservationsRetrieveApiArg,
  LabsLicenseObservationsRetrieveApiResponse,
  LicenseCheckWrite,
} from '@/shared/api/generated/api';

/**
 * License-check endpoints. Handwritten over the generated types so checks, runs and found
 * licenses share the `LicenseCheck` tag; changing a check also refreshes the license list.
 */
export const licenseChecksApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getLicenseChecks: build.query<LabsLicenseChecksRetrieveApiResponse, { q?: string; page?: number }>({
      query: ({ q, page }) => ({ url: '/api/labs/license-checks', params: { q: q || undefined, page: page ?? 1, page_size: 50 } }),
      providesTags: ['LicenseCheck'],
    }),
    getLicenseCheckPresets: build.query<LabsLicenseChecksPresetsRetrieveApiResponse['data']['items'], void>({
      query: () => ({ url: '/api/labs/license-checks/presets' }),
      transformResponse: (response: LabsLicenseChecksPresetsRetrieveApiResponse) => response.data.items,
    }),
    getLicenseCheckRuns: build.query<LabsLicenseChecksRunsRetrieveByCheckIdApiResponse['data']['items'], number>({
      query: (checkId) => ({ url: `/api/labs/license-checks/${checkId}/runs` }),
      transformResponse: (response: LabsLicenseChecksRunsRetrieveByCheckIdApiResponse) => response.data.items,
      providesTags: ['LicenseCheck'],
    }),
    createLicenseCheck: build.mutation<LabsLicenseChecksCreateApiResponse['data'], LicenseCheckWrite>({
      query: (body) => ({ url: '/api/labs/license-checks', method: 'POST', body }),
      transformResponse: (response: LabsLicenseChecksCreateApiResponse) => response.data,
      invalidatesTags: ['LicenseCheck'],
    }),
    updateLicenseCheck: build.mutation<
      LabsLicenseChecksPartialUpdateByCheckIdApiResponse['data'],
      { checkId: number; changes: LicenseCheckWrite }
    >({
      query: ({ checkId, changes }) => ({ url: `/api/labs/license-checks/${checkId}`, method: 'PATCH', body: changes }),
      transformResponse: (response: LabsLicenseChecksPartialUpdateByCheckIdApiResponse) => response.data,
      invalidatesTags: ['LicenseCheck'],
    }),
    deleteLicenseCheck: build.mutation<void, number>({
      query: (checkId) => ({ url: `/api/labs/license-checks/${checkId}`, method: 'DELETE' }),
      invalidatesTags: ['LicenseCheck'],
    }),
    getLicenseObservations: build.query<LabsLicenseObservationsRetrieveApiResponse, LabsLicenseObservationsRetrieveApiArg>({
      query: ({ status, checkId, licenseId, computingId, isAttentionRequired, includeRemoved, q, page, pageSize }) => ({
        url: '/api/labs/license-observations',
        params: {
          status,
          check_id: checkId,
          license_id: licenseId,
          computing_id: computingId,
          is_attention_required: isAttentionRequired ?? undefined,
          include_removed: includeRemoved || undefined,
          q: q || undefined,
          page: page ?? 1,
          page_size: pageSize ?? 20,
        },
      }),
      providesTags: ['LicenseCheck', 'License'],
    }),
  }),
});

export const {
  useGetLicenseChecksQuery,
  useGetLicenseCheckPresetsQuery,
  useGetLicenseCheckRunsQuery,
  useCreateLicenseCheckMutation,
  useUpdateLicenseCheckMutation,
  useDeleteLicenseCheckMutation,
  useGetLicenseObservationsQuery,
} = licenseChecksApi;
