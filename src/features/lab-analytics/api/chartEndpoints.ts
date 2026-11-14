import { baseApi } from '@/shared/lib/api';
import type {
  ChartDateParams,
  ChartDurationParams,
  ChartStatistics,
  StatisticsChartEntry,
  UserStorageQuotaChartEntry,
  LabEfficiencyChartEntry,
  LabUsageByTimeFrameChartEntry,
  ProjectUsageChartEntry,
  UserByBookingEfficiencyChartEntry,
  UserByLabUsageChartEntry,
} from '../types';
import type {
  LabsAnalyticsBookingRetrieveApiResponse,
  LabsAnalyticsLabCountRetrieveApiResponse,
  LabsAnalyticsLabEfficiencyRetrieveApiResponse,
  LabsAnalyticsLabVisitsRetrieveApiResponse,
  LabsAnalyticsProjectUsageRetrieveApiResponse,
  LabsAnalyticsStorageQuotaRetrieveApiResponse,
  LabsAnalyticsUserCountRetrieveApiResponse,
  LabsAnalyticsUserLabUsageRetrieveApiResponse,
  LabsAnalyticsUserBookingEfficiencyRetrieveApiResponse,
  LabsAnalyticsLabUsageByTimeframeRetrieveApiResponse,
} from '@/shared/api/generated/api';
import {
  mapLabEfficiency,
  mapCountOrTrend,
  mapLabCountStatistics,
  mapStorageQuota,
  mapLabUsageByTimeframe,
  mapProjectUsage,
  mapUserBookingEfficiency,
  mapUserCountStatistics,
  mapUserLabUsage,
} from '../mapper';

const analyticsBase = '/api/labs/analytics';

export const analyticsChartApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getLabEfficiency: build.query<LabEfficiencyChartEntry[], ChartDurationParams>({
      query: (params) => ({ url: `${analyticsBase}/lab-efficiency`, params }),
      transformResponse: (res: LabsAnalyticsLabEfficiencyRetrieveApiResponse) => mapLabEfficiency(res),
      providesTags: ['Analytics'],
    }),

    getProjectUsage: build.query<ProjectUsageChartEntry[], ChartDurationParams>({
      query: (params) => ({ url: `${analyticsBase}/project-usage`, params }),
      transformResponse: (res: LabsAnalyticsProjectUsageRetrieveApiResponse) => mapProjectUsage(res),
      providesTags: ['Analytics'],
    }),

    getUserLabUsage: build.query<UserByLabUsageChartEntry[], ChartDurationParams>({
      query: (params) => ({ url: `${analyticsBase}/user-lab-usage`, params }),
      transformResponse: (res: LabsAnalyticsUserLabUsageRetrieveApiResponse) => mapUserLabUsage(res),
      providesTags: ['Analytics'],
    }),

    getUserBookingEfficiency: build.query<UserByBookingEfficiencyChartEntry[], ChartDurationParams>({
      query: (params) => ({ url: `${analyticsBase}/user-booking-efficiency`, params }),
      transformResponse: (res: LabsAnalyticsUserBookingEfficiencyRetrieveApiResponse) => mapUserBookingEfficiency(res),
      providesTags: ['Analytics'],
    }),

    getLabUsageByTimeframe: build.query<LabUsageByTimeFrameChartEntry[], ChartDurationParams>({
      query: (params) => ({ url: `${analyticsBase}/lab-usage-by-timeframe`, params }),
      transformResponse: (res: LabsAnalyticsLabUsageByTimeframeRetrieveApiResponse) => mapLabUsageByTimeframe(res),
      providesTags: ['Analytics'],
    }),

    getStorageQuota: build.query<UserStorageQuotaChartEntry[], ChartDateParams>({
      query: (params) => ({ url: `${analyticsBase}/storage-quota`, params }),
      transformResponse: (res: LabsAnalyticsStorageQuotaRetrieveApiResponse) => mapStorageQuota(res),
      providesTags: ['Analytics'],
    }),

    getLabVisits: build.query<ChartStatistics | StatisticsChartEntry[], ChartDurationParams | void>({
      query: (params) => ({ url: `${analyticsBase}/lab-visits`, params: params || undefined }),
      transformResponse: (res: LabsAnalyticsLabVisitsRetrieveApiResponse) => mapCountOrTrend(res),
      providesTags: ['Analytics'],
    }),

    getBookingSummary: build.query<ChartStatistics | StatisticsChartEntry[], ChartDurationParams | void>({
      query: (params) => ({ url: `${analyticsBase}/booking`, params: params || undefined }),
      transformResponse: (res: LabsAnalyticsBookingRetrieveApiResponse) => mapCountOrTrend(res),
      providesTags: ['Analytics'],
    }),

    getUserCountSnapshot: build.query<ChartStatistics, void>({
      query: () => `${analyticsBase}/user-count`,
      transformResponse: (res: LabsAnalyticsUserCountRetrieveApiResponse) => mapUserCountStatistics(res),
      providesTags: ['Analytics'],
    }),

    getLabCountSnapshot: build.query<ChartStatistics, void>({
      query: () => `${analyticsBase}/lab-count`,
      transformResponse: (res: LabsAnalyticsLabCountRetrieveApiResponse) => mapLabCountStatistics(res),
      providesTags: ['Analytics'],
    }),

  }),
});

export const {
  useGetLabEfficiencyQuery,
  useGetProjectUsageQuery,
  useGetUserLabUsageQuery,
  useGetUserBookingEfficiencyQuery,
  useGetLabUsageByTimeframeQuery,
  useGetStorageQuotaQuery,
  useGetLabVisitsQuery,
  useGetBookingSummaryQuery,
  useGetUserCountSnapshotQuery,
  useGetLabCountSnapshotQuery,
} = analyticsChartApi;

