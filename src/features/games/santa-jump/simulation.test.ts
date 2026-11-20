import { test } from 'node:test';
import assert from 'node:assert/strict';
import { chapters, SANTA_X } from './constants.ts';
import { createRun, jump, step } from './simulation.ts';
import type { Run } from './types.ts';

for (const [chapter, level] of chapters.entries()) {
  test(`delivers the required letters in ${level.short} using ordinary jumps`, () => {
    let run: Run = { ...createRun(chapter), phase: 'playing' };
    for (let frame = 0; frame < (level.routeLength / level.speed + 30) * 60 && run.phase === 'playing'; frame++) {
      const target = run.entities.find(e => e.x > SANTA_X + 45);
      if (run.height === 0 && target && target.x - SANTA_X < level.speed * 0.32 + 32) run = jump(run);
      run = step(run, 1 / 60);
    }
    assert.equal(run.phase, 'delivered');
    assert.ok(run.distance >= level.routeLength);
    assert.equal(run.letters, level.letters);
    assert.ok(run.score >= 10 * level.letters);
  });
}

test('shield absorbs one collision and a retry clears the inventory', () => {
  let state: Run = { ...createRun(2), phase: 'playing' };
  const hit = (kind: 'shield' | 'hazard') => step({ ...state, entities: [{ id: 42, kind, x: SANTA_X + 8, bottom: 0 }] }, 1 / 60);
  state = hit('shield');
  assert.equal(state.shield, true);
  state = hit('hazard');
  assert.equal(state.phase, 'playing');
  assert.equal(state.shield, false);
  state = hit('hazard');
  assert.equal(state.phase, 'lost');
  assert.equal(step(state, 0.04), state);
  assert.equal(createRun(2).letters, 0);
});

test('pause freezes the world and jump limits follow the chapter', () => {
  const paused: Run = { ...createRun(1), phase: 'paused' };
  assert.equal(step(paused, 1 / 60), paused);
  assert.equal(jump(paused), paused);
  const airborne = jump(jump({ ...paused, phase: 'playing' }));
  assert.equal(airborne.jumps, 2);
  assert.equal(jump(airborne), airborne);
});
