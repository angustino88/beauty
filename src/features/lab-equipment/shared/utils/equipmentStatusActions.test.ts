import assert from 'node:assert/strict';
import test from 'node:test';
import {
  firstBorrowBlocker,
  getAvailableStatusStep,
  getEquipmentStatusActionOptions,
  isLifecycleTargetBlocked,
  type EquipmentStatusFacts,
} from './equipmentStatusActions.ts';

const facts = (overrides: Partial<EquipmentStatusFacts> = {}): EquipmentStatusFacts => ({
  lifecycle: 'in_service',
  condition: 'operational',
  status: 'available',
  onBench: false,
  onLoan: false,
  calibrationOverdue: false,
  ...overrides,
});

test('only offers maintenance and broken actions when a change is applicable', () => {
  const options = getEquipmentStatusActionOptions(facts(), ['assignable', 'bookable']);
  assert.deepEqual(options.map(({ value }) => value), ['maintenance', 'broken', 'in_use', 'borrowed', 'lost', 'transferred', 'retired']);
});

test('disables Borrowed with the first failing lending reason', () => {
  const blocker = firstBorrowBlocker(facts({ condition: 'in_maintenance', onBench: true }), ['bookable']);
  assert.equal(blocker, 'Equipment must be operational.');
  const borrowed = getEquipmentStatusActionOptions(facts({ condition: 'out_of_service' }), ['bookable'])
    .find(({ value }) => value === 'borrowed');
  assert.equal(borrowed?.disabled, true);
  assert.equal(borrowed?.blocker, 'Equipment must be operational.');
});

test('offers Found for lost equipment and returns the lifecycle step first', () => {
  const lost = facts({ lifecycle: 'lost', condition: 'in_maintenance', status: 'lost' });
  assert.deepEqual(getEquipmentStatusActionOptions(lost, []).map(({ value, label }) => ({ value, label })), [
    { value: 'available', label: 'Found' },
    { value: 'retired', label: 'Retired' },
  ]);
  assert.equal(getAvailableStatusStep(lost), 'lifecycle');
});

test('Available steps follow lifecycle, condition, loan, then bench precedence', () => {
  assert.equal(getAvailableStatusStep(facts({ lifecycle: 'transferred_out', onLoan: true, onBench: true })), 'lifecycle');
  assert.equal(getAvailableStatusStep(facts({ condition: 'in_maintenance', onLoan: true, onBench: true })), 'condition');
  assert.equal(getAvailableStatusStep(facts({ onLoan: true, onBench: true })), 'return');
  assert.equal(getAvailableStatusStep(facts({ onBench: true })), 'placement');
  assert.equal(getAvailableStatusStep(facts()), 'none');
});

test('lifecycle actions are blocked only by the documented loan/bench constraints', () => {
  const onBench = facts({ onBench: true });
  const onLoan = facts({ onLoan: true });
  assert.equal(isLifecycleTargetBlocked('lost', onLoan), false);
  assert.equal(isLifecycleTargetBlocked('lost', onBench), true);
  assert.equal(isLifecycleTargetBlocked('transferred', onLoan), true);
  assert.equal(isLifecycleTargetBlocked('retired', onLoan), true);
  assert.equal(isLifecycleTargetBlocked('maintenance', onBench), false);
});