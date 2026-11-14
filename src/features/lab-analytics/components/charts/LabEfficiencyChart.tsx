import { Empty } from 'antd';
import { Bar, CartesianGrid, ComposedChart, Legend, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { getChartHeight, getFloatTick, getWholeTick, MAX_TICKS } from '../../utils';
import type { LabEfficiencyChartEntry } from '../../types';
import { ChartColors, ChartDefaults } from './ChartTheme';
import CustomTooltip from './CustomTooltip';

export function LabEfficiencyChart({ dataSource }: { dataSource: LabEfficiencyChartEntry[] }) {
  const chartData = dataSource.map((d) => ({
    ...d,
    label: `${d.lab_name} (${d.computer_name})`,
    efficiency: d.efficiency,
    booking: d.booking,
  }));
  const chartHeight = getChartHeight(chartData.length);
  if (!chartData.length) return <Empty />;

  return (
    <ResponsiveContainer width="100%" height={chartHeight}>
      <ComposedChart data={chartData} layout="vertical" margin={{ top: 10, right: 24, bottom: 10, left: 12 }}>
        <CartesianGrid strokeDasharray="4 8" stroke={ChartColors.grid} />
        <XAxis
          type="number"
          axisLine={false}
          tickCount={MAX_TICKS}
          ticks={getFloatTick(chartData.map((entry) => entry.efficiency))}
          xAxisId={0}
          tick={{ fill: ChartColors.text, fontSize: 12 }}
          tickLine={false}
        />
        <XAxis
          type="number"
          orientation="top"
          axisLine={false}
          tickCount={MAX_TICKS}
          ticks={getWholeTick(chartData.map((entry) => entry.booking))}
          xAxisId={1}
          hide
          tickLine={false}
        />
        <YAxis dataKey="label" type="category" axisLine={false} tick={{ fill: ChartColors.text, fontSize: 13 }} width={95} tickLine={false} />
        <Tooltip content={<CustomTooltip />} />
        <Legend wrapperStyle={{ paddingTop: 6 }} iconType="circle" />
        <Bar
          name="Efficiency"
          dataKey="efficiency"
          fill={ChartColors.bar}
          barSize={ChartDefaults.barSize}
          radius={[ChartDefaults.barRadius, ChartDefaults.barRadius, ChartDefaults.barRadius, ChartDefaults.barRadius]}
          isAnimationActive
          animationDuration={ChartDefaults.animationMs}
          xAxisId={0}
        />
        <Line
          name="Bookings"
          dataKey="booking"
          stroke={ChartColors.line}
          strokeWidth={ChartDefaults.lineWidth}
          dot={{ r: ChartDefaults.dotRadius, strokeWidth: 2, stroke: ChartColors.line }}
          activeDot={{ r: ChartDefaults.activeDotRadius }}
          isAnimationActive
          animationDuration={ChartDefaults.animationMs}
          xAxisId={1}
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}

