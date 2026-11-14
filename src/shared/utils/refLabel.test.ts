import assert from 'node:assert/strict';
import test from 'node:test';
import { refLabel } from './refLabel.ts';

test('refLabel renders references, users and choices as text', () => {
  assert.equal(refLabel({ id: 1, name: 'Dell' }), 'Dell');
  assert.equal(refLabel({ id: 4, display_name: 'Le Van C', username: 'lvc' }), 'Le Van C');
  assert.equal(refLabel({ id: 4, username: 'lvc' }), 'lvc');
  assert.equal(refLabel({ value: 'in_use', label: 'In use' }), 'In use');
  assert.equal(refLabel({ first_name: 'An', last_name: 'Tran' }), 'An Tran');
  assert.equal(refLabel(' Store 1 '), 'Store 1');
  assert.equal(refLabel(42), '42');
  assert.equal(refLabel([{ name: 'A' }, 'B', null]), 'A, B');
});

test('refLabel never stringifies an unknown object', () => {
  assert.equal(refLabel({ id: 9 }), '');
  assert.equal(refLabel(null), '');
  assert.equal(refLabel(undefined), '');
});
