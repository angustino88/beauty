import { test } from 'node:test';
import assert from 'node:assert/strict';
import { chapters, SANTA_X } from './constants.ts';
import { chapterPace, createRun, jump, step } from './simulation.ts';
import type { Foe, Run, Supply } from './types.ts';

for (const [chapter, level] of chapters.entries()) {
  test(`delivers the required letters in ${level.short} and clears its encounters`, () => {
    let run: Run = { ...createRun(chapter), phase: 'playing' };
    const seenFoes = new Set<string>();
    const seenSupplies = new Set<string>();
    for (let frame = 0; frame < (level.routeLength / level.speed + 30) * 60 && run.phase === 'playing'; frame++) {
      for (const e of run.entities) {
        if (['hare', 'owl', 'goblin', 'ram', 'mole', 'bat'].includes(e.kind)) {
          assert.ok(level.foes.includes(e.kind as Foe), `${e.kind} should not spawn in ${level.short}`);
          seenFoes.add(e.kind);
        }
        if (['star', 'shield', 'magnet', 'prism', 'hourglass'].includes(e.kind)) {
          assert.ok(level.supplies.includes(e.kind as Supply), `${e.kind} should not spawn in ${level.short}`);
          seenSupplies.add(e.kind);
        }
      }
      const target = run.entities.filter(e => e.x > SANTA_X + 45).sort((a, b) => a.x - b.x)[0];
      const owlAhead = run.entities.some(e => (e.kind === 'owl' || e.kind === 'bat') && e.x > SANTA_X - 45 && e.x < SANTA_X + 230);
      if (!owlAhead && run.height === 0 && target && target.x - SANTA_X < level.speed * 0.32 + 32) run = jump(run);
      const highPickup = run.entities.some(e => e.bottom >= 178 && e.x > SANTA_X && e.x < SANTA_X + 145);
      if (!owlAhead && highPickup && run.height > 58 && run.velocity < 390 && run.jumps < run.jumpLimit) run = jump(run);
      run = step(run, 1 / 60);
    }
    assert.equal(run.phase, 'delivered', JSON.stringify(run));
    assert.equal(run.bossHP, level.boss ? 0 : null);
    assert.ok(run.distance >= level.routeLength);
    assert.equal(run.letters, level.letters);
    assert.ok(run.score >= 10 * level.letters);
    assert.equal(seenFoes.size, new Set(level.foes).size);
    assert.equal(seenSupplies.size, new Set(level.supplies).size);
  });
}

test('each stop defines a unique stage rule, distinct rosters and strictly increasing difficulty', () => {
  const rules = new Set(chapters.map(c => c.rule));
  assert.equal(rules.size, chapters.length);
  for (let i = 1; i < chapters.length; i++) {
    const prev = chapters[i - 1];
    const curr = chapters[i];
    assert.ok(curr.speed > prev.speed);
    assert.ok(curr.routeLength > prev.routeLength);
    assert.ok(curr.letters > prev.letters);
    assert.ok(curr.foeEvery <= prev.foeEvery);
    assert.notDeepEqual(curr.foes, prev.foes);
    assert.notDeepEqual(curr.supplies, prev.supplies);
  }
});

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

test('timed stops enforce their delivery deadline and hourglasses slow the countdown', () => {
  const timedIndex = 2; // Moonlit Rooftops (90s curfew)
  const limit = chapters[timedIndex].timeLimit;
  assert.ok(limit > 0);
  const expired = step({ ...createRun(timedIndex), phase: 'playing', elapsed: limit - 0.01 }, 0.02);
  assert.equal(expired.phase, 'lost');
  assert.equal(expired.elapsed, limit);
  const slowed = step({ ...createRun(timedIndex), phase: 'playing', slow: 3, elapsed: limit - 0.01 }, 0.01);
  assert.equal(slowed.phase, 'playing');
  assert.ok(slowed.elapsed < limit);
});

test('accelerating stops ramp pace along the route and award survival bonuses', () => {
  const harbor = createRun(5); // Starlight Harbor (+25% ramp, +10 bonus every 10s)
  const startRun: Run = { ...harbor, phase: 'playing', distance: 0 };
  const endRun: Run = { ...harbor, phase: 'playing', distance: chapters[5].routeLength, elapsed: 9.99 };
  assert.ok(chapterPace(endRun) > chapterPace(startRun));
  const early = step(startRun, 0.02);
  const late = step(endRun, 0.02);
  assert.ok(late.distance - endRun.distance > early.distance);
  assert.equal(late.score, chapters[5].survivalBonus);
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

test('whiteout caverns never schedule defensive supplies and solstice peak fires paired boss blasts', () => {
  for (let wave = 0; wave < 28; wave++) {
    const run: Run = { ...createRun(8), phase: 'playing', wave }; // Violet Ice Caverns (Stop 9)
    const next = step(run, 1 / 60);
    assert.ok(next.distance > chapters[8].speed / 60);
    assert.ok(next.entities.every(e => e.kind !== 'shield' && e.kind !== 'hourglass'));
  }
  const summitBoss: Run = { ...createRun(9), phase: 'playing', bossHP: 3 }; // Solstice Peak (Stop 10)
  assert.equal(step(summitBoss, 1 / 60).entities.filter(e => e.kind === 'blast').length, 2);
  const finalStar: Run = { ...summitBoss, bossHP: 1, entities: [{ kind: 'counterStar', x: SANTA_X, bottom: 0, id: 99 }] };
  assert.equal(step(finalStar, 1 / 60).phase, 'delivered');
});
