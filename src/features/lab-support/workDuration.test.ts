import test from 'node:test';
import assert from 'node:assert/strict';
import {
  MAX_WORK_LOG_MINUTES,
  WORK_UNIT_MINUTES,
  formatHoursMinutes,
  formatWorkBreakdown,
  getSmartUnitSuggestions,
  parseSmartDuration,
} from './workDuration.ts';

test('parseSmartDuration supports plain minutes for backward compatibility', () => {
  const res = parseSmartDuration('45');
  assert.equal(res.ok, true);
  if (res.ok) {
    assert.equal(res.minutes, 45);
    assert.equal(res.bareMinutes, true);
    assert.equal(res.rounded, false);
    assert.equal(res.breakdown, '45m');
    assert.equal(res.hoursLabel, '45m');
  }

  const max = parseSmartDuration('14400');
  assert.equal(max.ok, true);
  if (max.ok) assert.equal(max.minutes, 14400);
});

test('parseSmartDuration converts m, h, d, w, mo using work-time scale (1d=8h, 1w=5d, 1mo=4w)', () => {
  const cases: Array<[string, number]> = [
    ['1m', 1],
    ['45m', 45],
    ['30 min', 30],
    ['15 mins', 15],
    ['1 minute', 1],
    ['90 minutes', 90],
    ['1h', 60],
    ['2 hr', 120],
    ['3 hrs', 180],
    ['1 hour', 60],
    ['2.5 hours', 150],
    ['.5h', 30],
    ['1d', WORK_UNIT_MINUTES.d],
    ['0.5d', 240],
    ['2 days', 960],
    ['1w', WORK_UNIT_MINUTES.w],
    ['2 wk', 4800],
    ['3 wks', 7200],
    ['1 week', 2400],
    ['6 weeks', 14400],
    ['1mo', WORK_UNIT_MINUTES.mo],
    ['0.5mo', 4800],
    ['1.5mo', 14400],
    ['1 month', 9600],
    ['1.5 months', 14400],
    ['1 mth', 9600],
    ['1.25 mos', 12000],
  ];

  for (const [input, expected] of cases) {
    const parsed = parseSmartDuration(input);
    assert.equal(parsed.ok, true, `Expected "${input}" to parse`);
    if (parsed.ok) {
      assert.equal(parsed.minutes, expected, `Expected "${input}" to equal ${expected}m`);
      assert.equal(parsed.bareMinutes, false);
    }
  }
});

test('parseSmartDuration supports compound expressions, separators, and case insensitivity', () => {
  const cases: Array<[string, number]> = [
    ['1h 30m', 90],
    ['1h30m', 90],
    ['1H 30M', 90],
    ['30m 1h', 90],
    ['1d 2h 15m', 480 + 120 + 15],
    ['1w 2d 4h', 2400 + 960 + 240],
    ['1mo 1w 2d', 9600 + 2400 + 960],
    ['1mo 2w', MAX_WORK_LOG_MINUTES],
    ['2h, 30m', 150],
    ['1w + 2d + 30m', 2400 + 960 + 30],
    ['1h 1h 30m', 150],
    ['  2d   4h  ', 1200],
  ];

  for (const [input, expected] of cases) {
    const parsed = parseSmartDuration(input);
    assert.equal(parsed.ok, true, `Expected "${input}" to parse`);
    if (parsed.ok) assert.equal(parsed.minutes, expected, `Mismatch for "${input}"`);
  }
});

test('parseSmartDuration supports H:MM clock notation and validates minutes 00..59', () => {
  const okCases: Array<[string, number]> = [
    ['0:45', 45],
    ['1:30', 90],
    ['2:05', 125],
    ['10:00', 600],
    ['240:00', 14400],
  ];
  for (const [input, expected] of okCases) {
    const parsed = parseSmartDuration(input);
    assert.equal(parsed.ok, true, `Expected "${input}" to parse`);
    if (parsed.ok) assert.equal(parsed.minutes, expected);
  }

  for (const bad of ['1:60', '1:75', '1:5', '0:0']) {
    const parsed = parseSmartDuration(bad);
    assert.equal(parsed.ok, false, `Expected "${bad}" to fail`);
    if (!parsed.ok) assert.equal(parsed.code, 'invalid_clock');
  }
});

