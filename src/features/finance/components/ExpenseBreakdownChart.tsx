import React, { useId } from 'react';
import { Card, Empty } from 'antd';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { ChartLegend, ChartTooltip, VerticalGradient, formatCompact, useChartTheme } from '@/shared/charts';
import type { IFinancialReportTypeBreakdown } from '../types';
import styles from './FinanceWorkspace.module.css';

interface ExpenseBreakdownChartProps {
  currency: string;
  data: IFinancialReportTypeBreakdown[];
}

/** Stacked paid + pending columns; the stack height is the budgeted amount. */
export const ExpenseBreakdownChart: React.FC<ExpenseBreakdownChartProps> = ({ currency, data }) => {
  const theme = useChartTheme();
  const id = useId().replace(/:/g, '');
  if (!data || data.length === 0) {
    return (
      <Card className={styles.chartCard} title="Spend by category">
        <Empty description="No breakdown data available" />
      </Card>
    );
  }

  const chartData = [...data]
    .sort((a, b) => b.amount - a.amount)
    .map((item) => ({ category: item.expense_type_label, paid: item.paid_amount, pending: item.pending_amount, budgeted: item.amount }));
  const [paidColor, pendingColor] = [theme.series[0], theme.series[3]];
  const money = (value: unknown) => `${currency} ${Number(value ?? 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;

  return (
    <Card className={styles.chartCard} title={<div>Spend by category<div className={styles.chartSubtitle}>Paid and pending amounts by expense type</div></div>}>
      <ChartLegend items={[{ label: 'Paid', color: paidColor }, { label: 'Pending', color: pendingColor }]} />
      <div style={{ width: '100%', height: 320 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 10, right: 8, left: 0, bottom: 0 }} barCategoryGap="28%">
            <defs>
              <VerticalGradient id={`${id}-paid`} color={paidColor} from={1} to={0.55} />
              <VerticalGradient id={`${id}-pending`} color={pendingColor} from={0.95} to={0.6} />
            </defs>
            <CartesianGrid {...theme.gridProps} />
            <XAxis dataKey="category" {...theme.axisProps} interval={0} tickFormatter={(value: string) => (value.length > 14 ? `${value.slice(0, 13)}…` : value)} />
            <YAxis {...theme.axisProps} width={52} tickFormatter={(value) => formatCompact(value, 0)} />
            <Tooltip
              cursor={{ fill: theme.grid, opacity: 0.5 }}
              content={<ChartTooltip formatValue={(value) => money(value)} title={(label, payload) => `${String(label)} · budget ${money(payload[0]?.payload?.budgeted)}`} />}
            />
            <Bar dataKey="paid" name="Paid" stackId="spend" fill={`url(#${id}-paid)`} maxBarSize={44} />
            <Bar dataKey="pending" name="Pending" stackId="spend" fill={`url(#${id}-pending)`} radius={[6, 6, 0, 0]} maxBarSize={44} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
};
