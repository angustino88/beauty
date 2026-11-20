import test from 'node:test';
import assert from 'node:assert/strict';
import { findNavigationPage, getNavigationSections, searchNavigationPages } from './navigation.ts';

test('regular users see only public navigation, including in search', () => {
  const sections = getNavigationSections(false);
  assert.deepEqual(sections.map(({ key }) => key), [
    'dashboard', '3d-dashboard', 'leaderboard', 'booking-calendar', 'my-bookings', 'help',
  ]);
  assert.equal(searchNavigationPages('equipment', sections).length, 0);
  assert.equal(findNavigationPage('/spaces/station', sections), undefined);
});

test('coordinator navigation retains all destinations and promotes frequent pages', () => {
  const sections = getNavigationSections(true);
  assert.equal(sections.length, 11);
  const paths = sections.flatMap(({ pages }) => pages.map(({ path }) => path));
  assert.equal(paths.length, 30);
  assert.equal(new Set(paths).size, paths.length);
  assert.deepEqual(sections.slice(0, 5).map(({ pages }) => pages[0].path), [
    '/dashboard', '/dashboard/3d', '/leaderboard', '/booking-calendar', '/my-bookings',
  ]);
  assert.ok(sections.slice(0, 5).every(({ pages }) => pages.length === 1));
  assert.deepEqual(sections.slice(0, 3).map(({ pages }) => pages[0].icon), [
    'dashboard', '3d-dashboard', 'leaderboard',
  ]);
  assert.ok(sections.every(({ pages }) => pages.every(({ icon }) => icon)));
});

test('deep links select the most specific page and its section', () => {
  const sections = getNavigationSections(true);
  assert.equal(findNavigationPage('/dashboard/3d', sections)?.page.path, '/dashboard/3d');
  assert.equal(findNavigationPage('/spaces/station/42', sections)?.section.key, 'spaces');
  assert.equal(findNavigationPage('/support-tickets/42', sections)?.page.path, '/support-tickets');
  assert.equal(findNavigationPage('/dashboard-not-a-route', sections), undefined);
});

test('legacy links highlight canonical destinations', () => {
  const sections = getNavigationSections(true);
  for (const section of sections) {
    for (const page of section.pages) {
      for (const alias of page.aliases ?? []) {
        assert.equal(findNavigationPage(alias, sections)?.page.path, page.path);
      }
    }
  }
});

test('search matches page and section names regardless of case or whitespace', () => {
  const sections = getNavigationSections(true);
  assert.equal(searchNavigationPages('  EQUIPMENT   licenses ', sections)[0]?.page.path, '/lab-equipment/license');
  assert.equal(searchNavigationPages('finance', sections).length, 3);
  assert.equal(searchNavigationPages('no-such-page', sections).length, 0);
});