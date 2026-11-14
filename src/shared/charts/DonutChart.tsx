import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { ChartTooltip } from './ChartParts';
import { formatNumber, formatPercent } from './format';
import { useChartTheme } from './useChartTheme';
import styles from './charts.module.css';

export interface DonutSlice { key: string; label: string; value: number; color?: string }

/**
 * Donut with the total in the centre and a value/share legend beside it.
 * Slices without an explicit colour take the categorical chart palette.
 */
export function DonutChart({ data, totalLabel = 'Total', height = 260, unit }: {
  data: DonutSlice[];
  totalLabel?: string;
  height?: number;
  unit?: string;
}) {
  const theme = useChartTheme();
  const slices = data.filter((slice) => slice.value > 0)
    .map((slice, index) => ({ ...slice, fill: slice.color ?? theme.series[index % theme.series.length] }));
  const total = slices.reduce((sum, slice) => sum + slice.value, 0);

  return (
    <div className={styles.donut}>
      <div className={styles.donutChart} style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={slices}
              dataKey="value"
              nameKey="label"
              innerRadius="68%"
              outerRadius="96%"
              paddingAngle={slices.length > 1 ? 2 : 0}
              cornerRadius={6}
              stroke="none"
              startAngle={90}
              endAngle={-270}
              isAnimationActive={false}
            >
              {slices.map((slice) => <Cell key={slice.key} fill={slice.fill} />)}
            </Pie>
            <Tooltip content={<ChartTooltip formatValue={(v) => `${formatNumber(v)}${unit ? ` ${unit}` : ''} · ${formatPercent(Number(v), total)}`} />} />
          </PieChart>
        </ResponsiveContainer>
        <div className={styles.donutCenter}>
          <strong>{formatNumber(total)}</strong>
          <span>{totalLabel}</span>
        </div>
      </div>
      <ul className={styles.donutLegend}>
        {slices.map((slice) => (
          <li key={slice.key}>
            <i style={{ background: slice.fill }} />
            <span className={styles.donutLabel}>{slice.label}</span>
            <strong>{formatNumber(slice.value)}</strong>
            <em>{formatPercent(slice.value, total)}</em>
          </li>
        ))}
      </ul>
    </div>
  );
}
