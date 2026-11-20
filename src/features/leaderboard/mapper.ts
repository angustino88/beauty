import type {
  LabsLeaderboardLabRetrieveApiResponse,
  LabsLeaderboardPersonaRetrieveApiResponse,
  LabsBenchesProfileRetrieveByIdApiResponse,
  LabsLeaderboardUsersProfileRetrieveByIdApiResponse,
  LabsLeaderboardUsersWeeklyUsageRetrieveByIdApiResponse,
  LabsBenchesWeeklyUsageRetrieveByIdApiResponse,
} from '@/shared/api/generated/api';
import type {
  LabItem,
  LabProfile,
  LeaderboardAssessment,
  PersonaItem,
  TopProjectItem,
  UserProfile,
  WeeklyUsageItem,
} from './types';

type RecordValue = Record<string, unknown>;

const rateOrNull = (value: unknown): number | null => (typeof value === 'number' && Number.isFinite(value) ? value : null);

const mapTopProjects = (projects?: unknown[]): TopProjectItem[] => {
  if (!Array.isArray(projects)) return [];
  return projects.map((p, index) => {
    if (typeof p === 'string') {
      return { project_id: index + 1, project_name: p, total_minutes: 0 };
    }
    const rec = (p as RecordValue) ?? {};
    return {
      project_id: (rec.project_id as number) ?? index + 1,
      project_name: (rec.project_name as string) ?? (rec.name as string) ?? '',
      total_minutes: (rec.total_minutes as number) ?? 0,
    };
  });
};

export function mapPersonaResponse(response: LabsLeaderboardPersonaRetrieveApiResponse): PersonaItem[] {
  const rows = Array.isArray(response.data) ? response.data : [];
  return rows.map((rowItem: unknown) => {
    const row = (rowItem as RecordValue) ?? {};
    return {
      id: (row.id as number) ?? 0,
      username: (row.username as string) ?? '',
      display_name: (row.display_name as string) ?? null,
      avatar: (row.avatar as string) ?? null,
      points: (row.points as number) ?? 0,
      wfo_rate: (row.wfo_rate as number) ?? 0,
      wfh_rate: (row.wfh_rate as number) ?? 0,
      extended_hours_rate: (row.extended_hours_rate as number) ?? 0,
      labs_accessed: (row.labs_accessed as number) ?? 0,
      usage_efficiency: (row.usage_efficiency as number) ?? 0,
      active_rate: rateOrNull(row.active_rate),
      ad_hoc_rate: rateOrNull(row.ad_hoc_rate),
      total_bookings: (row.total_bookings as number) ?? 0,
      no_show_bookings: (row.no_show_bookings as number) ?? 0,
      booking_compliance: rateOrNull(row.booking_compliance),
      booking_utilization: rateOrNull(row.booking_utilization),
      slot_adherence: rateOrNull(row.slot_adherence),
      early_release_rate: rateOrNull(row.early_release_rate),
      idle_reserved_minutes: (row.idle_reserved_minutes as number) ?? 0,
      total_sessions: (row.total_sessions as number) ?? 0,
      total_usage_minutes: (row.total_usage_minutes as number) ?? 0,
      active_usage_minutes: (row.active_usage_minutes as number) ?? 0,
      avg_session_minutes: (row.avg_session_minutes as number) ?? 0,
      longest_session_minutes: (row.longest_session_minutes as number) ?? 0,
      last_remote: (row.last_remote_at as string) ?? null,
      top_projects: mapTopProjects(row.top_projects as unknown[]),
    };
  });
}

export function mapLabResponse(response: LabsLeaderboardLabRetrieveApiResponse): LabItem[] {
  const rows = Array.isArray(response.data) ? response.data : [];
  return rows.map((rowItem: unknown) => {
    const row = (rowItem as RecordValue) ?? {};
    const downtimeMinutes = (row.downtime_minutes as number) ?? 0;
    const downtimeHours = (row.downtime_hours as number) ?? (downtimeMinutes > 0 ? Math.round(downtimeMinutes / 60) : 0);
    return {
      id: (row.id as number) ?? 0,
      lab_name: (row.lab_name as string) ?? (row.name as string) ?? null,
      computer_name: (row.computer_name as string) ?? null,
      image: (row.image as string) ?? null,
      points: (row.points as number) ?? 0,
      active_users: (row.active_users as number) ?? 0,
      utilization_rate: (row.utilization_rate as number) ?? 0,
      booking_fill: (row.booking_fill as number) ?? 0,
      total_bookings: (row.total_bookings as number) ?? 0,
      no_show_bookings: (row.no_show_bookings as number) ?? 0,
      booking_compliance: rateOrNull(row.booking_compliance),
      booking_utilization: rateOrNull(row.booking_utilization),
      early_release_rate: rateOrNull(row.early_release_rate),
      idle_reserved_minutes: (row.idle_reserved_minutes as number) ?? 0,
      availability: (row.availability as number) ?? 0,
      last_remote: (row.last_remote_at as string) ?? null,
      total_sessions: (row.total_sessions as number) ?? 0,
      total_usage_minutes: (row.total_usage_minutes as number) ?? 0,
      downtime_hours: downtimeHours,
      top_projects: mapTopProjects(row.top_projects as unknown[]),
    };
  });
}

