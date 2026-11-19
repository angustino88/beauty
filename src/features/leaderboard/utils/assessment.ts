import type { LabItem, PersonaItem } from '../types';

/**
 * Inline KPI assessment for leaderboard rows: an overall rating plus the strengths and the points
 * to improve, each written as a short sentence with the figure behind it. Pure, so the table, the
 * detail view and the Excel export all say the same thing.
 */

export type AssessmentRating = 'excellent' | 'good' | 'fair' | 'needs_attention' | 'limited_data';
export type AssessmentTone = 'success' | 'info' | 'warning' | 'danger' | 'neutral';

export interface Assessment {
  rating: AssessmentRating;
  label: string;
  tone: AssessmentTone;
  /** Weighted KPI score 0–100; null when there is too little activity to judge. */
  score: number | null;
  strengths: string[];
  improvements: string[];
}

const RATINGS: Record<AssessmentRating, { label: string; tone: AssessmentTone }> = {
  excellent: { label: 'Excellent', tone: 'success' },
  good: { label: 'Good', tone: 'info' },
  fair: { label: 'Fair', tone: 'warning' },
  needs_attention: { label: 'Needs attention', tone: 'danger' },
  limited_data: { label: 'Limited data', tone: 'neutral' },
};

const pct = (value: number) => `${Math.round(value * 100)}%`;
const hours = (value: number) => {
  const rounded = Math.round(value * 10) / 10;
  return `${rounded} h`;
};

/** Weighted mean of the KPIs that have a value, as 0–100. */
function weightedScore(parts: Array<[number | null | undefined, number]>): number | null {
  let total = 0;
  let weight = 0;
  for (const [value, w] of parts) {
    if (value == null || !Number.isFinite(value)) continue;
    total += Math.max(0, Math.min(1, value)) * w;
    weight += w;
  }
  return weight ? Math.round((total / weight) * 100) : null;
}

type NamedKpi = [label: string, value: number | null | undefined];

/**
 * When no KPI crosses a threshold, still name the best and the weakest area so every rating says
 * what someone does well and where to look first.
 */
function fillGaps(kpis: NamedKpi[], strengths: string[], improvements: string[]): void {
  const known = kpis.filter((kpi): kpi is [string, number] => kpi[1] != null && Number.isFinite(kpi[1]));
  if (!known.length) return;
  const sorted = [...known].sort((a, b) => b[1] - a[1]);
  const [bestLabel, best] = sorted[0];
  const [worstLabel, worst] = sorted[sorted.length - 1];
  if (!strengths.length && best >= 0.6) strengths.push(`Strongest area: ${bestLabel} (${pct(best)})`);
  if (!improvements.length && worst < 0.85 && worstLabel !== bestLabel) improvements.push(`Most room to grow: ${worstLabel} (${pct(worst)})`);
}

function build(score: number | null, enoughData: boolean, strengths: string[], improvements: string[]): Assessment {
  const rating: AssessmentRating = !enoughData || score == null ? 'limited_data'
    : score >= 85 ? 'excellent'
      : score >= 70 ? 'good'
        : score >= 50 ? 'fair'
          : 'needs_attention';
  return { rating, ...RATINGS[rating], score: rating === 'limited_data' ? null : score, strengths, improvements };
}

