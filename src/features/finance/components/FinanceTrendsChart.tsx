import React from 'react';
import { Card, Empty } from 'antd';
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { IFinanceMonthTrend } from '../types';
import styles from './FinanceWorkspace.module.css';

interface FinanceTrendsChartProps {
  currency: string;
  data: IFinanceMonthTrend[];
  loading?: boolean;
}

export const FinanceTrendsChart: React.FC<FinanceTrendsChartProps> = ({
  currency,
  data,
  loading = false,
}) => {
  if (!loading && (!data || data.length === 0)) {
    return (
      <Card className={styles.chartCard} title="Monthly cash flow">
        <Empty description="No trend data available for the selected period" />
      </Card>
    );
  }

  const chartData = data.map((item) => ({
    month: item.month,
    expense: item.sources.expense.net,
    procurement: item.sources.procurement.net,
    combined: item.combined.net,
  }));

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
      <div style={{ width: '100%', height: 320 }}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={chartData}
            margin={{ top: 20, right: 30, left: 10, bottom: 10 }}
          >
            <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#e9efea" />
            <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fill: '#75857a', fontSize: 11 }} />
            <YAxis
              tickLine={false} axisLine={false} tick={{ fill: '#75857a', fontSize: 11 }}
              tickFormatter={(val) => `${val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}`}
            />
            <Tooltip
              formatter={(value) => [
                `${currency} ${Number(value ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
              ]}
              contentStyle={{ borderRadius: 10, border: '1px solid #e2eae3', boxShadow: '0 10px 30px rgba(25, 53, 40, .12)' }}
              labelStyle={{ fontWeight: 600 }}
            />
            <Legend verticalAlign="top" height={36} />
            <Bar
              dataKey="expense"
              name="Facility Expenses"
              fill="#4a8295"
              stackId="a"
              radius={[2, 2, 0, 0]}
            />
            <Bar
              dataKey="procurement"
              name="Procurement / Hardware"
              fill="#459178"
              stackId="a"
              radius={[4, 4, 0, 0]}
            />
            <Line
              type="monotone"
              dataKey="combined"
              name="Net Combined Cash Flow"
              stroke="#b98548"
              strokeWidth={3}
              dot={{ r: 3, fill: '#b98548' }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
};
