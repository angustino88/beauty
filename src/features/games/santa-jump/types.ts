export type Phase = 'briefing' | 'playing' | 'paused' | 'lost' | 'delivered';
export type Supply = 'star' | 'shield' | 'magnet' | 'prism' | 'hourglass';
export type Foe = 'hare' | 'owl' | 'goblin' | 'ram' | 'mole' | 'bat';
export type Item = Supply | Foe | 'letter' | 'hazard' | 'blast' | 'counterStar';
export interface Entity {
  id: number;
  kind: Item;
  x: number;
  bottom: number;
}
export interface Run {
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
