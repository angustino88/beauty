import { baseApi } from '@/shared/lib/api';
import { generatedApi } from '@/shared/api/generated/api';
import { resourceImageFormData, resourceImageUrl } from '@/shared/lib/api/resourceImage';
import type { EquipmentItemRead, EquipmentDetailRead, EquipmentChangeCondition, EquipmentChangeLifecycle, EquipmentStatusSummaryDataSerializersEquipmentStatusSummaryDetailResponse } from '@/shared/api/generated/api';
import { equipmentWriteBody, mapEquipmentRead } from './equipmentAdapter';
import type {
  EquipmentItem,
  EquipmentListParams,
  EquipmentListResponse,
  EquipmentReferenceData,
  EquipmentStatusSummary,
  EquipmentWritePayload,
  EquipmentFacetParams,
  EquipmentFacetResponse,
  EquipmentCatalogOptionList,
} from '../types/equipment';
import { normalizeFilterFacets, type FilterFacets } from '../shared/facets/filterFacets';

export const equipmentApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    updateEquipmentImage: build.mutation<void, { id: number; image: File }>({
      query: ({ id, image }) => ({
        url: resourceImageUrl('equipment', id),
        method: 'PUT',
        body: resourceImageFormData(image),
      }),
      invalidatesTags: ['Equipment'],
    }),
    deleteEquipmentImage: build.mutation<void, number>({
      query: (id) => ({ url: resourceImageUrl('equipment', id), method: 'DELETE' }),
      invalidatesTags: ['Equipment'],
    }),
    // The collection filters by the numeric ID resolved from reference-data, not the route key.
    getEquipmentList: build.query<EquipmentListResponse, EquipmentListParams>({
      query: ({ category, ...params }) => {
        const searchParams = new URLSearchParams();
        searchParams.set('category', String(category));
        if (params.search) searchParams.set('q', params.search);
        if (params.ordering) searchParams.set('ordering', params.ordering);
        if (params.kind != null) searchParams.set('kind', String(params.kind));
        if (params.type != null) searchParams.set('type', String(params.type));
        if (params.manufacturer != null) searchParams.set('manufacturer', String(params.manufacturer));
        if (params.product_model != null) searchParams.set('product_model_id', String(params.product_model));
        if (params.status) searchParams.set('status', params.status);
        if (params.owner != null) searchParams.set('owner_id', String(params.owner));
        if (params.department != null) searchParams.set('department_id', String(params.department));
        if (params.group_id != null) searchParams.set('group_id', String(params.group_id));
        if (params.assigned != null) searchParams.set('assigned', String(params.assigned));

        const qs = searchParams.toString();
        return { url: `/api/labs/equipment?${qs}` };
      },
      transformResponse: (res: unknown): EquipmentListResponse => {
        const raw = res as {
          data?: EquipmentItemRead[];
          meta?: { pagination?: { count: number; page: number; page_size: number } };
          total_count?: number;
          results?: EquipmentItemRead[];
        };
        const items = Array.isArray(raw?.data)
          ? raw.data
          : Array.isArray(raw?.results)
            ? raw.results
            : Array.isArray(raw)
              ? (raw as EquipmentItemRead[])
              : [];
        const total =
          raw?.meta?.pagination?.count ??
          raw?.total_count ??
          items.length;

        return {
          data: items.map(mapEquipmentRead),
          meta: raw?.meta,
          total_count: total,
        };
      },
      providesTags: (result, _error, { category }) => [
        { type: 'Equipment' as const, id: `${category}_LIST` },
        ...(result?.data?.map((item) => ({ type: 'Equipment' as const, id: `${category}_${item.id}` })) ?? []),
      ],
    }),

    getEquipmentDetail: build.query<EquipmentItem, { category: string; id: number }>({
      query: ({ id }) => ({ url: `/api/labs/equipment/${id}` }),
      transformResponse: (response: { data: EquipmentDetailRead }) => mapEquipmentRead(response.data),
      providesTags: (_result, _error, { category, id }) => [{ type: 'Equipment' as const, id: `${category}_${id}` }],
    }),

    // The backend summary counts computed display_status for the selected category.
    getEquipmentSummary: build.query<EquipmentStatusSummary, number>({
      query: (category) => ({
        url: '/api/labs/equipment/status-summary',
        params: { category },
      }),
      transformResponse: (res: EquipmentStatusSummaryDataSerializersEquipmentStatusSummaryDetailResponse): EquipmentStatusSummary => {
        const envelope = res.data;
        return {
          total_count: envelope.total_count,
          unknown_status_count: envelope.unknown_status_count,
          statuses: envelope.statuses.map((entry) => ({ ...entry, count: entry.resource_count })),
        };
      },
      providesTags: (_res, _err, category) => [{ type: 'Equipment' as const, id: `${category}_SUMMARY` }],
    }),

    // Reference data uses a numeric category ID when narrowed.
    getEquipmentReferenceData: build.query<EquipmentReferenceData, string>({
      query: () => ({
        url: '/api/labs/equipment/reference-data',
      }),
      transformResponse: (res: unknown): EquipmentReferenceData => {
        const envelope = (res as { data?: EquipmentReferenceData })?.data ?? (res as EquipmentReferenceData);
        return {
          kinds: envelope?.kinds ?? [],
          types: envelope?.types ?? [],
          manufacturers: envelope?.manufacturers ?? [],
          product_models: envelope?.product_models ?? [],
          groups: envelope?.groups ?? [],
          owners: envelope?.owners ?? [],
          departments: envelope?.departments ?? [],
          storage_rooms: envelope?.storage_rooms ?? [],
          sizes: envelope?.sizes ?? [],
          resolutions: envelope?.resolutions ?? [],
          interfaces: envelope?.interfaces ?? [],
          protocols: envelope?.protocols ?? [],
          customers: envelope?.customers ?? [],
          characteristics: envelope?.characteristics ?? [],
          materials: envelope?.materials ?? [],
        };
      },
    }),

    // Filter definitions apply to all equipment categories.
    getEquipmentFilters: build.query<FilterFacets, string>({
      query: () => ({ url: '/api/labs/equipment/filters' }),
      transformResponse: normalizeFilterFacets,
    }),

    // GET /api/labs/equipment/{category?}/facets
    getEquipmentFacet: build.query<EquipmentFacetResponse, EquipmentFacetParams & { categoryPath?: string }>({
      async queryFn(args, _api, _extra, baseQuery) {
        const params = { ...args };
        delete params.categoryPath;
        const data: EquipmentFacetResponse['data'] = [];
        let page = 1;
        let response: EquipmentFacetResponse;
        do {
          const result = await baseQuery({
            url: '/api/labs/equipment/facets',
            params: { ...params, page, page_size: 100 },
          });
          if (result.error) return { error: result.error };
          response = result.data as EquipmentFacetResponse;
          if (!Array.isArray(response?.data)) {
            return { error: { status: 'CUSTOM_ERROR', error: 'Invalid equipment facet response' } };
          }
          data.push(...response.data);
          if (!response.data.length || data.length >= (response.meta?.pagination?.count ?? data.length)) break;
          page += 1;
          if (page > 100) return { error: { status: 'CUSTOM_ERROR', error: 'Equipment facet result limit exceeded' } };
        } while (page <= 100);
        return { data: { ...response, data } };
      },
      providesTags: (_result, _error, { categoryPath }) => [
        { type: 'Equipment', id: `${categoryPath}_LIST` },
      ],
    }),

    getEquipmentCatalogOptions: build.query<EquipmentCatalogOptionList, {
      endpoint: 'categories' | 'kinds' | 'types' | 'manufacturers' | 'product-models';
      categoryId?: number;
      kindId?: number;
      typeId?: number;
      manufacturerId?: number;
      includeIds?: number[];
      q?: string;
    }>({
      query: ({ endpoint, categoryId, kindId, typeId, manufacturerId, includeIds, q }) => ({
        url: `/api/labs/equipment-${endpoint}/options`,
        params: {
          category_id: ['kinds', 'types', 'manufacturers'].includes(endpoint) ? categoryId : undefined,
          kind_id: endpoint === 'types' ? kindId : undefined,
          type_id: endpoint === 'product-models' ? typeId : undefined,
          manufacturer_id: endpoint === 'product-models' ? manufacturerId : undefined,
          include_ids: includeIds?.length ? includeIds.join(',') : undefined,
          q,
        },
      }),
    }),

    // POST /api/labs/equipment returns a detail envelope.
    createEquipment: build.mutation<EquipmentItem, { category: string; body: EquipmentWritePayload }>({
      query: ({ body }) => ({
        url: '/api/labs/equipment',
        method: 'POST',
        body: equipmentWriteBody(body as Record<string, unknown>, true),
      }),
      transformResponse: (response: { data: EquipmentDetailRead }) => mapEquipmentRead(response.data),
      // Lists/summaries use numeric category IDs; facets/details use route keys.
      invalidatesTags: ['Equipment'],
    }),

    // PATCH /api/labs/equipment/{id} — status changes use explicit actions.
    updateEquipment: build.mutation<
      EquipmentItem,
      { category: string; id: number; body: Partial<EquipmentWritePayload> }
    >({
      query: ({ id, body }) => {
        return {
          url: `/api/labs/equipment/${id}`,
          method: 'PATCH',
          body: equipmentWriteBody(body as Record<string, unknown>, false),
        };
      },
      transformResponse: (response: { data: EquipmentDetailRead }) => mapEquipmentRead(response.data),
      invalidatesTags: ['Equipment'],
    }),

    // DELETE /api/labs/equipment/{id}
    deleteEquipment: build.mutation<void, { category: string; id: number }>({
      query: ({ id }) => ({
        url: `/api/labs/equipment/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Equipment'],
    }),

    changeEquipmentCondition: build.mutation<EquipmentItem, { category: string; id: number; body: EquipmentChangeCondition }>({
      query: ({ id, body }) => ({
        url: `/api/labs/equipment/${id}/actions/change-condition`,
        method: 'POST',
        body,
      }),
      transformResponse: (response: { data: EquipmentDetailRead }) => mapEquipmentRead(response.data),
      invalidatesTags: ['Equipment'],
    }),
    changeEquipmentLifecycle: build.mutation<EquipmentItem, { category: string; id: number; body: EquipmentChangeLifecycle }>({
      query: ({ id, body }) => ({
        url: `/api/labs/equipment/${id}/actions/change-lifecycle`,
        method: 'POST',
        body,
      }),
      transformResponse: (response: { data: EquipmentDetailRead }) => mapEquipmentRead(response.data),
      invalidatesTags: ['Equipment'],
    }),
  }),
  overrideExisting: false,
});

// Generated and custom endpoints share a store but have separate cache entries.
generatedApi.enhanceEndpoints({
  endpoints: {
    labsEquipmentRetrieve: { providesTags: ['Equipment'] },
    labsEquipmentRetrieveById: { providesTags: ['Equipment'] },
    labsEquipmentOptionsRetrieve: { providesTags: ['Equipment'] },
    labsEquipmentStatusSummaryRetrieve: { providesTags: ['Equipment'] },
    labsEquipmentCreate: { invalidatesTags: ['Equipment'] },
    labsEquipmentActionsChangeConditionCreateByEquipmentId: { invalidatesTags: ['Equipment'] },
    labsEquipmentActionsChangeLifecycleCreateByEquipmentId: { invalidatesTags: ['Equipment'] },
    labsEquipmentActionsHandOverCreateByEquipmentId: { invalidatesTags: ['Equipment'] },
    labsEquipmentActionsReturnCreateByEquipmentId: { invalidatesTags: ['Equipment'] },
    labsEquipmentPlacementUpdateByEquipmentId: { invalidatesTags: ['Equipment'] },
    labsEquipmentPlacementDestroyByEquipmentId: { invalidatesTags: ['Equipment'] },
  },
});

export const {
  useGetEquipmentListQuery,
  useGetEquipmentDetailQuery,
  useLazyGetEquipmentListQuery,
  useGetEquipmentSummaryQuery,
  useGetEquipmentReferenceDataQuery,
  useGetEquipmentFiltersQuery,
  useGetEquipmentFacetQuery,
  useGetEquipmentCatalogOptionsQuery,
  useCreateEquipmentMutation,
  useUpdateEquipmentMutation,
  useDeleteEquipmentMutation,
  useChangeEquipmentConditionMutation,
  useChangeEquipmentLifecycleMutation,
  useUpdateEquipmentImageMutation,
  useDeleteEquipmentImageMutation,
} = equipmentApi;
