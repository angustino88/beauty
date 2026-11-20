import { baseApi } from '@/shared/lib/api';

/** Rows fetched per scroll step by paged selects. */
export const PAGED_OPTIONS_PAGE_SIZE = 50;

export type PagedOptionsParams = Record<string, string | number | boolean | undefined>;

export interface PagedOptionsArgs {
  /** A paginated list endpoint, e.g. `/api/labs/equipment`. */
  path: string;
  params?: PagedOptionsParams;
}

export interface PagedOptionsPage<Row = Record<string, unknown>> {
  data: Row[];
  meta?: { pagination?: { count: number; next: string | null } };
}

/**
 * One page per scroll step of any standard paginated list (`data` + `meta.pagination`).
 * Used by select boxes so that every item can be reached by scrolling, without typing.
 */
export const pagedOptionsApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getPagedOptions: build.infiniteQuery<PagedOptionsPage, PagedOptionsArgs, number>({
      infiniteQueryOptions: {
        initialPageParam: 1,
        getNextPageParam: (lastPage, _allPages, lastPageParam) =>
          lastPage.meta?.pagination?.next ? lastPageParam + 1 : undefined,
      },
      query: ({ queryArg, pageParam }) => ({
        url: queryArg.path,
        params: { ...queryArg.params, page: pageParam, page_size: PAGED_OPTIONS_PAGE_SIZE },
      }),
    }),
  }),
  overrideExisting: false,
});

export const { useGetPagedOptionsInfiniteQuery } = pagedOptionsApi;
