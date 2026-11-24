import assert from 'node:assert/strict';
import test from 'node:test';
import { createTicketWriteQueue, SkippedTicketWrite } from './ticketWriteQueue.ts';

test('rapid edits send successive acknowledged versions and keep both field updates', async () => {
  const save = createTicketWriteQueue<{ version: number; priority: string; assignee: string }>();
  const original = { version: 4, priority: 'medium', assignee: '' };
  let allowFirstWrite!: () => void;
  const delay = new Promise<void>((resolve) => { allowFirstWrite = resolve; });
  const versions: number[] = [];

  const priority = save(original, async (ticket, version) => {
    versions.push(version);
    await delay;
    return { ...ticket, version: 5, priority: 'high' };
  });
  const assignee = save(original, async (ticket, version) => {
    versions.push(version);
    return { ...ticket, version: 6, assignee: 'Ana' };
  });

  await Promise.resolve();
  assert.deepEqual(versions, [4]);
  allowFirstWrite();
  await priority;
  assert.deepEqual(await assignee, { version: 6, priority: 'high', assignee: 'Ana' });
  assert.deepEqual(versions, [4, 5]);
  await save(original, async (ticket, version) => {
    assert.equal(version, 6);
    return ticket;
  });
});

test('a real version conflict stops queued edits until a new save with refreshed values', async () => {
  const save = createTicketWriteQueue<{ version: number }>();
  const conflict = { status: 409 };
  const first = save({ version: 8 }, async () => { throw conflict; });
  const queued = save({ version: 8 }, async () => {
    assert.fail('a queued write must not overwrite a concurrent change');
  });

  await assert.rejects(first, (error: unknown) => error === conflict);
  await assert.rejects(queued, SkippedTicketWrite);
  const next = await save({ version: 9 }, async (_, version) => {
    assert.equal(version, 9);
    return { version: 10 };
  });
  assert.equal(next.version, 10);
});
