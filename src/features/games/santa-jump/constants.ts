import type { Foe, Supply } from './types.ts';

export const WORLD_WIDTH = 760;
export const WORLD_HEIGHT = 320;
export const FLOOR = 264;
export const SANTA_X = 93;
export const SANTA_SIZE = 64;
export const ITEM_SIZE = 38;
export const HAZARD_SIZE = 44;

export interface Chapter {
  name: string;
  short: string;
  recipient: string;
  time: string;
  rule: string;
  ruleHint: string;
  story: string;
  ending: string;
  hazard: string;
  speed: number;
  spacing: number;
  routeLength: number;
  letters: number;
  jumps: number;
  foes: readonly Foe[];
  supplies: readonly Supply[];
  foeEvery: number;
  basePace: number;
  maxRamp: number;
  timeLimit: number;
  survivalBonus: number;
  boss?: 'frost-king' | 'summit-king';
}

export const chapters: readonly Chapter[] = [
  {
    name: 'North Pole Mailroom', short: 'Mailroom', recipient: 'The packing elves', time: '20:15',
    rule: 'Courtyard Warmup',
    ruleHint: 'Single-jump training lane. Clear gift crates and bounding hares with basic ice shields.',
    story: 'A gust blows the wish letters out of the mailroom. Gather the first bundle so the elves know which gifts to wrap.',
    ending: 'The elves tie the last ribbon. Beyond the workshop door, a trail of envelopes leads into the pines. Double jump unlocked! Tap again in midair.',
    hazard: 'Gift crate', speed: 215, spacing: 400, routeLength: 10965, letters: 9, jumps: 1,
    foes: ['hare'], supplies: ['star', 'shield'],
    foeEvery: 3, basePace: 1, maxRamp: 0, timeLimit: 0, survivalBonus: 0,
  },
  {
    name: 'Emerald Pine Forest', short: 'Pine Forest', recipient: 'The forest keeper', time: '21:40',
    rule: 'Canopy Drift',
    ruleHint: 'Double jump unlocked. Duck under low snow owls and use holly magnets to pull canopy letters.',
    story: 'The forest keeper has hung lanterns along the frozen creek. Follow their glow, hop over stumps and catch the letters drifting through the pines.',
    ending: 'The lantern trail ends at the village. High above the sleeping streets, envelopes flutter on the rooftops.',
    hazard: 'Pine stump', speed: 245, spacing: 382, routeLength: 15680, letters: 12, jumps: 2,
    foes: ['owl', 'hare'], supplies: ['magnet', 'star', 'shield'],
    foeEvery: 2, basePace: 1, maxRamp: 0, timeLimit: 0, survivalBonus: 0,
  },
  {
    name: 'Moonlit Rooftops', short: 'Rooftops', recipient: 'The village children', time: '23:25',
    rule: 'Curfew Sprint',
    ruleHint: 'Beat the 90s midnight curfew. Charging pine goblins rush the chimneys while prism brooches double points.',
    story: 'The village is fast asleep. Leap from roof to roof, clear the chimneys and gather the letters left beside the glowing windows.',
    ending: 'A gift waits under every tree. The last envelope bears the wax seal of the observatory. Triple jump unlocked! Tap twice in midair.',
    hazard: 'Brick chimney', speed: 270, spacing: 365, routeLength: 20790, letters: 17, jumps: 2,
    foes: ['goblin', 'owl'], supplies: ['prism', 'magnet', 'shield', 'star'],
    foeEvery: 2, basePace: 1, maxRamp: 0, timeLimit: 90, survivalBonus: 0,
  },
  {
    name: 'Daybreak Observatory', short: 'Observatory', boss: 'frost-king', recipient: 'The star keeper', time: '05:10',
    rule: 'Starlight Siege',
    ruleHint: 'Triple jump unlocked. Deliver 22 letters to the summit, then shatter the Frost King’s three crown seals.',
    story: 'Carry the last wishes to the observatory before sunrise. The Frost King guards the summit. Dodge his ice volleys and catch three high stars to break his crown.',
    ending: 'The North Star shines again. From the smallest attic to the cabin at the edge of the woods, a line of lanterns flickers toward the coast. The glassmakers need a new lens for the harbor beacon.',
    hazard: 'Ice crystal', speed: 300, spacing: 350, routeLength: 26700, letters: 22, jumps: 3,
    foes: ['goblin', 'hare', 'owl'], supplies: ['shield', 'star', 'magnet', 'hourglass', 'star'],
    foeEvery: 2, basePace: 1, maxRamp: 0, timeLimit: 0, survivalBonus: 0,
  },
  {
    name: 'Aurora Glassworks', short: 'Glassworks', recipient: 'The glassmakers', time: '05:35',
    rule: 'Furnace Draft',
    ruleHint: 'Updrafts lift letters to the high rafters and ramp speed by +15%. Fragile furnaces offer no ice shields.',
    story: 'The furnaces are warm again. Follow the letters above the cooling glass and take the lens order to the master glassmaker.',
    ending: 'The last furnace opens. Santa wraps the emerald lens in wool and follows the harbor bells down to the docks.',
    hazard: 'Glass shard', speed: 308, spacing: 362, routeLength: 28336, letters: 23, jumps: 3,
    foes: ['ram', 'goblin'], supplies: ['prism', 'magnet', 'hourglass', 'star'],
    foeEvery: 2, basePace: 1, maxRamp: 0.15, timeLimit: 0, survivalBonus: 0,
  },
  {
    name: 'Starlight Harbor', short: 'Harbor', recipient: 'The lighthouse keeper', time: '06:10',
    rule: 'Tidal Tailwind',
    ruleHint: 'Coastal gusts accelerate route speed up to +25% and award +10 survival bonus points every 10 seconds.',
    story: 'Fishing boats wait beyond the breakwater. Leap the cargo on the dock and collect the last letters before the morning tide turns.',
    ending: 'The new lens catches the first ray of sun. One by one, the boats follow its green light home. A train whistle calls Santa inland with a second mailbag.',
    hazard: 'Cargo crate', speed: 316, spacing: 358, routeLength: 30652, letters: 25, jumps: 3,
    foes: ['ram', 'owl', 'hare'], supplies: ['magnet', 'shield', 'prism', 'star'],
    foeEvery: 2, basePace: 1, maxRamp: 0.25, timeLimit: 0, survivalBonus: 10,
  },
  {
    name: 'Ribbon Railway', short: 'Railway', recipient: 'The night conductor', time: '06:40',
    rule: 'Express Timetable',
    ruleHint: 'Beat the 120s locomotive departure. Lantern moles surface between tracks as clockwork rams accelerate.',
    story: 'A red locomotive waits with letters for the mountain villages. Watch the clockwork rams: they accelerate halfway across the track.',
    ending: 'The conductor hands Santa a brass key. Above the depot, the bell tower has missed its morning chime.',
    hazard: 'Freight crate', speed: 323, spacing: 368, routeLength: 37145, letters: 29, jumps: 3,
    foes: ['mole', 'ram', 'goblin'], supplies: ['hourglass', 'magnet', 'shield', 'star'],
    foeEvery: 1, basePace: 1.04, maxRamp: 0.12, timeLimit: 120, survivalBonus: 0,
  },
  {
    name: 'Brass Bell Tower', short: 'Bell Tower', recipient: 'The bell keeper', time: '07:15',
    rule: 'Clockwork Overdrive',
    ruleHint: 'Bronze gears ramp speed up to +30% with +10 bonus points every 10s as crystal bats swoop overhead.',
    story: 'Carry the key past the great bronze wheels. Lantern moles surface between the gears just before Santa reaches them.',
    ending: 'Six bells ring, but the seventh stays silent. Its crystal tongue lies in the caves beneath the tower.',
    hazard: 'Loose masonry', speed: 330, spacing: 366, routeLength: 42240, letters: 32, jumps: 3,
    foes: ['bat', 'mole', 'ram'], supplies: ['hourglass', 'prism', 'shield', 'star'],
    foeEvery: 1, basePace: 1.05, maxRamp: 0.30, timeLimit: 0, survivalBonus: 10,
  },
  {
    name: 'Violet Ice Caverns', short: 'Caverns', recipient: 'The crystal miners', time: '07:55',
    rule: 'Whiteout Squall',
    ruleHint: 'Subterranean gale runs 15% faster and ramps +15% with zero shields or hourglasses. Pure evasion.',
    story: 'Follow the miners’ lamps to the lost crystal. Stay below the bats as they swoop through the tunnel.',
    ending: 'The crystal catches a ray from the summit. Above the clouds the Frost King raises his crown once more.',
    hazard: 'Amethyst shard', speed: 338, spacing: 365, routeLength: 47320, letters: 37, jumps: 3,
    foes: ['bat', 'mole', 'goblin', 'owl'], supplies: ['prism', 'magnet', 'star'],
    foeEvery: 1, basePace: 1.15, maxRamp: 0.15, timeLimit: 0, survivalBonus: 15,
  },
  {
    name: 'Solstice Peak', short: 'Solstice Peak', boss: 'summit-king', recipient: 'The summit choir', time: '08:40',
    rule: 'Solstice Crown Duel',
    ruleHint: 'Beat the 170s summit deadline past all mountain creatures, then shatter the King’s crown between paired blasts.',
    story: 'Deliver the crystal to the choir above the snowline. The king now sends paired blasts: catch the high stars between them.',
    ending: 'All seven bells ring together. Their song travels from the summit to the sea as the last wish finds its home.',
    hazard: 'Glacier spire', speed: 345, spacing: 364, routeLength: 52785, letters: 40, jumps: 3,
    foes: ['bat', 'ram', 'mole', 'goblin'], supplies: ['prism', 'magnet', 'hourglass', 'shield', 'star'],
    foeEvery: 1, basePace: 1.08, maxRamp: 0.22, timeLimit: 170, survivalBonus: 15,
  },
];
