import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { buildRequiredFieldRules } from './formValidation.ts';

// Use the same validator as Ant Design, including its CommonJS default export.
const require = createRequire(import.meta.url);
const Schema = require('@rc-component/async-validator').default as typeof import('@rc-component/async-validator').default;

test('required Kind accepts numeric IDs but rejects an empty selection', async () => {
  const rules = buildRequiredFieldRules({ required: true, type: 'select', label: 'Kind' });
  assert.equal(Object.hasOwn(rules[0], 'whitespace'), false);
  const schema = new Schema({ kind_id: rules });
  await schema.validate({ kind_id: 1 });
  await schema.validate({ kind_id: '1' });
  await assert.rejects(schema.validate({ kind_id: undefined }));
  await assert.rejects(schema.validate({ kind_id: null }));
  await assert.rejects(schema.validate({ kind_id: '' }));
});

test('required number and multi-select fields accept non-string values', async () => {
  await new Schema({ capacity: buildRequiredFieldRules({ required: true, type: 'number', label: 'Capacity' }) })
    .validate({ capacity: 4 });
  const schema = new Schema({ owners: buildRequiredFieldRules({ required: true, type: 'multi-select', label: 'Owners' }) });
  await schema.validate({ owners: [1, 2] });
  await assert.rejects(schema.validate({ owners: [] }));
});

test('required text fields still reject whitespace-only input', async () => {
  for (const type of ['text', 'textarea'] as const) {
    const schema = new Schema({ value: buildRequiredFieldRules({ required: true, type, label: 'Name' }) });
    await schema.validate({ value: 'Equipment' });
    await assert.rejects(schema.validate({ value: '   ' }));
  }
});

test('optional fields do not receive required validation', () => {
  assert.deepEqual(buildRequiredFieldRules({ type: 'select', label: 'Type' }), []);
});