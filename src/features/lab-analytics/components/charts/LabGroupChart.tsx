import { ChartEmpty, DonutChart } from '@/shared/charts';
import type { LabGroupChartEntry } from '../../types';

export function LabGroupChart({ dataSource }: { dataSource: LabGroupChartEntry[] }) {
  if (!dataSource.some((entry) => entry.entries > 0)) return <ChartEmpty />;
  return (
    <DonutChart
      totalLabel="Benches"
      data={[...dataSource]
        .sort((a, b) => b.entries - a.entries)
        .map((entry, index) => ({ key: String(entry.lab_group ?? index), label: entry.lab_group_name ?? 'Ungrouped', value: entry.entries }))}
    />
  );
}
