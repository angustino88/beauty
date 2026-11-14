import { ChartEmpty, RankedList, useChartTheme } from '@/shared/charts';
import type { UserByBookingEfficiencyChartEntry } from '../../types';

/** Efficiency is a percentage, so bars are scaled to 100 % rather than to the leader. */
export function UserByBookingEfficiencyChart({ dataSource }: { dataSource: UserByBookingEfficiencyChartEntry[] }) {
  const theme = useChartTheme();
  if (!dataSource.length) return <ChartEmpty />;
  return (
    <RankedList
      color={theme.series[0]}
      showShare={false}
      formatValue={(value) => `${Math.round(value * 10) / 10}%`}
      items={dataSource.map((entry) => ({
        key: entry.remote_user,
        label: entry.remote_user_displayname || entry.remote_user,
        value: entry.efficiency,
        max: 100,
        color: entry.efficiency < 70 ? theme.tone.warning : undefined,
      }))}
    />
  );
}
