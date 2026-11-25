import { stationContents } from './stationContents';
import { baseApi } from "@/shared/lib/api";
import { generatedApi } from '@/shared/api/generated/api';
import { skipToken } from "@reduxjs/toolkit/query";
import {
  generateListTags,
  generateItemTag,
  invalidateList,
} from "@/shared/lib/api/tagHelpers";
import {
  createResourceEndpoints,
} from "@/shared/lib/api/endpointHelpers";
import type {
  IRoom,
  IRoomDashboardLayout,
  IRoomDashboardRack,
  IRoomDashboardSlot,
  IRoomListResponse,
  IRoomParams,
  IRoomPayload,
} from "./types";
import type { SpaceStatusHistoryRecord } from "../shared/SpaceStatusHistoryModal";
import {
  mapRoomDetailApiResponse,
  mapRoomListApiResponse,
  mapRoomWritePayload,
} from "./mapper";
import { normalizeFilterFacets, type FilterFacets } from "@/features/lab-equipment/shared/facets/filterFacets";
import { resourceImageFormData, resourceImageUrl } from "@/shared/lib/api/resourceImage";

const ENDPOINTS = createResourceEndpoints("labs/rooms");
const TAG = "Room";

generatedApi.enhanceEndpoints({
  endpoints: {
    labsRoomsRetrieve: { providesTags: invalidateList(TAG) },
    labsRoomsOptionsRetrieve: { providesTags: invalidateList(TAG) },
    labsRoomsStatusSummaryRetrieve: { providesTags: invalidateList(TAG) },
    labsRoomsCreate: { invalidatesTags: invalidateList(TAG) },
    labsRoomsSlotsRetrieveByRoomId: {
      providesTags: (_res, _err, arg) => [
        { type: TAG, id: "SLOTS" },
        { type: TAG, id: `slots-${arg.roomId}` },
      ],
    },
    labsRoomsActionsGenerateSlotsCreateByRoomId: {
      invalidatesTags: (_res, _err, arg) => [
        { type: TAG, id: "SLOTS" },
        { type: TAG, id: `slots-${arg.roomId}` },
        ...generateItemTag(TAG, arg.roomId),
      ],
    },
  },
});

type MappingPage = {
  data: Record<string, unknown[]>;
  meta: { pagination: Record<string, { next_cursor: string | null }> };
};

function mapDashboardLayout(res: unknown): IRoomDashboardLayout {
  const envelope = (res as Record<string, unknown>) ?? {};
  const data = (envelope.data ?? envelope) as Record<string, unknown>;

  if (Array.isArray(data.rooms) || Array.isArray(data.room_slots)) {
    const rooms = (Array.isArray(data.rooms) ? data.rooms : []) as Array<Record<string, unknown>>;
    const roomSlots = (Array.isArray(data.room_slots) ? data.room_slots : []) as Array<Record<string, unknown>>;
    const stations = (Array.isArray(data.stations) ? data.stations : []) as Array<Record<string, unknown>>;

    const room = rooms[0] ?? {};
    const stationsBySlotId = new Map<number, Record<string, unknown>>();
    const unplacedStations: IRoomDashboardRack[] = [];

    for (const st of stations) {
      const slotId = st.slot_id as number | null;
      if (slotId) {
        stationsBySlotId.set(slotId, st);
      } else {
        unplacedStations.push({
          id: st.id as number,
          sku: (st.sku as string) ?? null,
          name: (st.name as string) ?? null,
          slot_id: null,
          slot_code: null,
          slot_row: null,
          slot_col: null,
        });
      }
    }

    const slots: IRoomDashboardSlot[] = roomSlots.map((s) => {
      const slotId = s.id as number;
      const station = stationsBySlotId.get(slotId);
      return {
        id: slotId,
        row_index: (s.row_index as number) ?? 0,
        col_index: (s.col_index as number) ?? 0,
        slot_code: (s.slot_code as string) ?? "",
        rack: station
          ? {
              id: station.id as number,
              sku: (station.sku as string) ?? null,
              name: (station.name as string) ?? null,
              slot_id: slotId,
              slot_code: (s.slot_code as string) ?? null,
              slot_row: (s.row_index as number) ?? null,
              slot_col: (s.col_index as number) ?? null,
            }
          : null,
      };
    });

    return {
      room: {
        id: (room.id as number) ?? 0,
        sku: (room.sku as string) ?? null,
        name: (room.name as string) ?? null,
        rows: (room.layout_rows as number) ?? null,
        cols: (room.layout_columns as number) ?? null,
        setup_capacity: roomSlots.length,
      },
      slots,
      contents: stationContents(data),
      station_models: Object.fromEntries(
        stations.map((st) => [st.id as number, (st.visual_model_id as number | null | undefined) ?? null]),
      ),
      unplaced_racks: unplacedStations,
    };
  }

  return (envelope.data as IRoomDashboardLayout) ?? envelope;
}

