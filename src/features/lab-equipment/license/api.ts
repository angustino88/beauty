import { baseApi } from '@/shared/lib/api';
import { skipToken } from '@reduxjs/toolkit/query';
import { generateListTags, generateItemTag, invalidateList } from '@/shared/lib/api/tagHelpers';
import { buildSortableListQuery, createResourceEndpoints, normalizeListResponse, normalizeRefList } from '@/shared/lib/api/endpointHelpers';
import {
  mapLicenseCategory,
  mapLicenseProduct,
  mapLicenseRead,
  mapLicenseRestriction,
  mapLicenseType,
  mapLicenseVendor,
  mapLicenseWritePayload,
} from './mapper';
import type {
  ILicense, ILicenseListResponse, ILicenseParams, ILicensePayload,
  ILicenseCategory, ILicenseProduct, ILicenseRestriction, ILicenseType, ILicenseVendor,
} from './types';
import type { IChangeLog } from '../shared/types/equipment.types';
import { normalizeFilterFacets, type FilterFacets } from '../shared/facets/filterFacets';
import type { LicenseStatusSummaryDataSerializersLicenseStatusSummaryDetailResponse } from '@/shared/api/generated/api';

type DropdownOption = { value: number; label: string };

const ENDPOINTS = createResourceEndpoints('labs/licenses');
const TAG = 'License';

