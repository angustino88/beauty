import assert from 'node:assert/strict';
import test from 'node:test';
import { formatCompact, formatPercent, seriesStats } from './format.ts';

test('formatCompact abbreviates large values only', () => {
  assert.equal(formatCompact(950), '950');
  assert.equal(formatCompact(1234), '1.2k');
  assert.equal(formatCompact(38400), '38k');
  assert.equal(formatCompact(1_250_000), '1.25M');
  assert.equal(formatCompact('x'), '—');
});

test('formatPercent and seriesStats', () => {
  assert.equal(formatPercent(1, 400), '<1%');
  assert.equal(formatPercent(50, 200), '25%');
  assert.equal(formatPercent(3, 0), '0%');
  assert.deepEqual(seriesStats([4, 8, Number.NaN, 6]), { min: 4, avg: 6, max: 8 });
  assert.equal(seriesStats([]), null);
});
