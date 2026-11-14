import { Empty } from 'antd';
import { Brush, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { generateInterval, processDateLabels } from '../../utils';
import type { StatisticUnit, StatisticsChartEntry } from '../../types';
import { ChartColors, ChartDefaults } from './ChartTheme';
import CustomTooltip from './CustomTooltip';

export function StatisticsChart({ dataSource, unit, bucketUnit, color = ChartColors.line }: { dataSource: StatisticsChartEntry[]; unit: string; bucketUnit: StatisticUnit; color?: string }) {
  const processedData = processDateLabels(dataSource, bucketUnit);
  if (!processedData.length) return <Empty />;

  return (
    <ResponsiveContainer width="100%" height={350}>
      <LineChart data={processedData} margin={{ top: 10, right: 40, left: 10, bottom: 50 }}>
        <CartesianGrid strokeDasharray="4 8" stroke={ChartColors.grid} />
        <XAxis
          type="category"
          dataKey="label"
          angle={45}
          dx={15}
          dy={30}
          minTickGap={-200}
          tick={{ fontSize: 12, fill: ChartColors.text }}
          axisLine={false}
          tickLine={false}
          interval={generateInterval(processedData.length)}
        />
        <YAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: ChartColors.text }} />
        <Tooltip content={<CustomTooltip />} />
        <Legend verticalAlign="top" iconType="circle" wrapperStyle={{ paddingBottom: 8 }} />
        <Brush dataKey="label" height={28} stroke={color} dy={44} travellerWidth={10} />
        <Line
          name={unit}
          dataKey="count"
          stroke={color}
          strokeWidth={ChartDefaults.lineWidth}
          dot={{ r: ChartDefaults.dotRadius, stroke: color, strokeWidth: 1 }}
          activeDot={{ r: ChartDefaults.activeDotRadius, fill: color, stroke: '#ffffff', strokeWidth: 2 }}
          isAnimationActive
          animationDuration={600}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

