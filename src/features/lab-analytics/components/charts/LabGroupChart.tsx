import { Empty } from 'antd';
import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import type { LabGroupChartEntry } from '../../types';
import CustomTooltip from './CustomTooltip';
import { ChartPalette } from './ChartTheme';
import { PieChartLabel } from './PieChartLabel';

export function LabGroupChart({ dataSource }: { dataSource: LabGroupChartEntry[] }) {
  const total = dataSource.reduce((acc, item) => acc + item.entries, 0);
  if (!dataSource.length) return <Empty />;

  return (
    <ResponsiveContainer width="100%" height={350}>
      <PieChart>
        <Pie
          data={dataSource}
          dataKey="entries"
          nameKey="lab_group_name"
          cx="50%"
          cy="50%"
          outerRadius={126}
          innerRadius={88}
          labelLine={false}
          label={(props) => <PieChartLabel {...props} />}
          isAnimationActive
          animationDuration={600}
        >
          {dataSource.map((entry, index) => (
            <Cell name={entry.lab_group_name ?? 'Unknown'} key={index} fill={ChartPalette[index % ChartPalette.length]} stroke="#ffffff" strokeWidth={3} />
          ))}
        </Pie>
        <text x="50%" y="47%" textAnchor="middle" fill="#65736b" fontSize={11} fontWeight={700}>
          TOTAL
        </text>
        <text x="50%" y="55%" textAnchor="middle" fill="#173d29" fontSize={24} fontWeight={700}>
          {total}
        </text>
        <Legend iconType="circle" iconSize={8} wrapperStyle={{ paddingTop: 12, fontSize: 12 }} />
        <Tooltip content={<CustomTooltip />} />
      </PieChart>
    </ResponsiveContainer>
  );
}

