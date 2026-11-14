import { ChartEmpty, RankedList, useChartTheme } from '@/shared/charts';
import type { UserByLabUsageChartEntry } from '../../types';

export function UserByLabUsageChart({ dataSource }: { dataSource: UserByLabUsageChartEntry[] }) {
  const theme = useChartTheme();
  if (!dataSource.length) return <ChartEmpty />;
  return (
    <RankedList
      color={theme.series[2]}
      unit="h"
      items={dataSource.map((entry) => ({ key: entry.remote_user, label: entry.remote_user_displayname || entry.remote_user, value: entry.usage }))}
    />
  );
}
