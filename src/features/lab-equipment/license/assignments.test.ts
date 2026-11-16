import test from 'node:test';
import assert from 'node:assert/strict';
import { diffAssignments } from './assignments.ts';

test('only the difference is released and assigned', () => {
  assert.deepEqual(diffAssignments([1, 2, 3], [2, 3, 4]), { release: [1], assign: [4] });
});

test('an unchanged selection changes nothing, whatever the order', () => {
  assert.deepEqual(diffAssignments([1, 2], [2, 1]), { release: [], assign: [] });
});

test('a new license assigns everything and clearing releases everything', () => {
  assert.deepEqual(diffAssignments([], [5, 6]), { release: [], assign: [5, 6] });
  assert.deepEqual(diffAssignments([5, 6], []), { release: [5, 6], assign: [] });
});

test('duplicates in the selection are assigned once', () => {
  assert.deepEqual(diffAssignments([], [7, 7]), { release: [], assign: [7] });
});
