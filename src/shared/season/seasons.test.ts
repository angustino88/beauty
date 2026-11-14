import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveSeason, seasonForDate } from './seasons.ts';

test('the calendar picks the season, and nothing between seasons', () => {
  assert.equal(seasonForDate(new Date(2026, 1, 1))?.id, 'tet');
  assert.equal(seasonForDate(new Date(2026, 8, 20))?.id, 'mid-autumn');
  assert.equal(seasonForDate(new Date(2026, 11, 24))?.id, 'christmas');
  assert.equal(seasonForDate(new Date(2026, 10, 14)), null);
  assert.equal(seasonForDate(new Date(2026, 1, 25))?.id, 'tet');
  assert.equal(seasonForDate(new Date(2026, 1, 26)), null);
});

test('an override pins or disables the season; unknown values follow the date', () => {
  const november = new Date(2026, 10, 14);
  assert.equal(resolveSeason(november, 'tet')?.id, 'tet');
  assert.equal(resolveSeason(november, ' Christmas ')?.id, 'christmas');
  assert.equal(resolveSeason(new Date(2026, 11, 24), 'none'), null);
  assert.equal(resolveSeason(new Date(2026, 11, 24), 'auto')?.id, 'christmas');
  assert.equal(resolveSeason(november, undefined), null);
});
