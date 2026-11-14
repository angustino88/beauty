export type LeaderboardRangePreset = 'weekly' | 'monthly' | 'all-time';

export interface LeaderboardFilter {
  start_date?: string;
  end_date?: string;
}

export interface TopProjectItem {
  project_id: number;
  project_name: string;
  total_minutes: number;
}

export interface PersonaItem {
  id: number;
  username: string;
  display_name: string | null;
  avatar: string | null;
  points: number;
  wfo_rate: number;
  wfh_rate: number;
  late_rate: number;
  labs_accessed: number;
  usage_efficiency: number;
  total_bookings: number;
  booking_compliance: number;
  total_sessions: number;
  total_usage_minutes: number;
  avg_session_minutes: number;
  longest_session_minutes: number;
  last_remote: string | null;
  top_projects: TopProjectItem[];
}

export interface LabItem {
  id: number;
  lab_name: string | null;
  computer_name: string | null;
  image: string | null;
  points: number;
  active_users: number;
  utilization_rate: number;
  booking_compliance: number;
  availability: number;
  last_remote: string | null;
  total_sessions: number;
  total_usage_minutes: number;
  downtime_hours: number;
  top_projects: TopProjectItem[];
}

export interface RankedPersonaItem extends PersonaItem { rank: number; }
export interface RankedLabItem    extends LabItem     { rank: number; }

export interface WeeklyUsageItem {
  weekday: number;
  total_minutes: number;
  day?: number;
  hour?: number;
  usage?: number;
}

export interface UserProfile {
  last_remote: string | null;
  wfo_rate: number;
  wfh_rate: number;
  late_rate: number;
  labs_accessed: number;
  usage_efficiency: number;
  total_bookings: number;
  booking_compliance: number;
  total_sessions: number;
  total_usage_minutes: number;
  avg_session_minutes: number;
  longest_session_minutes: number;
  top_projects: TopProjectItem[];
}

export interface LabProfile {
  last_remote: string | null;
  total_sessions: number;
  active_users: number;
  utilization_rate: number;
  booking_compliance: number;
  downtime_hours: number;
  availability: number;
  total_usage_minutes: number;
  top_projects: TopProjectItem[];
}
