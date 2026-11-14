import { baseApi } from '@/shared/lib/api';
import type {
  IFinanceAnalyticsParams,
  IFinanceExpenseTypeBreakdown,
  IFinanceMonthlyTrends,
  IFinanceSummary,
  IFinancialReport,
  IFinancialReportFilterParams,
} from './types';
import {
  mapFinanceExpenseTypeBreakdown,
  mapFinanceMonthlyTrends,
  mapFinanceSummary,
  mapFinancialReport,
} from './mapper';

export const financeApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getFinancialReport: build.query<IFinancialReport, IFinancialReportFilterParams | void>({
      query: (params) => ({
        url: '/api/labs/expenses/report',
        params: {
          currency: params?.currency,
          billing_period: params?.billing_period,
          expense_type: params?.expense_type,
          from_date: params?.from_date,
          to_date: params?.to_date,
          room_id: params?.room_id,
          status: params?.status,
        },
      }),
      transformResponse: (res: unknown) => mapFinancialReport(res),
      providesTags: [
        { type: 'FinanceReport', id: 'REPORT' },
        { type: 'FinanceReport', id: 'SUMMARY' },
      ],
    }),

    getRoomFinancialReport: build.query<
      IFinancialReport,
      { roomId: number } & IFinancialReportFilterParams
    >({
      query: ({ roomId, ...params }) => ({
        url: `/api/labs/rooms/${roomId}/expenses/report`,
        params: {
          currency: params?.currency,
          billing_period: params?.billing_period,
          expense_type: params?.expense_type,
          from_date: params?.from_date,
          to_date: params?.to_date,
          status: params?.status,
        },
      }),
      transformResponse: (res: unknown) => mapFinancialReport(res),
      providesTags: (_res, _err, { roomId }) => [
        { type: 'FinanceReport', id: `room-${roomId}` },
      ],
    }),

    getFinanceSummary: build.query<IFinanceSummary, IFinanceAnalyticsParams>({
      query: (params) => ({
        url: '/api/labs/analytics/finance/summary',
        params: {
          currency: params.currency,
          start_month: params.start_month,
          end_month: params.end_month,
          timezone: params.timezone,
        },
      }),
      transformResponse: (res: unknown) => mapFinanceSummary(res),
      providesTags: [{ type: 'FinanceReport', id: 'SUMMARY' }],
    }),

    getFinanceMonthlyTrends: build.query<
      IFinanceMonthlyTrends,
      IFinanceAnalyticsParams
    >({
      query: (params) => ({
        url: '/api/labs/analytics/finance/monthly-trends',
        params: {
          currency: params.currency,
          start_month: params.start_month,
          end_month: params.end_month,
          timezone: params.timezone,
        },
      }),
      transformResponse: (res: unknown) => mapFinanceMonthlyTrends(res),
      providesTags: [{ type: 'FinanceReport', id: 'TRENDS' }],
    }),

    getFinanceExpenseTypeBreakdown: build.query<
      IFinanceExpenseTypeBreakdown,
      IFinanceAnalyticsParams
    >({
      query: (params) => ({
        url: '/api/labs/analytics/finance/expense-type-breakdown',
        params: {
          currency: params.currency,
          start_month: params.start_month,
          end_month: params.end_month,
          timezone: params.timezone,
        },
      }),
      transformResponse: (res: unknown) => mapFinanceExpenseTypeBreakdown(res),
      providesTags: [{ type: 'FinanceReport', id: 'BREAKDOWN' }],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetFinancialReportQuery,
  useGetRoomFinancialReportQuery,
  useGetFinanceSummaryQuery,
  useGetFinanceMonthlyTrendsQuery,
  useGetFinanceExpenseTypeBreakdownQuery,
} = financeApi;
