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
      const owlAhead = run.entities.some(e => (e.kind === 'owl' || e.kind === 'bat') && e.x > SANTA_X - 45 && e.x < SANTA_X + 230);
      if (!owlAhead && run.height === 0 && target && target.x - SANTA_X < level.speed * 0.32 + 32) run = jump(run);
      const highPickup = run.entities.some(e => e.bottom >= 178 && e.x > SANTA_X && e.x < SANTA_X + 145);
      if (!owlAhead && highPickup && run.height > 58 && run.velocity < 390 && run.jumps < run.jumpLimit) run = jump(run);
      run = step(run, 1 / 60);
    }
    assert.equal(run.phase, 'delivered', JSON.stringify(run));
    assert.equal(run.bossHP, 'boss' in level ? 0 : null);
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

test('reaching the observatory starts the boss fight and cannot skip it', () => {
  const level = chapters[3];
  let state: Run = { ...createRun(3), phase: 'playing', letters: level.letters, distance: level.routeLength };
  state = step(state, 1 / 60);
  assert.equal(state.bossHP, 3);
  state = step(state, 1 / 60);
  assert.equal(state.phase, 'playing');
  assert.equal(state.bossHP, 3);
});

test('score rush spends points on hits and ends at sixty seconds', () => {
  let state: Run = { ...createRun(0, 0, 'rush'), phase: 'playing', score: 20,
    entities: [{ id: 7, kind: 'hare', x: SANTA_X, bottom: 0 }] };
  state = step(state, 1 / 60);
  assert.equal(state.score, 5);
  assert.equal(state.phase, 'playing');
  state = step({ ...state, elapsed: 59.99 }, 0.02);
  assert.equal(state.elapsed, 60);
  assert.equal(state.phase, 'delivered');
});

test('endless accelerates beyond the route and awards survival points', () => {
  const base: Run = { ...createRun(0, 0, 'endless'), phase: 'playing', distance: chapters[0].routeLength, letters: 10 };
  const early = step(base, 0.02);
  const late = step({ ...base, elapsed: 99.99 }, 0.02);
  assert.ok(late.distance > early.distance);
  assert.equal(late.phase, 'playing');
  assert.equal(late.score, 10);
});

test('magnet collects a distant star, prism doubles it and hourglass slows travel', () => {
  const base: Run = { ...createRun(0), phase: 'playing', nextWave: 1000 };
  const armed = step({ ...base, entities: (['prism', 'magnet', 'hourglass'] as const).map((kind, id) =>
    ({ kind, id, x: SANTA_X + 8, bottom: 0 })) }, 0.02);
  const star = { id: 60, kind: 'star' as const, x: SANTA_X + 63, bottom: 120 };
  const next = step({ ...armed, entities: [star] }, 0.02);
  assert.equal(next.score, 10);
  assert.ok(next.distance - armed.distance < armed.distance);
  assert.equal(step({ ...base, entities: [star] }, 0.02).score, 0);
  assert.equal(step({ ...next, phase: 'paused' }, 0.02).magnet, next.magnet);
});

test('whiteout survives at 90 seconds and never schedules defensive supplies', () => {
  for (let wave = 0; wave < 28; wave++) {
    const run: Run = { ...createRun(0, 0, 'whiteout'), phase: 'playing', wave };
    const next = step(run, 1 / 60);
    assert.ok(next.distance > chapters[0].speed / 60);
    assert.ok(next.entities.every(e => e.kind !== 'shield' && e.kind !== 'hourglass'));
  }
  const lastFrame: Run = { ...createRun(0, 0, 'whiteout'), phase: 'playing', elapsed: 89.99 };
  assert.equal(step(lastFrame, 0.02).phase, 'delivered');
});

test('crown duel grants three jumps, fires paired blasts and enforces the deadline', () => {
  const run: Run = { ...createRun(0, 0, 'duel'), phase: 'playing' };
  assert.equal(run.jumpLimit, 3);
  assert.equal(run.bossHP, 3);
  assert.equal(step(run, 1 / 60).entities.filter(e => e.kind === 'blast').length, 2);
  assert.equal(step({ ...run, elapsed: 23.99 }, 0.02).phase, 'lost');
  const finalStar: Run = { ...run, bossHP: 1, entities: [{ kind: 'counterStar', x: SANTA_X, bottom: 0, id: 99 }] };
  assert.equal(step(finalStar, 1 / 60).phase, 'delivered');
});
