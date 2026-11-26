import { baseApi } from '@/shared/lib/api';
import { mapSlotWatch, type ISlotWatch, type RawSlotWatch, type SlotWatchCreateRequest, type SlotWatchStatus } from './slotWatchMapper';

export * from './slotWatchMapper';

const unwrap = (res: unknown): RawSlotWatch => (res as { data: RawSlotWatch }).data;

export const slotWatchApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    // GET /api/labs/bench-slot-watches — the caller's own slot alerts
    getSlotWatches: build.query<ISlotWatch[], { status?: SlotWatchStatus } | void>({
      query: (arg) => ({
        url: '/api/labs/bench-slot-watches',
        params: { page_size: 100, ...(arg?.status ? { status: arg.status } : {}) },
      }),
      transformResponse: (res: unknown) => ((res as { data?: RawSlotWatch[] }).data ?? []).map(mapSlotWatch),
      providesTags: (result) => [
        ...(result ?? []).map(({ id }) => ({ type: 'SlotWatch' as const, id })),
        { type: 'SlotWatch' as const, id: 'LIST' },
      ],
    }),

    // POST /api/labs/bench-slot-watches — notify me when this bench frees up in the range (idempotent)
    createSlotWatch: build.mutation<ISlotWatch, SlotWatchCreateRequest>({
      query: (body) => ({ url: '/api/labs/bench-slot-watches', method: 'POST', body }),
      transformResponse: (res: unknown) => mapSlotWatch(unwrap(res)),
      invalidatesTags: [{ type: 'SlotWatch', id: 'LIST' }],
    }),

    // POST /api/labs/bench-bookings/{id}/actions/follow — one alert when that booking ends (idempotent)
    followBooking: build.mutation<ISlotWatch, number>({
      query: (bookingId) => ({ url: `/api/labs/bench-bookings/${bookingId}/actions/follow`, method: 'POST' }),
      transformResponse: (res: unknown) => mapSlotWatch(unwrap(res)),
      invalidatesTags: [{ type: 'SlotWatch', id: 'LIST' }],
    }),

    // POST /api/labs/bench-slot-watches/{id}/actions/cancel — stop the alert (safe to repeat)
    cancelSlotWatch: build.mutation<ISlotWatch, number>({
      query: (id) => ({ url: `/api/labs/bench-slot-watches/${id}/actions/cancel`, method: 'POST' }),
      transformResponse: (res: unknown) => mapSlotWatch(unwrap(res)),
      invalidatesTags: (_, __, id) => [
        { type: 'SlotWatch', id },
        { type: 'SlotWatch', id: 'LIST' },
      ],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetSlotWatchesQuery,
  useCreateSlotWatchMutation,
  useFollowBookingMutation,
  useCancelSlotWatchMutation,
} = slotWatchApi;
