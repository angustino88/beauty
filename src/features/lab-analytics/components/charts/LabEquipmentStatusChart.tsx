import { ChartEmpty, DonutChart, useChartTheme } from '@/shared/charts';
import { toneForStatus } from '@/shared/status/statusTone';
import { equipmentStatusLabel } from '@/features/lab-equipment/shared/utils/equipmentStatus';
import type { LabEquipmentStatusSummary } from '../../types';

/** Every status gets its own slice in its status colour, so faults are never hidden in "Others". */
export function LabEquipmentStatusChart({ statusSummary }: { statusSummary: LabEquipmentStatusSummary[] | undefined }) {
  const theme = useChartTheme();
  const rows = (statusSummary ?? []).filter((row) => Number(row.entries) > 0);
  if (!rows.length) return <ChartEmpty />;
  return (
    <DonutChart
      totalLabel="Equipment"
      data={[...rows]
        .sort((a, b) => Number(b.entries) - Number(a.entries))
        .map((row) => ({
          key: row.status_type,
          label: equipmentStatusLabel(row.status_type),
          value: Number(row.entries),
          color: theme.tone[toneForStatus(row.status_type)],
        }))}
    />
  );
}
