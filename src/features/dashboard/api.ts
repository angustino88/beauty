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
     * GET /api/labs/dashboard/?page=N&page_size=M&q=...&activity_status=...&bench_group=...
     * Operational dashboard bench listing with real-time telemetry and schedule data.
     */
    getDashboardPage: build.query<DashboardPageResponse, DashboardPageParams>({
      query: (params) => {
        const searchParams = new URLSearchParams();
        searchParams.set('page', String(params.page));
        searchParams.set('page_size', String(params.page_size));
        // Only benches with computing equipment assigned are listed; the rest cannot be booked or remoted into.
        searchParams.set('has_computing', 'true');
        if (params.search) searchParams.set('q', params.search);
        // The list takes one value per filter and rejects repeated or unknown params, so a
        // multi-select sends its first value; sample and license filters are applied on the page.
        if (params.status?.length) searchParams.set('activity_status', params.status[0]);
        if (params.bench_group?.length) searchParams.set('bench_group', String(params.bench_group[0]));
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
      transformResponse: (res: LabsBenchGroupsRetrieveApiResponse) => ({
        bench_groups: mapBenchGroupsResponse(res),
        locations: [],
        statuses: [],
      }),
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
    addFavorite: build.mutation<{ data: { is_favorite: boolean } }, { benchId: number }>({
      query: ({ benchId }) => ({
        url: `/api/labs/benches/${benchId}/actions/favorite`,
        method: 'POST',
      }),
      transformResponse: (res: LabsBenchesActionsFavoriteCreateByBenchIdApiResponse) =>
        mapFavoriteResponse(res),
      async onQueryStarted({ benchId }, { dispatch, getState, queryFulfilled }) {
        const patchResults = patchDashboardPageCaches(dispatch, getState, (draft) => {
          const item = draft.results.find((l) => l.id === benchId);
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
    removeFavorite: build.mutation<void, { benchId: number }>({
      query: ({ benchId }) => ({
        url: `/api/labs/benches/${benchId}/actions/favorite`,
        method: 'DELETE',
      }),
      async onQueryStarted({ benchId }, { dispatch, getState, queryFulfilled }) {
        const patchResults = patchDashboardPageCaches(dispatch, getState, (draft, args) => {
          if (args.is_favorite) {
            const idx = draft.results.findIndex((l) => l.id === benchId);
            if (idx !== -1) {
              draft.results.splice(idx, 1);
              draft.total_count = Math.max(0, draft.total_count - 1);
            }
            return;
          }

          const item = draft.results.find((l) => l.id === benchId);
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
