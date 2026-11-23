import { baseApi } from "@/shared/lib/api";
import { generatedApi } from '@/shared/api/generated/api';
import {
  generateListTags,
  generateItemTag,
  invalidateList,
} from "@/shared/lib/api/tagHelpers";
import { createResourceEndpoints } from "@/shared/lib/api/endpointHelpers";
import type {
  IBench,
  IBenchGroup,
  IBenchListResponse,
  IBenchParams,
  IBenchPayload,
} from "./types";
import {
  mapBenchDetailApiResponse,
  mapBenchListApiResponse,
} from "./mapper";
import { normalizeFilterFacets, type FilterFacets } from "@/features/lab-equipment/shared/facets/filterFacets";
import { resourceImageFormData, resourceImageUrl } from "@/shared/lib/api/resourceImage";

const ENDPOINTS = createResourceEndpoints("labs/benches");
const TAG = "Bench";

generatedApi.enhanceEndpoints({
  endpoints: {
    labsBenchesRetrieve: { providesTags: invalidateList(TAG) },
    labsBenchesOptionsRetrieve: { providesTags: invalidateList(TAG) },
    labsBenchesStatusSummaryRetrieve: { providesTags: invalidateList(TAG) },
    labsBenchesCreate: { invalidatesTags: invalidateList(TAG) },
  },
});

