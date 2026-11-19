import type { LicenseCheckTargetRequestKindEnum } from '@/shared/api/generated/api';

export interface PickedTarget {
  kind: LicenseCheckTargetRequestKindEnum;
  target_id: number;
  name: string;
}

export const TARGET_KINDS: { value: LicenseCheckTargetRequestKindEnum; label: string }[] = [
  { value: 'bench', label: 'Bench' },
  { value: 'station', label: 'Station' },
  { value: 'room', label: 'Room' },
  { value: 'category', label: 'Equipment category' },
  { value: 'equipment', label: 'Computer' },
];

export const KIND_LABEL = Object.fromEntries(TARGET_KINDS.map((kind) => [kind.value, kind.label])) as Record<string, string>;
