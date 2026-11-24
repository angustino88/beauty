import { baseApi } from '@/shared/lib/api';
import type {
  BenchBookingItem,
  IBenchBookingListParams,
  IBenchOption,
  IBookingBenchChoice,
  IProjectOption,
} from './types';
import {
  buildBookingListQuery,
  mapBookingCreateResponse,
  mapBookingDetailResponse,
  mapBookingListResponse,
  mapBookingUpdateResponse,
  mapBenchOptions,
  mapBookingBenchChoices,
  mapProjectOptions,
  type BenchBookingCreateRequest,
  type BenchBookingUpdateRequest,
} from './mapper';

type BenchBookingListResponse = { total_count: number; data: BenchBookingItem[] };

type BookingDecision = {
  id: string | number;
  idempotencyKey: string;
};

type BookingRejection = BookingDecision & { reason: string };

export const bookingApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    // GET /api/labs/bench-bookings — list with pagination and filtering
    getBenchBookings: build.query<BenchBookingListResponse, IBenchBookingListParams>({
      query: (params) => ({ url: `/api/labs/bench-bookings?${buildBookingListQuery(params)}` }),
      transformResponse: (res: unknown) => mapBookingListResponse(res),
      providesTags: (result) =>
        result?.data
          ? [
              ...result.data.map(({ id }) => ({ type: 'Booking' as const, id })),
              { type: 'Booking', id: 'LIST' },
            ]
          : [{ type: 'Booking', id: 'LIST' }],
    }),

    // GET /api/labs/bench-bookings/{booking_id} — retrieve single bench booking
    getBenchBookingById: build.query<BenchBookingItem, string | number>({
      query: (id) => ({ url: `/api/labs/bench-bookings/${id}` }),
      transformResponse: (res: unknown) => mapBookingDetailResponse(res),
      providesTags: (_, __, id) => [{ type: 'Booking', id: String(id) }],
    }),

    // POST /api/labs/bench-bookings — create a bench booking
    createBenchBooking: build.mutation<BenchBookingItem, Partial<BenchBookingCreateRequest>>({
      query: (body) => ({
        url: '/api/labs/bench-bookings',
        method: 'POST',
        body: {
          bench_id: body.bench_id,
          starts_at: body.starts_at,
          ends_at: body.ends_at,
          reason: body.reason,
          project_id: body.project_id,
        },
      }),
      transformResponse: (res: unknown) => mapBookingCreateResponse(res),
      invalidatesTags: [{ type: 'Booking', id: 'LIST' }],
    }),

    // PATCH /api/labs/bench-bookings/{booking_id} — update an existing bench booking
    updateBenchBooking: build.mutation<
      BenchBookingItem,
      { id: string | number; body: Partial<BenchBookingUpdateRequest> }
    >({
      query: ({ id, body }) => {
        const patchBody: Record<string, unknown> = {};
        if (body.bench_id !== undefined) patchBody.bench_id = body.bench_id;
        if (body.starts_at !== undefined) patchBody.starts_at = body.starts_at;
        if (body.ends_at !== undefined) patchBody.ends_at = body.ends_at;
        if (body.reason !== undefined) patchBody.reason = body.reason;
        if (body.project_id !== undefined) patchBody.project_id = body.project_id;

        return {
          url: `/api/labs/bench-bookings/${id}`,
          method: 'PATCH',
          body: patchBody,
        };
      },
      transformResponse: (res: unknown) => mapBookingUpdateResponse(res),
      invalidatesTags: (_, __, { id }) => [
        { type: 'Booking', id: String(id) },
        { type: 'Booking', id: 'LIST' },
      ],
    }),

    // POST /api/labs/bench-bookings/{booking_id}/actions/approve
    approveBenchBooking: build.mutation<BenchBookingItem, BookingDecision>({
      query: ({ id, idempotencyKey }) => ({
        url: `/api/labs/bench-bookings/${id}/actions/approve`,
        method: 'POST',
        headers: { 'Idempotency-Key': idempotencyKey.toLowerCase() },
      }),
      transformResponse: (res: unknown) => mapBookingUpdateResponse(res),
      invalidatesTags: (_, __, { id }) => [
        { type: 'Booking', id: String(id) },
        { type: 'Booking', id: 'LIST' },
      ],
    }),

    // POST /api/labs/bench-bookings/{booking_id}/actions/reject
    rejectBenchBooking: build.mutation<BenchBookingItem, BookingRejection>({
      query: ({ id, idempotencyKey, reason }) => ({
        url: `/api/labs/bench-bookings/${id}/actions/reject`,
        method: 'POST',
        headers: { 'Idempotency-Key': idempotencyKey.toLowerCase() },
        body: { reason },
      }),
      transformResponse: (res: unknown) => mapBookingUpdateResponse(res),
      invalidatesTags: (_, __, { id }) => [
        { type: 'Booking', id: String(id) },
        { type: 'Booking', id: 'LIST' },
      ],
    }),

    // POST /api/labs/bench-bookings/{booking_id}/actions/cancel — cancel a bench booking
    cancelBenchBooking: build.mutation<BenchBookingItem, { id: string | number; reason?: string }>({
      query: ({ id, reason }) => ({
        url: `/api/labs/bench-bookings/${id}/actions/cancel`,
        method: 'POST',
        body: { reason: reason || 'Cancelled by user' },
      }),
      transformResponse: (res: unknown) => mapBookingUpdateResponse(res),
      invalidatesTags: (_, __, { id }) => [
        { type: 'Booking', id: String(id) },
        { type: 'Booking', id: 'LIST' },
      ],
    }),

    // POST /api/labs/bench-bookings/{booking_id}/actions/complete — complete a bench booking
    completeBenchBooking: build.mutation<BenchBookingItem, string | number>({
      query: (id) => ({
        url: `/api/labs/bench-bookings/${id}/actions/complete`,
        method: 'POST',
      }),
      transformResponse: (res: unknown) => mapBookingUpdateResponse(res),
      invalidatesTags: (_, __, id) => [
        { type: 'Booking', id: String(id) },
        { type: 'Booking', id: 'LIST' },
      ],
    }),

    // GET /api/labs/benches/options — selector options for benches
    getBenchOptions: build.query<IBenchOption[], void>({
      query: () => ({ url: '/api/labs/benches/options' }),
      transformResponse: (res: unknown): IBenchOption[] => mapBenchOptions(res),
      providesTags: [{ type: 'Bench', id: 'LIST' }],
    }),

    // GET /api/labs/benches/booking-choices — in-service benches with the computers on each, so people pick a bench
    // by the computer name they know. `hasComputing` leaves out benches with no computer mapped; `includeId` keeps the bench of an existing booking selectable.
    getBookingBenchChoices: build.query<IBookingBenchChoice[], { includeId?: number | null; hasComputing?: boolean } | void>({
      query: (arg) => ({
        url: '/api/labs/benches/booking-choices',
        params: {
          ...(arg && arg.includeId ? { include_ids: String(arg.includeId) } : {}),
          ...(arg && arg.hasComputing ? { has_computing: 'true' } : {}),
        },
      }),
      transformResponse: (res: unknown): IBookingBenchChoice[] => mapBookingBenchChoices(res),
      providesTags: [{ type: 'Bench', id: 'LIST' }],
    }),

    // GET /api/labs/lab-projects/options — selector options for lab projects
    getProjectOptions: build.query<IProjectOption[], void>({
      query: () => ({ url: '/api/labs/lab-projects/options' }),
      transformResponse: (res: unknown): IProjectOption[] => mapProjectOptions(res),
      providesTags: [{ type: 'LabProject', id: 'LIST' }],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetBenchBookingsQuery,
  useLazyGetBenchBookingsQuery,
  useGetBenchBookingByIdQuery,
  useLazyGetBenchBookingByIdQuery,
  useCreateBenchBookingMutation,
  useUpdateBenchBookingMutation,
  useApproveBenchBookingMutation,
  useRejectBenchBookingMutation,
  useCancelBenchBookingMutation,
  useCompleteBenchBookingMutation,
  useGetBenchOptionsQuery,
  useGetBookingBenchChoicesQuery,
  useGetProjectOptionsQuery,
} = bookingApi;