export function mapUserProfileResponse(response: LabsLeaderboardUsersProfileRetrieveByIdApiResponse): UserProfile {
  const profile = (response.data as RecordValue) ?? {};
  return {
    last_remote: (profile.last_remote_at as string) ?? null,
    wfo_rate: (profile.wfo_rate as number) ?? 0,
    wfh_rate: (profile.wfh_rate as number) ?? 0,
    extended_hours_rate: (profile.extended_hours_rate as number) ?? 0,
    labs_accessed: (profile.labs_accessed as number) ?? 0,
    usage_efficiency: (profile.usage_efficiency as number) ?? 0,
    total_bookings: (profile.total_bookings as number) ?? 0,
    booking_compliance: (profile.booking_compliance as number) ?? 0,
    total_sessions: (profile.total_sessions as number) ?? 0,
    total_usage_minutes: (profile.total_usage_minutes as number) ?? 0,
    avg_session_minutes: (profile.avg_session_minutes as number) ?? 0,
    longest_session_minutes: (profile.longest_session_minutes as number) ?? 0,
    top_projects: mapTopProjects(profile.top_projects as unknown[]),
  };
}

export function mapLabProfileResponse(response: LabsBenchesProfileRetrieveByIdApiResponse): LabProfile {
  const profile = (response.data as RecordValue) ?? {};
  return {
    last_remote: (profile.last_remote_at as string) ?? null,
    total_sessions: (profile.total_sessions as number) ?? 0,
    active_users: (profile.active_users as number) ?? 0,
    utilization_rate: (profile.utilization_rate as number) ?? 0,
    booking_compliance: (profile.booking_compliance as number) ?? 0,
    downtime_hours: (profile.downtime_hours as number) ?? 0,
    availability: (profile.availability as number) ?? 0,
    total_usage_minutes: (profile.total_usage_minutes as number) ?? 0,
    top_projects: mapTopProjects(profile.top_projects as unknown[]),
  };
}

type RawUsageItem = {
  weekday?: number;
  total_minutes?: number;
  day?: number;
  hour?: number;
  usage?: number;
};

const mapWeeklyUsage = (items: RawUsageItem[]): WeeklyUsageItem[] => {
  if (!Array.isArray(items) || items.length === 0) return [];

  // Check if items already have weekday and total_minutes
  if (items.some((i) => typeof i.weekday === 'number' && typeof i.total_minutes === 'number')) {
    return items.map((item) => ({
      weekday: item.weekday ?? 1,
      total_minutes: item.total_minutes ?? item.usage ?? 0,
      day: item.day,
      hour: item.hour,
      usage: item.usage,
    }));
  }

  // Otherwise aggregate day/hour heatmap points by day
  const dayMinutes = new Map<number, number>();
  for (const item of items) {
    let day = item.day;
    // Map 0-indexed day to weekday 1-7
    if (day !== undefined) {
      if (day === 0) day = 7;
    } else {
      day = item.weekday ?? 1;
    }
    const minutes = item.usage ?? item.total_minutes ?? 0;
    dayMinutes.set(day, (dayMinutes.get(day) ?? 0) + minutes);
  }

  const result: WeeklyUsageItem[] = [];
  for (let d = 1; d <= 7; d++) {
    result.push({
      weekday: d,
      total_minutes: dayMinutes.get(d) ?? 0,
    });
  }
  return result;
};

export function mapUserWeeklyUsageResponse(response: LabsLeaderboardUsersWeeklyUsageRetrieveByIdApiResponse): WeeklyUsageItem[] {
  return mapWeeklyUsage(response.data as RawUsageItem[]);
}

export function mapLabWeeklyUsageResponse(response: LabsBenchesWeeklyUsageRetrieveByIdApiResponse): WeeklyUsageItem[] {
  return mapWeeklyUsage(response.data as RawUsageItem[]);
}

const asChoice = (value: unknown) => {
  const rec = (value as RecordValue) ?? {};
  return { value: String(rec.value ?? ''), label: String(rec.label ?? rec.value ?? '') };
};
const asList = (value: unknown): RecordValue[] => (Array.isArray(value) ? value.filter((v) => v && typeof v === 'object') as RecordValue[] : []);
const asPeriod = (value: unknown) => {
  const rec = (value as RecordValue) ?? {};
  return { starts_at: String(rec.starts_at ?? ''), ends_at: String(rec.ends_at ?? '') };
};
const numberOrNull = (value: unknown): number | null => (typeof value === 'number' && Number.isFinite(value) ? value : null);

/** `{data: {...}}` from GET .../assessment. */
export function mapAssessmentResponse(response: unknown): LeaderboardAssessment {
  const data = (((response as RecordValue) ?? {}).data as RecordValue) ?? {};
  return {
    period: asPeriod(data.period),
    previous_period: asPeriod(data.previous_period),
    rating: asChoice(data.rating),
    score: numberOrNull(data.score),
    previous_score: numberOrNull(data.previous_score),
    summary: String(data.summary ?? ''),
    total_sessions: Number(data.total_sessions ?? 0),
    total_bookings: Number(data.total_bookings ?? 0),
    kpis: asList(data.kpis).map((kpi) => ({
      kpi: asChoice(kpi.kpi),
      value: numberOrNull(kpi.value),
      previous_value: numberOrNull(kpi.previous_value),
      target: Number(kpi.target ?? 0),
      is_higher_better: kpi.is_higher_better !== false,
      weight: Number(kpi.weight ?? 0),
      status: asChoice(kpi.status),
    })),
    strengths: asList(data.strengths).map((item) => ({ kpi: asChoice(item.kpi), text: String(item.text ?? '') })),
    development_areas: asList(data.development_areas).map((item) => ({
      kpi: asChoice(item.kpi),
      severity: asChoice(item.severity),
      text: String(item.text ?? ''),
      recommendation: String(item.recommendation ?? ''),
    })),
  };
}
