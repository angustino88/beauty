import { baseApi } from "@/shared/lib/api";
import {
  generateListTags,
  generateItemTag,
  invalidateList,
} from "@/shared/lib/api/tagHelpers";
import type {
  BenchPlacementPayload,
  EquipmentAssignmentPayload,
  MappingFilterOptions,
  ResourceMappingListResponse,
  ResourceMappingParams,
  ResourceMappingRow,
  StationPlacementPayload,
} from "./types";
import {
  mapResourceMappingDataToRows,
  mapResourceMappingListResponse,
} from "./mapper";

const TAG = "ResourceMapping";

export const mappingApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getMappings: build.query<ResourceMappingListResponse, ResourceMappingParams>({
      query: (params) => {
        const queryParams = new URLSearchParams();
        if (params.page) queryParams.set("page", String(params.page));
        if (params.page_size) queryParams.set("page_size", String(params.page_size));
        if (params.search) queryParams.set("q", params.search);
        if (params.ordering) queryParams.set("ordering", params.ordering);
        if (params.station_id) queryParams.set("setup_location_id", String(params.station_id));
        if (params.bench_id) queryParams.set("id", String(params.bench_id));
        if (params.status) queryParams.set("status", params.status);

        const qs = queryParams.toString();
        return { url: `/api/labs/benches${qs ? `?${qs}` : ""}` };
      },
      transformResponse: (res: unknown) => mapResourceMappingListResponse(res),
      providesTags: (result) => generateListTags(TAG, result),
    }),

    getEquipmentMapping: build.query<ResourceMappingRow[], number>({
      query: (equipmentId) => ({ url: `/api/labs/equipment/${equipmentId}/mapping` }),
      transformResponse: (response: unknown) => mapResourceMappingDataToRows(response),
      providesTags: (_result, _error, id) => [{ type: 'Equipment', id }, { type: TAG, id: 'LIST' }],
    }),

    getBenchMapping: build.query<ResourceMappingRow | null, number>({
      query: (benchId) => ({ url: `/api/labs/benches/${benchId}/mapping` }),
      transformResponse: (res: unknown) => {
        const rows = mapResourceMappingDataToRows(res);
        return rows[0] ?? null;
      },
      providesTags: (_res, _err, id) => generateItemTag(TAG, id),
    }),

    getRoomMapping: build.query<ResourceMappingRow[], number>({
      query: (roomId) => ({ url: `/api/labs/rooms/${roomId}/mapping` }),
      transformResponse: (res: unknown) => mapResourceMappingDataToRows(res),
      providesTags: (_res, _err, id) => [{ type: "Room", id: `mapping-${id}` }],
    }),

    getStationMapping: build.query<ResourceMappingRow[], number>({
      query: (stationId) => ({ url: `/api/labs/stations/${stationId}/mapping` }),
      transformResponse: (res: unknown) => mapResourceMappingDataToRows(res),
      providesTags: (_res, _err, id) => [{ type: "Station", id: `mapping-${id}` }],
    }),

    placeBench: build.mutation<void, { benchId: number; body: BenchPlacementPayload }>({
      query: ({ benchId, body }) => ({
        url: `/api/labs/benches/${benchId}/actions/place`,
        method: "POST",
        body,
      }),
      invalidatesTags: (_res, _err, { benchId }) => [
        ...generateItemTag(TAG, benchId),
        ...invalidateList(TAG),
        { type: "Bench", id: benchId },
      ],
    }),

    placeStation: build.mutation<void, { stationId: number; body: StationPlacementPayload }>({
      query: ({ stationId, body }) => ({
        url: `/api/labs/stations/${stationId}/actions/place`,
        method: "POST",
        body,
      }),
      invalidatesTags: (_res, _err, { stationId }) => [
        ...invalidateList(TAG),
        { type: "Station", id: stationId },
      ],
    }),

    assignEquipment: build.mutation<void, { equipmentId: number; body: EquipmentAssignmentPayload }>({
      query: ({ equipmentId, body }) => ({
        url: `/api/labs/equipment/${equipmentId}/assignment`,
        method: "PUT",
        body,
      }),
      invalidatesTags: (_res, _err, { body }) => [
        ...generateItemTag(TAG, body.bench_id),
        ...invalidateList(TAG),
        { type: "Equipment", id: "LIST" },
      ],
    }),

    unassignEquipment: build.mutation<void, { equipmentId: number; benchId?: number }>({
      query: ({ equipmentId }) => ({
        url: `/api/labs/equipment/${equipmentId}/assignment`,
        method: "DELETE",
      }),
      invalidatesTags: (_res, _err, { benchId }) => [
        ...(benchId ? generateItemTag(TAG, benchId) : []),
        ...invalidateList(TAG),
        { type: "Equipment", id: "LIST" },
      ],
    }),

    getMappingFilterOptions: build.query<MappingFilterOptions, void>({
      async queryFn(_arg, _queryApi, _extraOptions, fetchWithBQ) {
        const [roomsRes, stationsRes, benchesRes] = await Promise.all([
          fetchWithBQ("/api/labs/rooms/options"),
          fetchWithBQ("/api/labs/stations/options"),
          fetchWithBQ("/api/labs/benches/options"),
        ]);

        const extractOptions = (res: unknown) => {
          const envelope = (res as Record<string, unknown>) ?? {};
          const list = Array.isArray(envelope.data) ? envelope.data : [];
          return list.map((item: Record<string, unknown>) => ({
            text: String(item.name || item.sku || item.id),
            value: item.id as number,
          }));
        };

        const categories = [
          { text: "Computing", value: "computing" },
          { text: "Display", value: "display" },
          { text: "Debugging", value: "debugging" },
          { text: "Networking", value: "networking" },
          { text: "Power", value: "power" },
          { text: "Accessories", value: "accessory" },
          { text: "Samples", value: "sample" },
          { text: "Furniture", value: "furniture" },
          { text: "Instruments", value: "instrument" },
          { text: "Laboratory", value: "laboratory" },
          { text: "Mechanical", value: "mechanical" },
          { text: "Other", value: "other" },
        ];

        return {
          data: {
            rooms: extractOptions(roomsRes.data),
            stations: extractOptions(stationsRes.data),
            benches: extractOptions(benchesRes.data),
            categories,
          },
        };
      },
      providesTags: [{ type: "ResourceMapping", id: "FILTERS" }],
    }),

    getStationSlots: build.query<Array<{ id: number; slot_code: string; label?: string }>, number>({
      query: (stationId) => ({ url: `/api/labs/stations/${stationId}/slots` }),
      transformResponse: (res: unknown) => {
        const envelope = (res as Record<string, unknown>) ?? {};
        const list = Array.isArray(envelope.data) ? envelope.data : [];
        return list.map((s: Record<string, unknown>) => ({
          id: s.id as number,
          slot_code: (s.slot_code as string) ?? "",
          label: (s.label as string) ?? undefined,
        }));
      },
    }),

    getRoomSlots: build.query<Array<{ id: number; slot_code: string; row_index: number; col_index: number }>, number>({
      query: (roomId) => ({ url: `/api/labs/rooms/${roomId}/slots` }),
      transformResponse: (res: unknown) => {
        const envelope = (res as Record<string, unknown>) ?? {};
        const list = Array.isArray(envelope.data) ? envelope.data : [];
        return list.map((s: Record<string, unknown>) => ({
          id: s.id as number,
          slot_code: (s.slot_code as string) ?? "",
          row_index: (s.row_index as number) ?? 0,
          col_index: (s.col_index as number) ?? 0,
        }));
      },
    }),

    exportMappingChangeLog: build.mutation<Blob, void>({
      query: () => ({
        url: "/api/labs/resources/bench/audits",
        responseHandler: (response) => response.blob(),
      }),
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetMappingsQuery,
  useGetEquipmentMappingQuery,
  useLazyGetMappingsQuery,
  useGetBenchMappingQuery,
  useGetRoomMappingQuery,
  useGetStationMappingQuery,
  usePlaceBenchMutation,
  usePlaceStationMutation,
  useAssignEquipmentMutation,
  useUnassignEquipmentMutation,
  useGetMappingFilterOptionsQuery,
  useGetStationSlotsQuery,
  useGetRoomSlotsQuery,
  useExportMappingChangeLogMutation,
} = mappingApi;
