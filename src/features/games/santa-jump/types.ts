export type Phase = 'briefing' | 'playing' | 'paused' | 'lost' | 'delivered';
export type Mode = 'campaign' | 'rush' | 'endless' | 'whiteout' | 'duel';
export type Item = 'ram' | 'bat' | 'mole' | 'magnet' | 'hourglass' | 'prism' | 'owl' | 'hare' | 'letter' | 'star' | 'shield' | 'hazard' | 'goblin' | 'blast' | 'counterStar';
export interface Entity {
  id: number;
  kind: Item;
  x: number;
  bottom: number;
}
export interface Run {
  mode: Mode;
  elapsed: number;
  magnet: number;
  slow: number;
  multiplier: number;
  phase: Phase;
  chapter: number;
  jumpLimit: number;
  bossHP: number | null;
  height: number;
  velocity: number;
  jumps: number;
  distance: number;
  wave: number;
  nextWave: number;
  letters: number;
  score: number;
  shield: boolean;
  entities: Entity[];
}
