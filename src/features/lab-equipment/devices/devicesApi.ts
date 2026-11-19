import { baseApi } from '@/shared/lib/api';
import type {
  LabsDeviceConnectionsActionsLinkCreateByConnectionIdApiResponse,
  LabsDeviceConnectionsRetrieveByConnectionIdApiResponse,
  LabsDeviceConnectionsSummaryRetrieveApiResponse,
  LabsEquipmentHardwareIdsCreateByEquipmentIdApiResponse,
  LabsExpectedDevicesLegacySuggestionsRetrieveApiResponse,
  LabsEquipmentHardwareIdsRetrieveByEquipmentIdApiResponse,
  RegisterHardwareIdRequest,
  LabsExpectedDevicesCreateApiResponse,
  LabsExpectedDevicesPartialUpdateByExpectedDeviceIdApiResponse,
} from '@/shared/api/generated/api';
import type { DeviceConnectionFilters, DeviceConnectionPage, ExpectedDevicePage, KnownPresence } from './types';

export const DEVICE_CONNECTIONS_PAGE_SIZE = 20;

/**
 * Device monitoring endpoints. Handwritten over the generated types so every read shares the
 * `Monitoring` cache tag: linking, expectation changes and agent lifecycle actions refresh them all.
 */
export const devicesApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getDeviceConnections: build.query<DeviceConnectionPage, DeviceConnectionFilters>({
      query: ({ computingId, benchId, state, isAttentionRequired, q, page, pageSize }) => ({
        url: '/api/labs/device-connections',
        params: {
          computing_id: computingId,
          bench_id: benchId,
          state,
          is_attention_required: isAttentionRequired,
          q: q || undefined,
          page,
          page_size: pageSize ?? DEVICE_CONNECTIONS_PAGE_SIZE,
        },
      }),
      providesTags: ['Monitoring'],
    }),
    getDeviceConnectionSummary: build.query<LabsDeviceConnectionsSummaryRetrieveApiResponse['data'], { benchId?: number }>({
      query: ({ benchId }) => ({ url: '/api/labs/device-connections/summary', params: { bench_id: benchId } }),
      transformResponse: (response: LabsDeviceConnectionsSummaryRetrieveApiResponse) => response.data,
      providesTags: ['Monitoring'],
    }),
    getDeviceConnection: build.query<LabsDeviceConnectionsRetrieveByConnectionIdApiResponse['data'], number>({
      query: (connectionId) => ({ url: `/api/labs/device-connections/${connectionId}` }),
      transformResponse: (response: LabsDeviceConnectionsRetrieveByConnectionIdApiResponse) => response.data,
      providesTags: ['Monitoring'],
    }),
    linkDeviceConnection: build.mutation<
      LabsDeviceConnectionsActionsLinkCreateByConnectionIdApiResponse['data'],
      { connectionId: number; equipmentId: number }
    >({
      query: ({ connectionId, equipmentId }) => ({
        url: `/api/labs/device-connections/${connectionId}/actions/link`,
        method: 'POST',
        body: { equipment_id: equipmentId },
      }),
      transformResponse: (response: LabsDeviceConnectionsActionsLinkCreateByConnectionIdApiResponse) => response.data,
      invalidatesTags: ['Monitoring'],
    }),
    getExpectedDevices: build.query<
      ExpectedDevicePage,
      { computingId?: number; benchId?: number; presence?: KnownPresence; page?: number; pageSize?: number }
    >({
      query: ({ computingId, benchId, presence, page, pageSize }) => ({
        url: '/api/labs/expected-devices',
        params: { computing_id: computingId, bench_id: benchId, presence, page: page ?? 1, page_size: pageSize ?? 20 },
      }),
      providesTags: ['Monitoring'],
    }),
    createExpectedDevice: build.mutation<
      LabsExpectedDevicesCreateApiResponse['data'],
      { computingId: number; equipmentId: number; isDisconnectAlertEnabled: boolean }
    >({
      query: ({ computingId, equipmentId, isDisconnectAlertEnabled }) => ({
        url: '/api/labs/expected-devices',
        method: 'POST',
        body: { computing_id: computingId, equipment_id: equipmentId, is_disconnect_alert_enabled: isDisconnectAlertEnabled },
      }),
      transformResponse: (response: LabsExpectedDevicesCreateApiResponse) => response.data,
      invalidatesTags: ['Monitoring'],
    }),
    updateExpectedDevice: build.mutation<
      LabsExpectedDevicesPartialUpdateByExpectedDeviceIdApiResponse['data'],
      { expectedDeviceId: number; isDisconnectAlertEnabled: boolean }
    >({
      query: ({ expectedDeviceId, isDisconnectAlertEnabled }) => ({
        url: `/api/labs/expected-devices/${expectedDeviceId}`,
        method: 'PATCH',
        body: { is_disconnect_alert_enabled: isDisconnectAlertEnabled },
      }),
      transformResponse: (response: LabsExpectedDevicesPartialUpdateByExpectedDeviceIdApiResponse) => response.data,
      invalidatesTags: ['Monitoring'],
    }),
    deleteExpectedDevice: build.mutation<void, number>({
      query: (expectedDeviceId) => ({ url: `/api/labs/expected-devices/${expectedDeviceId}`, method: 'DELETE' }),
      invalidatesTags: ['Monitoring'],
    }),
    getLegacyDeviceSuggestions: build.query<
      LabsExpectedDevicesLegacySuggestionsRetrieveApiResponse['data']['items'],
      number
    >({
      query: (computingId) => ({ url: '/api/labs/expected-devices/legacy-suggestions', params: { computing_id: computingId } }),
      transformResponse: (response: LabsExpectedDevicesLegacySuggestionsRetrieveApiResponse) => response.data.items,
      providesTags: ['Monitoring'],
    }),
    getEquipmentHardwareIds: build.query<
      LabsEquipmentHardwareIdsRetrieveByEquipmentIdApiResponse['data']['items'],
      number
    >({
      query: (equipmentId) => ({ url: `/api/labs/equipment/${equipmentId}/hardware-ids` }),
      transformResponse: (response: LabsEquipmentHardwareIdsRetrieveByEquipmentIdApiResponse) => response.data.items,
      providesTags: ['Monitoring'],
    }),
    registerEquipmentHardwareId: build.mutation<
      LabsEquipmentHardwareIdsCreateByEquipmentIdApiResponse['data'],
      { equipmentId: number } & RegisterHardwareIdRequest
    >({
      query: ({ equipmentId, ...body }) => ({
        url: `/api/labs/equipment/${equipmentId}/hardware-ids`,
        method: 'POST',
        body,
      }),
      transformResponse: (response: LabsEquipmentHardwareIdsCreateByEquipmentIdApiResponse) => response.data,
      invalidatesTags: ['Monitoring'],
    }),
    deleteEquipmentHardwareId: build.mutation<void, { equipmentId: number; hardwareIdId: number }>({
      query: ({ equipmentId, hardwareIdId }) => ({
        url: `/api/labs/equipment/${equipmentId}/hardware-ids/${hardwareIdId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Monitoring'],
    }),
  }),
});

export const {
  useGetDeviceConnectionsQuery,
  useGetDeviceConnectionSummaryQuery,
  useGetDeviceConnectionQuery,
  useLinkDeviceConnectionMutation,
  useGetExpectedDevicesQuery,
  useCreateExpectedDeviceMutation,
  useUpdateExpectedDeviceMutation,
  useDeleteExpectedDeviceMutation,
  useGetLegacyDeviceSuggestionsQuery,
  useGetEquipmentHardwareIdsQuery,
  useRegisterEquipmentHardwareIdMutation,
  useDeleteEquipmentHardwareIdMutation,
} = devicesApi;