export const roomRtkApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getRooms: build.query<IRoomListResponse, IRoomParams>({
      query: ({ search, ...params }) => ({ url: ENDPOINTS.LIST, params: { ...params, q: search } }),
      transformResponse: (res: unknown) => mapRoomListApiResponse(res),
      providesTags: (result) => generateListTags(TAG, result),
    }),
    createRoom: build.mutation<IRoom, IRoomPayload>({
      query: (body) => ({
        url: ENDPOINTS.CREATE,
        method: "POST",
        body: mapRoomWritePayload(body),
      }),
      transformResponse: (res: unknown) => mapRoomDetailApiResponse(res),
      invalidatesTags: invalidateList(TAG),
    }),
    updateRoom: build.mutation<IRoom, { id: number; body: IRoomPayload }>({
      query: ({ id, body }) => ({
        url: ENDPOINTS.UPDATE(id),
        method: "PATCH",
        body: mapRoomWritePayload(body),
      }),
      transformResponse: (res: unknown) => mapRoomDetailApiResponse(res),
      invalidatesTags: (_r, _e, { id }) => [
        ...generateItemTag(TAG, id),
        ...invalidateList(TAG),
        { type: "ChangeLog", id },
      ],
    }),
    deleteRoom: build.mutation<void, number>({
      query: (id) => ({ url: ENDPOINTS.DELETE(id), method: "DELETE" }),
      invalidatesTags: invalidateList(TAG),
    }),
    forceDeleteRoom: build.mutation<
      { id: number; released: { stations: number; equipment: number } },
      { id: number; reason: string; confirm: true }
    >({
      query: ({ id, reason, confirm }) => ({
        url: `/api/labs/rooms/${id}/actions/force-delete`,
        method: "POST",
        body: { reason, confirm },
      }),
      transformResponse: (res: unknown) => {
        const envelope = (res ?? {}) as { data?: { id: number; released: { stations: number; equipment: number } } };
        return envelope.data ?? (res as { id: number; released: { stations: number; equipment: number } });
      },
      invalidatesTags: (_r, _e, { id }) => [
        ...generateItemTag(TAG, id),
        ...invalidateList(TAG),
        { type: "Station", id: "LIST" },
        { type: "Bench", id: "LIST" },
        { type: "ResourceMapping", id: "LIST" },
        { type: "Equipment", id: "LIST" },
      ],
    }),
    changeRoomLifecycle: build.mutation<
      IRoom,
      {
        roomId: number;
        body: {
          lifecycle_status?: 'planned' | 'in_service' | 'retired';
          access_policy?: 'open' | 'restricted';
          metadata?: Record<string, unknown>;
        };
      }
    >({
      query: ({ roomId, body }) => ({
        url: `/api/labs/rooms/${roomId}/actions/change-lifecycle`,
        method: "POST",
        body,
      }),
      transformResponse: (res: unknown) => mapRoomDetailApiResponse(res),
      invalidatesTags: (_r, _e, { roomId }) => [
        ...generateItemTag(TAG, roomId),
        ...invalidateList(TAG),
        { type: "Station", id: "LIST" },
        { type: "Bench", id: "LIST" },
      ],
    }),
    updateRoomImage: build.mutation<void, { id: number; image: File }>({
      query: ({ id, image }) => ({
        url: resourceImageUrl("rooms", id),
        method: "PUT",
        body: resourceImageFormData(image),
      }),
      invalidatesTags: (_r, _e, { id }) => [
        ...generateItemTag(TAG, id),
        ...invalidateList(TAG),
      ],
    }),
    deleteRoomImage: build.mutation<void, number>({
      query: (id) => ({ url: resourceImageUrl("rooms", id), method: "DELETE" }),
      invalidatesTags: (_r, _e, id) => [
        ...generateItemTag(TAG, id),
        ...invalidateList(TAG),
      ],
    }),
    getRoomById: build.query<IRoom, number>({
      query: (id) => ({ url: ENDPOINTS.DETAIL(id) }),
      transformResponse: (res: unknown) => mapRoomDetailApiResponse(res),
      providesTags: (_result, _error, id) => generateItemTag(TAG, id),
    }),
    getRoomHistory: build.query<
      { data: SpaceStatusHistoryRecord[]; total: number },
      { id: number; page: number; pageSize: number }
    >({
      query: ({ id, page, pageSize }) => ({
        url: `${ENDPOINTS.DETAIL(id)}/history`,
        params: { page, page_size: pageSize },
      }),
      transformResponse: (res: { data: SpaceStatusHistoryRecord[]; meta: { pagination: { count: number } } }) => ({
        data: res.data,
        total: res.meta.pagination.count,
      }),
      providesTags: (_result, _error, { id }) => [{ type: "ChangeLog", id }],
    }),
    getRoomFilters: build.query<FilterFacets, void>({
      query: () => ({ url: "/api/labs/rooms/filters" }),
      transformResponse: normalizeFilterFacets,
      providesTags: invalidateList(TAG),
    }),
    getRoomDashboardLayout: build.query<IRoomDashboardLayout, number>({
      async queryFn(id, _api, _extra, fetchWithBQ) {
        const url = `/api/labs/rooms/${id}/mapping`;
        const first = await fetchWithBQ({ url, params: { page_size: 100 } });
        if (first.error) return { error: first.error };
        const page = first.data as MappingPage;
        if (!page.data || !page.meta?.pagination) return { data: mapDashboardLayout(first.data) };
        const data = { ...page.data };
        let pagination = page.meta.pagination;
        let pending = ['room_slots', 'stations', 'station_slots', 'benches', 'equipment'].filter(key => pagination[key]?.next_cursor);
        while (pending.length) {
          const params = Object.fromEntries(pending.map(key => [key + '_cursor', pagination[key].next_cursor]));
          const next = await fetchWithBQ({ url, params: { ...params, page_size: 100 } });
          if (next.error) return { error: next.error };
          const batch = next.data as MappingPage;
          for (const key of pending) data[key] = [...data[key], ...batch.data[key]];
          pagination = batch.meta.pagination;
          pending = pending.filter(key => pagination[key]?.next_cursor);
        }
        return { data: mapDashboardLayout({ data }) };
      },
      providesTags: (_result, _error, id) => [{ type: "Room", id: `layout-${id}` }],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetRoomsQuery,
  useCreateRoomMutation,
  useUpdateRoomMutation,
  useDeleteRoomMutation,
  useForceDeleteRoomMutation,
  useChangeRoomLifecycleMutation,
  useUpdateRoomImageMutation,
  useDeleteRoomImageMutation,
  useGetRoomByIdQuery,
  useGetRoomHistoryQuery,
  useGetRoomFiltersQuery,
  useGetRoomDashboardLayoutQuery,
} = roomRtkApi;

export function useGetRoomByIdWrapper(
  id: number | typeof skipToken,
  options?: Parameters<typeof roomRtkApi.endpoints.getRoomById.useQuery>[1],
) {
  return roomRtkApi.endpoints.getRoomById.useQuery(
    id === skipToken ? skipToken : id,
    options,
  );
}
