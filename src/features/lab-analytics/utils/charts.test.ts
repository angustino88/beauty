import test from 'node:test';
import assert from 'node:assert/strict';
import { getChartSubtitle, processDateLabels } from './charts.ts';

for (const [unit, rows, labels] of [
  ['day', [{ count: 2, date: '2026-11-01' }, { count: 3, date: '2026-11-03' }], ['11/01/2026', '11/02/2026', '11/03/2026']],
  ['week', [{ count: 2, year: 2025, week: 52 }, { count: 3, year: 2026, week: 2 }], ['W52/2025', 'W1/2026', 'W2/2026']],
  ['month', [{ count: 2, year: 2026, month: 1 }, { count: 3, year: 2026, month: 3 }], ['01/2026', '02/2026', '03/2026']],
  ['quarter', [{ count: 2, year: 2026, quarter: 1 }, { count: 3, year: 2026, quarter: 3 }], ['Q1/2026', 'Q2/2026', 'Q3/2026']],
  ['year', [{ count: 2, year: 2025 }, { count: 3, year: 2027 }], ['2025', '2026', '2027']],
] as const) {
  test(`labels and zero-fills ${unit} analytics buckets`, () => {
    const result = processDateLabels([...rows], unit);
    assert.deepEqual(result.map((entry) => entry.label), labels);
    assert.deepEqual(result.map((entry) => entry.count), [2, 0, 3]);
  });
}

test('summary without bucket date does not invent a year', () => {
  assert.deepEqual(processDateLabels([{ count: 7 }]), [{ count: 7, label: 'Current' }]);
});

test('chart subtitle names the ranking slice and a compact period', () => {
  assert.equal(
    getChartSubtitle({ from_date_time: '2026-11-10T00:00:00+07:00', to_date_time: '2026-11-16T23:59:59+07:00', top: 10, order: 'asc' }),
    'Top 10, lowest first · 10 – 16 Nov 2026',
  );
  assert.equal(
    getChartSubtitle({ from_date_time: '2026-10-28T00:00:00+07:00', to_date_time: '2026-11-03T23:59:59+07:00' }, false),
    '28 Oct – 3 Nov 2026',
  );
  assert.equal(getChartSubtitle({ log_date: '2026-11-11' }, false), 'Snapshot · 11 Nov 2026');
});
