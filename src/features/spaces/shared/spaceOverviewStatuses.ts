import { toneForStatus } from '../../../shared/status/statusTone.ts';

type StatusCount = { status: { value: string; label: string }; resource_count: number };

export function lifecycleSummaryCards(counts: readonly StatusCount[]) {
  return counts.map(({ status }) => ({
    key: status.value,
    label: status.label,
    tone: toneForStatus(status.value),
  }));
}
