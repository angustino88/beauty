import { useId } from 'react';
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { ChartEmpty, ChartLegend, ChartTooltip, VerticalGradient, formatNumber, useChartTheme } from '@/shared/charts';
import type { LabUsageByTimeFrameChartEntry } from '../../types';

/** Hours used per time slot; the busiest slot is highlighted. */
export function LabUsageByTimeFrameChart({ dataSource }: { dataSource: LabUsageByTimeFrameChartEntry[] }) {
  const theme = useChartTheme();
  const id = useId().replace(/:/g, '');
  const maxUsage = Math.max(...dataSource.map((entry) => entry.usage), 0);
  if (!dataSource.some((item) => item.usage > 0)) return <ChartEmpty />;
  const data = dataSource.map((entry) => ({ ...entry, slot: entry.timeslot.split('-')[0] }));

  return (
    <div style={{ width: '100%' }}>
      <ChartLegend items={[{ label: 'Usage (hours)', color: theme.series[0] }, { label: 'Peak slot', color: theme.series[1] }]} />
      <ResponsiveContainer width="100%" height={290}>
        <BarChart data={data} margin={{ top: 8, right: 4, bottom: 0, left: -12 }} barCategoryGap="22%">
          <defs>
            <VerticalGradient id={`${id}-bar`} color={theme.series[0]} from={0.95} to={0.35} />
            <VerticalGradient id={`${id}-peak`} color={theme.series[1]} from={1} to={0.45} />
          </defs>
          <CartesianGrid {...theme.gridProps} />
          <XAxis dataKey="slot" {...theme.axisProps} />
          <YAxis {...theme.axisProps} width={44} />
          <Tooltip cursor={{ fill: theme.grid, opacity: 0.5 }} content={<ChartTooltip title={(_label, payload) => String(payload[0]?.payload?.timeslot ?? '')} formatValue={(v) => `${formatNumber(v)} h`} />} />
          <Bar name="Usage" dataKey="usage" radius={[6, 6, 0, 0]} maxBarSize={42} isAnimationActive animationDuration={500}>
            {data.map((entry) => <Cell key={entry.timeslot} fill={`url(#${id}-${entry.usage === maxUsage ? 'peak' : 'bar'})`} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
