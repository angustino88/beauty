import test from 'node:test';
import assert from 'node:assert/strict';
import type { AssessmentKpiResult } from '../types.ts';
import { orientKpis, radarData } from './assessmentChart.ts';

const kpi = (value: string, label: string, v: number | null, prev: number | null, target: number, isHigherBetter = true): AssessmentKpiResult => ({
  kpi: { value, label }, value: v, previous_value: prev, target, is_higher_better: isHigherBetter, weight: 1,
  status: { value: 'met', label: 'On target' },
});

test('lower-is-better KPIs are plotted as their positive complement', () => {
  const [row] = orientKpis([kpi('advance_booking', 'Sessions without a booking', 0.14, 0.25, 0.2, false)]);
  assert.deepEqual(
    [row.axis, row.current, row.previous, row.target, row.raw],
    ['Booked ahead', 86, 75, 80, 0.14],
  );
});

test('the radar uses applicable KPIs only and needs three axes', () => {
  const data = radarData([
    kpi('a', 'A', 0.5, 0.4, 0.9), kpi('b', 'B', null, null, 0.9), kpi('c', 'C', 0.7, 0.6, 0.8), kpi('d', 'D', 0.2, 0.1, 0.5),
  ]);
  assert.deepEqual(data?.rows.map((r) => r.key), ['a', 'c', 'd']);
  assert.equal(data?.hasPrevious, true);
  assert.equal(radarData([kpi('a', 'A', 0.5, null, 0.9), kpi('c', 'C', 0.7, 0.6, 0.8)]), null);
});

test('a partial previous period is not drawn', () => {
  const data = radarData([kpi('a', 'A', 0.5, null, 0.9), kpi('c', 'C', 0.7, 0.6, 0.8), kpi('d', 'D', 0.2, 0.1, 0.5)]);
  assert.equal(data?.hasPrevious, false);
});
