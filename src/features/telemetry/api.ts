import { baseApi } from '@/shared/lib/api';
import type {
  Channel,
  ChannelsFromProfileInput,
  Device,
  DeviceDetail,
  DeviceListParams,
  DeviceProfile,
  Metric,
  ModbusSettingsInput,
  Page,
  ProfileCreateInput,
  SourceCreateInput,
  TargetOverview,
  TargetType,
} from './types';

const BASE = '/api/labs/telemetry';
const DEVICE = 'TelemetryDevice' as const;
const PROFILE = 'TelemetryProfile' as const;
const TARGET = 'TelemetryTarget' as const;

type Envelope<T> = { data: T };
const unwrap = <T,>(response: Envelope<T>): T => response.data;

/** Every configuration change can alter device lists, details and the per-target tabs. */
const deviceChanged = (id?: number) => [
  { type: DEVICE, id: 'LIST' as const },
  ...(id ? [{ type: DEVICE, id }] : []),
  { type: TARGET, id: 'ALL' as const },
];

function query(params: object): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') search.set(key, String(value));
  }
  const text = search.toString();
  return text ? `?${text}` : '';
}

export interface OptionItem {
  id: number;
  sku: string | null;
  name: string;
}

export const telemetryApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    // ---- reference data ------------------------------------------------------------------------
    getTelemetryMetrics: build.query<Metric[], void>({
      query: () => `${BASE}/metrics?page_size=100`,
      transformResponse: (response: Page<Metric>) => response.data,
    }),
    getDeviceProfiles: build.query<Page<DeviceProfile>, { status?: string; q?: string; page?: number; page_size?: number }>({
      query: (params) => `${BASE}/device-profiles${query(params)}`,
      providesTags: (result) => [
        ...(result?.data ?? []).map(({ id }) => ({ type: PROFILE, id })),
        { type: PROFILE, id: 'LIST' },
      ],
    }),
    createDeviceProfile: build.mutation<DeviceProfile, ProfileCreateInput>({
      query: (body) => ({ url: `${BASE}/device-profiles`, method: 'POST', body }),
      transformResponse: unwrap<DeviceProfile>,
      invalidatesTags: [{ type: PROFILE, id: 'LIST' }],
    }),
    approveDeviceProfile: build.mutation<DeviceProfile, number>({
      query: (id) => ({ url: `${BASE}/device-profiles/${id}/actions/approve`, method: 'POST' }),
      transformResponse: unwrap<DeviceProfile>,
      invalidatesTags: (_result, _error, id) => [{ type: PROFILE, id }, { type: PROFILE, id: 'LIST' }],
    }),

    // ---- devices -------------------------------------------------------------------------------
    getTelemetryDevices: build.query<Page<Device>, DeviceListParams>({
      query: (params) => `${BASE}/devices${query(params)}`,
      providesTags: (result) => [
        ...(result?.data ?? []).map(({ id }) => ({ type: DEVICE, id })),
        { type: DEVICE, id: 'LIST' },
      ],
    }),
    getTelemetryDevice: build.query<DeviceDetail, number>({
      query: (id) => `${BASE}/devices/${id}`,
      transformResponse: unwrap<DeviceDetail>,
      providesTags: (_result, _error, id) => [{ type: DEVICE, id }],
    }),
    createSource: build.mutation<DeviceDetail, SourceCreateInput>({
      query: (body) => ({ url: `${BASE}/sources`, method: 'POST', body }),
      transformResponse: unwrap<DeviceDetail>,
      invalidatesTags: () => deviceChanged(),
    }),
    claimSource: build.mutation<
      DeviceDetail,
      { id: number; body: Omit<SourceCreateInput, 'kind' | 'device_uid'> }
    >({
      query: ({ id, body }) => ({ url: `${BASE}/devices/${id}/actions/claim`, method: 'POST', body }),
      transformResponse: unwrap<DeviceDetail>,
      invalidatesTags: (_result, _error, { id }) => deviceChanged(id),
    }),
    updateSource: build.mutation<
      DeviceDetail,
      {
        id: number;
        body: Partial<{
          install_location_type: TargetType;
          install_location_id: number;
          modbus: ModbusSettingsInput;
          manufacturer: string;
          model: string;
        }>;
      }
    >({
      query: ({ id, body }) => ({ url: `${BASE}/sources/${id}`, method: 'PATCH', body }),
      transformResponse: unwrap<DeviceDetail>,
      invalidatesTags: (_result, _error, { id }) => deviceChanged(id),
    }),
    retireDevice: build.mutation<DeviceDetail, number>({
      query: (id) => ({ url: `${BASE}/devices/${id}/actions/retire`, method: 'POST' }),
      transformResponse: unwrap<DeviceDetail>,
      invalidatesTags: (_result, _error, id) => deviceChanged(id),
    }),
    registerGateway: build.mutation<DeviceDetail, { equipment_id: number; kind: 'room_host' | 'station_pc' }>({
      query: (body) => ({ url: `${BASE}/gateways`, method: 'POST', body }),
      transformResponse: unwrap<DeviceDetail>,
      invalidatesTags: () => deviceChanged(),
    }),
    bindGatewayScope: build.mutation<unknown, { id: number; target_type: TargetType; target_id: number }>({
      query: ({ id, ...body }) => ({ url: `${BASE}/gateways/${id}/actions/bind-scope`, method: 'POST', body }),
      invalidatesTags: (_result, _error, { id }) => deviceChanged(id),
    }),

    // ---- channels ------------------------------------------------------------------------------
    createChannelsFromProfile: build.mutation<DeviceDetail, { sourceId: number; body: ChannelsFromProfileInput }>({
      query: ({ sourceId, body }) => ({ url: `${BASE}/sources/${sourceId}/channels`, method: 'POST', body }),
      transformResponse: unwrap<DeviceDetail>,
      invalidatesTags: (_result, _error, { sourceId }) => deviceChanged(sourceId),
    }),
    bindSourceTarget: build.mutation<DeviceDetail, { sourceId: number; target_type: TargetType; target_id: number }>({
      query: ({ sourceId, ...body }) => ({
        url: `${BASE}/sources/${sourceId}/actions/bind-target`,
        method: 'POST',
        body,
      }),
      transformResponse: unwrap<DeviceDetail>,
      invalidatesTags: (_result, _error, { sourceId }) => deviceChanged(sourceId),
    }),
    updateChannel: build.mutation<
      Channel,
      { id: number; sourceId: number; body: Partial<{ label: string; is_enabled: boolean; field_device_equipment_id: number | null }> }
    >({
      query: ({ id, body }) => ({ url: `${BASE}/channels/${id}`, method: 'PATCH', body }),
      transformResponse: unwrap<Channel>,
      invalidatesTags: (_result, _error, { sourceId }) => deviceChanged(sourceId),
    }),
    bindChannelTarget: build.mutation<
      Channel,
      { id: number; sourceId: number; target_type: TargetType; target_id: number }
    >({
      query: ({ id, target_type, target_id }) => ({
        url: `${BASE}/channels/${id}/actions/bind-target`,
        method: 'POST',
        body: { target_type, target_id },
      }),
      transformResponse: unwrap<Channel>,
      invalidatesTags: (_result, _error, { sourceId }) => deviceChanged(sourceId),
    }),
    unbindChannel: build.mutation<Channel, { id: number; sourceId: number }>({
      query: ({ id }) => ({ url: `${BASE}/channels/${id}/actions/unbind`, method: 'POST' }),
      transformResponse: unwrap<Channel>,
      invalidatesTags: (_result, _error, { sourceId }) => deviceChanged(sourceId),
    }),

    // ---- per-target overview -------------------------------------------------------------------
    getTargetTelemetry: build.query<TargetOverview, { type: TargetType; id: number }>({
      query: ({ type, id }) => `${BASE}/targets/${type}/${id}`,
      transformResponse: unwrap<TargetOverview>,
      providesTags: [{ type: TARGET, id: 'ALL' }],
    }),

    // ---- selector data from existing features (OPT-2: {id, sku, name}) -------------------------
    getTargetOptions: build.query<OptionItem[], { type: TargetType; q?: string; room_id?: number }>({
      query: ({ type, q, room_id }) => {
        const path = { room: 'rooms', station: 'stations', bench: 'benches', equipment: 'equipment' }[type];
        return `/api/labs/${path}/options${query({ q, room_id })}`;
      },
      transformResponse: (response: Page<OptionItem>) => response.data,
    }),

  }),
});

export const {
  useGetTelemetryMetricsQuery,
  useGetDeviceProfilesQuery,
  useCreateDeviceProfileMutation,
  useApproveDeviceProfileMutation,
  useGetTelemetryDevicesQuery,
  useGetTelemetryDeviceQuery,
  useCreateSourceMutation,
  useClaimSourceMutation,
  useUpdateSourceMutation,
  useRetireDeviceMutation,
  useRegisterGatewayMutation,
  useBindGatewayScopeMutation,
  useCreateChannelsFromProfileMutation,
  useBindSourceTargetMutation,
  useUpdateChannelMutation,
  useBindChannelTargetMutation,
  useUnbindChannelMutation,
  useGetTargetTelemetryQuery,
  useGetTargetOptionsQuery,
} = telemetryApi;