export const licenseRtkApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getLicenses: build.query<ILicenseListResponse, ILicenseParams>({
      query: (params) => {
        const query = buildSortableListQuery(params);
        return { url: `${ENDPOINTS.LIST}${query ? `?${query}` : ''}` };
      },
      transformResponse: (res: unknown) => {
        const normalized = normalizeListResponse<Record<string, unknown>>(res);
        return { ...normalized, data: normalized.data.map(mapLicenseRead) };
      },
      providesTags: (result) => generateListTags(TAG, result),
    }),

    getLicenseStatusSummary: build.query<LicenseStatusSummaryDataSerializersLicenseStatusSummaryDetailResponse['data'], void>({
      query: () => ({ url: '/api/labs/licenses/status-summary' }),
      transformResponse: (response: LicenseStatusSummaryDataSerializersLicenseStatusSummaryDetailResponse) => response.data,
      providesTags: () => [{ type: TAG, id: 'LIST' }],
    }),

    getLicenseById: build.query<ILicense, number>({
      query: (id) => ({ url: ENDPOINTS.DETAIL(id) }),
      transformResponse: (res: { data?: Record<string, unknown> } | Record<string, unknown>) => {
        const data = (res as { data?: Record<string, unknown> }).data ?? res;
        return mapLicenseRead(data);
      },
      providesTags: (_result, _error, id) => generateItemTag(TAG, id),
    }),

    createLicense: build.mutation<ILicense, ILicensePayload>({
      query: (body) => ({ url: ENDPOINTS.CREATE, method: 'POST', body: mapLicenseWritePayload(body) }),
      transformResponse: (res: { data?: Record<string, unknown> } | Record<string, unknown>) => {
        const data = (res as { data?: Record<string, unknown> }).data ?? res;
        return mapLicenseRead(data);
      },
      invalidatesTags: invalidateList(TAG),
    }),

    updateLicense: build.mutation<ILicense, { id: number; body: ILicensePayload }>({
      query: ({ id, body }) => ({ url: ENDPOINTS.UPDATE(id), method: 'PATCH', body: mapLicenseWritePayload(body) }),
      transformResponse: (res: { data?: Record<string, unknown> } | Record<string, unknown>) => {
        const data = (res as { data?: Record<string, unknown> }).data ?? res;
        return mapLicenseRead(data);
      },
      invalidatesTags: (_r, _e, { id }) => [...generateItemTag(TAG, id), ...invalidateList(TAG), { type: 'ChangeLog', id }],
    }),

    deleteLicense: build.mutation<void, number>({
      query: (id) => ({ url: ENDPOINTS.DELETE(id), method: 'DELETE' }),
      invalidatesTags: invalidateList(TAG),
    }),

    updateLicenseImage: build.mutation<ILicense, { id: number; image: File }>({
      query: ({ id, image }) => {
        const formData = new FormData();
        formData.append('image', image);
        return { url: ENDPOINTS.UPDATE(id), method: 'PATCH', body: formData };
      },
      transformResponse: (res: { data?: Record<string, unknown> } | Record<string, unknown>) => {
        const data = (res as { data?: Record<string, unknown> }).data ?? res;
        return mapLicenseRead(data);
      },
      invalidatesTags: (_r, _e, { id }) => [...generateItemTag(TAG, id), ...invalidateList(TAG)],
    }),

    getLicenseHistory: build.query<IChangeLog[], number>({
      query: (id) => ({ url: `${ENDPOINTS.DETAIL(id)}/history` }),
      transformResponse: (res: { data?: IChangeLog[] } | IChangeLog[]) =>
        Array.isArray(res) ? res : res?.data ?? [],
      providesTags: (_result, _error, id) => [{ type: 'ChangeLog', id }],
    }),

    getLicenseFilters: build.query<FilterFacets, void>({
      query: () => ({ url: '/api/labs/licenses/filters' }),
      transformResponse: normalizeFilterFacets,
    }),

    getLicenseProducts: build.query<ILicenseProduct[], void>({
      query: () => ({ url: '/api/labs/licenses/categories/summary' }),
      transformResponse: (res: unknown) => {
        const list = normalizeRefList<Record<string, unknown>>(res);
        return list.map(mapLicenseProduct);
      },
    }),

    getLicenseVendors: build.query<ILicenseVendor[], void>({
      query: () => ({ url: '/api/labs/licenses/filters' }),
      transformResponse: (res: unknown) => {
        const list = normalizeRefList<Record<string, unknown>>(res);
        return list.map(mapLicenseVendor);
      },
    }),

    getLicenseTypes: build.query<ILicenseType[], void>({
      query: () => ({ url: '/api/labs/licenses/filters' }),
      transformResponse: (res: unknown) => {
        const list = normalizeRefList<Record<string, unknown>>(res);
        return list.map(mapLicenseType);
      },
    }),

    getLicenseCategories: build.query<ILicenseCategory[], void>({
      query: () => ({ url: '/api/labs/licenses/categories/summary' }),
      transformResponse: (res: unknown) => {
        const list = normalizeRefList<Record<string, unknown>>(res);
        return list.map(mapLicenseCategory);
      },
    }),

    getLicenseRestrictions: build.query<ILicenseRestriction[], void>({
      query: () => ({ url: '/api/labs/licenses/filters' }),
      transformResponse: (res: unknown) => {
        const list = normalizeRefList<Record<string, unknown>>(res);
        return list.map(mapLicenseRestriction);
      },
    }),

    getLicenseOptions: build.query<DropdownOption[], void>({
      query: () => ({ url: '/api/labs/licenses?page=1&page_size=100' }),
      transformResponse: (res: unknown): DropdownOption[] => {
        const list = normalizeListResponse<Record<string, unknown>>(res);
        return list.data
          .map((item) => ({
            value: (item.id as number) ?? 0,
            label: (item.name as string) ?? (item.sku as string) ?? '',
          }))
          .filter((item) => item.value > 0 && item.label.trim().length > 0);
      },
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetLicensesQuery,
  useGetLicenseStatusSummaryQuery,
  useCreateLicenseMutation,
  useUpdateLicenseMutation,
  useDeleteLicenseMutation,
  useUpdateLicenseImageMutation,
  useGetLicenseHistoryQuery,
  useGetLicenseFiltersQuery,
  useGetLicenseProductsQuery,
  useGetLicenseVendorsQuery,
  useGetLicenseTypesQuery,
  useGetLicenseCategoriesQuery,
  useGetLicenseRestrictionsQuery,
  useGetLicenseOptionsQuery,
} = licenseRtkApi;

export function useGetLicenseByIdQuery(
  id: number | typeof skipToken,
  options?: Parameters<typeof licenseRtkApi.endpoints.getLicenseById.useQuery>[1],
) {
  return licenseRtkApi.endpoints.getLicenseById.useQuery(
    id === skipToken ? skipToken : id,
    options,
  );
}
