import { baseApi } from '@/shared/lib/api';
import type {
  BillingPeriodEnum,
  ExpenseTypeEnum,
  ICreateExpensePaymentPayload,
  ICreateExpensePayload,
  IExpense,
  IExpenseListResponse,
  IExpensePayment,
  IExpenseQueryParams,
} from './types';
import {
  mapExpense,
  mapExpenseListResponse,
  mapExpensePayment,
  mapExpensePaymentListResponse,
  toExpensePaymentWriteBody,
  toExpenseWriteBody,
} from './mapper';

export interface IRoomOption {
  id: number;
  name: string;
}

export const expenseApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getFacilityExpenses: build.query<
      IExpenseListResponse,
      {
        roomId?: number;
        page?: number;
        page_size?: number;
        expense_type?: ExpenseTypeEnum;
        billing_period?: BillingPeriodEnum;
      } | void
    >({
      query: (params) => {
        if (params?.roomId) {
          return {
            url: `/api/labs/rooms/${params.roomId}/expenses`,
            params: {
              page: params.page ?? 1,
              page_size: params.page_size ?? 10,
              expense_type: params.expense_type,
              billing_period: params.billing_period,
            },
          };
        }
        return {
          url: '/api/labs/expenses/report',
          params: {
            expense_type: params?.expense_type,
            billing_period: params?.billing_period,
          },
        };
      },
      transformResponse: (res: unknown, _meta, arg) => {
        if (arg?.roomId) {
          return mapExpenseListResponse(res, arg.roomId);
        }
        if (!res || typeof res !== 'object') {
          return {
            data: [],
            pagination: { count: 0, page: 1, page_size: 10, next: null, previous: null },
          };
        }
        const envelope = res as Record<string, unknown>;
        const dataObj = (envelope.data && typeof envelope.data === 'object'
          ? envelope.data
          : envelope) as Record<string, unknown>;
        const rawItems = Array.isArray(dataObj.items) ? dataObj.items : [];
        const mapped = rawItems.map((it) => mapExpense(it));
        return {
          data: mapped,
          pagination: {
            count: mapped.length,
            page: 1,
            page_size: mapped.length || 10,
            next: null,
            previous: null,
          },
        };
      },
      providesTags: (_result, _err, arg) => [
        { type: 'Expense' as const, id: arg?.roomId ? `room-${arg.roomId}` : 'ALL' },
        { type: 'Expense' as const, id: 'LIST' },
      ],
    }),

    getRoomExpenses: build.query<IExpenseListResponse, IExpenseQueryParams>({
      query: ({ roomId, page = 1, page_size = 10, expense_type, billing_period }) => ({
        url: `/api/labs/rooms/${roomId}/expenses`,
        params: {
          page,
          page_size,
          expense_type,
          billing_period,
        },
      }),
      transformResponse: (res: unknown, _meta, arg) => mapExpenseListResponse(res, arg.roomId),
      providesTags: (result, _err, { roomId }) =>
        result
          ? [
              ...result.data.map(({ id }) => ({ type: 'Expense' as const, id })),
              { type: 'Expense' as const, id: `room-${roomId}` },
              { type: 'Expense' as const, id: 'LIST' },
            ]
          : [
              { type: 'Expense' as const, id: `room-${roomId}` },
              { type: 'Expense' as const, id: 'LIST' },
            ],
    }),

    createRoomExpense: build.mutation<
      IExpense,
      { roomId: number; body: ICreateExpensePayload }
    >({
      query: ({ roomId, body }) => ({
        url: `/api/labs/rooms/${roomId}/expenses`,
        method: 'POST',
        body: toExpenseWriteBody(body),
      }),
      transformResponse: (res: unknown, _meta, arg) => {
        const envelope = (res as { data?: unknown })?.data ?? res;
        return mapExpense(envelope, arg.roomId);
      },
      invalidatesTags: (_res, _err, { roomId }) => [
        { type: 'Expense', id: `room-${roomId}` },
        { type: 'Expense', id: 'LIST' },
        { type: 'FinanceReport', id: 'SUMMARY' },
      ],
    }),

    getExpensePayments: build.query<
      { data: IExpensePayment[]; pagination: IExpenseListResponse['pagination'] },
      { expenseId: number; page?: number; pageSize?: number }
    >({
      query: ({ expenseId, page = 1, pageSize = 50 }) => ({
        url: `/api/labs/expenses/${expenseId}/payments`,
        params: { page, page_size: pageSize },
      }),
      transformResponse: (res: unknown, _meta, arg) =>
        mapExpensePaymentListResponse(res, arg.expenseId),
      providesTags: (_res, _err, { expenseId }) => [
        { type: 'Expense', id: `payments-${expenseId}` },
      ],
    }),

    createExpensePayment: build.mutation<
      IExpensePayment,
      { expenseId: number; body: ICreateExpensePaymentPayload }
    >({
      query: ({ expenseId, body }) => ({
        url: `/api/labs/expenses/${expenseId}/payments`,
        method: 'POST',
        body: toExpensePaymentWriteBody(body),
      }),
      transformResponse: (res: unknown, _meta, arg) => {
        const envelope = (res as { data?: unknown })?.data ?? res;
        return mapExpensePayment(envelope, arg.expenseId);
      },
      invalidatesTags: (_res, _err, { expenseId }) => [
        { type: 'Expense', id: `payments-${expenseId}` },
        { type: 'Expense', id: expenseId },
        { type: 'Expense', id: 'LIST' },
        { type: 'FinanceReport', id: 'SUMMARY' },
      ],
    }),

    getExpenseRooms: build.query<IRoomOption[], void>({
      query: () => ({
        url: '/api/labs/rooms',
        params: { page_size: 100 },
      }),
      transformResponse: (res: unknown): IRoomOption[] => {
        if (!res || typeof res !== 'object') return [];
        const envelope = res as Record<string, unknown>;
        const list = Array.isArray(envelope.data)
          ? envelope.data
          : Array.isArray(envelope.results)
            ? envelope.results
            : [];
        return list.map((r: Record<string, unknown>) => ({
          id: typeof r.id === 'number' ? r.id : Number(r.id ?? 0),
          name: typeof r.name === 'string' ? r.name : `Room #${r.id}`,
        }));
      },
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetFacilityExpensesQuery,
  useGetRoomExpensesQuery,
  useCreateRoomExpenseMutation,
  useGetExpensePaymentsQuery,
  useCreateExpensePaymentMutation,
  useGetExpenseRoomsQuery,
} = expenseApi;
