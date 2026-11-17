import { baseApi } from '@/shared/lib/api';
import type { DeviceConnectionPage } from '../types/deviceConnections';

export const deviceConnectionsApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getDeviceConnections: build.query<DeviceConnectionPage, { computerId: number; page: number }>({
      query: ({ computerId, page }) => ({
        url: '/api/labs/device-connections',
        params: { computer_id: computerId, page, page_size: 20 },
      }),
      providesTags: (_result, _error, { computerId }) => [{ type: 'Monitoring', id: computerId }],
    }),
  }),
});

export const { useGetDeviceConnectionsQuery } = deviceConnectionsApi;
