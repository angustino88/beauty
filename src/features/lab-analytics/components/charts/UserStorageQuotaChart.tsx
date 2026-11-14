import { Empty } from 'antd';
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { getChartHeight, MAX_TICKS } from '../../utils';
import type { UserStorageQuotaChartEntry } from '../../types';
import { ChartColors, ChartDefaults } from './ChartTheme';
import CustomTooltip from './CustomTooltip';

export function UserStorageQuotaChart({ dataSource }: { dataSource: UserStorageQuotaChartEntry[] }) {
  const chartHeight = getChartHeight(dataSource.length);
  if (!dataSource.length) return <Empty />;

  return (
    <ResponsiveContainer width="100%" height={chartHeight}>
      <BarChart data={dataSource} layout="vertical">
        <CartesianGrid strokeDasharray="4 8" stroke={ChartColors.grid} />
        <XAxis type="number" axisLine={false} tickLine={false} tickCount={MAX_TICKS} tick={{ fontSize: 12, fill: ChartColors.text }} />
        <YAxis yAxisId={0} type="category" dataKey="username" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: ChartColors.text }} width={90} />
        <YAxis yAxisId={1} type="category" dataKey="username" axisLine={false} hide />
        <Tooltip content={<CustomTooltip />} />
        <Legend iconType="circle" wrapperStyle={{ paddingTop: 6 }} />
        <Bar
          name="Used (GiB)"
          yAxisId={0}
          dataKey="used"
          fill={ChartColors.bar}
          radius={[ChartDefaults.barRadius, ChartDefaults.barRadius, ChartDefaults.barRadius, ChartDefaults.barRadius]}
          barSize={ChartDefaults.barSize}
          isAnimationActive
          animationDuration={ChartDefaults.animationMs}
        />
        <Bar
          name="Quota (GiB)"
          yAxisId={1}
          dataKey="quota"
          fill={ChartColors.line}
          barSize={12}
          radius={[ChartDefaults.barRadius, ChartDefaults.barRadius, ChartDefaults.barRadius, ChartDefaults.barRadius]}
          isAnimationActive
          animationDuration={ChartDefaults.animationMs}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}

