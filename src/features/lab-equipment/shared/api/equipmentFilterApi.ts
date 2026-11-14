import { baseApi } from '@/shared/lib/api';
import { normalizeListResponse } from '@/shared/lib/api/endpointHelpers';

export type EquipmentFilterRules = {
  single: string[];
  multiple: string[];
  reverse?: string[];
};

export type EquipmentFilterRequest = {
  filter_params: Record<string, unknown>;
  filter_rules: EquipmentFilterRules;
  filter_key: string;
  page?: number;
};

export type EquipmentFilterResponse<T> = {
  total_count: number;
  data: T[];
};

export const equipmentFilterApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    filterEquipment: build.query<
      EquipmentFilterResponse<unknown>,
      EquipmentFilterRequest
    >({
      query: ({ page, ...body }) => ({
        url: '/api/labs/lab-filter/',
        method: 'POST',
        params: page ? { page } : undefined,
        body,
      }),
      transformResponse: (res: unknown) => normalizeListResponse<unknown>(res),
      providesTags: (_result, _error, { filter_key }) =>
        filter_key === 'Room' || filter_key === 'License' || filter_key === 'Sample'
          ? [{ type: filter_key, id: 'LIST' }]
          : [],
    }),
  }),
  overrideExisting: false,
});

export const { useFilterEquipmentQuery } = equipmentFilterApi;