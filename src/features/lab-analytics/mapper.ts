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

const asRef = (value: unknown): { id: number; name: string } | null =>
  isRecord(value) && typeof value.id === 'number' ? { id: value.id, name: asNullableString(value.name) ?? `#${value.id}` } : null;

const asNumberOrNull = (value: unknown): number | null =>
  typeof value === 'number' && Number.isFinite(value) ? value : null;

export function mapSessionLogEntry(dto: Record<string, unknown>): LabSessionLogEntry {
  const user = isRecord(dto.user) && typeof dto.user.id === 'number'
    ? { id: dto.user.id, username: asNullableString(dto.user.username) ?? '', display_name: asNullableString(dto.user.display_name) ?? '' }
    : null;
  const access = isRecord(dto.access_type) && typeof dto.access_type.value === 'string'
    ? { value: dto.access_type.value, label: asNullableString(dto.access_type.label) ?? dto.access_type.value }
    : null;
  return {
    id: Number(dto.id),
    login_at: asNullableString(dto.login_at),
    logout_at: asNullableString(dto.logout_at),
    duration_minutes: asNumberOrNull(dto.duration_minutes),
    active_minutes: asNumberOrNull(dto.active_minutes),
    computer: asRef(dto.computer),
    host_name: asNullableString(dto.host_name),
    bench: asRef(dto.bench),
    remote_user: asNullableString(dto.remote_user),
    remote_user_display_name: asNullableString(dto.remote_user_display_name),
    user,
    access_type: access,
    booking_code: asNullableString(dto.booking_code),
    booking_id: asNumberOrNull(dto.booking_id),
  };
}

/** Paginated envelope `{data: [...], meta: {pagination: {count}}}`. */
export function mapSessionLogResponse(response: unknown): LabSessionLogResponse {
  const outer = isRecord(response) ? response : {};
  const items = Array.isArray(outer.data) ? outer.data : [];
  const meta = isRecord(outer.meta) && isRecord(outer.meta.pagination) ? outer.meta.pagination : {};
  const results = items.filter(isRecord).map((item) => mapSessionLogEntry(item));
  return { total_count: typeof meta.count === 'number' ? meta.count : results.length, results };
}
