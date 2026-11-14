import React, { useId } from 'react';
import { Card, Empty } from 'antd';
import { Area, CartesianGrid, ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import dayjs from 'dayjs';
import { ChartLegend, ChartTooltip, VerticalGradient, formatCompact, useChartTheme } from '@/shared/charts';
import type { IFinanceMonthTrend } from '../types';
import styles from './FinanceWorkspace.module.css';

interface FinanceTrendsChartProps {
  currency: string;
  data: IFinanceMonthTrend[];
  loading?: boolean;
}

const money = (currency: string, value: unknown) =>
  `${currency} ${Number(value ?? 0).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

/** Change between the last two months, as a signed percentage. */
const lastChange = (values: number[]) => {
  if (values.length < 2 || !values[values.length - 2]) return null;
  return Math.round(((values[values.length - 1] - values[values.length - 2]) / Math.abs(values[values.length - 2])) * 100);
};

/** Month-over-month change; for spending, an increase is the unfavourable direction. */
function Change({ value }: { value: number | null }) {
  if (value === null) return null;
  return <span className={value > 0 ? styles.changeUp : styles.changeDown}>{value > 0 ? '+' : ''}{value}% vs last month</span>;
}

export const FinanceTrendsChart: React.FC<FinanceTrendsChartProps> = ({ currency, data, loading = false }) => {
  const theme = useChartTheme();
  const id = useId().replace(/:/g, '');

  if (!loading && (!data || data.length === 0)) {
    return (
      <Card className={styles.chartCard} title="Monthly cash flow">
        <Empty description="No trend data available for the selected period" />
      </Card>
    );
  }

  const chartData = data.map((item) => ({
    month: dayjs(`${item.month}-01`).isValid() ? dayjs(`${item.month}-01`).format('MMM YY') : item.month,
    expense: item.sources.expense.net,
    procurement: item.sources.procurement.net,
    combined: item.combined.net,
  }));
  const [expenseColor, procurementColor, netColor] = [theme.series[0], theme.series[1], theme.series[2]];
  const totals = {
    expense: chartData.reduce((sum, row) => sum + row.expense, 0),
    procurement: chartData.reduce((sum, row) => sum + row.procurement, 0),
  };
  const changes = { expense: lastChange(chartData.map((row) => row.expense)), procurement: lastChange(chartData.map((row) => row.procurement)) };

  return (
    <Card
      className={styles.chartCard}
      title={
        <div>
          <div>Monthly cash flow</div>
          <div className={styles.chartSubtitle}>Facility and procurement outflow over time · {currency}</div>
        </div>
      }
    >
      <div className={styles.chartTotals}>
        <div><span>Facility expenses</span><strong>{money(currency, totals.expense)}</strong><Change value={changes.expense} /></div>
        <div><span>Procurement</span><strong>{money(currency, totals.procurement)}</strong><Change value={changes.procurement} /></div>
      </div>
      <ChartLegend items={[
        { label: 'Facility expenses', color: expenseColor },
        { label: 'Procurement / hardware', color: procurementColor },
        { label: 'Net combined', color: netColor, dashed: true },
      ]} />
      <div style={{ width: '100%', height: 320 }}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 10, right: 12, left: 0, bottom: 0 }}>
            <defs>
              <VerticalGradient id={`${id}-exp`} color={expenseColor} from={0.36} to={0} />
            </defs>
            <CartesianGrid {...theme.gridProps} />
            <XAxis dataKey="month" {...theme.axisProps} />
            <YAxis {...theme.axisProps} width={52} tickFormatter={(value) => formatCompact(value, 0)} />
            <Tooltip cursor={{ stroke: theme.axis, strokeDasharray: '4 4' }} content={<ChartTooltip formatValue={(value) => money(currency, value)} />} />
            <Area type="monotone" dataKey="expense" name="Facility expenses" stroke={expenseColor} strokeWidth={2.5} fill={`url(#${id}-exp)`} dot={false} activeDot={{ r: 5, stroke: theme.surface, strokeWidth: 2 }} />
            <Area type="monotone" dataKey="procurement" name="Procurement" stroke={procurementColor} strokeWidth={2.5} fill="none" dot={false} activeDot={{ r: 5, stroke: theme.surface, strokeWidth: 2 }} />
            <Line type="monotone" dataKey="combined" name="Net combined" stroke={netColor} strokeWidth={2} strokeDasharray="6 5" dot={{ r: 3, fill: netColor, strokeWidth: 0 }} activeDot={{ r: 5 }} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
};
