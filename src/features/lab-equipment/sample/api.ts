import { baseApi } from '@/shared/lib/api';
import { skipToken } from '@reduxjs/toolkit/query';
import {
  useLabsEquipmentRetrieveByIdQuery,
  useLabsEquipmentOptionsRetrieveQuery,
  useLabsEquipmentReferenceDataRetrieveQuery,
} from '@/shared/api/generated/api';
import { generateListTags, generateItemTag, invalidateList } from '@/shared/lib/api/tagHelpers';
import { createResourceEndpoints, normalizeListResponse } from '@/shared/lib/api/endpointHelpers';
import { withGeneratedData } from '@/shared/lib/api/generatedAdapters';
import type {
  ISample, ISampleListResponse, ISampleParams, ISamplePayload,
} from './types';
import type { IChangeLog } from '../shared/types/equipment.types';
import {
  mapSampleChannel,
  mapSampleCharacteristic,
  mapSampleKL,
  mapSampleManufacturer,
  mapSampleOEM,
  mapSampleProductLine,
  mapSampleRead,
  mapSampleType,
  mapSampleVersion,
  mapSampleWritePayload,
} from './mapper';
import { normalizeFilterFacets, type FilterFacets } from '../shared/facets/filterFacets';

type DropdownOption = { value: number; label: string };

const ENDPOINTS = createResourceEndpoints('labs/equipment/sample');
const TAG = 'Sample';

export const sampleRtkApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getSamples: build.query<ISampleListResponse, ISampleParams>({
      query: (params) => ({ url: ENDPOINTS.LIST, params }),
      transformResponse: (res: unknown) => {
        const normalized = normalizeListResponse<unknown>(res);
        return { ...normalized, data: normalized.data.map(mapSampleRead) };
      },
      providesTags: (result) => generateListTags(TAG, result),
    }),
    createSample: build.mutation<ISample, ISamplePayload>({
      query: (body) => ({ url: ENDPOINTS.CREATE, method: 'POST', body: mapSampleWritePayload(body) }),
      transformResponse: (res: { data: unknown }) => mapSampleRead(res.data),
      invalidatesTags: invalidateList(TAG),
    }),
    updateSample: build.mutation<ISample, { id: number; body: ISamplePayload }>({
      query: ({ id, body }) => ({ url: ENDPOINTS.UPDATE(id), method: 'PATCH', body: mapSampleWritePayload(body) }),
      transformResponse: (res: { data: unknown }) => mapSampleRead(res.data),
      invalidatesTags: (_r, _e, { id }) => [...generateItemTag(TAG, id), ...invalidateList(TAG), { type: 'ChangeLog', id }],
    }),
    deleteSample: build.mutation<void, number>({
      query: (id) => ({ url: ENDPOINTS.DELETE(id), method: 'DELETE' }),
      invalidatesTags: invalidateList(TAG),
    }),
    updateSampleImage: build.mutation<ISample, { id: number; image: File }>({
      query: ({ id, image }) => {
        const formData = new FormData();
        formData.append('image', image);
        return { url: ENDPOINTS.UPDATE(id), method: 'PATCH', body: formData };
      },
      transformResponse: (res: { data: unknown }) => mapSampleRead(res.data),
      async onQueryStarted({ id }, { dispatch, getState, queryFulfilled }) {
        try {
          const { data: updated } = await queryFulfilled;
          const cachedArgs = sampleRtkApi.util.selectCachedArgsForQuery(
            getState() as Parameters<typeof sampleRtkApi.util.selectCachedArgsForQuery>[0],
            'getSamples',
          );
          cachedArgs.forEach((args) => {
            dispatch(
              sampleRtkApi.util.updateQueryData('getSamples', args, (draft) => {
                const item = draft.data.find((sample) => sample.id === id);
                if (item) item.image = updated.image ?? null;
              }),
            );
          });
        } catch {
          // fallback to natural refetch paths if update fails
        }
      },
      invalidatesTags: [],
    }),
    getSampleHistory: build.query<IChangeLog[], number>({
      query: (id) => ({ url: `/api/labs/equipment/sample/${id}/history` }),
      transformResponse: (res: { data?: IChangeLog[] } | IChangeLog[]) =>
        Array.isArray(res) ? res : res?.data ?? [],
      providesTags: (_result, _error, id) => [{ type: 'ChangeLog', id }],
    }),
    getSampleFilters: build.query<FilterFacets, void>({
      query: () => ({ url: '/api/labs/equipment/sample/filters' }),
      transformResponse: normalizeFilterFacets,
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetSamplesQuery,
  useCreateSampleMutation,
  useUpdateSampleMutation,
  useDeleteSampleMutation,
  useUpdateSampleImageMutation,
  useGetSampleHistoryQuery,
  useGetSampleFiltersQuery,
} = sampleRtkApi;

export function useGetSampleByIdQuery(
  id: number | typeof skipToken,
  options?: Parameters<typeof useLabsEquipmentRetrieveByIdQuery>[1],
) {
  const result = useLabsEquipmentRetrieveByIdQuery(id === skipToken ? skipToken : { id }, options);
  return withGeneratedData(result, result.data ? mapSampleRead(result.data.data) : undefined);
}

export const useGetSampleManufacturersQuery = () => {
  const result = useLabsEquipmentReferenceDataRetrieveQuery({});
  return { ...result, data: (result.data?.data?.manufacturers ?? []).map(mapSampleManufacturer) };
};

export const useGetSampleProductLinesQuery = () => {
  const result = useLabsEquipmentReferenceDataRetrieveQuery({});
  return { ...result, data: (result.data?.data?.product_models ?? []).map(mapSampleProductLine) };
};

export const useGetSampleVersionsQuery = () => {
  const result = useLabsEquipmentReferenceDataRetrieveQuery({});
  return { ...result, data: (result.data?.data?.kinds ?? []).map(mapSampleVersion) };
};

export const useGetSampleTypesQuery = () => {
  const result = useLabsEquipmentReferenceDataRetrieveQuery({});
  return { ...result, data: (result.data?.data?.types ?? []).map(mapSampleType) };
};

export const useGetSampleOEMsQuery = () => {
  const result = useLabsEquipmentReferenceDataRetrieveQuery({});
  return { ...result, data: (result.data?.data?.customers ?? []).map(mapSampleOEM) };
};

export const useGetSampleKLsQuery = () => {
  const result = useLabsEquipmentReferenceDataRetrieveQuery({});
  return { ...result, data: (result.data?.data?.groups ?? []).map(mapSampleKL) };
};

export const useGetSampleChannelsQuery = () => {
  const result = useLabsEquipmentReferenceDataRetrieveQuery({});
  return { ...result, data: (result.data?.data?.interfaces ?? []).map(mapSampleChannel) };
};

export const useGetSampleCharacteristicsQuery = () => {
  const result = useLabsEquipmentReferenceDataRetrieveQuery({});
  return { ...result, data: (result.data?.data?.characteristics ?? []).map(mapSampleCharacteristic) };
};

export function useGetSampleOptionsQuery(
  options?: Parameters<typeof useLabsEquipmentOptionsRetrieveQuery>[0],
) {
  const result = useLabsEquipmentOptionsRetrieveQuery(options ?? { q: 'sample' });
  const data: DropdownOption[] = (result.data?.data ?? []).map((item) => ({
    value: item.id,
    label: item.sku ? `${item.name} (${item.sku})` : item.name,
  }));
  return { ...result, data };
}
