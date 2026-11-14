import type {
  LabsAnalyticsLabEfficiencyRetrieveApiResponse,
  LabsAnalyticsProjectUsageRetrieveApiResponse,
  LabsAnalyticsLabUsageByTimeframeRetrieveApiResponse,
  LabsAnalyticsUserBookingEfficiencyRetrieveApiResponse,
  LabsAnalyticsUserLabUsageRetrieveApiResponse,
  AnalyticsAggregatedLog,
  AnalyticsCountTrend,
  LabsAnalyticsLabEquipmentStatusRetrieveApiResponse,
  LabsAnalyticsBenchGroupRetrieveApiResponse,
  LabsAnalyticsBookingRetrieveApiResponse,
  LabsAnalyticsLabCountRetrieveApiResponse,
  LabsAnalyticsLabVisitsRetrieveApiResponse,
  LabsAnalyticsUserCountRetrieveApiResponse,
  LabsAnalyticsStorageQuotaRetrieveApiResponse,
} from '@/shared/api/generated/api';
import type {
  LabEfficiencyChartEntry,
  LabSessionLogEntry,
  LabSessionLogResponse,
  LabUsageByTimeFrameChartEntry,
  LabEquipmentStatusSummary,
  LabGroupChartEntry,
  ChartStatistics,
  StatisticsChartEntry,
  UserStorageQuotaChartEntry,
  ProjectUsageChartEntry,
  UserByBookingEfficiencyChartEntry,
  UserByLabUsageChartEntry,
} from './types';

export const unwrapChartData = <T extends { data: unknown }>(response: T): T['data'] => response.data;

type CountTrendResponse = AnalyticsCountTrend | AnalyticsAggregatedLog[] | { data: AnalyticsCountTrend | AnalyticsAggregatedLog[] };

const normalizeCountTrendResponse = (response: CountTrendResponse): AnalyticsCountTrend | AnalyticsAggregatedLog[] =>
  'data' in response ? response.data : response;

function mapCountStatistics(response: CountTrendResponse): ChartStatistics {
  const normalizedResponse = normalizeCountTrendResponse(response);
  if (!Array.isArray(normalizedResponse)) {
    return { count: normalizedResponse.count, trend: normalizedResponse.trend };
  }
  return { count: normalizedResponse.reduce((total, entry) => total + entry.count, 0), trend: 0 };
}

function mapTrendSeries(response: CountTrendResponse): StatisticsChartEntry[] {
  const normalizedResponse = normalizeCountTrendResponse(response);
  if (!Array.isArray(normalizedResponse)) return [{ count: normalizedResponse.count }];
  return normalizedResponse.map((entry) => ({
    count: entry.count,
    ...(entry.date != null ? { date: entry.date } : {}),
    ...(entry.year != null ? { year: entry.year } : {}),
    ...(entry.week != null ? { week: entry.week } : {}),
    ...(entry.month != null ? { month: entry.month } : {}),
    ...(entry.quarter != null ? { quarter: entry.quarter } : {}),
  }));
}

export const mapLabVisitStatistics = (response: LabsAnalyticsLabVisitsRetrieveApiResponse) => mapCountStatistics(response);
export const mapBookingStatistics = (response: LabsAnalyticsBookingRetrieveApiResponse) => mapCountStatistics(response);
export const mapUserCountStatistics = (response: LabsAnalyticsUserCountRetrieveApiResponse) => mapCountStatistics(response);
export const mapLabCountStatistics = (response: LabsAnalyticsLabCountRetrieveApiResponse) => mapCountStatistics(response);

export const mapLabVisitTrend = (response: LabsAnalyticsLabVisitsRetrieveApiResponse) => mapTrendSeries(response);
export const mapBookingTrend = (response: LabsAnalyticsBookingRetrieveApiResponse) => mapTrendSeries(response);
export const mapUserCountTrend = (response: LabsAnalyticsUserCountRetrieveApiResponse) => mapTrendSeries(response);
export const mapLabCountTrend = (response: LabsAnalyticsLabCountRetrieveApiResponse) => mapTrendSeries(response);

export const mapCountOrTrend = (response: CountTrendResponse) =>
  Array.isArray(response) ? mapTrendSeries(response) : mapCountStatistics(response);

