import { PolarAngleAxis, PolarGrid, PolarRadiusAxis, Radar, RadarChart, ResponsiveContainer, Tooltip } from 'recharts';
import { ChartLegend, useChartTheme } from '@/shared/charts';
import type { AssessmentKpiResult } from '../../types';
import { pct, radarData, type OrientedKpi } from '../../utils/assessmentChart';
import styles from './Assessment.module.css';

function RadarTooltip({ active, payload, hasPrevious }: { active?: boolean; payload?: Array<{ payload?: OrientedKpi }>; hasPrevious: boolean }) {
  const row = active ? payload?.[0]?.payload : undefined;
  if (!row) return null;
  return (
    <div className={styles.chartTooltip}>
      <div className={styles.chartTooltipTitle}>{row.label}</div>
      <div><span>This period</span><strong>{pct(row.raw)}</strong></div>
      {hasPrevious && <div><span>Previous period</span><strong>{pct(row.rawPrevious)}</strong></div>}
      <div><span>Target</span><strong>{row.isHigherBetter ? '≥' : '≤'} {pct(row.rawTarget)}</strong></div>
    </div>
  );
}

/**
 * KPI profile: one axis per KPI, further out is better. This period against the previous period, with
 * the target as a dashed outline, so strengths and gaps read as the shape.
 */
export function AssessmentRadar({ kpis }: { kpis: AssessmentKpiResult[] }) {
  const theme = useChartTheme();
  const data = radarData(kpis);
  if (!data) return null;
  const [current, previous] = theme.series;

  return (
    <figure className={styles.radar} aria-label="KPI profile radar chart">
      <ChartLegend
        align="center"
        items={[
          { label: 'This period', color: current },
          ...(data.hasPrevious ? [{ label: 'Previous period', color: previous }] : []),
          { label: 'Target', color: theme.axis, dashed: true },
        ]}
      />
      <div className={styles.radarCanvas}>
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={data.rows} outerRadius="70%" margin={{ top: 8, right: 36, bottom: 8, left: 36 }}>
            <PolarGrid stroke={theme.grid} />
            <PolarAngleAxis dataKey="axis" tick={{ fill: theme.textMuted, fontSize: 11 }} />
            <PolarRadiusAxis domain={[0, 100]} tickCount={5} tick={false} axisLine={false} />
            <Radar name="Target" dataKey="target" stroke={theme.axis} strokeDasharray="4 4" strokeWidth={1.5} fill="none" isAnimationActive={false} />
            {data.hasPrevious && (
              <Radar name="Previous period" dataKey="previous" stroke={previous} strokeWidth={2} fill={previous} fillOpacity={0.06} isAnimationActive={false} />
            )}
            <Radar
              name="This period"
              dataKey="current"
              stroke={current}
              strokeWidth={2}
              fill={current}
              fillOpacity={0.16}
              dot={{ r: 4, fill: current, stroke: theme.surface, strokeWidth: 2 }}
              isAnimationActive={false}
            />
            <Tooltip content={<RadarTooltip hasPrevious={data.hasPrevious} />} cursor={false} />
          </RadarChart>
        </ResponsiveContainer>
      </div>
      <figcaption className={styles.chartNote}>Further out is better. Lower-is-better KPIs are shown inverted.</figcaption>
    </figure>
  );
}
