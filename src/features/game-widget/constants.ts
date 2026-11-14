export const GAME_WIDTH = 520;
export const GROUND_Y = 0;
export const OBSTACLE_SPEED_START = 5.2;
export const SPAWN_INTERVAL_START = 1800;
export const JUMP_VELOCITY = -14;
export const GRAVITY = 0.7;
export const OBSTACLE_WIDTH = 34;
export const MIN_SPAWN_MS = 500;
export const MAX_EXTRA_JITTER_MS = 900;

export const COLLECT_VALUE = 1;
export const COLLECT_SIZE = 26;
export const COLLECT_SPAWN_BASE_MS = 1400;
export const COLLECT_SPAWN_JITTER_MS = 900;

export const SHIELD_DURATION_MS = 3000;

export const TIER_POINTS = {
  DOUBLE: 10,
  TRIPLE: 20,
  SUPER_CHALLENGE: 40,
} as const;

export const TIER_LABELS = {
  DOUBLE: 'Double jump unlocked',
  TRIPLE: 'Triple jump unlocked',
  SUPER: 'Super Challenge',
} as const;

export const SUPER_CHALLENGE = {
  spawnBurstChance: 0.38,
  burstOffsets: [0, 90, 180, 260],
  moveChance: 0.35,
  moveAmp: 14,
  moveFreq: 0.06,
  speedStep: 0.55,
  intervalStep: 180,
  minInterval: 520,
  shieldChance: 0.16,
  scoreCollectChance: 0.7,
} as const;

export const getNextSpawnDelay = (base: number, jumpTier: 1 | 2 | 3) => {
  if (jumpTier === 1) return Math.max(MIN_SPAWN_MS, base);
  const jitter = Math.random() * MAX_EXTRA_JITTER_MS;
  return Math.max(MIN_SPAWN_MS, base + jitter);
};

export const getNextCollectDelay = () =>
  Math.max(600, COLLECT_SPAWN_BASE_MS + Math.random() * COLLECT_SPAWN_JITTER_MS);
