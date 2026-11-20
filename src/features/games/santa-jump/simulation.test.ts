import { test } from 'node:test';
import assert from 'node:assert/strict';
import { chapters, SANTA_X } from './constants.ts';
import { createRun, jump, step } from './simulation.ts';
import type { Run } from './types.ts';

for (const [chapter, level] of chapters.entries()) {
  test(`delivers the required letters in ${level.short} and clears its encounters`, () => {
    let run: Run = { ...createRun(chapter), phase: 'playing' };
    for (let frame = 0; frame < (level.routeLength / level.speed + 30) * 60 && run.phase === 'playing'; frame++) {
      const target = run.entities.filter(e => e.x > SANTA_X + 45).sort((a, b) => a.x - b.x)[0];
      if (run.height === 0 && target && target.x - SANTA_X < level.speed * 0.32 + 32) run = jump(run);
      const highPickup = run.entities.some(e => e.bottom >= 178 && e.x > SANTA_X && e.x < SANTA_X + 145);
      if (highPickup && run.height > 58 && run.velocity < 390 && run.jumps < run.jumpLimit) run = jump(run);
      run = step(run, 1 / 60);
    }
    assert.equal(run.phase, 'delivered', JSON.stringify(run));
    if (chapter === 3) assert.equal(run.bossHP, 0);
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

test('earned air jumps carry back to earlier stops', () => {
  for (const [unlocked, limit] of [[0, 1], [1, 2], [3, 3]]) {
    let state: Run = { ...createRun(0, unlocked), phase: 'playing' };
    for (let i = 0; i < 4; i++) state = jump(state);
    assert.equal(state.jumps, limit);
  }
});

test('reaching the last stop starts the boss fight and cannot skip it', () => {
  const level = chapters[3];
  let state: Run = { ...createRun(3), phase: 'playing', letters: level.letters, distance: level.routeLength };
  state = step(state, 1 / 60);
  assert.equal(state.bossHP, 3);
  state = step(state, 1 / 60);
  assert.equal(state.phase, 'playing');
  assert.equal(state.bossHP, 3);
});
