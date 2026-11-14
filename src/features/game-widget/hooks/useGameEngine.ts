import { useCallback, useEffect, useRef, useState } from 'react';
import {
  COLLECT_SIZE,
  COLLECT_VALUE,
  GAME_WIDTH,
  GROUND_Y,
  GRAVITY,
  JUMP_VELOCITY,
  OBSTACLE_SPEED_START,
  OBSTACLE_WIDTH,
  SHIELD_DURATION_MS,
  SPAWN_INTERVAL_START,
  SUPER_CHALLENGE,
  TIER_LABELS,
  TIER_POINTS,
  getNextCollectDelay,
  getNextSpawnDelay,
} from '../constants';
import type { Collectible, GameWidgetState, Obstacle } from '../types';

export function useGameEngine() {
  const [running, setRunning] = useState(true);
  const [, setJumping] = useState(false);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [speed, setSpeed] = useState(OBSTACLE_SPEED_START);
  const [spawnInterval, setSpawnInterval] = useState(SPAWN_INTERVAL_START);
  const [obstacles, setObstacles] = useState<Obstacle[]>([]);
  const [collectibles, setCollectibles] = useState<Collectible[]>([]);
  const shieldUntilRef = useRef<number>(0);
  const [shieldCountdown, setShieldCountdown] = useState(0);

  const [jumpTier, setJumpTier] = useState<1 | 2 | 3>(1);
  const [tierNotice, setTierNotice] = useState<string | null>(null);
  const tierTimerRef = useRef<number | null>(null);

  const [y, setY] = useState(0);
  const obstaclesRef = useRef<Obstacle[]>([]);
  const collectiblesRef = useRef<Collectible[]>([]);
  const yRef = useRef(0);
  const vyRef = useRef(0);
  const speedRef = useRef(OBSTACLE_SPEED_START);
  const spawnIntervalRef = useRef(SPAWN_INTERVAL_START);
  const nextSpawnDelayRef = useRef<number>(SPAWN_INTERVAL_START);
  const lastSpawnRef = useRef<number>(0);
  const collectNextDelayRef = useRef<number>(1400);
  const collectLastSpawnRef = useRef<number>(0);
  const jumpCountRef = useRef(0);
  const frameRef = useRef<number | null>(null);

  const isChallenge = jumpTier === 3;
  const isSuperChallenge = isChallenge && score >= TIER_POINTS.SUPER_CHALLENGE;

  const applyTierUnlocks = useCallback((nextScore: number) => {
    setJumpTier((currentTier) => {
      if (nextScore >= TIER_POINTS.TRIPLE && currentTier < 3) {
        setTierNotice(TIER_LABELS.TRIPLE);
        return 3;
      }
      if (nextScore >= TIER_POINTS.DOUBLE && currentTier < 2) {
        setTierNotice(TIER_LABELS.DOUBLE);
        return 2;
      }
      return currentTier;
    });
  }, []);

  useEffect(() => {
    let rafId: number | null = null;
    const tick = () => {
      const now = performance.now();
      const remainingMs = Math.max(0, shieldUntilRef.current - now);
      const seconds = Math.ceil(remainingMs / 1000);
      setShieldCountdown(remainingMs > 0 ? seconds : 0);
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);
    return () => {
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, []);

  useEffect(() => {
    speedRef.current = speed;
  }, [speed]);
  useEffect(() => {
    spawnIntervalRef.current = spawnInterval;
  }, [spawnInterval]);
  useEffect(() => {
    obstaclesRef.current = obstacles;
  }, [obstacles]);
  useEffect(() => {
    collectiblesRef.current = collectibles;
  }, [collectibles]);

  const jump = useCallback(() => {
    if (!running || gameOver) return;
    if (jumpCountRef.current < jumpTier) {
      vyRef.current = JUMP_VELOCITY;
      jumpCountRef.current += 1;
      setJumping(true);
      setTimeout(() => setJumping(false), 220);
    }
  }, [running, gameOver, jumpTier]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        jump();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [jump]);

  useEffect(() => {
    if (!running || gameOver) return;

    const step = (ts: number) => {
      if (ts - lastSpawnRef.current >= nextSpawnDelayRef.current) {
        const burst = isSuperChallenge && Math.random() < SUPER_CHALLENGE.spawnBurstChance;
        if (burst) {
          SUPER_CHALLENGE.burstOffsets.slice(0, 3 + Math.round(Math.random())).forEach((off, i) => {
            obstaclesRef.current.push({ id: ts + i, x: GAME_WIDTH + 40 + off, passed: false });
          });
        } else {
          obstaclesRef.current.push({ id: ts, x: GAME_WIDTH + 40, passed: false });
          if (jumpTier > 1 && Math.random() < 0.25) {
            const offset = 80 + Math.random() * 80;
            obstaclesRef.current.push({ id: ts + 1, x: GAME_WIDTH + 40 + offset, passed: false });
          }
        }
        lastSpawnRef.current = ts;
        nextSpawnDelayRef.current = getNextSpawnDelay(spawnIntervalRef.current, jumpTier);
      }

      if (ts - collectLastSpawnRef.current >= collectNextDelayRef.current) {
        const roll = Math.random();
        const isShield = isChallenge && roll < SUPER_CHALLENGE.shieldChance;
        const isScore = roll < (isChallenge ? SUPER_CHALLENGE.scoreCollectChance : 0.35);
        if (isShield || isScore) {
          const airY = 100 - (28 + Math.random() * 36);
          collectiblesRef.current.push({
            id: ts,
            x: GAME_WIDTH + 40 + (Math.random() * 120 - 60),
            y: airY,
            eaten: false,
            kind: isShield ? 'shield' : 'score',
          });
        }
        collectLastSpawnRef.current = ts;
        collectNextDelayRef.current = getNextCollectDelay();
      }

      obstaclesRef.current = obstaclesRef.current
        .map((o) => {
          const x = o.x - speedRef.current;
          let oy = 100;
          const moveChance = isSuperChallenge
            ? Math.max(0.6, SUPER_CHALLENGE.moveChance)
            : isChallenge
              ? SUPER_CHALLENGE.moveChance
              : 0;
          if (Math.random() < moveChance) {
            const phase = ((o.id % 1000) / 1000) * Math.PI * 2 + (ts * SUPER_CHALLENGE.moveFreq) / 16;
            const amp = isSuperChallenge ? SUPER_CHALLENGE.moveAmp + 4 : SUPER_CHALLENGE.moveAmp;
            oy = 100 + Math.sin(phase) * amp;
          }
          return { ...o, x, oy };
        })
        .filter((o) => o.x > -(OBSTACLE_WIDTH + 20));

      collectiblesRef.current = collectiblesRef.current
        .map((c) => ({ ...c, x: c.x - speedRef.current }))
        .filter((c) => c.x > -COLLECT_SIZE - 20);

      vyRef.current += GRAVITY;
      let nextY = yRef.current + vyRef.current;
      if (nextY > GROUND_Y) {
        nextY = GROUND_Y;
        vyRef.current = 0;
        jumpCountRef.current = 0;
      }
      if (nextY < -72) nextY = -72;
      yRef.current = nextY;

      const runnerLeft = 60;
      const runnerRight = runnerLeft + 48;
      const runnerTop = 100 + yRef.current;
      const runnerBottom = runnerTop + 48;

      obstaclesRef.current = obstaclesRef.current.map((o) => {
        const obsLeft = o.x;
        const obsRight = o.x + OBSTACLE_WIDTH;
        const obsTop = o.oy ?? 100;
        const obsBottom = obsTop + 34;

        const overlap =
          obsLeft < runnerRight - 6 &&
          obsRight > runnerLeft + 6 &&
          obsTop < runnerBottom - 6 &&
          obsBottom > runnerTop + 6;

        if (overlap && yRef.current > -10 && !gameOver && performance.now() > shieldUntilRef.current) {
          setGameOver(true);
          setRunning(false);
        }

        if (!o.passed && obsRight < runnerLeft && !gameOver) {
          setScore((s) => {
            const newScore = s + 1;
            applyTierUnlocks(newScore);
            setHighScore((best) => Math.max(best, newScore));
            if (newScore % 5 === 0) {
              setSpeed((spd) => {
                const next = spd + (isSuperChallenge ? SUPER_CHALLENGE.speedStep : isChallenge ? 0.48 : 0.4);
                speedRef.current = next;
                return next;
              });
              setSpawnInterval((intv) => {
                const step = isSuperChallenge ? SUPER_CHALLENGE.intervalStep : isChallenge ? 140 : 120;
                const minI = isSuperChallenge ? SUPER_CHALLENGE.minInterval : isChallenge ? 560 : 600;
                const next = Math.max(minI, intv - step);
                spawnIntervalRef.current = next;
                return next;
              });
            }
            return newScore;
          });
          return { ...o, passed: true };
        }
        return o;
      });

      collectiblesRef.current = collectiblesRef.current.map((c) => {
        if (!c.eaten) {
          const colLeft = c.x;
          const colRight = c.x + COLLECT_SIZE;
          const colTop = c.y;
          const colBottom = colTop + COLLECT_SIZE;
          const eat =
            colLeft < runnerRight - 6 &&
            colRight > runnerLeft + 6 &&
            colTop < runnerBottom - 6 &&
            colBottom > runnerTop + 6;
          if (eat) {
            c.eaten = true;
            if (c.kind === 'shield') {
              shieldUntilRef.current = performance.now() + SHIELD_DURATION_MS;
              setTierNotice('Shield active');
              setShieldCountdown(Math.ceil(SHIELD_DURATION_MS / 1000));
            } else {
              setScore((s) => {
                const newScore = s + COLLECT_VALUE;
                applyTierUnlocks(newScore);
                setHighScore((best) => Math.max(best, newScore));
                return newScore;
              });
            }
          }
        }
        return c;
      });

      setY(yRef.current);
      setObstacles(obstaclesRef.current);
      setCollectibles(collectiblesRef.current);
      frameRef.current = requestAnimationFrame(step);
    };

    frameRef.current = requestAnimationFrame(step);
    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, [running, gameOver, jumpTier, score, isChallenge, isSuperChallenge, applyTierUnlocks]);

  useEffect(() => {
    if (!tierNotice) return;
    if (tierTimerRef.current) window.clearTimeout(tierTimerRef.current);
    tierTimerRef.current = window.setTimeout(() => setTierNotice(null), 2800);
    return () => {
      if (tierTimerRef.current) {
        window.clearTimeout(tierTimerRef.current);
        tierTimerRef.current = null;
      }
    };
  }, [tierNotice]);

  const restart = useCallback(() => {
    setScore(0);
    setGameOver(false);
    setRunning(true);
    obstaclesRef.current = [];
    collectiblesRef.current = [];
    setObstacles([]);
    setCollectibles([]);
    yRef.current = 0;
    setY(0);
    vyRef.current = 0;
    speedRef.current = OBSTACLE_SPEED_START;
    setSpeed(OBSTACLE_SPEED_START);
    spawnIntervalRef.current = SPAWN_INTERVAL_START;
    setSpawnInterval(SPAWN_INTERVAL_START);
    nextSpawnDelayRef.current = SPAWN_INTERVAL_START;
    lastSpawnRef.current = performance.now();
    jumpCountRef.current = 0;
    setJumpTier(1);
    setTierNotice(null);
  }, []);

  const state: GameWidgetState = {
    running,
    gameOver,
    score,
    highScore,
    jumpTier,
    shieldCountdown,
    tierNotice,
    isChallenge,
    isSuperChallenge,
    y,
    obstacles,
    collectibles,
  };

  return {
    state,
    jump,
    restart,
    toggleRunning: () => setRunning((r) => !r),
  };
}