test('parseSmartDuration marks fractional-minute rounding clearly', () => {
  const parsed = parseSmartDuration('0.33h');
  assert.equal(parsed.ok, true);
  if (parsed.ok) {
    assert.equal(parsed.minutes, 20);
    assert.equal(parsed.rounded, true);
  }

  const tiny = parseSmartDuration('0.001h');
  assert.equal(tiny.ok, false);
  if (!tiny.ok) assert.equal(tiny.code, 'too_small');
});

test('parseSmartDuration rejects empty, negative, malformed, bare decimals, and over-limit entries', () => {
  const empty = parseSmartDuration('   ');
  assert.equal(empty.ok, false);
  if (!empty.ok) assert.equal(empty.code, 'empty');

  const bareDec = parseSmartDuration('1.5');
  assert.equal(bareDec.ok, false);
  if (!bareDec.ok) assert.equal(bareDec.code, 'bare_decimal');

  for (const small of ['0', '0h', '0m', '-30m', '-5']) {
    const res = parseSmartDuration(small);
    assert.equal(res.ok, false, `Expected "${small}" to fail`);
    if (!res.ok) assert.equal(res.code, 'too_small');
  }

  for (const large of ['14401', '241h', '31d', '7w', '2mo', '1mo 2w 1m', '9999999mo']) {
    const res = parseSmartDuration(large);
    assert.equal(res.ok, false, `Expected "${large}" to fail as too_large`);
    if (!res.ok) assert.equal(res.code, 'too_large');
  }

  for (const invalid of ['abc', '1y', '30s', '1h 30', '1h +', '+ 1h', '2h foo', '1..5h']) {
    const res = parseSmartDuration(invalid);
    assert.equal(res.ok, false, `Expected "${invalid}" to fail as invalid`);
    if (!res.ok) assert.equal(res.code, 'invalid');
  }
});

test('formatWorkBreakdown round-trips accurately through parseSmartDuration', () => {
  assert.equal(formatWorkBreakdown(45), '45m');
  assert.equal(formatWorkBreakdown(90), '1h 30m');
  assert.equal(formatWorkBreakdown(480), '1d');
  assert.equal(formatWorkBreakdown(600), '1d 2h');
  assert.equal(formatWorkBreakdown(2400), '1w');
  assert.equal(formatWorkBreakdown(9600), '1mo');
  assert.equal(formatWorkBreakdown(14400), '1mo 2w');

  assert.equal(formatHoursMinutes(45), '45m');
  assert.equal(formatHoursMinutes(90), '1h 30m');
  assert.equal(formatHoursMinutes(9600), '160h');
  assert.equal(formatHoursMinutes(14400), '240h');

  const samples = [1, 15, 59, 60, 61, 479, 480, 515, 2399, 2400, 3360, 9599, 9600, 12345, 14400];
  for (const mins of samples) {
    const formatted = formatWorkBreakdown(mins);
    const reparsed = parseSmartDuration(formatted);
    assert.equal(reparsed.ok, true, `Failed round-trip for ${mins} (${formatted})`);
    if (reparsed.ok) assert.equal(reparsed.minutes, mins);
  }
});

test('getSmartUnitSuggestions adapts to bare numbers and respects the 240h cap', () => {
  assert.deepEqual(
    getSmartUnitSuggestions('1').map((s) => s.value),
    ['1m', '1h', '1d', '1w', '1mo'],
  );

  // 2mo = 320h exceeds 240h cap, so it is omitted
  assert.deepEqual(
    getSmartUnitSuggestions('2').map((s) => s.value),
    ['2m', '2h', '2d', '2w'],
  );

  // Bare decimals omit 'm' and include all valid larger units up to 1.5mo (240h)
  assert.deepEqual(
    getSmartUnitSuggestions('1.5').map((s) => s.value),
    ['1.5h', '1.5d', '1.5w', '1.5mo'],
  );

  assert.deepEqual(
    getSmartUnitSuggestions('.5').map((s) => s.value),
    ['0.5h', '0.5d', '0.5w', '0.5mo'],
  );

  assert.deepEqual(
    getSmartUnitSuggestions('45').map((s) => s.value),
    ['45m', '45h'],
  );

  assert.deepEqual(getSmartUnitSuggestions(''), []);
  assert.deepEqual(getSmartUnitSuggestions('0'), []);
  assert.deepEqual(getSmartUnitSuggestions('2h'), []);
  assert.deepEqual(getSmartUnitSuggestions('1h 30m'), []);
});
