import { Empty } from 'antd';
import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { hardwareStatuses } from '../../utils';
import type { LabEquipmentStatusSummary } from '../../types';
import CustomTooltip from './CustomTooltip';
import { ChartPalette } from './ChartTheme';
import { PieChartLabel } from './PieChartLabel';

type StatusRow = { status_type: string; entries: number; label: string };

function processEquipmentStatusChartResponse(statusRows: LabEquipmentStatusSummary[]): StatusRow[] {
  let otherCount = 0;
  const rows = statusRows.map((row) => ({
    status_type: row.status_type,
    entries: Number(row.entries),
    label: hardwareStatuses.find((s) => s.value === row.status_type)?.text ?? row.status_type,
  }))
    .filter((row) => {
      if (['transferred', 'maintenance', 'broken', 'lost', 'on_order'].includes(row.status_type)) {
        otherCount += row.entries;
        return false;
      }
      return true;
    })
    .filter((r) => r.entries > 0);

  if (otherCount > 0) {
    rows.push({
      status_type: 'others',
      entries: otherCount,
      label: 'Others',
    });
  }
  return rows;
}

export function LabEquipmentStatusChart({ statusSummary }: { statusSummary: LabEquipmentStatusSummary[] | undefined }) {
  const processedData = processEquipmentStatusChartResponse(statusSummary ?? []);
  const total = processedData.reduce((acc, item) => acc + item.entries, 0);
  if (!processedData.length) return <Empty />;

  return (
    <ResponsiveContainer width="100%" height={350}>
      <PieChart>
        <Pie
          data={processedData}
          dataKey="entries"
          nameKey="label"
          cx="50%"
          cy="50%"
          outerRadius={126}
          innerRadius={88}
          label={(props) => <PieChartLabel {...props} />}
          labelLine={false}
          isAnimationActive
          animationDuration={600}
        >
          {processedData.map((entry, index) => (
            <Cell
              name={entry.label}
              key={index}
              fill={entry.status_type === 'others' ? '#9aa5a0' : ChartPalette[index % ChartPalette.length]}
              stroke="#ffffff"
              strokeWidth={3}
            />
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

