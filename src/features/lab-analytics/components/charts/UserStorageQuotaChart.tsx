import { ChartEmpty, RankedList, formatNumber, useChartTheme } from '@/shared/charts';
import type { UserStorageQuotaChartEntry } from '../../types';

/** Each bar is usage against that user's own quota; amber from 75 %, red from 90 %. */
export function UserStorageQuotaChart({ dataSource }: { dataSource: UserStorageQuotaChartEntry[] }) {
  const theme = useChartTheme();
  if (!dataSource.length) return <ChartEmpty />;
  return (
    <RankedList
      color={theme.series[4]}
      unit="GiB"
      items={dataSource.map((entry) => {
        const ratio = entry.quota > 0 ? entry.used / entry.quota : 0;
        return {
          key: entry.username,
          label: entry.display_name || entry.username,
          value: entry.used,
          max: entry.quota > 0 ? entry.quota : undefined,
          detail: `${formatNumber(entry.used)} of ${formatNumber(entry.quota)} GiB`,
          color: ratio >= 0.9 ? theme.tone.danger : ratio >= 0.75 ? theme.tone.warning : undefined,
        };
      })}
    />
  );
}
