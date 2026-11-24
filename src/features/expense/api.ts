import { baseApi } from '@/shared/lib/api';
import type {
  BillingPeriodEnum,
  ExpenseResourceKind,
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
        resource_kind?: ExpenseResourceKind;
        resource_id?: number;
        page?: number;
        page_size?: number;
        expense_type?: ExpenseTypeEnum;
        billing_period?: BillingPeriodEnum;
      } | void
    >({
      query: (params) => {
        const resourceKind = params?.roomId ? 'room' : params?.resource_kind;
        const resourceId = params?.roomId ?? params?.resource_id;
        return {
          url: '/api/labs/expenses',
          params: {
            page: params?.page ?? 1,
            page_size: params?.page_size ?? 10,
            ...(resourceKind ? { resource_kind: resourceKind } : {}),
            ...(resourceKind && resourceId ? { resource_id: resourceId } : {}),
            ...(params?.expense_type ? { expense_type: params.expense_type } : {}),
            ...(params?.billing_period ? { billing_period: params.billing_period } : {}),
          },
        };
      },
      transformResponse: (res: unknown, _meta, arg) =>
        mapExpenseListResponse(res, arg?.roomId),
      providesTags: (_result, _err, arg) => [
        { type: 'Expense' as const, id: arg?.roomId ? `room-${arg.roomId}` : 'ALL' },
        { type: 'Expense' as const, id: 'LIST' },
      ],
    }),

    createExpense: build.mutation<
      IExpense,
      ICreateExpensePayload & { resource_kind: ExpenseResourceKind; resource_id: number }
    >({
      query: (body) => ({
        url: '/api/labs/expenses',
        method: 'POST',
        body: toExpenseWriteBody(body),
      }),
      transformResponse: (res: unknown, _meta, arg) => {
        const envelope = (res as { data?: unknown })?.data ?? res;
        return mapExpense(envelope, arg.resource_kind === 'room' ? arg.resource_id : undefined);
      },
      invalidatesTags: (_res, _err, arg) => [
        ...(arg.resource_kind === 'room' ? [{ type: 'Expense' as const, id: `room-${arg.resource_id}` }] : []),
        { type: 'Expense', id: 'ALL' },
        { type: 'Expense', id: 'LIST' },
        { type: 'FinanceReport', id: 'SUMMARY' },
      ],
    }),

    getRoomExpenses: build.query<IExpenseListResponse, IExpenseQueryParams & { roomId: number }>({
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
  useCreateExpenseMutation,
  useGetRoomExpensesQuery,
  useCreateRoomExpenseMutation,
  useGetExpensePaymentsQuery,
  useCreateExpensePaymentMutation,
  useGetExpenseRoomsQuery,
} = expenseApi;
