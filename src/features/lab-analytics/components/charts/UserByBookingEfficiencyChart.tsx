import { Empty } from 'antd';
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { getChartHeight } from '../../utils';
import type { UserByBookingEfficiencyChartEntry } from '../../types';
import { ChartColors, ChartDefaults } from './ChartTheme';
import CustomTooltip from './CustomTooltip';

export function UserByBookingEfficiencyChart({ dataSource }: { dataSource: UserByBookingEfficiencyChartEntry[] }) {
  const chartHeight = getChartHeight(dataSource.length);
  if (!dataSource.length) return <Empty />;

  return (
    <ResponsiveContainer width="100%" height={chartHeight}>
      <BarChart data={dataSource} layout="vertical">
        <CartesianGrid strokeDasharray="4 8" stroke={ChartColors.grid} />
        <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: ChartColors.text }} />
        <YAxis type="category" dataKey="remote_user" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: ChartColors.text }} width={110} />
        <Tooltip content={<CustomTooltip />} />
        <Legend iconType="circle" wrapperStyle={{ paddingTop: 6 }} />
        <Bar
          name="Efficiency"
          dataKey="efficiency"
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

