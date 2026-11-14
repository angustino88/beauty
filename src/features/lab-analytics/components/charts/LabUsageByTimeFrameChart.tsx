import { Empty } from 'antd';
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { MAX_TICKS } from '../../utils';
import type { LabUsageByTimeFrameChartEntry } from '../../types';
import { ChartColors, ChartDefaults } from './ChartTheme';
import CustomTooltip from './CustomTooltip';

export function LabUsageByTimeFrameChart({ dataSource }: { dataSource: LabUsageByTimeFrameChartEntry[] }) {
  const maxUsage = Math.max(...dataSource.map((entry) => entry.usage), 0);
  if (!dataSource.some((item) => item.usage > 0)) return <Empty />;

  return (
    <ResponsiveContainer width="100%" height={370}>
      <BarChart data={dataSource} layout="vertical">
        <CartesianGrid strokeDasharray="4 8" stroke={ChartColors.grid} />
        <XAxis type="number" axisLine={false} tickLine={false} tickCount={MAX_TICKS} tick={{ fontSize: 12, fill: ChartColors.text }} />
        <YAxis interval={0} type="category" dataKey="timeslot" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: ChartColors.text }} width={110} />
        <Tooltip content={<CustomTooltip />} />
        <Bar
          name="Usage Time (Hours)"
          dataKey="usage"
          fill={ChartColors.bar}
          radius={[ChartDefaults.barRadius, ChartDefaults.barRadius, ChartDefaults.barRadius, ChartDefaults.barRadius]}
          barSize={ChartDefaults.barSize}
          isAnimationActive
          animationDuration={ChartDefaults.animationMs}
        >
          {dataSource.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.usage === maxUsage ? ChartColors.highlight : ChartColors.bar} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

