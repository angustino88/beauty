import { chapters, HAZARD_SIZE, ITEM_SIZE, SANTA_SIZE, SANTA_X, WORLD_WIDTH } from './constants.ts';
import type { Entity, Run } from './types.ts';

export function createRun(chapter: number): Run {
  return {
    phase: 'briefing', chapter, height: 0, velocity: 0, jumps: 0, distance: 0,
    wave: 0, nextWave: 0, letters: 0, score: 0, shield: false, entities: [],
  };
}

export function jump(run: Run): Run {
  if (run.phase !== 'playing' || run.jumps >= chapters[run.chapter].jumps) return run;
  return { ...run, jumps: run.jumps + 1, velocity: 550 };
}

// Heights are measured from the snow line. All distances use world coordinates.
export function step(run: Run, dt: number): Run {
  if (run.phase !== 'playing') return run;
  const level = chapters[run.chapter];
  const travel = level.speed * dt;
  const distance = run.distance + travel;
  const height = Math.max(0, Math.min(185, run.height + run.velocity * dt - 700 * dt * dt));
  const next: Run = {
    ...run, height, distance, jumps: height > 0 ? run.jumps : 0,
    velocity: height > 0 ? (height === 185 ? Math.min(0, run.velocity) : run.velocity) - 1400 * dt : 0,
    entities: [],
  };
  let entities = run.entities;
  if (distance >= run.nextWave) {
    const wave = run.wave;
    const pickup: Entity = {
      id: wave * 2, kind: wave % 2 === 0 && run.letters < level.letters ? 'letter' : wave % 4 === 1 ? 'shield' : 'star',
      x: WORLD_WIDTH, bottom: 67 + (wave % 3) * 9,
    };
    // The first pickup teaches the arc before any obstacle enters the lane.
    entities = [...entities, pickup];
    if (wave > 0) entities.push({ id: wave * 2 + 1, kind: 'hazard', x: WORLD_WIDTH + 5, bottom: 0 });
    next.nextWave += level.spacing * [1, 1.18, 0.94, 1.34][wave % 4];
    next.wave++;
  }
  for (const entity of entities) {
    const x = entity.x - travel;
    const size = entity.kind === 'hazard' ? HAZARD_SIZE : ITEM_SIZE;
    if (x + size < 0) continue;
    const overlaps = x + size - 4 > SANTA_X + 10 && x + 4 < SANTA_X + SANTA_SIZE - 10
      && height + 5 < entity.bottom + size && height + SANTA_SIZE - 6 > entity.bottom;
    if (!overlaps) {
      next.entities.push({ ...entity, x });
      continue;
    }
    if (entity.kind === 'hazard') {
      if (!next.shield) {
        next.phase = 'lost';
        next.entities.push({ ...entity, x });
        return next;
      }
      next.shield = false;
    } else if (entity.kind === 'shield') {
      next.shield = true;
    } else {
      next.score += entity.kind === 'letter' ? 10 : 5;
      if (entity.kind === 'letter') next.letters = Math.min(level.letters, next.letters + 1);
    }
  }
  if (distance >= level.routeLength && next.letters >= level.letters) next.phase = 'delivered';
  return next;
}
