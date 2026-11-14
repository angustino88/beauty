import { ChartEmpty, RankedList, useChartTheme } from '@/shared/charts';
import type { ProjectUsageChartEntry } from '../../types';

export function ProjectUsageChart({ dataSource }: { dataSource: ProjectUsageChartEntry[] }) {
  const theme = useChartTheme();
  if (!dataSource.length) return <ChartEmpty />;
  return (
    <RankedList
      color={theme.series[0]}
      unit="h"
      items={dataSource.map((entry, index) => ({ key: `${entry.project_name}-${index}`, label: entry.project_name ?? 'No project', value: entry.usage }))}
    />
  );
}