export const benchApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    updateBenchImage: build.mutation<void, { id: number; image: File }>({
      query: ({ id, image }) => ({
        url: resourceImageUrl("benches", id),
        method: "PUT",
        body: resourceImageFormData(image),
      }),
      invalidatesTags: (_r, _e, { id }) => [...generateItemTag(TAG, id), ...invalidateList(TAG)],
    }),
    deleteBenchImage: build.mutation<void, number>({
      query: (id) => ({ url: resourceImageUrl("benches", id), method: "DELETE" }),
      invalidatesTags: (_r, _e, id) => [...generateItemTag(TAG, id), ...invalidateList(TAG)],
    }),
    getBenches: build.query<IBenchListResponse, IBenchParams>({
      query: (params) => {
        const queryParams = new URLSearchParams();
        if (params.page) queryParams.set("page", String(params.page));
        if (params.page_size) queryParams.set("page_size", String(params.page_size));
        if (params.search) queryParams.set("q", params.search);
        if (params.ordering) queryParams.set("ordering", params.ordering);
        if (params.bench_group_id != null) queryParams.set("bench_group_id", String(params.bench_group_id));
        if (params.type_id != null) queryParams.set("type_id", String(params.type_id));
        if (params.setup_location_id != null) queryParams.set("setup_location_id", String(params.setup_location_id));
        if (params.owner_id != null) queryParams.set("owner_id", String(params.owner_id));
        if (params.lifecycle_status) queryParams.set("lifecycle_status", params.lifecycle_status);
        if (params.condition) queryParams.set("condition", params.condition);
        if (params.activity_status) queryParams.set("activity_status", params.activity_status);
        if (params.status) queryParams.set("status", params.status);
        if (params.favorite) queryParams.set("favorite", "true");

        const qs = queryParams.toString();
        return { url: `${ENDPOINTS.LIST}${qs ? `?${qs}` : ""}` };
      },
      transformResponse: (res: unknown) => mapBenchListApiResponse(res),
      providesTags: (result) => generateListTags(TAG, result),
    }),

    getBenchById: build.query<IBench, number>({
      query: (id) => ({ url: ENDPOINTS.DETAIL(id) }),
      transformResponse: (res: unknown) => mapBenchDetailApiResponse(res),
      providesTags: (_res, _err, id) => generateItemTag(TAG, id),
    }),

    createBench: build.mutation<IBench, IBenchPayload>({
      query: (body) => ({
        url: ENDPOINTS.CREATE,
        method: "POST",
        body,
      }),
      transformResponse: (res: unknown) => mapBenchDetailApiResponse(res),
      invalidatesTags: [...invalidateList(TAG), { type: "Station", id: "SLOTS" }, { type: "Station", id: "LIST" }],
    }),

    updateBench: build.mutation<IBench, { id: number; body: Partial<IBenchPayload> }>({
      query: ({ id, body }) => ({
        url: ENDPOINTS.UPDATE(id),
        method: "PATCH",
        body,
      }),
      transformResponse: (res: unknown) => mapBenchDetailApiResponse(res),
      invalidatesTags: (_res, _err, { id }) => [
        ...generateItemTag(TAG, id),
        ...invalidateList(TAG),
        { type: "Station", id: "SLOTS" },
        { type: "Station", id: "LIST" },
      ],
    }),

    deleteBench: build.mutation<void, number>({
      query: (id) => ({ url: ENDPOINTS.DELETE(id), method: "DELETE" }),
      invalidatesTags: [...invalidateList(TAG), { type: "Station", id: "SLOTS" }, { type: "Station", id: "LIST" }],
    }),

    forceDeleteBench: build.mutation<
      { id: number; released: { equipment: number; bookings: number } },
      { id: number; reason: string; confirm: true }
    >({
      query: ({ id, reason, confirm }) => ({
        url: `/api/labs/benches/${id}/actions/force-delete`,
        method: "POST",
        body: { reason, confirm },
      }),
      transformResponse: (res: unknown) => {
        const envelope = (res ?? {}) as { data?: { id: number; released: { equipment: number; bookings: number } } };
        return envelope.data ?? (res as { id: number; released: { equipment: number; bookings: number } });
      },
      invalidatesTags: (_r, _e, { id }) => [
        ...generateItemTag(TAG, id),
        ...invalidateList(TAG),
        { type: "Station", id: "LIST" },
        { type: "Station", id: "SLOTS" },
        { type: "ResourceMapping", id: "LIST" },
        { type: "Equipment", id: "LIST" },
        { type: "Booking", id: "LIST" },
      ],
    }),

    getBenchGroups: build.query<IBenchGroup[], void>({
      query: () => ({ url: "/api/labs/bench-groups/options" }),
      transformResponse: (res: unknown): IBenchGroup[] => {
        const envelope = (res as Record<string, unknown>) ?? {};
        const data = (envelope.data ?? envelope) as Record<string, unknown>;
        const items = Array.isArray(data.results) ? data.results : Array.isArray(data) ? data : [];
        return items.map((g: Record<string, unknown>) => ({
          id: (g.id as number) ?? 0,
          name: String(g.name || g.lab_group_name || ""),
        }));
      },
    }),
    getBenchFilters: build.query<FilterFacets, void>({
      query: () => ({ url: "/api/labs/benches/filters" }),
      transformResponse: normalizeFilterFacets,
      providesTags: invalidateList(TAG),
    }),

    favoriteBench: build.mutation<void, number>({
      query: (id) => ({
        url: `/api/labs/benches/${id}/actions/favorite`,
        method: "POST",
      }),
      invalidatesTags: (_res, _err, id) => [...generateItemTag(TAG, id), ...invalidateList(TAG)],
    }),

    unfavoriteBench: build.mutation<void, number>({
      query: (id) => ({
        url: `/api/labs/benches/${id}/actions/favorite`,
        method: "DELETE",
      }),
      invalidatesTags: (_res, _err, id) => [...generateItemTag(TAG, id), ...invalidateList(TAG)],
    }),

    changeBenchLifecycle: build.mutation<
      IBench,
      { benchId: number; body: { lifecycle_status: 'in_service' | 'retired'; metadata?: Record<string, unknown> } }
    >({
      query: ({ benchId, body }) => ({
        url: `/api/labs/benches/${benchId}/actions/change-lifecycle`,
        method: "POST",
        body,
      }),
      transformResponse: (res: unknown) => mapBenchDetailApiResponse(res),
      invalidatesTags: (_res, _err, { benchId }) => [
        ...generateItemTag(TAG, benchId),
        ...invalidateList(TAG),
        { type: "Station", id: "LIST" },
        { type: "Room", id: "LIST" },
      ],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetBenchesQuery,
  useGetBenchByIdQuery,
  useLazyGetBenchByIdQuery,
  useCreateBenchMutation,
  useUpdateBenchMutation,
  useDeleteBenchMutation,
  useForceDeleteBenchMutation,
  useGetBenchGroupsQuery,
  useGetBenchFiltersQuery,
  useFavoriteBenchMutation,
  useUnfavoriteBenchMutation,
  useUpdateBenchImageMutation,
  useDeleteBenchImageMutation,
  useChangeBenchLifecycleMutation,
} = benchApi;
