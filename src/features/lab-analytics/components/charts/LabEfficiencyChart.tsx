import { ChartEmpty, RankedList, useChartTheme } from '@/shared/charts';
import type { LabEfficiencyChartEntry } from '../../types';

/** Efficiency % per lab, with bookings and booked hours as context. */
export function LabEfficiencyChart({ dataSource }: { dataSource: LabEfficiencyChartEntry[] }) {
  const theme = useChartTheme();
  if (!dataSource.length) return <ChartEmpty />;
  return (
    <RankedList
      color={theme.series[0]}
      showShare={false}
      formatValue={(value) => `${Math.round(value * 10) / 10}%`}
      items={dataSource.map((entry) => ({
        key: `${entry.lab_name}-${entry.computer_name}`,
        label: `${entry.lab_name} · ${entry.computer_name}`,
        value: entry.efficiency,
        max: 100,
        detail: `${entry.booking} ${entry.booking === 1 ? 'booking' : 'bookings'} · ${Math.round(entry.duration * 10) / 10} h used`,
        color: entry.efficiency < 70 ? theme.tone.warning : undefined,
      }))}
    />
  );
}
