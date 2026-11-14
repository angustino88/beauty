import { baseApi } from '@/shared/lib/api';
import type { ChartParams, ChartStatistics, StatisticsChartEntry } from '../types';
import type {
  LabsAnalyticsBookingRetrieveApiResponse,
  LabsAnalyticsLabCountRetrieveApiResponse,
  LabsAnalyticsLabVisitsRetrieveApiResponse,
  LabsAnalyticsUserCountRetrieveApiResponse,
} from '@/shared/api/generated/api';
import {
  mapBookingStatistics,
  mapBookingTrend,
  mapLabCountStatistics,
  mapLabCountTrend,
  mapLabVisitStatistics,
  mapLabVisitTrend,
  mapUserCountStatistics,
  mapUserCountTrend,
} from '../mapper';

const analyticsBase = '/api/labs/analytics';

export const analyticsStatisticsApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getLabVisitStatistics: build.query<ChartStatistics, void>({
      query: () => `${analyticsBase}/lab-visits`,
      transformResponse: (res: LabsAnalyticsLabVisitsRetrieveApiResponse) => mapLabVisitStatistics(res),
      providesTags: ['Analytics'],
    }),
    getBookingCountStatistics: build.query<ChartStatistics, void>({
      query: () => `${analyticsBase}/booking`,
      transformResponse: (res: LabsAnalyticsBookingRetrieveApiResponse) => mapBookingStatistics(res),
      providesTags: ['Analytics'],
    }),
    getUserCountStatistics: build.query<ChartStatistics, void>({
      query: () => `${analyticsBase}/user-count`,
      transformResponse: (res: LabsAnalyticsUserCountRetrieveApiResponse) => mapUserCountStatistics(res),
      providesTags: ['Analytics'],
    }),
    getLabCountStatistics: build.query<ChartStatistics, void>({
      query: () => `${analyticsBase}/lab-count`,
      transformResponse: (res: LabsAnalyticsLabCountRetrieveApiResponse) => mapLabCountStatistics(res),
      providesTags: ['Analytics'],
    }),

    getLabVisitTrendSeries: build.query<StatisticsChartEntry[], ChartParams>({
      query: (params) => ({ url: `${analyticsBase}/lab-visits`, params }),
      transformResponse: (res: LabsAnalyticsLabVisitsRetrieveApiResponse) => mapLabVisitTrend(res),
      providesTags: ['Analytics'],
    }),
    getBookingTrendSeries: build.query<StatisticsChartEntry[], ChartParams>({
      query: (params) => ({ url: `${analyticsBase}/booking`, params }),
      transformResponse: (res: LabsAnalyticsBookingRetrieveApiResponse) => mapBookingTrend(res),
      providesTags: ['Analytics'],
    }),
    getUserCountTrendSeries: build.query<StatisticsChartEntry[], ChartParams>({
      query: (params) => ({ url: `${analyticsBase}/user-count`, params }),
      transformResponse: (res: LabsAnalyticsUserCountRetrieveApiResponse) => mapUserCountTrend(res),
      providesTags: ['Analytics'],
    }),
    getLabCountTrendSeries: build.query<StatisticsChartEntry[], ChartParams>({
      query: (params) => ({ url: `${analyticsBase}/lab-count`, params }),
      transformResponse: (res: LabsAnalyticsLabCountRetrieveApiResponse) => mapLabCountTrend(res),
      providesTags: ['Analytics'],
    }),
  }),
});

export const {
  useGetLabVisitStatisticsQuery,
  useGetBookingCountStatisticsQuery,
  useGetUserCountStatisticsQuery,
  useGetLabCountStatisticsQuery,
  useGetLabVisitTrendSeriesQuery,
  useGetBookingTrendSeriesQuery,
  useGetUserCountTrendSeriesQuery,
  useGetLabCountTrendSeriesQuery,
} = analyticsStatisticsApi;

