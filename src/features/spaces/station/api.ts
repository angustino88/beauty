import { baseApi } from "@/shared/lib/api";
import { generatedApi } from '@/shared/api/generated/api';
import {
  generateListTags,
  generateItemTag,
  invalidateList,
} from "@/shared/lib/api/tagHelpers";
import { createResourceEndpoints } from "@/shared/lib/api/endpointHelpers";
import type {
  IStation,
  IStationDropdownOptions,
  IStationListResponse,
  IStationParams,
  IStationPayload,
} from "./types";
import type { SpaceStatusHistoryRecord } from "../shared/SpaceStatusHistoryModal";
import {
  mapStationDetailApiResponse,
  mapStationListApiResponse,
  mapStationWritePayload,
} from "./mapper";
import { normalizeFilterFacets, type FilterFacets } from "@/features/lab-equipment/shared/facets/filterFacets";

const ENDPOINTS = createResourceEndpoints("labs/stations");
const TAG = "Station";

generatedApi.enhanceEndpoints({
  endpoints: {
    labsStationsRetrieve: { providesTags: invalidateList(TAG) },
    labsStationsOptionsRetrieve: { providesTags: invalidateList(TAG) },
    labsStationsStatusSummaryRetrieve: { providesTags: invalidateList(TAG) },
    labsStationsCreate: { invalidatesTags: invalidateList(TAG) },
  },
});