export function mapStorageQuota(response: LabsAnalyticsStorageQuotaRetrieveApiResponse): UserStorageQuotaChartEntry[] {
  return response.data.map((item) => ({
    username: item.username ?? item.account_identifier,
    display_name: item.account_display_name ?? '',
    used: item.used_gibibytes,
    quota: item.quota_gibibytes,
  }));
}

export const mapLabGroupSummary = (response: LabsAnalyticsBenchGroupRetrieveApiResponse): LabGroupChartEntry[] =>
  response.data.map((item) => ({
    lab_group: item.id,
    lab_group_name: item.bench_group_name ?? item.name,
    entries: item.entries ?? item.total_benches,
  }));

export const mapEquipmentStatusSummary = (
  response: LabsAnalyticsLabEquipmentStatusRetrieveApiResponse,
): LabEquipmentStatusSummary[] => response.data.map((item) => ({
  status_type: item.status,
  entries: item.entries ?? item.count,
}));

export const mapLabEfficiency = (response: LabsAnalyticsLabEfficiencyRetrieveApiResponse): LabEfficiencyChartEntry[] =>
  response.data.map((item) => ({ ...item }));

export const mapProjectUsage = (response: LabsAnalyticsProjectUsageRetrieveApiResponse): ProjectUsageChartEntry[] =>
  response.data.map((item) => ({ ...item }));

export const mapUserLabUsage = (response: LabsAnalyticsUserLabUsageRetrieveApiResponse): UserByLabUsageChartEntry[] =>
  response.data.map((item) => ({ ...item }));

export const mapUserBookingEfficiency = (
  response: LabsAnalyticsUserBookingEfficiencyRetrieveApiResponse,
): UserByBookingEfficiencyChartEntry[] => response.data.map((item) => ({ ...item }));

export const mapLabUsageByTimeframe = (
  response: LabsAnalyticsLabUsageByTimeframeRetrieveApiResponse,
): LabUsageByTimeFrameChartEntry[] => response.data.map((item) => ({ ...item }));

const asNullableString = (value: unknown): string | null =>
  typeof value === 'string' ? value : null;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

interface SessionLogRead {
  id: number;
  computer_name: string | null;
  login_time: string | null;
  logout_time: string | null;
  duration_in_hour: number | null;
  active_time_in_hour: number | null;
  remote_user: unknown;
  remote_computer: string | null;
  remote_ip: string | null;
  booking_code: string | null;
  booking_info: unknown;
}

export function mapSessionLogEntry(dto: SessionLogRead): LabSessionLogEntry {
  const remoteUser = isRecord(dto.remote_user) ? dto.remote_user : {};
  const booking = isRecord(dto.booking_info) ? dto.booking_info : null;

  return {
    id: dto.id,
    computer_name: dto.computer_name,
    login_time: dto.login_time ?? null,
    logout_time: dto.logout_time ?? null,
    duration_in_hour: dto.duration_in_hour,
    active_time_in_hour: dto.active_time_in_hour,
    remote_user: {
      username: asNullableString(remoteUser.username),
      displayname: asNullableString(remoteUser.displayname),
    },
    remote_computer: dto.remote_computer ?? null,
    remote_ip: dto.remote_ip ?? null,
    booking_code: dto.booking_code ?? null,
    booking_info: booking
      ? {
          project: asNullableString(booking.project),
          from_date_time: asNullableString(booking.from_date_time),
          to_date_time: asNullableString(booking.to_date_time),
        }
      : null,
  };
}

export function mapSessionLogResponse(response: unknown): LabSessionLogResponse {
  const outer = isRecord(response) ? response : {};
  const normalized = isRecord(outer.data) ? outer.data : outer;
  const items = Array.isArray(normalized.data) ? normalized.data : Array.isArray(normalized.results) ? normalized.results : [];
  const entries = items.filter(isRecord).map((item) => mapSessionLogEntry(item as unknown as SessionLogRead));
  return {
    total_count: typeof normalized.total_count === 'number' ? normalized.total_count : entries.length,
    total_usage_hours: typeof normalized.total_usage_hours === 'number' ? normalized.total_usage_hours : 0,
    results: entries,
  };
}
