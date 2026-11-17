import { baseApi } from '@/shared/lib/api';
import type { DeviceConnectionPage } from '../types/deviceConnections';

export const DEVICE_CONNECTIONS_PAGE_SIZE = 20;

/**
 * Current device observations of one computer. Handwritten over the generated types so it
 * shares the `Monitoring` cache tag that agent lifecycle actions invalidate.
 */
export const deviceConnectionsApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getDeviceConnections: build.query<DeviceConnectionPage, { computerId: number; page: number }>({
      query: ({ computerId, page }) => ({
        url: '/api/labs/device-connections',
        params: { computer_id: computerId, page, page_size: DEVICE_CONNECTIONS_PAGE_SIZE },
      }),
      providesTags: (_result, _error, { computerId }) => [{ type: 'Monitoring' as const, id: computerId }],
    }),
  }),
});

export const { useGetDeviceConnectionsQuery } = deviceConnectionsApi;
