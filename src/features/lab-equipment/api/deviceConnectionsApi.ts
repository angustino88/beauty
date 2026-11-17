import { baseApi } from '@/shared/lib/api';
import type { DeviceConnectionPage } from '../types/deviceConnections';

export const DEVICE_CONNECTIONS_PAGE_SIZE = 20;

/**
 * Current device observations of one computing equipment. Handwritten over the generated types so it
 * shares the `Monitoring` cache tag that agent lifecycle actions invalidate.
 */
export const deviceConnectionsApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getDeviceConnections: build.query<DeviceConnectionPage, { computingId: number; page: number }>({
      query: ({ computingId, page }) => ({
        url: '/api/labs/device-connections',
        params: { computing_id: computingId, page, page_size: DEVICE_CONNECTIONS_PAGE_SIZE },
      }),
      providesTags: (_result, _error, { computingId }) => [{ type: 'Monitoring' as const, id: computingId }],
    }),
  }),
});

export const { useGetDeviceConnectionsQuery } = deviceConnectionsApi;
