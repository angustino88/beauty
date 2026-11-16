import assert from 'node:assert/strict';
import test from 'node:test';
import { mapApplyErrorDetail, mapImportReport, problemsToCsv, sortProblems } from './mapper.ts';

test('maps the import report from the wire shape', () => {
  const report = mapImportReport({
    is_dry_run: true,
    is_valid: false,
    template_version: '2.0',
    summary: { created: 3, existing: 1, error_count: 1, warning_count: 1 },
    sheets: [{ key: 'rooms', name: 'Rooms', rows: 2, created: 1, existing: 0, failed: 1, ignored_columns: ['X'] }],
    problems: [
      { sheet: 'Rooms', row: 5, column: 'Asset Tag', severity: { value: 'error', label: 'Error' }, code: 'duplicate', message: 'Duplicate' },
      { sheet: 'Rooms', row: null, column: 'X', severity: { value: 'warning', label: 'Warning' }, code: 'column_not_imported', message: 'Skipped' },
    ],
    unknown_sheets: [],
  });

  assert.equal(report.isValid, false);
  assert.equal(report.summary.errorCount, 1);
  assert.deepEqual(report.sheets[0].ignoredColumns, ['X']);
  assert.equal(report.problems[1].severity, 'warning');
});

test('parses the 422 detail field path Sheet[row].Column', () => {
  assert.deepEqual(mapApplyErrorDetail({ field: 'Equipment Kinds[12].Category', code: 'unknown_reference', message: 'm' }), {
    sheet: 'Equipment Kinds', row: 12, column: 'Category', severity: 'error', code: 'unknown_reference', message: 'm',
  });
  assert.equal(mapApplyErrorDetail({ field: 'Stations', message: 'x' }).row, null);
});

test('sorts errors first, then by sheet order and row', () => {
  const problems = sortProblems([
    { sheet: 'Benches', row: 4, column: null, severity: 'warning', code: 'w', message: '' },
    { sheet: 'Benches', row: 9, column: null, severity: 'error', code: 'e', message: '' },
    { sheet: 'Rooms', row: 7, column: null, severity: 'error', code: 'e', message: '' },
  ], ['Rooms', 'Benches']);
  assert.deepEqual(problems.map((p) => `${p.sheet}${p.row}`), ['Rooms7', 'Benches9', 'Benches4']);
});

test('CSV export quotes values and neutralises formulas', () => {
  const csv = problemsToCsv([{ sheet: 'Rooms', row: 4, column: 'Name', severity: 'error', code: 'c', message: '=cmd "x"' }]);
  assert.match(csv, /"'=cmd ""x"""/);
});
