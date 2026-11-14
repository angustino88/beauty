export type EquipmentStatusActionValue =
  | 'available'
  | 'maintenance'
  | 'broken'
  | 'in_use'
  | 'borrowed'
  | 'lost'
  | 'transferred'
  | 'retired';

export interface EquipmentStatusFacts {
  lifecycle?: string;
  condition?: string;
  status?: string;
  onBench: boolean;
  onLoan: boolean;
  calibrationOverdue: boolean;
}

export interface EquipmentStatusActionOption {
  value: EquipmentStatusActionValue;
  label: string;
  disabled?: boolean;
  blocker?: string;
}

export function firstBorrowBlocker(facts: EquipmentStatusFacts, capabilities: string[]): string | undefined {
  if (!capabilities.includes('bookable')) return 'This equipment category cannot be lent.';
  if (facts.lifecycle !== 'in_service') return 'Equipment must be in service.';
  if (facts.condition !== 'operational') return 'Equipment must be operational.';
  if (facts.onBench) return 'Remove it from the bench first.';
  if (facts.onLoan) return 'Take back the current loan first.';
  if (facts.calibrationOverdue) return 'Record a calibration before lending.';
  return undefined;
}

export function getEquipmentStatusActionOptions(
  facts: EquipmentStatusFacts,
  capabilities: string[],
): EquipmentStatusActionOption[] {
  const { lifecycle, condition, status } = facts;
  const inService = lifecycle === 'in_service';
  const borrowBlocker = firstBorrowBlocker(facts, capabilities);
  const canRestore = lifecycle !== 'retired' && (
    lifecycle === 'planned'
    || lifecycle === 'lost'
    || lifecycle === 'transferred_out'
    || condition !== 'operational'
    || facts.onLoan
    || facts.onBench
  );
  const found = lifecycle === 'lost';
  const options: EquipmentStatusActionOption[] = [];

  if (canRestore && status !== 'available') {
    options.push({ value: 'available', label: found ? 'Found' : 'Available' });
  }
  if (inService && condition !== 'in_maintenance') options.push({ value: 'maintenance', label: 'Maintenance' });
  if (inService && condition !== 'out_of_service') options.push({ value: 'broken', label: 'Broken' });
  if (inService && capabilities.includes('assignable')) options.push({ value: 'in_use', label: 'In use' });
  if (capabilities.includes('bookable') && inService) {
    options.push({ value: 'borrowed', label: 'Borrowed', disabled: Boolean(borrowBlocker), blocker: borrowBlocker });
  }
  if (inService) options.push({ value: 'lost', label: 'Lost' });
  if (inService) options.push({ value: 'transferred', label: 'Transferred' });
  if (lifecycle === 'planned' || inService || found) options.push({ value: 'retired', label: 'Retired' });

  return options;
}

export function getAvailableStatusStep(facts: EquipmentStatusFacts): 'lifecycle' | 'condition' | 'return' | 'placement' | 'none' {
  if (facts.lifecycle !== 'in_service') return 'lifecycle';
  if (facts.condition !== 'operational') return 'condition';
  if (facts.onLoan) return 'return';
  if (facts.onBench) return 'placement';
  return 'none';
}

export function isLifecycleTargetBlocked(
  action: EquipmentStatusActionValue | undefined,
  facts: EquipmentStatusFacts,
): boolean {
  return (action === 'lost' || action === 'transferred' || action === 'retired')
    && (facts.onBench || facts.onLoan && action !== 'lost');
}