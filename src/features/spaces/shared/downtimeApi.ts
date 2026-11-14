import { baseApi } from '@/shared/lib/api';
import type { Downtime, DowntimeState, ResourceType, ScheduleDowntimeRequest } from './resourceStatus.ts';
import {
  mapDowntimeItem,
  mapDowntimeListResponse,
  type DowntimeListResponse,
} from './downtimeMapper.ts';

export interface DowntimeListParams {
  resource_type?: ResourceType;
  resource_id?: number;
  state?: DowntimeState;
  page?: number;
  page_size?: number;
}

export type { DowntimeListResponse };
export { mapDowntimeItem, mapDowntimeListResponse };

const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);

export const downtimeApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getDowntimes: build.query<DowntimeListResponse, DowntimeListParams>({
      query: (params) => ({
        url: '/api/labs/downtimes',
        params,
      }),
      transformResponse: mapDowntimeListResponse,
      providesTags: (result) =>
        result
          ? [
              ...result.data.map(({ id }) => ({ type: 'Downtime' as const, id })),
              { type: 'Downtime', id: 'LIST' },
            ]
          : [{ type: 'Downtime', id: 'LIST' }],
    }),

    getDowntimeById: build.query<Downtime, number>({
      query: (id) => ({ url: `/api/labs/downtimes/${id}` }),
      transformResponse: (res: unknown) => {
        const envelope = isRecord(res) ? res : {};
        const data = envelope.data ?? envelope;
        return mapDowntimeItem(data);
      },
      providesTags: (_res, _err, id) => [{ type: 'Downtime', id }],
    }),

    createDowntime: build.mutation<Downtime, ScheduleDowntimeRequest>({
      query: (body) => ({
        url: '/api/labs/downtimes',
        method: 'POST',
        body,
      }),
      transformResponse: (res: unknown) => {
        const envelope = isRecord(res) ? res : {};
        const data = envelope.data ?? envelope;
        return mapDowntimeItem(data);
      },
      invalidatesTags: [
        { type: 'Downtime', id: 'LIST' },
        { type: 'Room', id: 'LIST' },
        { type: 'Station', id: 'LIST' },
        { type: 'Bench', id: 'LIST' },
        { type: 'Equipment', id: 'LIST' },
      ],
    }),

    cancelDowntime: build.mutation<Downtime, number>({
      query: (downtimeId) => ({
        url: `/api/labs/downtimes/${downtimeId}/actions/cancel`,
        method: 'POST',
      }),
      transformResponse: (res: unknown) => {
        const envelope = isRecord(res) ? res : {};
        const data = envelope.data ?? envelope;
        return mapDowntimeItem(data);
      },
      invalidatesTags: (_res, _err, id) => [
        { type: 'Downtime', id },
        { type: 'Downtime', id: 'LIST' },
        { type: 'Room', id: 'LIST' },
        { type: 'Station', id: 'LIST' },
        { type: 'Bench', id: 'LIST' },
        { type: 'Equipment', id: 'LIST' },
      ],
    }),

    endDowntime: build.mutation<Downtime, number>({
      query: (downtimeId) => ({
        url: `/api/labs/downtimes/${downtimeId}/actions/end`,
        method: 'POST',
      }),
      transformResponse: (res: unknown) => {
        const envelope = isRecord(res) ? res : {};
        const data = envelope.data ?? envelope;
        return mapDowntimeItem(data);
      },
      invalidatesTags: (_res, _err, id) => [
        { type: 'Downtime', id },
        { type: 'Downtime', id: 'LIST' },
        { type: 'Room', id: 'LIST' },
        { type: 'Station', id: 'LIST' },
        { type: 'Bench', id: 'LIST' },
        { type: 'Equipment', id: 'LIST' },
      ],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetDowntimesQuery,
  useLazyGetDowntimesQuery,
  useGetDowntimeByIdQuery,
  useCreateDowntimeMutation,
  useCancelDowntimeMutation,
  useEndDowntimeMutation,
} = downtimeApi;