export function assessPersona(row: PersonaItem): Assessment {
  const sessions = row.total_sessions ?? 0;
  const bookings = row.total_bookings ?? 0;
  const strengths: string[] = [];
  const improvements: string[] = [];
  const { booking_compliance: attendance, booking_utilization: used, slot_adherence: adherence, active_rate: active, ad_hoc_rate: adHoc } = row;

  // Strengths, most valuable first.
  if (attendance != null && bookings >= 2 && attendance >= 0.9) strengths.push(`Attends ${pct(attendance)} of bookings`);
  if (used != null && used >= 0.75) strengths.push(`Uses ${pct(used)} of booked time`);
  if (adherence != null && adherence >= 0.95) strengths.push('Stays within booked slots');
  if (active != null && sessions >= 2 && active >= 0.8) strengths.push(`Focused sessions: ${pct(active)} active time`);
  if (adHoc != null && sessions >= 3 && adHoc <= 0.1) strengths.push('Books ahead for almost every session');
  if (row.usage_efficiency >= 0.5) strengths.push(`Strong lab usage: ${hours(row.usage_efficiency * 8)} active per weekday`);
  if (sessions >= 3 && row.late_rate <= 0.05) strengths.push('Works within regular hours');
  if ((row.labs_accessed ?? 0) >= 3) strengths.push(`Works across ${row.labs_accessed} lab computers`);

  // Points to improve, most costly first.
  if (attendance != null && row.no_show_bookings > 0 && attendance < 0.8) {
    improvements.push(`${row.no_show_bookings} of ${bookings} bookings not attended: cancel slots you won't use`);
  }
  if (used != null && used < 0.5) improvements.push(`Uses only ${pct(used)} of booked time: book shorter slots`);
  if (adherence != null && adherence < 0.8) improvements.push(`${pct(1 - adherence)} of booked-session time is outside the slot`);
  if (active != null && sessions >= 2 && active < 0.5) improvements.push(`Sessions are mostly idle (${pct(active)} active)`);
  if (adHoc != null && sessions >= 3 && adHoc >= 0.5) improvements.push(`${pct(adHoc)} of sessions without a booking: book ahead`);
  if (sessions > 0 && row.late_rate >= 0.25) improvements.push(`${pct(row.late_rate)} of lab time after hours (20:00–06:00)`);

  fillGaps([
    ['booking attendance', attendance],
    ['booked time used', used],
    ['slot adherence', adherence],
    ['active time in sessions', active],
    ['booking ahead', adHoc == null ? null : 1 - adHoc],
  ], strengths, improvements);

  const score = weightedScore([
    [attendance, 3],
    [used, 2],
    [adherence, 1],
    [active, 2],
    [adHoc == null ? null : 1 - adHoc, 1],
    [sessions ? 1 - row.late_rate : null, 1],
  ]);
  return build(score, sessions + bookings >= 3, strengths, improvements);
}

export function assessLab(row: LabItem): Assessment {
  const strengths: string[] = [];
  const improvements: string[] = [];
  const util = row.utilization_rate ?? 0;
  const fill = row.booking_fill ?? 0;
  const { booking_compliance: attendance, booking_utilization: used } = row;

  if (util >= 0.5) strengths.push(`Well used: active ${pct(util)} of working hours`);
  if (attendance != null && row.total_bookings >= 2 && attendance >= 0.9) strengths.push(`Bookings are kept (${pct(attendance)} attended)`);
  if (used != null && used >= 0.75) strengths.push(`Booked time is used (${pct(used)})`);
  if (row.active_users >= 5) strengths.push(`Shared by ${row.active_users} users`);

  if (row.total_sessions + row.total_bookings > 0 && util < 0.15) improvements.push(`Underused: active ${pct(util)} of working hours`);
  if (fill >= 0.5 && util < fill / 2) improvements.push(`Booked ${pct(fill)} of working hours but active only ${pct(util)}`);
  if (attendance != null && row.no_show_bookings > 0 && attendance < 0.8) improvements.push(`${row.no_show_bookings} of ${row.total_bookings} booked slots not used`);
  if (used != null && used < 0.5) improvements.push(`Only ${pct(used)} of booked time is used`);

  fillGaps([
    ['booking attendance', attendance],
    ['booked time used', used],
    ['utilization', Math.min(1, util / 0.6)],
  ], strengths, improvements);

  // Utilisation counts as full marks from 60 % of working hours: a bench is rarely busy all day.
  const score = weightedScore([[Math.min(1, util / 0.6), 3], [attendance, 2], [used, 2]]);
  return build(score, row.total_sessions + row.total_bookings >= 3, strengths, improvements);
}
