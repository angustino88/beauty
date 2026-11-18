import assert from 'node:assert/strict';
import test from 'node:test';
import { resolveCategoryKey } from './categoryKey.ts';

const keyById = new Map([[4, 'computing'], [9, 'accessory']]);

test('the category id decides, whatever the category is called', () => {
  assert.equal(resolveCategoryKey({ id: 4, name: 'Accessory' }, keyById), 'computing');
  assert.equal(resolveCategoryKey({ id: 9, name: 'Cables & adapters' }, keyById), 'accessory');
});

test('without reference data the name is normalised; unknown names give no page', () => {
  assert.equal(resolveCategoryKey({ id: 77, name: 'Computing' }, new Map()), 'computing');
  assert.equal(resolveCategoryKey({ id: 77, name: 'Accessories' }, new Map()), 'accessory');
  assert.equal(resolveCategoryKey({ id: 77, name: 'Samples' }, new Map()), 'sample');
  assert.equal(resolveCategoryKey({ id: 77, name: 'Robots' }, new Map()), null);
  assert.equal(resolveCategoryKey(null, new Map()), null);
});
