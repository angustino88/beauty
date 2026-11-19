import test from 'node:test';
import assert from 'node:assert/strict';
import type { AssessmentKpiResult } from '../types.ts';
import { attainment, orientKpis, radarData } from './assessmentChart.ts';

const kpi = (value: string, label: string, v: number | null, prev: number | null, target: number, isHigherBetter = true): AssessmentKpiResult => ({
  kpi: { value, label }, value: v, previous_value: prev, target, is_higher_better: isHigherBetter, weight: 1,
  status: { value: 'met', label: 'On target' },
});

test('lower-is-better KPIs are plotted as their positive complement', () => {
  const [row] = orientKpis([kpi('ad_hoc_session_rate', 'Ad-hoc Session Rate', 0.14, 0.25, 0.2, false)]);
  assert.deepEqual(
    [row.axis, row.current, row.previous, row.target, row.raw],
    ['Pre-booked Session Rate', 86, 75, 80, 0.14],
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

test('attainment measures progress towards the target the way the server scores it', () => {
  assert.equal(attainment(0.45, 0.9, true), 0.5);
  assert.equal(attainment(0.95, 0.9, true), 1);
  assert.equal(attainment(0.05, 0.1, false), 1);
  assert.equal(Math.round((attainment(0.55, 0.1, false) ?? 0) * 100), 50);
  assert.equal(attainment(null, 0.9, true), null);
});
