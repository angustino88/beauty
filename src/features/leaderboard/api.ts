import { baseApi } from '@/shared/lib/api';
import { store } from '@/app/store';
import type {
  LeaderboardFilter,
  PersonaItem,
  LabItem,
  UserProfile,
  LabProfile,
  LeaderboardAssessment,
  WeeklyUsageItem,
} from './types';
import {
  mapAssessmentResponse,
  mapLabProfileResponse,
  mapLabResponse,
  mapLabWeeklyUsageResponse,
  mapPersonaResponse,
  mapUserProfileResponse,
  mapUserWeeklyUsageResponse,
} from './mapper';
import type {
  LabsLeaderboardLabRetrieveApiResponse,
  LabsLeaderboardPersonaRetrieveApiResponse,
  LabsBenchesProfileRetrieveByIdApiResponse,
  LabsLeaderboardUsersProfileRetrieveByIdApiResponse,
  LabsLeaderboardUsersWeeklyUsageRetrieveByIdApiResponse,
  LabsBenchesWeeklyUsageRetrieveByIdApiResponse,
} from '@/shared/api/generated/api';

export type LeaderboardExportType = 'persona' | 'lab';

export interface DetailQueryArg {
  id: number;
  filter: LeaderboardFilter;
}

export const leaderboardApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getPersona: build.query<PersonaItem[], LeaderboardFilter>({
      query: (params) => ({ url: '/api/labs/leaderboard/persona', params }),
      transformResponse: (res: LabsLeaderboardPersonaRetrieveApiResponse) => mapPersonaResponse(res),
      providesTags: ['Leaderboard'],
    }),

    getLab: build.query<LabItem[], LeaderboardFilter>({
      query: (params) => ({ url: '/api/labs/leaderboard/lab', params }),
      transformResponse: (res: LabsLeaderboardLabRetrieveApiResponse) => mapLabResponse(res),
      providesTags: ['Leaderboard'],
    }),

    getUserProfile: build.query<UserProfile, DetailQueryArg>({
      query: ({ id, filter }) => ({ url: `/api/labs/leaderboard/users/${id}/profile`, params: filter }),
      transformResponse: (res: LabsLeaderboardUsersProfileRetrieveByIdApiResponse) => mapUserProfileResponse(res),
    }),

    getUserWeeklyUsage: build.query<WeeklyUsageItem[], DetailQueryArg>({
      query: ({ id, filter }) => ({ url: `/api/labs/leaderboard/users/${id}/weekly-usage`, params: filter }),
      transformResponse: (res: LabsLeaderboardUsersWeeklyUsageRetrieveByIdApiResponse) => mapUserWeeklyUsageResponse(res),
    }),

    getLabProfile: build.query<LabProfile, DetailQueryArg>({
      query: ({ id, filter }) => ({ url: `/api/labs/benches/${id}/profile`, params: filter }),
      transformResponse: (res: LabsBenchesProfileRetrieveByIdApiResponse) => mapLabProfileResponse(res),
    }),

    getLabWeeklyUsage: build.query<WeeklyUsageItem[], DetailQueryArg>({
      query: ({ id, filter }) => ({ url: `/api/labs/benches/${id}/weekly-usage`, params: filter }),
      transformResponse: (res: LabsBenchesWeeklyUsageRetrieveByIdApiResponse) => mapLabWeeklyUsageResponse(res),
    }),

    /** KPI assessments: lab coordinators and admins only (the API answers 403 to everyone else). */
    getUserAssessment: build.query<LeaderboardAssessment, DetailQueryArg>({
      query: ({ id, filter }) => ({ url: `/api/labs/leaderboard/users/${id}/assessment`, params: filter }),
      transformResponse: mapAssessmentResponse,
    }),

    getBenchAssessment: build.query<LeaderboardAssessment, DetailQueryArg>({
      query: ({ id, filter }) => ({ url: `/api/labs/benches/${id}/assessment`, params: filter }),
      transformResponse: mapAssessmentResponse,
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetPersonaQuery,
  useGetLabQuery,
  useLazyGetUserProfileQuery,
  useLazyGetUserWeeklyUsageQuery,
  useLazyGetLabProfileQuery,
  useLazyGetLabWeeklyUsageQuery,
  useGetUserAssessmentQuery,
  useGetBenchAssessmentQuery,
} = leaderboardApi;

const leaderboardExportApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    // The export endpoint returns the ranking rows as JSON; the workbook is built on the client.
    downloadLeaderboard: build.query<Array<Record<string, unknown>>, LeaderboardFilter & { type: LeaderboardExportType }>({
      query: ({ type, start_date, end_date }) => ({
        url: '/api/labs/leaderboard/export',
        params: { type, start_date, end_date },
      }),
      transformResponse: (res: { data?: Array<Record<string, unknown>> }) => res?.data ?? [],
      keepUnusedDataFor: 0,
    }),
  }),
});

/** Fetch the export through the shared authenticated base query, including 401 retry. */
export async function exportLeaderboard(
  filter: LeaderboardFilter,
  type: LeaderboardExportType,
): Promise<Array<Record<string, unknown>>> {
  const request = store.dispatch(leaderboardExportApi.endpoints.downloadLeaderboard.initiate(
    { ...filter, type },
    { subscribe: false, forceRefetch: true },
  ));
  try {
    return await request.unwrap();
  } finally {
    request.unsubscribe();
  }
}
