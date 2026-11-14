import { Empty } from 'antd';
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { getChartHeight, MAX_TICKS } from '../../utils';
import type { ProjectUsageChartEntry } from '../../types';
import { ChartColors, ChartDefaults } from './ChartTheme';
import CustomTooltip from './CustomTooltip';

export function ProjectUsageChart({ dataSource }: { dataSource: ProjectUsageChartEntry[] }) {
  const chartHeight = getChartHeight(dataSource.length);
  if (!dataSource.length) return <Empty />;

  return (
    <ResponsiveContainer width="100%" height={chartHeight}>
      <BarChart data={dataSource} layout="vertical" margin={{ top: 8, right: 20, bottom: 8, left: 4 }} barCategoryGap="28%">
        <CartesianGrid strokeDasharray="3 6" stroke={ChartColors.grid} horizontal={false} />
        <XAxis type="number" axisLine={false} tickLine={false} tickCount={MAX_TICKS} tick={{ fontSize: 12, fill: ChartColors.text }} />
        <YAxis type="category" dataKey="project_name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: ChartColors.text }} width={90} />
        <Tooltip content={<CustomTooltip />} />
        <Legend iconType="circle" iconSize={8} wrapperStyle={{ paddingTop: 10, fontSize: 12 }} />
        <Bar
          name="Usage Time (Hours)"
          dataKey="usage"
          fill={ChartColors.bar}
          radius={[ChartDefaults.barRadius, ChartDefaults.barRadius, ChartDefaults.barRadius, ChartDefaults.barRadius]}
          barSize={ChartDefaults.barSize}
          isAnimationActive
          animationDuration={ChartDefaults.animationMs}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}

