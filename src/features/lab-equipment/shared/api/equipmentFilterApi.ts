import { baseApi } from '@/shared/lib/api';
import { normalizeListResponse } from '@/shared/lib/api/endpointHelpers';

export type EquipmentFilterRules = {
  single: string[];
  multiple: string[];
  reverse?: string[];
};

export type EquipmentFilterRequest = {
  filter_params: Record<string, unknown>;
  filter_key: string;
  page?: number;
};

export type EquipmentFilterResponse<T> = {
  total_count: number;
  data: T[];
};

/**
 * Column filters are served by the resource list endpoints, which take CSV query params
 * (`country_id=1,2`). Table filter keys that have no server-side filter are not listed here;
 * the table applies those on the loaded page instead.
 */
const LIST_FILTERS: Record<string, { url: string; params: Record<string, string> }> = {
  Room: {
    url: '/api/labs/rooms',
    params: {
      country: 'country_id',
      city: 'city_id',
      building: 'building_id',
      primary_owner: 'owner_id',
      status: 'status',
      lifecycle_status: 'lifecycle_status',
      access_policy: 'access_policy',
      condition: 'condition',
      activity_status: 'activity_status',
    },
  },
  License: {
    url: '/api/labs/licenses',
    params: { primary_owner: 'owner_id', status: 'status' },
  },
};

/** Table filter keys the server can filter on for this resource. */
export function serverFilterKeys(filterKey: string): string[] {
  return Object.keys(LIST_FILTERS[filterKey]?.params ?? {});
}

export const equipmentFilterApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    filterEquipment: build.query<
      EquipmentFilterResponse<unknown>,
      EquipmentFilterRequest
    >({
      query: ({ page, filter_key, filter_params }) => {
        const config = LIST_FILTERS[filter_key];
        const params: Record<string, string | number> = {};
        if (page) params.page = page;
        for (const [key, value] of Object.entries(filter_params)) {
          const target = config?.params[key];
          if (!target || value == null) continue;
          const text = Array.isArray(value) ? value.join(',') : String(value);
          if (text) params[target] = text;
        }
        return { url: config?.url ?? '/api/labs/rooms', params };
      },
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
