import { chapters, HAZARD_SIZE, ITEM_SIZE, SANTA_SIZE, SANTA_X, WORLD_WIDTH } from './constants.ts';
import type { Entity, Foe, Item, Run, Supply } from './types.ts';

export function isThreat(kind: Item) {
  return ['hazard', 'blast', 'goblin', 'owl', 'hare', 'ram', 'bat', 'mole'].includes(kind);
}

export function chapterAct(run: Pick<Run, 'chapter' | 'distance'>): 0 | 1 | 2 {
  const progress = run.distance / chapters[run.chapter].routeLength;
  return progress >= 0.7 ? 2 : progress >= 0.35 ? 1 : 0;
}

export function chapterRule(run: Pick<Run, 'chapter' | 'distance' | 'bossHP'>): string {
  const level = chapters[run.chapter];
  if (run.bossHP !== null) return level.boss === 'summit-king' ? 'Crown Duel' : 'Frost King Siege';
  return level.phases[chapterAct(run)];
}

export function chapterPace(run: Pick<Run, 'chapter' | 'distance'> & { bossHP?: number | null }) {
  if (run.bossHP !== null && run.bossHP !== undefined) return 1.05;
  const level = chapters[run.chapter];
  const progress = Math.min(1, run.distance / level.routeLength);
  const act = chapterAct(run);
  const actSurge = act === 2 ? 0.12 : act === 1 ? 0.05 : 0;
  return level.basePace + level.maxRamp * progress + actSurge;
}

export function createRun(chapter: number, unlockedChapter = chapter): Run {
  return {
    elapsed: 0, magnet: 0, slow: 0, multiplier: 0, phase: 'briefing', chapter,
    jumpLimit: chapters[unlockedChapter].jumps, bossHP: null, height: 0, velocity: 0, jumps: 0, distance: 0,
    wave: 0, nextWave: 0, letters: 0, score: 0, shield: false, entities: [],
  };
}

export function jump(run: Run): Run {
  if (run.phase !== 'playing' || run.jumps >= run.jumpLimit) return run;
  return { ...run, jumps: run.jumps + 1, velocity: 550 };
}

function activeActFoes(chapter: number, act: 0 | 1 | 2): readonly Foe[] {
  const [act1, act2, act3] = chapters[chapter].foes;
  if (act === 0) return [act1];
  if (act === 1) return [act2, act1];
  return [act3, act2, act1];
}

function selectWaveThreat(chapter: number, wave: number, act: 0 | 1 | 2, highPickup: boolean): Item {
  const level = chapters[chapter];
  const pool = activeActFoes(chapter, act);
  if (wave % 2 === 1) {
    const oddIndex = Math.floor(wave / 2);
    return pool[oddIndex % pool.length];
  }
  const evenIndex = wave / 2 - 1;
  const candidates: readonly Foe[] = highPickup
    ? pool.filter(f => f === 'hare' || f === 'mole')
    : pool.filter(f => f !== 'owl' && f !== 'bat');
  if (candidates.length === 0) return 'hazard';
  if ((act === 2 || level.foeEvery === 1) && evenIndex % 2 === 1) {
    return candidates[Math.floor(evenIndex / 2) % candidates.length];
  }
  if (level.foeEvery === 2 && evenIndex % 3 === 2) {
    return candidates[Math.floor(evenIndex / 3) % candidates.length];
  }
  return 'hazard';
}

function selectStageSupply(chapter: number, wave: number, act: 0 | 1 | 2): Supply {
  const level = chapters[chapter];
  const scheduled = level.supplies[Math.floor(wave / 2) % level.supplies.length];
  // During the Act III Climax (70-100%), shields are cut off in favor of offensive/scoring pickups.
  if (act === 2 && scheduled === 'shield') {
    return level.supplies.includes('prism') ? 'prism' : 'star';
  }
  return scheduled;
}

