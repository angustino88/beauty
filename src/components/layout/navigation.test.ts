import test from 'node:test';
import assert from 'node:assert/strict';
import { findNavigationPage, getNavigationSections, searchNavigationPages } from './navigation.ts';
import type { LabsPermission } from '../../features/auth/permissions.ts';

const nobody = () => false;
const everything = () => true;
const holding = (...held: LabsPermission[]) => (permission: LabsPermission) => held.includes(permission);

test('regular users see only public navigation, including in search', () => {
  const sections = getNavigationSections(nobody);
  assert.deepEqual(sections.map(({ key }) => key), [
    'dashboard', '3d-dashboard', 'leaderboard', 'booking-calendar', 'my-bookings', 'help',
  ]);
  assert.equal(searchNavigationPages('equipment', sections).length, 0);
  assert.equal(findNavigationPage('/spaces/station', sections), undefined);
});

test('coordinator navigation retains all destinations and promotes frequent pages', () => {
  const sections = getNavigationSections(everything);
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
  const sections = getNavigationSections(everything);
  assert.equal(findNavigationPage('/dashboard/3d', sections)?.page.path, '/dashboard/3d');
  assert.equal(findNavigationPage('/spaces/station/42', sections)?.section.key, 'spaces');
  assert.equal(findNavigationPage('/support-tickets/42', sections)?.page.path, '/support-tickets');
  assert.equal(findNavigationPage('/dashboard-not-a-route', sections), undefined);
});

test('search matches page and section names regardless of case or whitespace', () => {
  const sections = getNavigationSections(everything);
  assert.equal(searchNavigationPages('  EQUIPMENT   licenses ', sections)[0]?.page.path, '/lab-equipment/license');
  assert.equal(searchNavigationPages('finance', sections).length, 3);
  assert.equal(searchNavigationPages('no-such-page', sections).length, 0);
});
test('each section follows its own permission', () => {
  const operator = getNavigationSections(holding('lab_operations.manage')).map(({ key }) => key);
  assert.ok(operator.includes('spaces'));
  assert.ok(operator.includes('equipment'));
  assert.ok(!operator.includes('finance'));

  const finance = getNavigationSections(holding('finance.manage')).map(({ key }) => key);
  assert.ok(finance.includes('finance'));
  assert.ok(!finance.includes('spaces'));
});
