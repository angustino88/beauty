import assert from 'node:assert/strict';
import test from 'node:test';
import {
  formatAdditionalSummary,
  partitionFormSections,
  resolveFieldWidth,
} from './formLayout.ts';

test('resolveFieldWidth uses uniform half-width for single-line controls and ignores legacy narrow spans', () => {
  assert.equal(resolveFieldWidth({ type: 'text' }), 'half');
  assert.equal(resolveFieldWidth({ type: 'text', span: 7 }), 'half');
  assert.equal(resolveFieldWidth({ type: 'text', span: 10 }), 'half');
  assert.equal(resolveFieldWidth({ type: 'number', span: 8 }), 'half');
  assert.equal(resolveFieldWidth({ type: 'select', span: 12 }), 'half');
  assert.equal(resolveFieldWidth({ type: 'date' }), 'half');
  assert.equal(resolveFieldWidth({ type: 'datetime' }), 'half');
  assert.equal(resolveFieldWidth({ type: 'quarter' }), 'half');
});

test('resolveFieldWidth spans full width for multi-line, JSON, multi-select, and explicit span 24 fields', () => {
  assert.equal(resolveFieldWidth({ type: 'textarea' }), 'full');
  assert.equal(resolveFieldWidth({ type: 'json' }), 'full');
  assert.equal(resolveFieldWidth({ type: 'json-object' }), 'full');
  assert.equal(resolveFieldWidth({ type: 'multi-select' }), 'full');
  assert.equal(resolveFieldWidth({ type: 'text', span: 24 }), 'full');
  assert.equal(resolveFieldWidth({ type: 'select', span: 24 }), 'full');
});

test('partitionFormSections orders sections canonically and counts optional fields', () => {
  const result = partitionFormSections([
    { type: 'textarea', section: 'Notes' },
    { type: 'number', section: 'Specifications' },
    { type: 'number', section: 'Specifications' },
    { type: 'select', section: 'Ownership', essential: true },
    { type: 'text', required: true },
    { type: 'image' },
  ]);

  assert.deepEqual(result.primarySections, ['Identification', 'Ownership']);
  assert.deepEqual(result.additionalSections, ['Specifications', 'Notes']);
  assert.equal(result.additionalFieldCount, 3);
  assert.equal(
    formatAdditionalSummary(result.additionalSections, result.additionalFieldCount),
    'Specifications · Notes · 3 optional fields',
  );
});

test('formatAdditionalSummary handles singular field counts and empty section lists', () => {
  assert.equal(formatAdditionalSummary(['Notes'], 1), 'Notes · 1 optional field');
  assert.equal(formatAdditionalSummary([], 2), '2 optional fields');
});
