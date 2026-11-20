export type Phase = 'briefing' | 'playing' | 'paused' | 'lost' | 'delivered';
export type Item = 'letter' | 'star' | 'shield' | 'hazard' | 'goblin' | 'blast' | 'counterStar';
export interface Entity {
  id: number;
  kind: Item;
  x: number;
  bottom: number;
}
export interface Run {
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
