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
  MappingOptionItem,
  ResourceMappingListResponse,
  ResourceMappingParams,
  ResourceMappingRow,
} from "./types";
import { mapBenchMappingList, mapResourceMappingDataToRows } from "./mapper";

const TAG = "ResourceMapping";

export interface BenchAuditRow {
  id: number;
  bench: string;
  result: string;
  auditor: string;
  audited_at: string;
  remarks: string;
}

/** `{data: [{id, sku, name}]}` of an options endpoint → items; a failed request gives an empty list. */
const optionItems = (res: { data?: unknown } | undefined): MappingOptionItem[] => {
  const list = (res?.data as { data?: unknown } | undefined)?.data;
  return (Array.isArray(list) ? list : []).map((item: Record<string, unknown>) => ({
    id: Number(item.id),
    sku: item.sku == null ? null : String(item.sku),
    name: String(item.name ?? item.sku ?? item.id),
  }));
};

export const mappingApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    // One request per page: the server filters, searches, paginates and counts (meta.summary).
    getMappings: build.query<ResourceMappingListResponse, ResourceMappingParams>({
      query: (params) => ({
        url: "/api/labs/resource-mappings",
        params: Object.fromEntries(Object.entries(params).filter(([, value]) => value != null && value !== "")),
      }),
      transformResponse: (res: unknown) => mapBenchMappingList(res),
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

    // Column filter choices: rooms, stations, benches and the equipment categories the system has.
    getMappingFilterOptions: build.query<MappingFilterOptions, void>({
      async queryFn(_arg, _queryApi, _extraOptions, fetchWithBQ) {
        const [rooms, stations, benches, categories] = await Promise.all([
          fetchWithBQ("/api/labs/rooms/options"),
          fetchWithBQ("/api/labs/stations/options"),
          fetchWithBQ("/api/labs/benches/options"),
          fetchWithBQ("/api/labs/equipment-categories/options"),
        ]);
        return {
          data: {
            rooms: optionItems(rooms),
            stations: optionItems(stations),
            benches: optionItems(benches),
            categories: optionItems(categories),
          },
        };
      },
      providesTags: [{ type: "ResourceMapping", id: "FILTERS" }],
    }),

    // The bench audit history: one page of `/api/labs/audits` filtered to benches.
    getBenchAuditPage: build.query<{ rows: BenchAuditRow[]; hasNext: boolean }, number>({
      query: (page) => ({
        url: "/api/labs/audits",
        params: { resource_type: "bench", page, page_size: 100 },
      }),
      transformResponse: (res: {
        data?: Array<Record<string, unknown>>;
        meta?: { pagination?: { next?: string | null } };
      }) => ({
        rows: (res.data ?? []).map((item) => ({
          id: Number(item.id),
          bench: String((item.resource as { name?: string } | undefined)?.name ?? ""),
          result: String((item.result as { label?: string } | undefined)?.label ?? ""),
          auditor: String((item.auditor as { name?: string } | undefined)?.name ?? ""),
          audited_at: String(item.audited_at ?? ""),
          remarks: String(item.remarks ?? ""),
        })),
        hasNext: Boolean(res.meta?.pagination?.next),
      }),
      keepUnusedDataFor: 0,
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetMappingsQuery,
  useGetEquipmentMappingQuery,
  useLazyGetMappingsQuery,
  useGetBenchMappingQuery,
  usePlaceBenchMutation,
  useAssignEquipmentMutation,
  useUnassignEquipmentMutation,
  useGetMappingFilterOptionsQuery,
  useLazyGetBenchAuditPageQuery,
} = mappingApi;
