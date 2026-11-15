import { baseApi } from '@/shared/lib/api';
import type {
  DashboardPageParams,
  DashboardPageResponse,
  DashboardSummaryResponse,
  DashboardBenchDetail,
  BenchFilterOptions,
} from './types';
import {
  mapDashboardListResponse,
  mapDashboardSummaryResponse,
  mapBenchGroupsResponse,
  mapBenchDetailResponse,
  mapFavoriteResponse,
} from './mapper';
import type {
  LabsDashboardRetrieveApiResponse,
  LabsDashboardSummaryRetrieveApiResponse,
  LabsDashboardBenchesRetrieveByBenchIdApiResponse,
  LabsBenchGroupsRetrieveApiResponse,
  LabsBenchesActionsFavoriteCreateByBenchIdApiResponse,
} from '@/shared/api/generated/api';

const patchDashboardPageCaches = (
  dispatch: (action: unknown) => unknown,
  getState: () => unknown,
  updater: (draft: DashboardPageResponse, args: DashboardPageParams) => void,
): Array<{ undo: () => void }> => {
  const state = getState();
  const cachedArgs = dashboardApi.util.selectCachedArgsForQuery(
    state as Parameters<typeof dashboardApi.util.selectCachedArgsForQuery>[0],
    'getDashboardPage',
  );

  return cachedArgs.map(
    (args) =>
      dispatch(
        dashboardApi.util.updateQueryData('getDashboardPage', args, (draft) => {
          updater(draft, args);
        }),
      ) as { undo: () => void },
  );
};

export const dashboardApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    /**
     * GET /api/labs/dashboard/?page=N&page_size=M&q=...&status=...&bench_group=...
     * Operational dashboard bench listing with real-time telemetry and schedule data.
     */
    getDashboardPage: build.query<DashboardPageResponse, DashboardPageParams>({
      query: (params) => {
        const searchParams = new URLSearchParams();
        searchParams.set('page', String(params.page));
        searchParams.set('page_size', String(params.page_size));
        if (params.search) searchParams.set('q', params.search);
        // The list takes one value per filter and rejects repeated or unknown params, so a
        // multi-select sends its first value; sample and license filters are applied on the page.
        if (params.status?.length) searchParams.set('activity_status', params.status[0]);
        const groups = params.bench_group ?? params.lab_group;
        if (groups?.length) searchParams.set('bench_group', String(groups[0]));
        if (params.is_favorite !== undefined) {
          searchParams.set('is_favorite', String(params.is_favorite));
        }
        return `/api/labs/dashboard?${searchParams.toString()}`;
      },
      transformResponse: (res: LabsDashboardRetrieveApiResponse): DashboardPageResponse =>
        mapDashboardListResponse(res),
      providesTags: ['LabDevice'],
      keepUnusedDataFor: 30,
    }),

    /**
     * GET /api/labs/dashboard/summary
     * Operational dashboard summary metrics and status distributions.
     */
    getDashboardSummary: build.query<DashboardSummaryResponse, void>({
      query: () => '/api/labs/dashboard/summary',
      transformResponse: (res: LabsDashboardSummaryRetrieveApiResponse) =>
        mapDashboardSummaryResponse(res),
      providesTags: ['DashboardStats'],
    }),

    /**
     * GET /api/labs/bench-groups
     * Returns bench reference options and group definitions.
     */
    getBenchFilterOptions: build.query<BenchFilterOptions, void>({
      query: () => '/api/labs/bench-groups',
      transformResponse: (res: LabsBenchGroupsRetrieveApiResponse) => {
        const benchGroups = mapBenchGroupsResponse(res);
        return {
          bench_groups: benchGroups,
          lab_groups: benchGroups,
          locations: [],
          statuses: [],
        };
      },
      keepUnusedDataFor: 300,
    }),

    /**
     * GET /api/labs/dashboard/benches/{bench_id}
     * Detailed operational view of an individual laboratory bench.
     */
    getBenchDetail: build.query<DashboardBenchDetail, number>({
      query: (benchId) => `/api/labs/dashboard/benches/${benchId}`,
      transformResponse: (res: LabsDashboardBenchesRetrieveByBenchIdApiResponse) =>
        mapBenchDetailResponse(res),
      providesTags: ['LabDevice'],
    }),

    /**
     * POST /api/labs/benches/{bench_id}/actions/favorite
     * Mark bench as favorite with optimistic cache update.
     */
    addFavorite: build.mutation<{ data: { is_favorite: boolean } }, { labId?: number; benchId?: number }>({
      query: ({ labId, benchId }) => {
        const id = benchId ?? labId;
        return {
          url: `/api/labs/benches/${id}/actions/favorite`,
          method: 'POST',
        };
      },
      transformResponse: (res: LabsBenchesActionsFavoriteCreateByBenchIdApiResponse) =>
        mapFavoriteResponse(res),
      async onQueryStarted({ labId, benchId }, { dispatch, getState, queryFulfilled }) {
        const targetId = benchId ?? labId;
        if (targetId == null) return;
        const patchResults = patchDashboardPageCaches(dispatch, getState, (draft) => {
          const item = draft.results.find((l) => l.id === targetId);
          if (item) item.is_favorite = true;
        });
        try {
          await queryFulfilled;
        } catch {
          patchResults.forEach((patchResult) => {
            patchResult.undo();
          });
        }
      },
    }),

    /**
     * DELETE /api/labs/benches/{bench_id}/actions/favorite
     * Unfavorite bench with optimistic cache update.
     */
    removeFavorite: build.mutation<void, { labId?: number; benchId?: number }>({
      query: ({ labId, benchId }) => {
        const id = benchId ?? labId;
        return {
          url: `/api/labs/benches/${id}/actions/favorite`,
          method: 'DELETE',
        };
      },
      async onQueryStarted({ labId, benchId }, { dispatch, getState, queryFulfilled }) {
        const targetId = benchId ?? labId;
        if (targetId == null) return;
        const patchResults = patchDashboardPageCaches(dispatch, getState, (draft, args) => {
          if (args.is_favorite) {
            const idx = draft.results.findIndex((l) => l.id === targetId);
            if (idx !== -1) {
              draft.results.splice(idx, 1);
              draft.total_count = Math.max(0, draft.total_count - 1);
            }
            return;
          }

          const item = draft.results.find((l) => l.id === targetId);
          if (item) item.is_favorite = false;
        });
        try {
          await queryFulfilled;
        } catch {
          patchResults.forEach((patchResult) => {
            patchResult.undo();
          });
        }
      },
    }),
  }),
});

export const {
  useGetDashboardPageQuery,
  useGetDashboardSummaryQuery,
  useGetBenchFilterOptionsQuery,
  useGetBenchDetailQuery,
  useAddFavoriteMutation,
  useRemoveFavoriteMutation,
} = dashboardApi;

export const useGetLabFilterOptionsQuery = useGetBenchFilterOptionsQuery;
export const useGetLabDetailQuery = useGetBenchDetailQuery;
