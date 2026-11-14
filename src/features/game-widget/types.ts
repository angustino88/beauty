export interface Obstacle {
  id: number;
  x: number;
  oy?: number;
  passed: boolean;
}

export interface Collectible {
  id: number;
  x: number;
  y: number;
  eaten: boolean;
  kind?: 'score' | 'shield';
}

export interface GameWidgetState {
  running: boolean;
  gameOver: boolean;
  score: number;
  highScore: number;
  jumpTier: 1 | 2 | 3;
  shieldCountdown: number;
  tierNotice: string | null;
  isChallenge: boolean;
  isSuperChallenge: boolean;
  y: number;
  obstacles: Obstacle[];
  collectibles: Collectible[];
}
