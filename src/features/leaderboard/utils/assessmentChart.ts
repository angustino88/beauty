import type { AssessmentKpiResult } from '../types';

/**
 * Chart geometry for the KPI assessment. Every KPI is oriented so that further out (or further right)
 * is better: a "lower is better" KPI is plotted as its complement under a positive name, e.g.
 * "Sessions without a booking 14%" becomes "Booked ahead 86%". Tooltips still show the raw figure.
 */

const POSITIVE_NAME: Record<string, string> = {
  advance_booking: 'Booked ahead',
  after_hours: 'Within regular hours',
};

export interface OrientedKpi {
  key: string;
  /** Name for the better-is-more orientation. */
  axis: string;
  /** Original KPI name and raw values, for tooltips and text. */
  label: string;
  raw: number | null;
  rawPrevious: number | null;
  rawTarget: number;
  isHigherBetter: boolean;
  /** 0–100, better is more. */
  current: number | null;
  previous: number | null;
  target: number;
  status: AssessmentKpiResult['status'];
}

const oriented = (value: number | null, isHigherBetter: boolean) =>
  value == null ? null : Math.round((isHigherBetter ? value : 1 - value) * 100);

export function orientKpis(kpis: AssessmentKpiResult[]): OrientedKpi[] {
  return kpis.map((kpi) => ({
    key: kpi.kpi.value,
    axis: kpi.is_higher_better ? kpi.kpi.label : POSITIVE_NAME[kpi.kpi.value] ?? `Not ${kpi.kpi.label.toLowerCase()}`,
    label: kpi.kpi.label,
    raw: kpi.value,
    rawPrevious: kpi.previous_value,
    rawTarget: kpi.target,
    isHigherBetter: kpi.is_higher_better,
    current: oriented(kpi.value, kpi.is_higher_better),
    previous: oriented(kpi.previous_value, kpi.is_higher_better),
    target: oriented(kpi.target, kpi.is_higher_better) ?? 0,
    status: kpi.status,
  }));
}

export interface RadarData {
  rows: OrientedKpi[];
  /** The previous polygon is drawn only when every axis has a previous value; a partial one would mislead. */
  hasPrevious: boolean;
}

/** Axes for the radar: KPIs that apply this period. A radar needs at least three. */
export function radarData(kpis: AssessmentKpiResult[]): RadarData | null {
  const rows = orientKpis(kpis).filter((row) => row.current != null);
  if (rows.length < 3) return null;
  return { rows, hasPrevious: rows.every((row) => row.previous != null) };
}

export const pct = (value: number | null | undefined) => (value == null ? '—' : `${Math.round(value * 100)}%`);
