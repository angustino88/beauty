import { baseApi } from '@/shared/lib/api';
import { store } from '@/app/store';
import type {
  LeaderboardFilter,
  PersonaItem,
  LabItem,
  UserProfile,
  LabProfile,
  WeeklyUsageItem,
} from './types';
import {
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
} = leaderboardApi;

const leaderboardExportApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    downloadLeaderboard: build.query<Blob, LeaderboardFilter>({
      query: (filter) => ({
        url: '/api/labs/leaderboard/export',
        params: { start_date: filter.start_date, end_date: filter.end_date },
        responseHandler: (response) => response.blob(),
      }),
      keepUnusedDataFor: 0,
    }),
  }),
});

/** Fetch the export through the shared authenticated base query, including 401 retry. */
export async function exportLeaderboard(filter: LeaderboardFilter): Promise<Blob> {
  const request = store.dispatch(leaderboardExportApi.endpoints.downloadLeaderboard.initiate(
    filter,
    { subscribe: false, forceRefetch: true },
  ));
  try {
    return await request.unwrap();
  } finally {
    request.unsubscribe();
  }
}
