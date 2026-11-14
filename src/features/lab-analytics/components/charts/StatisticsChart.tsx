import { useId } from 'react';
import { Area, AreaChart, Brush, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { ChartEmpty, ChartTooltip, StatTriplet, VerticalGradient, useChartTheme } from '@/shared/charts';
import { generateInterval, processDateLabels } from '../../utils';
import type { StatisticUnit, StatisticsChartEntry } from '../../types';

export function StatisticsChart({ dataSource, unit, bucketUnit, color }: { dataSource: StatisticsChartEntry[]; unit: string; bucketUnit: StatisticUnit; color?: string }) {
  const theme = useChartTheme();
  const id = useId().replace(/:/g, '');
  const stroke = color && !color.startsWith('var(') ? color : theme.series[0];
  const processedData = processDateLabels(dataSource, bucketUnit);
  if (!processedData.length) return <ChartEmpty />;

  return (
    <div style={{ width: '100%' }}>
      <div style={{ maxWidth: 360, marginBottom: 12 }}>
        <StatTriplet values={processedData.map((entry) => Number(entry.count))} />
      </div>
      <ResponsiveContainer width="100%" height={340}>
        <AreaChart data={processedData} margin={{ top: 10, right: 12, left: -8, bottom: 8 }}>
          <defs><VerticalGradient id={`${id}-area`} color={stroke} from={0.4} to={0.02} /></defs>
          <CartesianGrid {...theme.gridProps} />
          <XAxis dataKey="label" {...theme.axisProps} interval={generateInterval(processedData.length)} minTickGap={16} />
          <YAxis {...theme.axisProps} width={48} allowDecimals={false} />
          <Tooltip cursor={{ stroke: theme.axis, strokeDasharray: '4 4' }} content={<ChartTooltip />} />
          <Area
            name={unit}
            type="monotone"
            dataKey="count"
            stroke={stroke}
            strokeWidth={2.5}
            fill={`url(#${id}-area)`}
            dot={false}
            activeDot={{ r: 5, fill: stroke, stroke: theme.surface, strokeWidth: 2 }}
            isAnimationActive
            animationDuration={500}
          />
          {processedData.length > 14 && (
            <Brush dataKey="label" height={24} stroke={theme.axis} fill={theme.surface} travellerWidth={8} />
          )}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
