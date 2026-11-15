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
import { resourceImageFormData, resourceImageUrl } from '@/shared/lib/api/resourceImage';

type DropdownOption = { value: number; label: string };

const ENDPOINTS = createResourceEndpoints('labs/licenses');
const TAG = 'License';

export const licenseRtkApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getLicenses: build.query<ILicenseListResponse, ILicenseParams>({
      query: (params) => {
        const { search, ...rest } = params;
        const listParams = { ...rest, q: search };
        const query = buildSortableListQuery(listParams);
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
      // The SKU is fixed at creation: the API answers 409 when a PATCH carries it.
      query: ({ id, body }) => {
        const changes = mapLicenseWritePayload(body);
        delete changes.sku;
        return { url: ENDPOINTS.UPDATE(id), method: 'PATCH', body: changes };
      },
      transformResponse: (res: { data?: Record<string, unknown> } | Record<string, unknown>) => {
        const data = (res as { data?: Record<string, unknown> }).data ?? res;
        return mapLicenseRead(data);
      },
      invalidatesTags: (_r, _e, { id }) => [...generateItemTag(TAG, id), ...invalidateList(TAG), { type: 'ChangeLog', id }],
    }),

    // Status is its own action, not a field of the license body.
    changeLicenseStatus: build.mutation<void, { id: number; status: string; details?: Record<string, unknown> }>({
      query: ({ id, status, details }) => ({
        url: `${ENDPOINTS.DETAIL(id)}/actions/change-status`,
        method: 'POST',
        body: { status, details: details ?? {} },
      }),
      invalidatesTags: (_r, _e, { id }) => [...generateItemTag(TAG, id), ...invalidateList(TAG), { type: 'ChangeLog', id }],
    }),

    // Seats are held by equipment: assign and release are their own actions, not license fields.
    assignLicense: build.mutation<void, { licenseId: number; equipmentId: number }>({
      query: ({ licenseId, equipmentId }) => ({
        url: `${ENDPOINTS.DETAIL(licenseId)}/actions/assign`,
        method: 'POST',
        body: { equipment_id: equipmentId },
      }),
      invalidatesTags: (_r, _e, { licenseId }) => [...generateItemTag(TAG, licenseId), ...invalidateList(TAG), 'Equipment', 'ResourceMapping'],
    }),

    releaseLicense: build.mutation<void, { licenseId: number; equipmentId: number }>({
      query: ({ licenseId, equipmentId }) => ({
        url: `${ENDPOINTS.DETAIL(licenseId)}/actions/assign`,
        method: 'DELETE',
        body: { equipment_id: equipmentId },
      }),
      invalidatesTags: (_r, _e, { licenseId }) => [...generateItemTag(TAG, licenseId), ...invalidateList(TAG), 'Equipment', 'ResourceMapping'],
    }),

    deleteLicense: build.mutation<void, number>({
      query: (id) => ({ url: ENDPOINTS.DELETE(id), method: 'DELETE' }),
      invalidatesTags: invalidateList(TAG),
    }),

    updateLicenseImage: build.mutation<void, { id: number; image: File }>({
      query: ({ id, image }) => ({
        url: resourceImageUrl('licenses', id),
        method: 'PUT',
        body: resourceImageFormData(image),
      }),
      invalidatesTags: (_r, _e, { id }) => [...generateItemTag(TAG, id), ...invalidateList(TAG)],
    }),

    deleteLicenseImage: build.mutation<void, number>({
      query: (id) => ({ url: resourceImageUrl('licenses', id), method: 'DELETE' }),
      invalidatesTags: (_r, _e, id) => [...generateItemTag(TAG, id), ...invalidateList(TAG)],
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
      query: () => ({ url: '/api/labs/license-products/options' }),
      transformResponse: (res: unknown) => {
        const list = normalizeRefList<Record<string, unknown>>(res);
        return list.map(mapLicenseProduct);
      },
    }),

    getLicenseVendors: build.query<ILicenseVendor[], void>({
      query: () => ({ url: '/api/labs/license-vendors/options' }),
      transformResponse: (res: unknown) => {
        const list = normalizeRefList<Record<string, unknown>>(res);
        return list.map(mapLicenseVendor);
      },
    }),

    getLicenseTypes: build.query<ILicenseType[], void>({
      query: () => ({ url: '/api/labs/license-types/options' }),
      transformResponse: (res: unknown) => {
        const list = normalizeRefList<Record<string, unknown>>(res);
        return list.map(mapLicenseType);
      },
    }),

    getLicenseCategories: build.query<ILicenseCategory[], void>({
      query: () => ({ url: '/api/labs/license-categories/options' }),
      transformResponse: (res: unknown) => {
        const list = normalizeRefList<Record<string, unknown>>(res);
        return list.map(mapLicenseCategory);
      },
    }),

    getLicenseRestrictions: build.query<ILicenseRestriction[], void>({
      query: () => ({ url: '/api/labs/license-restrictions/options' }),
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
  useChangeLicenseStatusMutation,
  useAssignLicenseMutation,
  useReleaseLicenseMutation,
  useDeleteLicenseImageMutation,
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
