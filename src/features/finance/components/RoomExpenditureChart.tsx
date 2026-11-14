import React from 'react';
import { Card, Empty } from 'antd';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { IFinancialReportRoomBreakdown } from '../types';
import styles from './FinanceWorkspace.module.css';

interface RoomExpenditureChartProps {
  currency: string;
  data: IFinancialReportRoomBreakdown[];
}

export const RoomExpenditureChart: React.FC<RoomExpenditureChartProps> = ({
  currency,
  data,
}) => {
  if (!data || data.length === 0) {
    return (
      <Card className={styles.chartCard} title="Facility allocation">
        <Empty description="No room distribution data available" />
      </Card>
    );
  }

  const chartData = data.map((item) => ({
    room: item.room_name,
    budgeted: item.amount,
    paid: item.paid_amount,
    pending: item.pending_amount,
  }));

  return (
    <Card className={styles.chartCard} title={<div>Facility allocation<div className={styles.chartSubtitle}>How commitments are distributed across rooms</div></div>}>
      <div style={{ width: '100%', height: 320 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{ top: 20, right: 30, left: 10, bottom: 20 }}
          >
            <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#e9efea" />
            <XAxis dataKey="room" tick={{ fill: '#75857a', fontSize: 11 }} tickLine={false} axisLine={false} interval={0} angle={-25} textAnchor="end" height={70} />
            <YAxis
              tick={{ fill: '#75857a', fontSize: 11 }} tickLine={false} axisLine={false}
              tickFormatter={(val) => `${val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}`}
            />
            <Tooltip
              contentStyle={{ borderRadius: 10, border: '1px solid #e2eae3', boxShadow: '0 10px 30px rgba(25, 53, 40, .12)' }}
              formatter={(value) => [
                `${currency} ${Number(value ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
              ]}
            />
            <Legend verticalAlign="top" height={36} />
            <Bar dataKey="budgeted" name="Budgeted" fill="#4a8295" radius={[4, 4, 0, 0]} />
            <Bar dataKey="paid" name="Paid" fill="#459178" radius={[4, 4, 0, 0]} />
            <Bar dataKey="pending" name="Pending" fill="#b98548" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
};