// Heights are measured from the snow line. All distances use world coordinates.
export function step(run: Run, dt: number): Run {
  if (run.phase !== 'playing') return run;
  const level = chapters[run.chapter];
  const motionDt = dt * (run.slow > 0 ? 0.65 : 1);
  const elapsed = run.elapsed + motionDt;
  if (level.timeLimit > 0 && elapsed >= level.timeLimit) {
    return { ...run, elapsed: level.timeLimit, phase: 'lost' };
  }
  const act = chapterAct(run);
  const pace = chapterPace(run);
  const travel = level.speed * motionDt * pace;
  const distance = run.distance + travel;
  const ceiling = run.jumps >= 3 ? 198 : 165;
  const height = Math.max(0, Math.min(ceiling, run.height + run.velocity * motionDt - 700 * motionDt * motionDt));
  const survivalGain = level.survivalBonus > 0 && Math.floor(elapsed / 10) > Math.floor(run.elapsed / 10)
    ? level.survivalBonus * (act === 2 ? 2 : 1)
    : 0;
  const next: Run = {
    ...run, elapsed, height, distance,
    slow: Math.max(0, run.slow - dt), magnet: Math.max(0, run.magnet - dt),
    multiplier: Math.max(0, run.multiplier - dt),
    score: run.score + survivalGain,
    jumps: height > 0 ? run.jumps : 0,
    velocity: height > 0 ? (height === ceiling ? Math.min(0, run.velocity) : run.velocity) - 1400 * motionDt : 0,
    entities: [],
  };
  let entities = run.entities;
  if (run.bossHP !== null && distance >= run.nextWave) {
    const volley = run.wave;
    const shots: Entity[] = [
      { id: volley * 3, kind: 'blast', x: WORLD_WIDTH - 90, bottom: 0 },
      { id: volley * 3 + 1, kind: 'counterStar', x: WORLD_WIDTH - 65, bottom: [0, 225, 199, 178][run.bossHP] },
    ];
    const elite = level.boss === 'summit-king';
    if (elite || run.bossHP === 1) {
      shots.push({ id: volley * 3 + 2, kind: 'blast', x: elite ? WORLD_WIDTH - 90 + level.speed * 0.30 : WORLD_WIDTH + 40, bottom: 0 });
    }
    entities = [...entities, ...shots];
    next.nextWave += level.speed * ((elite ? 2.1 : 2.6) + run.bossHP * 0.25);
    next.wave++;
  } else if (run.bossHP === null && distance >= run.nextWave) {
    const wave = run.wave;
    const supply = selectStageSupply(run.chapter, wave, act);
    const climaxBurst = act === 2 && distance >= level.routeLength * 0.82 && wave >= level.supplies.length * 2;
    const sendLetter = (wave % 2 === 0 || climaxBurst) && run.letters < level.letters;
    const twinWave = wave > 0 && ((act === 1 && wave % 4 === 2) || (act === 2 && wave % 2 === 0));
    const defaultBottom = run.chapter >= 4 && (wave % 6 === 4 || (act === 2 && wave % 4 === 0))
      ? 225
      : run.chapter > 0 && (wave % 4 === 2 || twinWave)
        ? 182
        : twinWave
          ? 112
          : 67 + (wave % 3) * 9;
    const highPickup = defaultBottom >= 178 || twinWave;
    const threatKind = wave > 0 ? selectWaveThreat(run.chapter, wave, act, highPickup) : null;
    const flyer = threatKind === 'owl' || threatKind === 'bat';
    const pickup: Entity = {
      id: wave * 3, kind: sendLetter ? 'letter' : supply,
      x: WORLD_WIDTH + (twinWave && !flyer ? 18 : 0),
      bottom: flyer ? 18 : defaultBottom,
    };
    // The first pickup teaches the arc before any obstacle enters the lane.
    entities = [...entities, pickup];
    if (threatKind !== null) {
      const chargerOffset = threatKind === 'ram' ? 46 : threatKind === 'goblin' ? 38 : 5;
      entities.push({ id: wave * 3 + 1, kind: threatKind, x: WORLD_WIDTH + chargerOffset, bottom: flyer ? 154 : 0 });
      if (twinWave && !flyer) {
        const flankerPool = activeActFoes(run.chapter, act).filter(f => f === 'hare' || f === 'mole');
        const flanker: Item = flankerPool.length > 0 && wave % 4 === 0 ? flankerPool[0] : 'hazard';
        const twinSpan = run.jumpLimit > 1 ? 48 : 34;
        entities.push({ id: wave * 3 + 2, kind: flanker, x: WORLD_WIDTH + 5 + twinSpan, bottom: 0 });
      }
    }
    const baseCadence = defaultBottom >= 178 || twinWave
      ? 1.24
      : act === 2
        ? [0.92, 1.04, 0.90, 1.12][wave % 4]
        : act === 1
          ? [0.96, 1.10, 0.94, 1.20][wave % 4]
          : [1, 1.14, 0.96, 1.26][wave % 4];
    next.nextWave += level.spacing * pace * baseCadence;
    next.wave++;
  }
  for (const original of entities) {
    let entity = original.kind === 'hare'
      ? { ...original, bottom: 26 * Math.abs(Math.sin((WORLD_WIDTH - original.x) / 70)) }
      : original;
    if (entity.kind === 'bat') entity = { ...entity, bottom: 138 + 32 * Math.sin(entity.x / 65) };
    if (entity.kind === 'mole') entity = { ...entity, bottom: Math.max(-32, Math.min(0, (296 - entity.x) / 2)) };
    const stride = entity.kind === 'ram' && entity.x < WORLD_WIDTH / 2 ? 1.32 : entity.kind === 'goblin' ? 1.12 : 1;
    const x = entity.x - travel * stride;
    const dangerous = isThreat(entity.kind);
    const size = dangerous ? HAZARD_SIZE : ITEM_SIZE;
    if (x + size < 0) continue;
    const overlaps = x + size - 4 > SANTA_X + 10 && x + 4 < SANTA_X + SANTA_SIZE - 10
      && height + 5 < entity.bottom + size && height + SANTA_SIZE - 6 > entity.bottom;
    const attracted = next.magnet > 0 && ['star', 'letter'].includes(entity.kind)
      && Math.abs(x - SANTA_X) < 75 && Math.abs(entity.bottom - height) < 150;
    if (!overlaps && !attracted) {
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
    } else if (entity.kind === 'hourglass') {
      next.slow = 5;
    } else if (entity.kind === 'prism') {
      next.multiplier = 8;
    } else if (entity.kind === 'magnet') {
      next.magnet = 8;
    } else if (entity.kind === 'shield') {
      next.shield = true;
    } else {
      next.score += (entity.kind === 'letter' ? 10 : 5) * (next.multiplier > 0 ? 2 : 1);
      if (entity.kind === 'letter') next.letters = Math.min(level.letters, next.letters + 1);
    }
  }
  if (run.bossHP === null && distance >= level.routeLength && next.letters >= level.letters) {
    if (level.boss) {
      next.bossHP = 3;
      next.entities = [];
      next.nextWave = distance + level.speed;
    } else {
      next.phase = 'delivered';
    }
  }
  return next;
}
