import { chapters, HAZARD_SIZE, ITEM_SIZE, SANTA_SIZE, SANTA_X, WORLD_WIDTH } from './constants.ts';
import type { Entity, Run } from './types.ts';

export function createRun(chapter: number, unlockedChapter = chapter): Run {
  return {
    phase: 'briefing', chapter, jumpLimit: chapters[unlockedChapter].jumps, bossHP: null, height: 0, velocity: 0, jumps: 0, distance: 0,
    wave: 0, nextWave: 0, letters: 0, score: 0, shield: false, entities: [],
  };
}

export function jump(run: Run): Run {
  if (run.phase !== 'playing' || run.jumps >= run.jumpLimit) return run;
  return { ...run, jumps: run.jumps + 1, velocity: 550 };
}

// Heights are measured from the snow line. All distances use world coordinates.
export function step(run: Run, dt: number): Run {
  if (run.phase !== 'playing') return run;
  const level = chapters[run.chapter];
  const travel = level.speed * dt;
  const distance = run.distance + travel;
  const ceiling = run.jumps >= 3 ? 198 : 165;
  const height = Math.max(0, Math.min(ceiling, run.height + run.velocity * dt - 700 * dt * dt));
  const next: Run = {
    ...run, height, distance, jumps: height > 0 ? run.jumps : 0,
    velocity: height > 0 ? (height === ceiling ? Math.min(0, run.velocity) : run.velocity) - 1400 * dt : 0,
    entities: [],
  };
  let entities = run.entities;
  if (run.bossHP !== null && distance >= run.nextWave) {
    const volley = run.wave;
    const shots: Entity[] = [
      { id: volley * 3, kind: 'blast', x: WORLD_WIDTH - 90, bottom: 0 },
      { id: volley * 3 + 1, kind: 'counterStar', x: WORLD_WIDTH - 65, bottom: [0, 225, 199, 178][run.bossHP] },
    ];
    if (run.bossHP === 1) shots.push({ id: volley * 3 + 2, kind: 'blast', x: WORLD_WIDTH + 40, bottom: 0 });
    entities = [...entities, ...shots];
    next.nextWave += level.speed * (2.8 + run.bossHP * 0.25);
    next.wave++;
  } else if (run.bossHP === null && distance >= run.nextWave) {
    const wave = run.wave;
    const pickup: Entity = {
      id: wave * 2, kind: wave % 2 === 0 && run.letters < level.letters ? 'letter' : wave % 4 === 1 ? 'shield' : 'star',
      x: WORLD_WIDTH, bottom: run.chapter > 0 && wave % 4 === 2 ? 182 : 67 + (wave % 3) * 9,
    };
    // The first pickup teaches the arc before any obstacle enters the lane.
    entities = [...entities, pickup];
    if (wave > 0) {
      const goblin = wave % (5 - run.chapter) === 1;
      entities.push({ id: wave * 2 + 1, kind: goblin ? 'goblin' : 'hazard', x: WORLD_WIDTH + 5, bottom: 0 });
    }
    next.nextWave += level.spacing * [1, 1.18, 0.94, 1.34][wave % 4];
    next.wave++;
  }
  for (const entity of entities) {
    const x = entity.x - travel * (entity.kind === 'goblin' ? 1.12 : 1);
    const dangerous = entity.kind === 'hazard' || entity.kind === 'blast' || entity.kind === 'goblin';
    const size = dangerous ? HAZARD_SIZE : ITEM_SIZE;
    if (x + size < 0) continue;
    const overlaps = x + size - 4 > SANTA_X + 10 && x + 4 < SANTA_X + SANTA_SIZE - 10
      && height + 5 < entity.bottom + size && height + SANTA_SIZE - 6 > entity.bottom;
    if (!overlaps) {
      next.entities.push({ ...entity, x });
      continue;
    }
    if (dangerous) {
      if (!next.shield) {
        next.phase = 'lost';
        next.entities.push({ ...entity, x });
        return next;
      }
      next.shield = false;
    } else if (entity.kind === 'counterStar' && next.bossHP !== null) {
      next.bossHP--;
      next.score += 25;
      if (next.bossHP === 0) {
        next.phase = 'delivered';
        return next;
      }
    } else if (entity.kind === 'shield') {
      next.shield = true;
    } else {
      next.score += entity.kind === 'letter' ? 10 : 5;
      if (entity.kind === 'letter') next.letters = Math.min(level.letters, next.letters + 1);
    }
  }
  if (run.bossHP === null && distance >= level.routeLength && next.letters >= level.letters) {
    if (run.chapter === chapters.length - 1) {
      next.bossHP = 3;
      next.entities = [];
      next.nextWave = distance + level.speed;
    } else {
      next.phase = 'delivered';
    }
  }
  return next;
}
