import assert from 'node:assert/strict';
import test from 'node:test';
import { buildEditFormValues, computeAsyncInitialPatch } from './formInitialSync.ts';

const FIELDS = [
  { name: 'name', type: 'text' as const },
  { name: 'visual_model_id', type: 'select' as const },
  { name: 'tags', type: 'multi-select' as const },
  { name: 'details', type: 'json-object' as const },
  { name: 'image', type: 'image' as const },
];

test('hydrates late-arriving visual_model_id after initial edit modal open', () => {
  const initial = buildEditFormValues(FIELDS, {
    id: 42,
    name: 'Rack A1',
    visual_model_id: undefined,
    tags: [{ id: 1 }, { id: 2 }],
    details: { notes: 'ok' },
  });
  assert.equal(initial.formValues.visual_model_id, undefined);

  const { patch, nextRaw } = computeAsyncInitialPatch({
    fields: FIELDS,
    record: {
      id: 42,
      name: 'Rack A1',
      visual_model_id: 7,
      tags: [{ id: 1 }, { id: 2 }],
      details: { notes: 'ok' },
    },
    previousRaw: initial.rawSnapshot,
    touchedFields: new Set(),
  });

  assert.deepEqual(patch, { visual_model_id: 7 });
  assert.equal(nextRaw.visual_model_id, 7);

  // Subsequent re-renders with identical values produce no further patches.
  const followUp = computeAsyncInitialPatch({
    fields: FIELDS,
    record: {
      id: 42,
      name: 'Rack A1',
      visual_model_id: 7,
      tags: [{ id: 1 }, { id: 2 }],
      details: { notes: 'ok' },
    },
    previousRaw: nextRaw,
    touchedFields: new Set(),
  });
  assert.deepEqual(followUp.patch, {});
});

test('does not overwrite visual_model_id if the user already changed or cleared it', () => {
  const initial = buildEditFormValues(FIELDS, {
    id: 42,
    name: 'Rack A1',
    visual_model_id: undefined,
  });

  const { patch, nextRaw } = computeAsyncInitialPatch({
    fields: FIELDS,
    record: {
      id: 42,
      name: 'Rack A1',
      visual_model_id: 7,
    },
    previousRaw: initial.rawSnapshot,
    touchedFields: new Set(['visual_model_id']),
  });

  assert.deepEqual(patch, {});
  assert.equal(nextRaw.visual_model_id, 7);
});

test('hydrates a field added after initial open when untouched', () => {
  const initial = buildEditFormValues([{ name: 'name', type: 'text' as const }], {
    id: 42,
    name: 'Rack A1',
  });

  const { patch } = computeAsyncInitialPatch({
    fields: [
      { name: 'name', type: 'text' as const },
      { name: 'visual_model_id', type: 'select' as const },
    ],
    record: {
      id: 42,
      name: 'Rack A1',
      visual_model_id: 9,
    },
    previousRaw: initial.rawSnapshot,
    touchedFields: new Set(),
  });

  assert.deepEqual(patch, { visual_model_id: 9 });
});

test('updates stale cached visual_model_id when refetched value is cleared', () => {
  const initial = buildEditFormValues(FIELDS, {
    id: 42,
    name: 'Rack A1',
    visual_model_id: 7,
  });

  const { patch } = computeAsyncInitialPatch({
    fields: FIELDS,
    record: {
      id: 42,
      name: 'Rack A1',
      visual_model_id: undefined,
    },
    previousRaw: initial.rawSnapshot,
    touchedFields: new Set(),
  });

  assert.deepEqual(patch, { visual_model_id: undefined });
});