export const stationApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getStations: build.query<IStationListResponse, IStationParams>({
      query: (params) => {
        const queryParams = new URLSearchParams();
        if (params.page) queryParams.set("page", String(params.page));
        if (params.page_size) queryParams.set("page_size", String(params.page_size));
        if (params.search) queryParams.set("search", params.search);
        if (params.ordering) queryParams.set("ordering", params.ordering);
        if (params.room_id) queryParams.set("room_id", String(params.room_id));
        if (params.owner_id) queryParams.set("owner_id", String(params.owner_id));
        if (params.status) queryParams.set("status", params.status);
        const qs = queryParams.toString();
        return { url: `${ENDPOINTS.LIST}${qs ? `?${qs}` : ""}` };
      },
      transformResponse: (res: unknown) => mapStationListApiResponse(res),
      providesTags: (result) => generateListTags(TAG, result),
    }),

    getStationById: build.query<IStation, number>({
      query: (id) => ({ url: ENDPOINTS.DETAIL(id) }),
      transformResponse: (res: unknown) => mapStationDetailApiResponse(res),
      providesTags: (_res, _err, id) => generateItemTag(TAG, id),
    }),

    createStation: build.mutation<IStation, IStationPayload>({
      query: (body) => ({
        url: ENDPOINTS.CREATE,
        method: "POST",
        body: mapStationWritePayload(body),
      }),
      transformResponse: (res: unknown) => mapStationDetailApiResponse(res),
      invalidatesTags: invalidateList(TAG),
    }),

    updateStation: build.mutation<IStation, { id: number; body: IStationPayload }>({
      query: ({ id, body }) => ({
        url: ENDPOINTS.UPDATE(id),
        method: "PATCH",
        body: mapStationWritePayload(body),
      }),
      transformResponse: (res: unknown) => mapStationDetailApiResponse(res),
      invalidatesTags: (_res, _err, { id }) => [
        ...generateItemTag(TAG, id),
        ...invalidateList(TAG),
      ],
    }),

    deleteStation: build.mutation<void, number>({
      query: (id) => ({ url: ENDPOINTS.DELETE(id), method: "DELETE" }),
      invalidatesTags: invalidateList(TAG),
    }),

    placeStation: build.mutation<
      void,
      { stationId: number; body: { room_id?: number | null; slot_id?: number | null; power_reserved_w?: string | null } }
    >({
      query: ({ stationId, body }) => ({
        url: `/api/labs/stations/${stationId}/actions/place`,
        method: "POST",
        body,
      }),
      invalidatesTags: (_res, _err, { stationId }) => [
        ...generateItemTag(TAG, stationId),
        ...invalidateList(TAG),
      ],
    }),

    changeStationStatus: build.mutation<
      void,
      { stationId: number; body: { status: string; effective_date?: string; reason?: string } }
    >({
      query: ({ stationId, body }) => ({
        url: `/api/labs/stations/${stationId}/actions/change-status`,
        method: "POST",
        body,
      }),
      invalidatesTags: (_res, _err, { stationId }) => [
        ...generateItemTag(TAG, stationId),
        ...invalidateList(TAG),
      ],
    }),

    changeStationLifecycle: build.mutation<
      IStation,
      {
        stationId: number;
        body: {
          lifecycle_status?: 'planned' | 'in_service' | 'retired';
          access_policy?: 'open' | 'restricted';
          metadata?: Record<string, unknown>;
        };
      }
    >({
      query: ({ stationId, body }) => ({
        url: `/api/labs/stations/${stationId}/actions/change-lifecycle`,
        method: "POST",
        body,
      }),
      transformResponse: (res: unknown) => mapStationDetailApiResponse(res),
      invalidatesTags: (_res, _err, { stationId }) => [
        ...generateItemTag(TAG, stationId),
        ...invalidateList(TAG),
        { type: "Room", id: "LIST" },
        { type: "Bench", id: "LIST" },
      ],
    }),

    getStationHistory: build.query<
      { data: SpaceStatusHistoryRecord[]; total: number },
      { id: number; page: number; pageSize: number }
    >({
      query: ({ id, page, pageSize }) => ({
        url: `${ENDPOINTS.DETAIL(id)}/history`,
        params: { page, page_size: pageSize },
      }),
      transformResponse: (res: { data: SpaceStatusHistoryRecord[]; meta: { pagination: { count: number } } }) => ({
        data: res.data,
        total: res.meta.pagination.count,
      }),
      providesTags: (_res, _err, { id }) => [{ type: "ChangeLog", id }],
    }),

    getStationSlots: build.query<Array<{ id: number; slot_code: string; label?: string }>, number>({
      query: (stationId) => ({ url: `/api/labs/stations/${stationId}/slots` }),
      transformResponse: (res: unknown) => {
        const envelope = (res as Record<string, unknown>) ?? {};
        const list = Array.isArray(envelope.data) ? envelope.data : [];
        return list.map((s: Record<string, unknown>) => ({
          id: s.id as number,
          slot_code: String(s.slot_code ?? ""),
          label: s.label ? String(s.label) : undefined,
        }));
      },
    }),

    getStationDropdown: build.query<IStationDropdownOptions, void>({
      query: () => ({ url: "/api/labs/stations/filters" }),
      providesTags: [...invalidateList(TAG), ...invalidateList('Room')],
      transformResponse: (res: unknown): IStationDropdownOptions => {
        const envelope = (res as Record<string, unknown>) ?? {};
        const data = (envelope.data as Record<string, unknown>) ?? envelope;
        const extract = (arr: unknown) =>
          Array.isArray(arr)
            ? arr.map((item: Record<string, unknown>) => ({
                id: (item.id as number) ?? 0,
                name: String(item.name || item.sku || item.id),
              }))
            : [];
        return {
          rooms: extract(data.rooms),
          departments: extract(data.departments),
          groups: extract(data.groups),
        };
      },
    }),
    getStationFilters: build.query<FilterFacets, void>({
      query: () => ({ url: "/api/labs/stations/filters" }),
      transformResponse: normalizeFilterFacets,
      providesTags: invalidateList(TAG),
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetStationsQuery,
  useGetStationByIdQuery,
  useCreateStationMutation,
  useUpdateStationMutation,
  useDeleteStationMutation,
  usePlaceStationMutation,
  useChangeStationStatusMutation,
  useChangeStationLifecycleMutation,
  useGetStationHistoryQuery,
  useGetStationSlotsQuery,
  useGetStationDropdownQuery,
  useGetStationFiltersQuery,
} = stationApi;

/** Legacy alias for backwards compatibility during migration */
export const useGetRacksQuery = useGetStationsQuery;
export const useGetRackByIdQuery = useGetStationByIdQuery;
export const useCreateRackMutation = useCreateStationMutation;
export const useUpdateRackMutation = useUpdateStationMutation;
export const useDeleteRackMutation = useDeleteStationMutation;
export const usePlaceRackMutation = usePlaceStationMutation;
